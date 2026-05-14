// builder_cpp/agent/cmd/agent/main.cpp
// Агент: Windows-сервис с регистрацией/телеметрией/апдейтом.
// RDP-часть вынесена в отдельный процесс-worker, запускаемый в сессии
// пользователя через CreateProcessAsUserA (флаг --rdp-worker).
#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#include <winhttp.h>
#include <shlobj.h>
#include <processthreadsapi.h>
#include <winsock2.h>
#include <ws2tcpip.h>
#include <wtsapi32.h>
#include <userenv.h>
#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <chrono>
#include <thread>
#include <sstream>
#include <iomanip>
#include <algorithm>
#include <cctype>
#include <ctime>
#include <random>
#include <mutex>
#include <cstdarg>
#include <atomic>
#include <wincrypt.h>
#include <cstring>
#include <tlhelp32.h>

#pragma comment(lib, "winhttp.lib")
#pragma comment(lib, "advapi32.lib")
#pragma comment(lib, "ws2_32.lib")
#pragma comment(lib, "crypt32.lib")
#pragma comment(lib, "wtsapi32.lib")
#pragma comment(lib, "userenv.lib")

#include "rdp_agent.h"

// Redis C++ library (hiredis) - optional, for Pub/Sub command delivery
#ifdef HAVE_REDIS
    #include "hiredis.h"
#endif

#ifndef SERVER_URL
#define SERVER_URL "http://localhost:8000"
#endif
#ifndef BUILD_SLUG
#define BUILD_SLUG "1.0.0"
#endif

std::string serverURL = SERVER_URL;
std::string buildSlug = BUILD_SLUG;

std::mutex logMutex;
std::ofstream logFile;
std::atomic<bool> g_stopRequested(false);
std::string g_telemetryMode = "none";
std::string g_agent_uuid;
std::string g_agent_token;
std::atomic<int> g_rdp_worker_timeout{30};

// Shared memory for activity monitoring (created by SYSTEM process, read by worker)
static HANDLE g_shm_handle = NULL;
static ActivityShm *g_shm = NULL;
static std::string g_shm_name;
static std::mutex g_shm_m;

SERVICE_STATUS serviceStatus = {0};
SERVICE_STATUS_HANDLE serviceHandle = NULL;
HANDLE stopEvent = NULL;

// ==================== LOGGER ====================

std::string getExePath()
{
    char path[MAX_PATH] = {0};
    GetModuleFileNameA(NULL, path, MAX_PATH);
    return std::string(path);
}

std::string getExeDir()
{
    std::string exePath = getExePath();
    size_t pos = exePath.find_last_of("\\/");
    return (pos != std::string::npos) ? exePath.substr(0, pos) : exePath;
}

std::string getFFmpegPath() { return getExeDir() + "\\ffmpeg.exe"; }

void setupFileLogger(const std::string &name = "agent.log")
{
    std::string logPath = getExeDir() + "\\" + name;
    logFile.open(logPath, std::ios::app | std::ios::out);
}

void log(const char *msg)
{
    std::lock_guard<std::mutex> lock(logMutex);
    auto now = std::chrono::system_clock::now();
    auto time = std::chrono::system_clock::to_time_t(now);
    struct tm tmTemp;
    localtime_s(&tmTemp, &time);
    char timeStr[32];
    strftime(timeStr, sizeof(timeStr), "%Y-%m-%d %H:%M:%S", &tmTemp);
    std::string line = std::string(timeStr) + " [pid=" +
                       std::to_string(GetCurrentProcessId()) + "] " + msg + "\n";
    std::cout << line;
    if (logFile.is_open())
    {
        logFile << line;
        logFile.flush();
    }
}

void logf(const char *fmt, ...)
{
    char buf[2048];
    va_list args;
    va_start(args, fmt);
    vsnprintf(buf, sizeof(buf), fmt, args);
    va_end(args);
    log(buf);
}

void log(const std::string &msg) { log(msg.c_str()); }

// ==================== URL PARSE ====================

bool parseUrl(const std::string &url, std::string &host, int &port,
              std::string &path, std::string &query)
{
    host.clear();
    port = 80;
    path = "/";
    query.clear();
    std::string u = url;
    if (u.find("http://") == 0)
        u = u.substr(7);
    else if (u.find("https://") == 0)
    {
        u = u.substr(8);
        port = 443;
    }

    size_t pathPos = u.find('/');
    size_t queryPos = u.find('?');
    std::string hostPort;
    if (pathPos != std::string::npos)
    {
        hostPort = u.substr(0, pathPos);
        if (queryPos != std::string::npos && queryPos > pathPos)
        {
            path = u.substr(pathPos, queryPos - pathPos);
            query = u.substr(queryPos);
        }
        else
            path = u.substr(pathPos);
    }
    else
        hostPort = u;

    size_t colonPos = hostPort.find(':');
    if (colonPos != std::string::npos)
    {
        host = hostPort.substr(0, colonPos);
        port = std::stoi(hostPort.substr(colonPos + 1));
    }
    else
        host = hostPort;
    return !host.empty();
}

// ==================== MACHINE UID ====================

std::string loadOrCreateMachineUID()
{
    std::string uidPath = getExeDir() + "\\machine_uid";
    std::ifstream ifs(uidPath);
    if (ifs.good())
    {
        std::string uid;
        std::getline(ifs, uid);
        if (!uid.empty())
            return uid;
    }
    std::random_device rd;
    std::mt19937 gen(rd());
    std::uniform_int_distribution<> dist(0, 999999);
    std::ostringstream oss;
    oss << time(nullptr) << "-" << GetCurrentProcessId() << "-" << dist(gen);
    std::string uid = oss.str();
    std::ofstream of(uidPath);
    of << uid;
    of.close();
    return uid;
}

// ==================== NETWORK ====================

std::string getLocalIP()
{
    WSADATA wsaData;
    if (WSAStartup(MAKEWORD(2, 2), &wsaData) != 0)
        return "";
    char hostname[256];
    if (gethostname(hostname, sizeof(hostname)))
    {
        WSACleanup();
        return "";
    }
    struct hostent *he = gethostbyname(hostname);
    if (!he)
    {
        WSACleanup();
        return "";
    }
    for (int i = 0; he->h_addr_list[i]; i++)
    {
        struct in_addr **addrList = (struct in_addr **)he->h_addr_list;
        if (addrList[i])
        {
            char *ip = inet_ntoa(*addrList[i]);
            if (ip && strncmp(ip, "127.", 4) != 0)
            {
                WSACleanup();
                return std::string(ip);
            }
        }
    }
    WSACleanup();
    return "";
}

std::string getExternalIP()
{
    HINTERNET hSession = WinHttpOpen(L"Agent/1.0", WINHTTP_ACCESS_TYPE_NO_PROXY, NULL, NULL, 0);
    if (!hSession)
        return "";
    HINTERNET hConnect = WinHttpConnect(hSession, L"api.ipify.org", INTERNET_DEFAULT_HTTP_PORT, 0);
    if (!hConnect)
    {
        WinHttpCloseHandle(hSession);
        return "";
    }
    HINTERNET hRequest = WinHttpOpenRequest(hConnect, L"GET", NULL, NULL, NULL, NULL, 0);
    if (!hRequest)
    {
        WinHttpCloseHandle(hConnect);
        WinHttpCloseHandle(hSession);
        return "";
    }
    if (!WinHttpSendRequest(hRequest, NULL, 0, NULL, 0, 0, 0) ||
        !WinHttpReceiveResponse(hRequest, NULL))
    {
        WinHttpCloseHandle(hRequest);
        WinHttpCloseHandle(hConnect);
        WinHttpCloseHandle(hSession);
        return "";
    }
    char buffer[64] = {0};
    DWORD bytesRead = 0;
    std::string result;
    while (WinHttpReadData(hRequest, buffer, sizeof(buffer) - 1, &bytesRead) && bytesRead > 0)
    {
        buffer[bytesRead] = 0;
        result += buffer;
    }
    WinHttpCloseHandle(hRequest);
    WinHttpCloseHandle(hConnect);
    WinHttpCloseHandle(hSession);
    return result;
}

std::string getUsersAsString()
{
    std::string psCommand = "$OutputEncoding = [console]::InputEncoding = [console]::OutputEncoding = "
                            "New-Object System.Text.UTF8Encoding; "
                            "Get-LocalUser | Where-Object { $_.Enabled -eq $true } | ForEach-Object { $_.Name }";
    STARTUPINFOA si = {0};
    si.cb = sizeof(si);
    si.dwFlags = STARTF_USESHOWWINDOW;
    si.wShowWindow = SW_HIDE;
    SECURITY_ATTRIBUTES sa = {0};
    sa.nLength = sizeof(sa);
    sa.bInheritHandle = TRUE;
    HANDLE hRead, hWrite;
    CreatePipe(&hRead, &hWrite, &sa, 0);
    SetHandleInformation(hRead, HANDLE_FLAG_INHERIT, 0);
    std::string cmdLine = "powershell.exe -Command \"" + psCommand + "\"";
    PROCESS_INFORMATION pi = {0};
    char *cmd = _strdup(cmdLine.c_str());
    if (!CreateProcessA(NULL, cmd, NULL, NULL, TRUE, CREATE_NO_WINDOW, NULL, NULL, &si, &pi))
    {
        free(cmd);
        CloseHandle(hRead);
        CloseHandle(hWrite);
        return "";
    }
    free(cmd);
    CloseHandle(hWrite);
    char buffer[4096];
    DWORD bytesRead;
    std::string output;
    while (ReadFile(hRead, buffer, sizeof(buffer) - 1, &bytesRead, NULL) && bytesRead > 0)
    {
        buffer[bytesRead] = 0;
        output += buffer;
    }
    CloseHandle(hRead);
    WaitForSingleObject(pi.hProcess, INFINITE);
    CloseHandle(pi.hProcess);
    CloseHandle(pi.hThread);
    std::string users;
    std::istringstream iss(output);
    std::string line;
    while (std::getline(iss, line))
    {
        line = line.substr(0, line.find_last_not_of(" \n\r\t") + 1);
        if (!line.empty() && line != "Administrator" && line != "Guest")
        {
            if (!users.empty())
                users += ", ";
            users += line;
        }
    }
    return users;
}

std::string jsonEscape(const std::string &s)
{
    std::string out;
    for (char c : s)
    {
        switch (c)
        {
        case '\"':
            out += "\\\"";
            break;
        case '\\':
            out += "\\\\";
            break;
        case '\b':
            out += "\\b";
            break;
        case '\f':
            out += "\\f";
            break;
        case '\n':
            out += "\\n";
            break;
        case '\r':
            out += "\\r";
            break;
        case '\t':
            out += "\\t";
            break;
        default:
            out += c;
        }
    }
    return out;
}

// ==================== HTTP CLIENT ====================

bool postJSON(const std::string &url, const std::string &bodyStr,
              std::string &responseBody, int &statusCode)
{
    std::string host, path, query;
    int port;
    if (!parseUrl(url, host, port, path, query))
        return false;
    std::string fullPath = path + query;

    HINTERNET hSession = WinHttpOpen(L"Agent/1.0", WINHTTP_ACCESS_TYPE_NO_PROXY, NULL, NULL, 0);
    if (!hSession)
        return false;
    std::wstring whost(host.begin(), host.end());
    HINTERNET hConnect = WinHttpConnect(hSession, whost.c_str(), port, 0);
    if (!hConnect)
    {
        WinHttpCloseHandle(hSession);
        return false;
    }
    std::wstring wpath(fullPath.begin(), fullPath.end());
    DWORD dwFlags = 0;
    if (url.find("https://") == 0)
        dwFlags |= WINHTTP_FLAG_SECURE;
    HINTERNET hRequest = WinHttpOpenRequest(hConnect, L"POST", wpath.c_str(), NULL, NULL, NULL, dwFlags);
    if (!hRequest)
    {
        WinHttpCloseHandle(hConnect);
        WinHttpCloseHandle(hSession);
        return false;
    }
    if (url.find("https://") == 0)
    {
        DWORD dwCertFlags = SECURITY_FLAG_IGNORE_UNKNOWN_CA |
                            SECURITY_FLAG_IGNORE_CERT_DATE_INVALID |
                            SECURITY_FLAG_IGNORE_CERT_CN_INVALID |
                            SECURITY_FLAG_IGNORE_CERT_WRONG_USAGE;
        WinHttpSetOption(hRequest, WINHTTP_OPTION_SECURITY_FLAGS, &dwCertFlags, sizeof(dwCertFlags));
    }
    std::wstring header = L"Content-Type: application/json\r\n";
    WinHttpAddRequestHeaders(hRequest, header.c_str(), (DWORD)header.size(), WINHTTP_ADDREQ_FLAG_ADD);
    if (!WinHttpSendRequest(hRequest, WINHTTP_NO_ADDITIONAL_HEADERS, 0,
                            (LPVOID)bodyStr.c_str(), (DWORD)bodyStr.size(),
                            (DWORD)bodyStr.size(), 0) ||
        !WinHttpReceiveResponse(hRequest, NULL))
    {
        WinHttpCloseHandle(hRequest);
        WinHttpCloseHandle(hConnect);
        WinHttpCloseHandle(hSession);
        return false;
    }
    DWORD dwStatusCode = 0;
    DWORD dwSize = sizeof(dwStatusCode);
    if (WinHttpQueryHeaders(hRequest, WINHTTP_QUERY_STATUS_CODE | WINHTTP_QUERY_FLAG_NUMBER,
                            NULL, &dwStatusCode, &dwSize, NULL))
        statusCode = (int)dwStatusCode;
    else
        statusCode = 0;
    char buffer[4096] = {0};
    DWORD bytesRead = 0;
    std::string response;
    while (WinHttpReadData(hRequest, buffer, sizeof(buffer) - 1, &bytesRead) && bytesRead > 0)
    {
        buffer[bytesRead] = 0;
        response += buffer;
    }
    responseBody = response;
    WinHttpCloseHandle(hRequest);
    WinHttpCloseHandle(hConnect);
    WinHttpCloseHandle(hSession);
    return true;
}

bool getJSON(const std::string &url, std::string &responseBody, int &statusCode)
{
    std::string host, path, query;
    int port;
    if (!parseUrl(url, host, port, path, query))
        return false;
    std::string fullPath = path + query;

    HINTERNET hSession = WinHttpOpen(L"Agent/1.0", WINHTTP_ACCESS_TYPE_NO_PROXY, NULL, NULL, 0);
    if (!hSession)
        return false;
    std::wstring whost(host.begin(), host.end());
    HINTERNET hConnect = WinHttpConnect(hSession, whost.c_str(), port, 0);
    if (!hConnect)
    {
        WinHttpCloseHandle(hSession);
        return false;
    }
    std::wstring wpath(fullPath.begin(), fullPath.end());
    DWORD dwFlags = 0;
    if (url.find("https://") == 0)
        dwFlags |= WINHTTP_FLAG_SECURE;
    HINTERNET hRequest = WinHttpOpenRequest(hConnect, L"GET", wpath.c_str(), NULL, NULL, NULL, dwFlags);
    if (!hRequest)
    {
        WinHttpCloseHandle(hConnect);
        WinHttpCloseHandle(hSession);
        return false;
    }
    if (url.find("https://") == 0)
    {
        DWORD dwCertFlags = SECURITY_FLAG_IGNORE_UNKNOWN_CA |
                            SECURITY_FLAG_IGNORE_CERT_DATE_INVALID |
                            SECURITY_FLAG_IGNORE_CERT_CN_INVALID |
                            SECURITY_FLAG_IGNORE_CERT_WRONG_USAGE;
        WinHttpSetOption(hRequest, WINHTTP_OPTION_SECURITY_FLAGS, &dwCertFlags, sizeof(dwCertFlags));
    }
    if (!WinHttpSendRequest(hRequest, WINHTTP_NO_ADDITIONAL_HEADERS, 0, NULL, 0, 0, 0) ||
        !WinHttpReceiveResponse(hRequest, NULL))
    {
        WinHttpCloseHandle(hRequest);
        WinHttpCloseHandle(hConnect);
        WinHttpCloseHandle(hSession);
        return false;
    }
    DWORD dwStatusCode = 0;
    DWORD dwSize = sizeof(dwStatusCode);
    if (WinHttpQueryHeaders(hRequest, WINHTTP_QUERY_STATUS_CODE | WINHTTP_QUERY_FLAG_NUMBER,
                            NULL, &dwStatusCode, &dwSize, NULL))
        statusCode = (int)dwStatusCode;
    else
        statusCode = 0;
    char buffer[4096] = {0};
    DWORD bytesRead = 0;
    std::string response;
    while (WinHttpReadData(hRequest, buffer, sizeof(buffer) - 1, &bytesRead) && bytesRead > 0)
    {
        buffer[bytesRead] = 0;
        response += buffer;
    }
    responseBody = response;
    WinHttpCloseHandle(hRequest);
    WinHttpCloseHandle(hConnect);
    WinHttpCloseHandle(hSession);
    return true;
}

// ==================== TELEMETRY ====================

struct TelemetryData
{
    std::string system, userName, ipAddr, externalIP;
    std::vector<std::string> disks;
    uint64_t totalMemory = 0, availableMemory = 0;
};

std::string getTotalMemory()
{
    MEMORYSTATUSEX m = {0};
    m.dwLength = sizeof(m);
    if (!GlobalMemoryStatusEx(&m))
        return "0";
    return std::to_string(m.ullTotalPhys / (1024 * 1024));
}

std::string getAvailableMemory()
{
    MEMORYSTATUSEX m = {0};
    m.dwLength = sizeof(m);
    if (!GlobalMemoryStatusEx(&m))
        return "0";
    return std::to_string(m.ullAvailPhys / (1024 * 1024));
}

TelemetryData collectTelemetry()
{
    TelemetryData data;
    data.system = "windows";
    data.userName = getUsersAsString();
    data.ipAddr = getLocalIP();
    data.externalIP = getExternalIP();
    data.totalMemory = std::stoull(getTotalMemory());
    data.availableMemory = std::stoull(getAvailableMemory());
    return data;
}

// ==================== SHA256 ====================

std::string sha256File(const std::string &path)
{
    HCRYPTPROV hProv = 0;
    HCRYPTHASH hHash = 0;
    if (!CryptAcquireContext(&hProv, 0, 0, PROV_RSA_AES, CRYPT_VERIFYCONTEXT))
        return "";
    if (!CryptCreateHash(hProv, CALG_SHA_256, 0, 0, &hHash))
    {
        CryptReleaseContext(hProv, 0);
        return "";
    }
    HANDLE hFile = CreateFileA(path.c_str(), GENERIC_READ, FILE_SHARE_READ, 0,
                               OPEN_EXISTING, FILE_FLAG_SEQUENTIAL_SCAN, 0);
    if (hFile == INVALID_HANDLE_VALUE)
    {
        CryptDestroyHash(hHash);
        CryptReleaseContext(hProv, 0);
        return "";
    }
    BYTE rgbFile[4096];
    DWORD cbRead = 0;
    while (ReadFile(hFile, rgbFile, sizeof(rgbFile), &cbRead, NULL) && cbRead > 0)
    {
        if (!CryptHashData(hHash, rgbFile, cbRead, 0))
        {
            CloseHandle(hFile);
            CryptDestroyHash(hHash);
            CryptReleaseContext(hProv, 0);
            return "";
        }
    }
    CloseHandle(hFile);
    BYTE rgbHash[32];
    DWORD cbHash = 32;
    if (!CryptGetHashParam(hHash, HP_HASHVAL, rgbHash, &cbHash, 0))
    {
        CryptDestroyHash(hHash);
        CryptReleaseContext(hProv, 0);
        return "";
    }
    CryptDestroyHash(hHash);
    CryptReleaseContext(hProv, 0);
    std::string result;
    CHAR rgbDigits[] = "0123456789abcdef";
    for (DWORD i = 0; i < cbHash; i++)
    {
        CHAR rgb[3];
        rgb[0] = rgbDigits[rgbHash[i] >> 4];
        rgb[1] = rgbDigits[rgbHash[i] & 0xf];
        rgb[2] = 0;
        result += rgb;
    }
    return result;
}

// ==================== RDP WORKER LIFECYCLE ====================

// Конфигурация worker'а, задаётся до старта watcher'а.
std::string g_rdp_server_host;
int g_rdp_server_port = 443;
std::string g_rdp_agent_id;
bool g_rdp_verify_cert = false; // self-signed → false

PROCESS_INFORMATION g_rdp_worker_pi = {0};
std::mutex g_rdp_worker_m;

// Получить primary-token пользователя активной консольной сессии.
// Если UAC разделил токен (пользователь admin, но живёт под filtered-токеном
// Medium IL) — подменяем на linked/elevated токен (High IL), чтобы worker мог
// инжектить ввод в окна администратора, Task Manager, regedit и пр.
//
// Требует SeTcbPrivilege (LocalSystem имеет).
static HANDLE GetActiveUserToken()
{
    DWORD sessionId = WTSGetActiveConsoleSessionId();
    if (sessionId == 0xFFFFFFFF)
    {
        log("No active console session");
        return NULL;
    }

    HANDLE hUser = NULL;
    if (!WTSQueryUserToken(sessionId, &hUser))
    {
        logf("WTSQueryUserToken failed: %lu", GetLastError());
        return NULL;
    }

    // --- UAC: пытаемся получить elevated-версию токена ---
    DWORD sz = 0;
    TOKEN_ELEVATION_TYPE et = TokenElevationTypeDefault;
    if (GetTokenInformation(hUser, TokenElevationType, &et, sizeof(et), &sz))
    {
        const char *etName =
            (et == TokenElevationTypeDefault) ? "Default (no split)" : (et == TokenElevationTypeFull)  ? "Full (already elevated)"
                                                                   : (et == TokenElevationTypeLimited) ? "Limited (filtered)"
                                                                                                       : "Unknown";
        logf("Active-user token elevation type: %d (%s)", (int)et, etName);

        if (et == TokenElevationTypeLimited)
        {
            // У админа есть «парный» полный токен — берём его.
            TOKEN_LINKED_TOKEN lt = {0};
            if (GetTokenInformation(hUser, TokenLinkedToken, &lt, sizeof(lt), &sz))
            {
                log("Switched to linked (elevated) token for High IL worker");
                CloseHandle(hUser);
                hUser = lt.LinkedToken; // impersonation token
            }
            else
            {
                DWORD err = GetLastError();
                logf("GetTokenInformation(TokenLinkedToken) failed: %lu "
                     "(standard user? UAC off?) — continuing with filtered token",
                     err);
                // Это значит пользователь не админ. Оставляем filtered — будет Medium IL.
                // Admin-окна всё равно не дадутся, но остальное будет работать.
            }
        }
    }
    else
    {
        logf("GetTokenInformation(TokenElevationType) failed: %lu", GetLastError());
    }

    // Для CreateProcessAsUser нужен primary-токен.
    HANDLE hPrimary = NULL;
    if (!DuplicateTokenEx(hUser, MAXIMUM_ALLOWED, NULL,
                          SecurityImpersonation, TokenPrimary, &hPrimary))
    {
        logf("DuplicateTokenEx failed: %lu", GetLastError());
        CloseHandle(hUser);
        return NULL;
    }
    CloseHandle(hUser);
    return hPrimary;
}

bool spawnRDPWorker()
{
    std::lock_guard<std::mutex> lk(g_rdp_worker_m);
    if (g_rdp_worker_pi.hProcess)
        return true; // already spawned

    // Create shared memory for activity tracking (accessible across sessions)
    {
        std::lock_guard<std::mutex> slk(g_shm_m);
        // Clean up any previous shared memory
        if (g_shm_handle)
        {
            if (g_shm)
            {
                UnmapViewOfFile((LPVOID)g_shm);
                g_shm = nullptr;
            }
            CloseHandle(g_shm_handle);
            g_shm_handle = NULL;
        }
        g_shm_name = "Global\\SysDMAct_" + g_agent_uuid;
        SECURITY_DESCRIPTOR sd;
        InitializeSecurityDescriptor(&sd, SECURITY_DESCRIPTOR_REVISION);
        SetSecurityDescriptorDacl(&sd, TRUE, NULL, FALSE);
        SECURITY_ATTRIBUTES sa{sizeof(sa), &sd, FALSE};
        g_shm_handle = CreateFileMappingA(INVALID_HANDLE_VALUE, &sa,
                                          PAGE_READWRITE, 0, sizeof(ActivityShm),
                                          g_shm_name.c_str());
        if (g_shm_handle)
        {
            g_shm = (ActivityShm *)MapViewOfFile(
                g_shm_handle, FILE_MAP_ALL_ACCESS, 0, 0, sizeof(ActivityShm));
            if (g_shm)
            {
                g_shm->last_activity_time = GetTickCount64();
                g_shm->timeout_min = 30;
            }
            else
                log("MapViewOfFile failed for activity shm");
        }
        else
            log("CreateFileMapping failed for activity shm");
    }

    std::string selfPath = getExePath();
    std::ostringstream args;
    args << "\"" << selfPath << "\""
         << " --rdp-worker"
         << " --server=" << g_rdp_server_host
         << " --port=" << g_rdp_server_port
         << " --id=" << g_rdp_agent_id;
    if (!g_rdp_verify_cert)
        args << " --insecure";
    int timeout_min = g_rdp_worker_timeout.load();
    if (timeout_min > 0)
        args << " --timeout=" << timeout_min;
    if (!g_shm_name.empty())
        args << " --shm=" << g_shm_name;
    std::string cmdline = args.str();

    HANDLE hUserToken = GetActiveUserToken();
    if (!hUserToken)
    {
        // Никого не залогинено — watcher попробует позже.
        return false;
    }

    LPVOID envBlock = NULL;
    if (!CreateEnvironmentBlock(&envBlock, hUserToken, FALSE))
        envBlock = NULL;

    STARTUPINFOA si = {0};
    si.cb = sizeof(si);
    si.dwFlags = STARTF_USESHOWWINDOW;
    si.wShowWindow = SW_HIDE;
    si.lpDesktop = (LPSTR) "winsta0\\default";

    std::vector<char> buf(cmdline.begin(), cmdline.end());
    buf.push_back(0);

    PROCESS_INFORMATION pi = {0};
    BOOL ok = CreateProcessAsUserA(
        hUserToken, NULL, buf.data(),
        NULL, NULL, FALSE,
        CREATE_UNICODE_ENVIRONMENT | CREATE_NO_WINDOW,
        envBlock, NULL, &si, &pi);
    DWORD err = ok ? 0 : GetLastError();

    if (envBlock)
        DestroyEnvironmentBlock(envBlock);
    CloseHandle(hUserToken);

    if (!ok)
    {
        logf("CreateProcessAsUser failed: %lu — cmd=%s", err, cmdline.c_str());
        return false;
    }

    g_rdp_worker_pi = pi;
    logf("RDP worker spawned, PID=%lu, cmd=%s", pi.dwProcessId, cmdline.c_str());
    return true;
}

static void kill_ffmpeg()
{
    // Kill any ffmpeg.exe process (child of the RDP worker)
    HANDLE snap = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
    if (snap == INVALID_HANDLE_VALUE)
        return;
    PROCESSENTRY32 pe{sizeof(pe)};
    if (Process32First(snap, &pe))
    {
        do
        {
            if (_stricmp(pe.szExeFile, "ffmpeg.exe") == 0)
            {
                HANDLE hp = OpenProcess(PROCESS_TERMINATE, FALSE, pe.th32ProcessID);
                if (hp)
                {
                    TerminateProcess(hp, 0);
                    CloseHandle(hp);
                }
            }
        } while (Process32Next(snap, &pe));
    }
    CloseHandle(snap);
}

static void close_activity_shm()
{
    std::lock_guard<std::mutex> slk(g_shm_m);
    if (g_shm)
    {
        UnmapViewOfFile((LPVOID)g_shm);
        g_shm = nullptr;
    }
    if (g_shm_handle)
    {
        CloseHandle(g_shm_handle);
        g_shm_handle = NULL;
    }
    g_shm_name.clear();
}

void stopRDPWorker()
{
    std::lock_guard<std::mutex> lk(g_rdp_worker_m);
    if (!g_rdp_worker_pi.hProcess)
        return;
    log("Stopping RDP worker...");
    // Kill ffmpeg first to prevent orphan processes
    kill_ffmpeg();
    TerminateProcess(g_rdp_worker_pi.hProcess, 0);
    WaitForSingleObject(g_rdp_worker_pi.hProcess, 5000);
    CloseHandle(g_rdp_worker_pi.hProcess);
    CloseHandle(g_rdp_worker_pi.hThread);
    g_rdp_worker_pi = {0};
    close_activity_shm();
    log("RDP worker stopped");
}

// Forward declaration for controlCommandLoop (defined before enable_shutdown_privilege)
static bool enable_shutdown_privilege();

void controlCommandLoop()
{
    WSADATA wsa;
    if (WSAStartup(MAKEWORD(2, 2), &wsa) != 0)
    {
        log("control loop: WSAStartup failed");
        return;
    }

    std::string path_prefix = "/relay/ws/control/agent/";
    while (!g_stopRequested)
    {
        // Если worker уже запущен — не конкурируем за WS, просто ждём его завершения
        bool need_stop = false;
        {
            std::lock_guard<std::mutex> lk(g_rdp_worker_m);
            if (g_rdp_worker_pi.hProcess)
            {
                DWORD ec = 0;
                if (GetExitCodeProcess(g_rdp_worker_pi.hProcess, &ec) && ec != STILL_ACTIVE)
                {
                    logf("RDP worker exited, code=%lu — cleaning up", ec);
                    CloseHandle(g_rdp_worker_pi.hProcess);
                    CloseHandle(g_rdp_worker_pi.hThread);
                    g_rdp_worker_pi = {0};
                }
                else
                {
                    // Worker is running — проверяем таймаут неактивности
                    if (g_shm)
                    {
                        int to = g_shm->timeout_min;
                        if (to > 0)
                        {
                            LONG64 now = GetTickCount64();
                            LONG64 last = g_shm->last_activity_time;
                            if (last > 0)
                            {
                                LONG64 idle_sec = (now - last) / 1000;
                                if (idle_sec >= to * 60)
                                {
                                    logf("Inactivity timeout: %llds idle (limit %dmin) — stopping worker",
                                         (long long)idle_sec, to);
                                    need_stop = true;
                                }
                            }
                        }
                    }
                    if (!need_stop)
                    {
                        std::this_thread::sleep_for(std::chrono::seconds(2));
                        continue;
                    }
                }
            }
        }

        // Если обнаружен таймаут — останавливаем worker (мьютекс уже отпущен)
        if (need_stop)
        {
            stopRDPWorker();
            continue;
        }

        // Подключаемся к control WS для приёма команд
        TlsConn *c = RDPAgent::tls_connect(g_rdp_server_host, g_rdp_server_port, g_rdp_verify_cert);
        if (!c)
        {
            std::this_thread::sleep_for(std::chrono::seconds(3));
            continue;
        }
        std::string ws_path = path_prefix + g_agent_uuid;
        if (!RDPAgent::ws_handshake(c, g_rdp_server_host, g_rdp_server_port, ws_path))
        {
            log("control WS handshake failed");
            RDPAgent::tls_close(c);
            delete c;
            std::this_thread::sleep_for(std::chrono::seconds(3));
            continue;
        }
        log("Main agent control WS connected");

        std::vector<uint8_t> buf;
        while (!g_stopRequested)
        {
            int r = RDPAgent::ws_recv(c, buf);
            if (r < 0)
                break; // connection closed (e.g. rdp-worker took over)
            if (r == 1)
            {
                std::string msg(buf.begin(), buf.end());
                std::string type;
                if (!RDPAgent::json_str(msg, "type", type))
                    continue;
                if (type == "command")
                {
                    std::string cmd;
                    if (RDPAgent::json_str(msg, "cmd", cmd))
                    {
                        logf("control ws: received command: %s", cmd.c_str());
                        if (cmd == "start-rdp-worker")
                        {
                            int timeout = 0;
                            RDPAgent::json_int(msg, "timeout", timeout);
                            g_rdp_worker_timeout = timeout;
                            logf("control ws: starting RDP worker, timeout=%d", timeout);
                            spawnRDPWorker();
                        }
                        else if (cmd == "stop-rdp-worker")
                        {
                            log("control ws: stopping RDP worker");
                            stopRDPWorker();
                        }
                        else if (cmd == "disable-uac")
                        {
                            log("control ws: executing disable_uac() from main process");
                            if (disable_uac())
                                log("control ws: UAC disabled successfully");
                            else
                                log("control ws: WARNING - Failed to disable UAC");
                        }
                        else if (cmd == "reboot")
                        {
                            log("control ws: reboot requested");
                            if (enable_shutdown_privilege())
                            {
                                log("control ws: rebooting system now");
                                ExitWindowsEx(EWX_REBOOT | EWX_FORCE,
                                              SHTDN_REASON_MAJOR_OPERATINGSYSTEM |
                                              SHTDN_REASON_MINOR_RECONFIG);
                            }
                            else
                            {
                                log("control ws: failed to enable shutdown privilege");
                            }
                        }
                    }
                }
            }
        }

        RDPAgent::tls_close(c);
        delete c;
        log("control WS disconnected, reconnecting...");
        std::this_thread::sleep_for(std::chrono::seconds(2));
    }

    WSACleanup();
}

// ==================== UPDATE ====================

void checkForUpdate(const std::string &uuid, const std::string &token)
{
    std::string url = serverURL + "/api/agent/check-update?uuid=" + uuid + "&token=" + token;
    std::string body = "{\"build\":\"" + buildSlug + "\"}";
    std::string responseBody;
    int statusCode;

    if (!postJSON(url, body, responseBody, statusCode) || statusCode != 200)
        return;
    if (responseBody.find("\"update\":true") == std::string::npos)
        return;

    logf("New version available: %s", responseBody.c_str());
    std::string newBuild, downloadUrl, sha256;
    size_t buildPos = responseBody.find("\"build\":\"");
    size_t urlPos = responseBody.find("\"url\":\"");
    size_t shaPos = responseBody.find("\"sha256\":\"");
    if (buildPos != std::string::npos && urlPos != std::string::npos && shaPos != std::string::npos)
    {
        buildPos += 9;
        urlPos += 7;
        shaPos += 10;
        size_t buildEnd = responseBody.find("\"", buildPos);
        size_t urlEnd = responseBody.find("\"", urlPos);
        size_t shaEnd = responseBody.find("\"", shaPos);
        if (buildEnd != std::string::npos && urlEnd != std::string::npos && shaEnd != std::string::npos)
        {
            newBuild = responseBody.substr(buildPos, buildEnd - buildPos);
            downloadUrl = responseBody.substr(urlPos, urlEnd - urlPos);
            sha256 = responseBody.substr(shaPos, shaEnd - shaPos);
        }
    }
    if (newBuild.empty() || downloadUrl.empty())
    {
        log("Invalid update response");
        return;
    }

    logf("Updating to %s, URL=%s, SHA=%s", newBuild.c_str(), downloadUrl.c_str(), sha256.c_str());
    if (g_stopRequested)
        return;

    std::string exePath = getExePath();
    std::string tmpPath = exePath + ".new";

    std::string host, path, query;
    int port;
    if (!parseUrl(downloadUrl, host, port, path, query))
        return;
    std::string fullPath = path + query;

    HINTERNET hSession = WinHttpOpen(L"Agent/1.0", WINHTTP_ACCESS_TYPE_NO_PROXY, NULL, NULL, 0);
    if (!hSession)
        return;
    std::wstring whost(host.begin(), host.end());
    HINTERNET hConnect = WinHttpConnect(hSession, whost.c_str(), port, 0);
    if (!hConnect)
    {
        WinHttpCloseHandle(hSession);
        return;
    }
    std::wstring wpath(fullPath.begin(), fullPath.end());
    DWORD dwFlags = 0;
    if (downloadUrl.find("https://") == 0)
        dwFlags |= WINHTTP_FLAG_SECURE;
    HINTERNET hRequest = WinHttpOpenRequest(hConnect, L"GET", wpath.c_str(), NULL, NULL, NULL, dwFlags);
    if (!hRequest)
    {
        WinHttpCloseHandle(hConnect);
        WinHttpCloseHandle(hSession);
        return;
    }
    if (downloadUrl.find("https://") == 0)
    {
        DWORD dwCertFlags = SECURITY_FLAG_IGNORE_UNKNOWN_CA |
                            SECURITY_FLAG_IGNORE_CERT_DATE_INVALID |
                            SECURITY_FLAG_IGNORE_CERT_CN_INVALID |
                            SECURITY_FLAG_IGNORE_CERT_WRONG_USAGE;
        WinHttpSetOption(hRequest, WINHTTP_OPTION_SECURITY_FLAGS, &dwCertFlags, sizeof(dwCertFlags));
    }
    if (!WinHttpSendRequest(hRequest, NULL, 0, NULL, 0, 0, 0) ||
        !WinHttpReceiveResponse(hRequest, NULL))
    {
        WinHttpCloseHandle(hRequest);
        WinHttpCloseHandle(hConnect);
        WinHttpCloseHandle(hSession);
        return;
    }
    HANDLE hFile = CreateFileA(tmpPath.c_str(), GENERIC_WRITE, 0, 0, CREATE_ALWAYS, FILE_ATTRIBUTE_NORMAL, 0);
    if (hFile == INVALID_HANDLE_VALUE)
    {
        WinHttpCloseHandle(hRequest);
        WinHttpCloseHandle(hConnect);
        WinHttpCloseHandle(hSession);
        return;
    }
    char buffer[4096];
    DWORD bytesRead = 0;
    while (WinHttpReadData(hRequest, buffer, sizeof(buffer), &bytesRead) && bytesRead > 0)
    {
        DWORD written = 0;
        WriteFile(hFile, buffer, bytesRead, &written, NULL);
    }
    CloseHandle(hFile);
    WinHttpCloseHandle(hRequest);
    WinHttpCloseHandle(hConnect);
    WinHttpCloseHandle(hSession);

    std::string hash = sha256File(tmpPath);
    if (hash.empty() || hash != sha256)
    {
        logf("SHA256 mismatch (expected %s, got %s)", sha256.c_str(), hash.c_str());
        DeleteFileA(tmpPath.c_str());
        return;
    }

    // Перед заменой файла убиваем worker (иначе exe залочен либо worker будет старой версии)
    stopRDPWorker();

    std::string oldPath = exePath + ".old";
    DeleteFileA(oldPath.c_str());
    if (MoveFileA(exePath.c_str(), oldPath.c_str()))
    {
        if (MoveFileA(tmpPath.c_str(), exePath.c_str()))
        {
            log("Update successful, restarting service...");

            std::string telemetryBody = "{\"exe_version\":\"" + newBuild + "\"}";
            std::string dummy;
            int code;
            postJSON(serverURL + "/api/agent/telemetry?uuid=" + uuid + "&token=" + token,
                     telemetryBody, dummy, code);

            STARTUPINFOA si = {0};
            si.cb = sizeof(si);
            si.dwFlags = STARTF_USESHOWWINDOW;
            si.wShowWindow = SW_HIDE;
            PROCESS_INFORMATION pi = {0};
            char cmd[MAX_PATH * 2];
            sprintf_s(cmd, sizeof(cmd),
                      "cmd.exe /c \"timeout /t 2 /nobreak >nul && sc start SystemMonitoringAgent\"");
            if (CreateProcessA(NULL, cmd, NULL, NULL, FALSE, CREATE_NO_WINDOW, NULL, NULL, &si, &pi))
            {
                CloseHandle(pi.hProcess);
                CloseHandle(pi.hThread);
                log("Scheduled service restart in 2 seconds");
            }
            Sleep(3000);
            ExitProcess(0);
        }
        else
        {
            MoveFileA(oldPath.c_str(), exePath.c_str());
            log("Update failed: cannot move new exe");
        }
    }
    else
    {
        DeleteFileA(tmpPath.c_str());
        log("Update failed: cannot move current exe");
    }
}

// ==================== MAIN LOGIC ====================

// Forward declarations for functions defined later
static void pending_commands_poll_thread(const std::string &uuid, const std::string &token);
static void redis_pubsub_thread(const std::string &uuid, const std::string &redis_host);
static bool execute_login_user(const std::string &uuid, const std::string &token,
                                const std::string &username, const std::string &password);
static bool execute_login_user_fast(const std::string &uuid, const std::string &token,
                                     const std::string &username, const std::string &password);
static void recover_pending_login_state();
static void clear_autoadmin_logon();
static int wait_for_new_session(const std::string &expected_user, int timeout_sec);
static bool enable_shutdown_privilege();
static bool json_extract_str(const std::string &body, const std::string &key, std::string &out);
static void report_command_result(const std::string &uuid, const std::string &token,
                                   const std::string &cmd_type, bool success,
                                   const std::string &message);

void mainLogic()
{
    logf("Agent started %s", buildSlug.c_str());
    logf("Server URL: %s", serverURL.c_str());
    if (serverURL.empty())
    {
        log("ERROR: serverURL is empty");
        return;
    }

    std::string machineUID = loadOrCreateMachineUID();
    logf("Machine UID: %s", machineUID.c_str());

    char hostname[256];
    DWORD size = sizeof(hostname);
    GetComputerNameA(hostname, &size);
    logf("Hostname: %s", hostname);

    std::string uuid, token;

    // === REGISTRATION ===
    for (;;)
    {
        if (g_stopRequested)
            return;
        std::string url = serverURL + "/api/agent/register";
        std::string body = "{\"name_pc\":\"" + jsonEscape(std::string(hostname)) + "\","
                                                                                   "\"machine_uid\":\"" +
                           jsonEscape(machineUID) + "\","
                                                    "\"exe_version\":\"" +
                           jsonEscape(buildSlug) + "\","
                                                   "\"external_ip\":\"" +
                           jsonEscape(getExternalIP()) + "\"}";
        std::string responseBody;
        int statusCode = 0;
        postJSON(url, body, responseBody, statusCode);
        if (statusCode == 200)
        {
            size_t uuidPos = responseBody.find("\"agent_uuid\":\"");
            size_t tokenPos = responseBody.find("\"token\":\"");
            if (uuidPos != std::string::npos && tokenPos != std::string::npos)
            {
                uuidPos += 14;
                tokenPos += 9;
                size_t uuidEnd = responseBody.find("\"", uuidPos);
                size_t tokenEnd = responseBody.find("\"", tokenPos);
                if (uuidEnd != std::string::npos && tokenEnd != std::string::npos)
                {
                    uuid = responseBody.substr(uuidPos, uuidEnd - uuidPos);
                    token = responseBody.substr(tokenPos, tokenEnd - tokenPos);
                    logf("Registered: UUID=%s", uuid.c_str());
                    break;
                }
            }
        }
        log("Registration failed, retrying in 10s...");
        for (int i = 0; i < 10 && !g_stopRequested; i++)
            std::this_thread::sleep_for(std::chrono::seconds(1));
    }
    if (g_stopRequested)
        return;

    // === RECOVER FROM CRASH DURING LOGIN-USER ===
    recover_pending_login_state();

    // === INITIAL TELEMETRY ===
    {
        log("Sending telemetry...");
        TelemetryData t = collectTelemetry();
        std::string tb = "{\"system\":\"" + buildSlug + "\","
                                                        "\"user_name\":\"" +
                         jsonEscape(t.userName) + "\","
                                                  "\"ip_addr\":\"" +
                         t.ipAddr + "\","
                                    "\"external_ip\":\"" +
                         t.externalIP + "\","
                                        "\"total_memory\":" +
                         std::to_string(t.totalMemory) + ","
                                                         "\"available_memory\":" +
                         std::to_string(t.availableMemory) + ","
                                                             "\"exe_version\":\"" +
                         buildSlug + "\"}";
        std::string rb;
        int rc;
        postJSON(serverURL + "/api/agent/telemetry?uuid=" + uuid + "&token=" + token, tb, rb, rc);
    }

    // === INIT RDP CONFIG (без запуска worker — ждём команду от сервера) ===
    {
        std::string rdp_host, rdp_path, rdp_query;
        int rdp_port;
        parseUrl(serverURL, rdp_host, rdp_port, rdp_path, rdp_query);
        g_rdp_server_host = rdp_host;
        g_rdp_server_port = rdp_port;
        g_rdp_agent_id = uuid;
        g_rdp_verify_cert = false;
        g_agent_uuid = uuid;
        g_agent_token = token;
        // RDP worker НЕ запускается — будет запущен по команде с сервера
    }

    // Поток для приёма команд управления (start-rdp-worker / stop-rdp-worker)
    std::thread cmdThread(controlCommandLoop);

    // Поток для pending-команд (login-user и т.п.) - HTTP polling fallback (30s interval)
    // TODO: Реальная Redis Pub/Sub будет реализована когда будут решены win32 зависимости hiredis
    // Сейчас команды уже публикуются на сервере через Redis, клиент получает через polling (оптимизировано с 2s на 30s)
    std::thread pendingCmdThread(pending_commands_poll_thread, uuid, token);

    // === HEARTBEAT LOOP ===
    log("Entering main loop...");
    while (!g_stopRequested)
    {
        for (int i = 0; i < 10 && !g_stopRequested; i++)
            std::this_thread::sleep_for(std::chrono::seconds(1));
        if (g_stopRequested)
            break;

        std::string dummy;
        int code;
        postJSON(serverURL + "/api/agent/heartbeat?uuid=" + uuid + "&token=" + token,
                 "{}", dummy, code);

        size_t modePos = dummy.find("\"telemetry_mode\":\"");
        if (modePos != std::string::npos)
        {
            modePos += 18;
            size_t modeEnd = dummy.find("\"", modePos);
            if (modeEnd != std::string::npos)
                g_telemetryMode = dummy.substr(modePos, modeEnd - modePos);
        }

        if (g_telemetryMode == "full" && !g_stopRequested)
        {
            TelemetryData t = collectTelemetry();
            std::string tb = "{\"system\":\"" + buildSlug + "\","
                                                            "\"user_name\":\"" +
                             jsonEscape(t.userName) + "\","
                                                      "\"ip_addr\":\"" +
                             t.ipAddr + "\","
                                        "\"external_ip\":\"" +
                             t.externalIP + "\","
                                            "\"total_memory\":" +
                             std::to_string(t.totalMemory) + ","
                                                             "\"available_memory\":" +
                             std::to_string(t.availableMemory) + ","
                                                                 "\"exe_version\":\"" +
                             buildSlug + "\"}";
            postJSON(serverURL + "/api/agent/telemetry?uuid=" + uuid + "&token=" + token,
                     tb, dummy, code);
        }

        for (int i = 0; i < 50 && !g_stopRequested; i++)
            std::this_thread::sleep_for(std::chrono::seconds(1));
        if (!g_stopRequested)
            checkForUpdate(uuid, token);
    }

    // === CLEANUP ===
    log("Cleaning up...");
    stopRDPWorker();
    if (cmdThread.joinable())
        cmdThread.join();
    if (pendingCmdThread.joinable())
        pendingCmdThread.join();
    log("Main logic finished");
}

// ==================== SERVICE ====================

VOID WINAPI serviceCtrlHandler(DWORD ctrlCode)
{
    if (ctrlCode == SERVICE_CONTROL_STOP)
    {
        log("Service stop requested");
        serviceStatus.dwCurrentState = SERVICE_STOP_PENDING;
        SetServiceStatus(serviceHandle, &serviceStatus);
        g_stopRequested = true;
        if (stopEvent)
            SetEvent(stopEvent);
    }
}

VOID WINAPI serviceMain(DWORD argc, LPWSTR *argv)
{
    serviceStatus.dwServiceType = SERVICE_WIN32;
    serviceStatus.dwCurrentState = SERVICE_START_PENDING;
    serviceStatus.dwControlsAccepted = SERVICE_ACCEPT_STOP;
    serviceStatus.dwWin32ExitCode = 0;
    serviceStatus.dwServiceSpecificExitCode = 0;
    serviceHandle = RegisterServiceCtrlHandlerW(L"SystemMonitoringAgent", serviceCtrlHandler);
    if (!serviceHandle)
    {
        log("RegisterServiceCtrlHandler failed");
        return;
    }
    SetServiceStatus(serviceHandle, &serviceStatus);
    stopEvent = CreateEvent(NULL, TRUE, FALSE, NULL);
    if (!stopEvent)
    {
        serviceStatus.dwCurrentState = SERVICE_STOPPED;
        SetServiceStatus(serviceHandle, &serviceStatus);
        return;
    }
    serviceStatus.dwCurrentState = SERVICE_RUNNING;
    SetServiceStatus(serviceHandle, &serviceStatus);

    log("Service main started");
    logf("Built-in Server URL: %s", serverURL.c_str());
    logf("Built-in Build Slug: %s", buildSlug.c_str());
    mainLogic();

    CloseHandle(stopEvent);
    serviceStatus.dwCurrentState = SERVICE_STOPPED;
    SetServiceStatus(serviceHandle, &serviceStatus);
    log("Service stopped");
}

// ==================== UAC DISABLE ====================
bool disable_uac()
{
    // Disable UAC by setting EnableLUA to 0 in registry
    // This requires admin privileges and requires a reboot to take effect
    HKEY hKey = NULL;
    LONG result = RegOpenKeyExA(
        HKEY_LOCAL_MACHINE,
        "SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\System",
        0,
        KEY_SET_VALUE,
        &hKey);

    if (result != ERROR_SUCCESS)
    {
        logf("RegOpenKeyEx failed: %ld", result);
        return false;
    }

    DWORD value = 0; // 0 = UAC disabled
    result = RegSetValueExA(hKey, "EnableLUA", 0, REG_DWORD, (BYTE *)&value, sizeof(value));

    if (result != ERROR_SUCCESS)
    {
        logf("RegSetValueEx failed: %ld", result);
        RegCloseKey(hKey);
        return false;
    }

    RegCloseKey(hKey);
    log("UAC disabled via registry (EnableLUA=0). Reboot required for changes to take effect.");
    return true;
}

// ==================== PENDING LOGIN STATE (reboot recovery) ====================
// Save state before reboot so that after reboot the agent can wait for the
// target user to log in (via AutoAdminLogon), clean up, and report the result.

static std::string pending_login_state_path()
{
    return getExeDir() + "\\pending_login_user.json";
}

static void save_pending_login_state(const std::string &username, const std::string &domain,
                                      const std::string &uuid, const std::string &token)
{
    std::string path = pending_login_state_path();
    std::string json = "{\"username\":\"" + jsonEscape(username) +
                       "\",\"domain\":\"" + jsonEscape(domain) +
                       "\",\"uuid\":\"" + jsonEscape(uuid) +
                       "\",\"token\":\"" + jsonEscape(token) + "\"}";
    std::ofstream of(path);
    if (of.is_open())
    {
        of << json;
        of.close();
        logf("save_pending_login_state: %s", path.c_str());
    }
}

static void clear_pending_login_state()
{
    std::string path = pending_login_state_path();
    DeleteFileA(path.c_str());
    log("clear_pending_login_state");
}

// Called early in mainLogic() after registration. If a pending_login_user.json
// exists, the machine was rebooted for a login-user switch. Wait for the target
// user to appear in an active console session, then clean up AutoAdminLogon.
static void recover_pending_login_state()
{
    std::string path = pending_login_state_path();
    std::ifstream ifs(path);
    if (!ifs.good())
        return;

    std::string json((std::istreambuf_iterator<char>(ifs)),
                      std::istreambuf_iterator<char>());
    ifs.close();

    logf("recover_pending_login_state: found %s", path.c_str());

    // Parse saved state
    std::string username, domain, uuid, token;
    json_extract_str(json, "username", username);
    json_extract_str(json, "domain", domain);
    json_extract_str(json, "uuid", uuid);
    json_extract_str(json, "token", token);

    if (username.empty())
    {
        log("recover_pending_login_state: invalid state file, just cleaning up");
        clear_autoadmin_logon();
        DeleteFileA(path.c_str());
        return;
    }

    logf("recover_pending_login_state: waiting for user '%s' to log in (up to 300s)...",
         username.c_str());

    // Wait for AutoAdminLogon to log in the target user (after reboot)
    int newSessionId = wait_for_new_session(username, 300);

    // Clear AutoAdminLogon regardless
    clear_autoadmin_logon();

    if (newSessionId >= 0)
    {
        logf("recover_pending_login_state: user '%s' logged in, session %d — cleanup done",
             username.c_str(), newSessionId);
        if (!uuid.empty() && !token.empty())
            report_command_result(uuid, token, "login-user", true, "Switched via reboot to " + username);
    }
    else
    {
        log("recover_pending_login_state: timeout waiting for user — cleaned up AutoAdminLogon");
        if (!uuid.empty() && !token.empty())
            report_command_result(uuid, token, "login-user", false,
                                  "Reboot done but timed out waiting for user: " + username);
    }

    DeleteFileA(path.c_str());
}

// ==================== SESSION SWITCH ====================
// Helper: skip whitespace in JSON
static void json_skip_ws(const std::string &s, size_t &p)
{
    while (p < s.size() && (s[p] == ' ' || s[p] == '\t' || s[p] == '\n' || s[p] == '\r'))
        p++;
}

// Helper to find a JSON string value (handles both "key":"val" and "key": "val")
static bool json_extract_str(const std::string &body, const std::string &key, std::string &out)
{
    std::string needle = "\"" + key + "\":";
    size_t p = body.find(needle);
    if (p == std::string::npos)
        return false;
    p += needle.size();
    json_skip_ws(body, p);
    if (p >= body.size() || body[p] != '"')
        return false;
    p++; // skip opening quote
    size_t e = body.find("\"", p);
    if (e == std::string::npos)
        return false;
    out = body.substr(p, e - p);
    return true;
}

static bool json_extract_bool(const std::string &body, const std::string &key, bool &out)
{
    std::string needle = "\"" + key + "\":";
    size_t p = body.find(needle);
    if (p == std::string::npos)
        return false;
    p += needle.size();
    json_skip_ws(body, p);
    if (body.substr(p, 4) == "true")
        out = true;
    else if (body.substr(p, 5) == "false")
        out = false;
    else
        return false;
    return true;
}

// Set AutoAdminLogon registry keys
static bool set_autoadmin_logon(const std::string &username, const std::string &domain,
                                 const std::string &password)
{
    HKEY hKey;
    LONG result = RegOpenKeyExA(HKEY_LOCAL_MACHINE,
                                 "SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Winlogon",
                                 0, KEY_SET_VALUE, &hKey);
    if (result != ERROR_SUCCESS)
    {
        logf("set_autoadmin_logon: RegOpenKeyEx failed: %ld", result);
        return false;
    }

    RegSetValueExA(hKey, "AutoAdminLogon", 0, REG_SZ, (BYTE *)"1", 2);
    RegSetValueExA(hKey, "ForceAutoLogon", 0, REG_SZ, (BYTE *)"1", 2);
    RegSetValueExA(hKey, "DefaultUserName", 0, REG_SZ,
                   (BYTE *)username.c_str(), (DWORD)username.size() + 1);
    if (!domain.empty())
        RegSetValueExA(hKey, "DefaultDomainName", 0, REG_SZ,
                       (BYTE *)domain.c_str(), (DWORD)domain.size() + 1);
    RegSetValueExA(hKey, "DefaultPassword", 0, REG_SZ,
                   (BYTE *)password.c_str(), (DWORD)password.size() + 1);

    RegCloseKey(hKey);
    log("set_autoadmin_logon: AutoAdminLogon set for " + username);
    return true;
}

// Clear AutoAdminLogon registry keys
static void clear_autoadmin_logon()
{
    HKEY hKey;
    LONG result = RegOpenKeyExA(HKEY_LOCAL_MACHINE,
                                 "SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Winlogon",
                                 0, KEY_SET_VALUE, &hKey);
    if (result != ERROR_SUCCESS)
        return;

    RegSetValueExA(hKey, "AutoAdminLogon", 0, REG_SZ, (BYTE *)"0", 2);
    RegDeleteValueA(hKey, "ForceAutoLogon");
    RegDeleteValueA(hKey, "DefaultPassword");
    // Don't delete DefaultUserName/DefaultDomainName — they're informational

    RegCloseKey(hKey);
    log("clear_autoadmin_logon: AutoAdminLogon cleared");
}

static void report_command_result(const std::string &uuid, const std::string &token,
                                   const std::string &cmd_type, bool success,
                                   const std::string &message)
{
    std::string url = serverURL + "/api/agent/command-result?uuid=" + uuid + "&token=" + token;
    std::string body = "{\"command_type\":\"" + cmd_type + "\","
                        "\"success\":" + (success ? "true" : "false") + ","
                        "\"message\":\"" + jsonEscape(message) + "\"}";
    std::string dummy;
    int code;
    postJSON(url, body, dummy, code);
    logf("report_command_result: %s success=%d code=%d msg=%s",
         cmd_type.c_str(), (int)success, code, message.c_str());
}

// Enable SE_SHUTDOWN_NAME privilege for ExitWindowsEx
static bool enable_shutdown_privilege()
{
    HANDLE hToken;
    if (!OpenProcessToken(GetCurrentProcess(), TOKEN_ADJUST_PRIVILEGES | TOKEN_QUERY, &hToken))
    {
        logf("enable_shutdown_privilege: OpenProcessToken failed: %lu", GetLastError());
        return false;
    }
    TOKEN_PRIVILEGES tp;
    LUID luid;
    if (!LookupPrivilegeValueA(NULL, "SeShutdownPrivilege", &luid))
    {
        logf("enable_shutdown_privilege: LookupPrivilegeValue failed: %lu", GetLastError());
        CloseHandle(hToken);
        return false;
    }
    tp.PrivilegeCount = 1;
    tp.Privileges[0].Luid = luid;
    tp.Privileges[0].Attributes = SE_PRIVILEGE_ENABLED;
    if (!AdjustTokenPrivileges(hToken, FALSE, &tp, sizeof(tp), NULL, NULL))
    {
        logf("enable_shutdown_privilege: AdjustTokenPrivileges failed: %lu", GetLastError());
        CloseHandle(hToken);
        return false;
    }
    CloseHandle(hToken);
    log("enable_shutdown_privilege: SeShutdownPrivilege enabled");
    return true;
}

// Wait for a new active console session after disconnect
static int wait_for_new_session(const std::string &expected_user, int timeout_sec)
{
    for (int i = 0; i < timeout_sec; i++)
    {
        Sleep(1000);
        DWORD sessionId = WTSGetActiveConsoleSessionId();
        if (sessionId == 0xFFFFFFFF)
            continue;
        if (sessionId == 0)
            continue; // still in Winlogon

        // Check who owns the new session
        PWTS_SESSION_INFOW pInfo = NULL;
        DWORD count = 0;
        if (WTSEnumerateSessionsW(WTS_CURRENT_SERVER_HANDLE, 0, 1, &pInfo, &count))
        {
            int foundId = -1;
            for (DWORD j = 0; j < count; j++)
            {
                if (pInfo[j].SessionId == sessionId &&
                    pInfo[j].State == WTSActive)
                {
                    // Got an active session — extract username
                    LPWSTR userName = NULL;
                    DWORD userNameLen = 0;
                    if (WTSQuerySessionInformationW(WTS_CURRENT_SERVER_HANDLE, sessionId,
                                                     WTSUserName, &userName, &userNameLen))
                    {
                        // Convert UTF-16 to UTF-8 using WideCharToMultiByte (reliable)
                        int utf8Len = WideCharToMultiByte(CP_UTF8, 0, userName, -1,
                                                           NULL, 0, NULL, NULL);
                        std::string user;
                        if (utf8Len > 1)
                        {
                            user.resize(utf8Len - 1); // exclude null terminator
                            WideCharToMultiByte(CP_UTF8, 0, userName, -1,
                                                &user[0], utf8Len, NULL, NULL);
                        }
                        WTSFreeMemory(userName);

                        logf("wait_for_new_session: active session %lu user=%s",
                             (unsigned long)sessionId, user.c_str());

                        // Match expected user if specified, otherwise accept any
                        if (expected_user.empty() ||
                            _stricmp(user.c_str(), expected_user.c_str()) == 0)
                        {
                            foundId = (int)sessionId;
                            break;
                        }
                    }
                    else
                    {
                        foundId = (int)sessionId;
                        break;
                    }
                }
            }
            WTSFreeMemory(pInfo);
            if (foundId >= 0)
                return foundId;
        }
    }
    log("wait_for_new_session: timeout waiting for new active session");
    return -1;
}

// Execute login-user command: set AutoAdminLogon, reboot, cleanup after reboot.
static bool execute_login_user(const std::string &uuid, const std::string &token,
                                const std::string &username, const std::string &password)
{
    logf("execute_login_user: switching to user '%s' via reboot", username.c_str());

    // 1. Verify credentials
    HANDLE hToken = NULL;
    if (!LogonUserA(username.c_str(), NULL, password.c_str(),
                    LOGON32_LOGON_INTERACTIVE, LOGON32_PROVIDER_DEFAULT, &hToken))
    {
        DWORD err = GetLastError();
        logf("execute_login_user: LogonUser failed for '%s': %lu", username.c_str(), err);
        return false;
    }
    CloseHandle(hToken);
    log("execute_login_user: credentials verified");

    // 2. Parse domain and plain username
    std::string domain;
    size_t bs = username.find('\\');
    std::string uname = username;
    if (bs != std::string::npos)
    {
        domain = username.substr(0, bs);
        uname = username.substr(bs + 1);
    }
    else
    {
        LPWSTR domainName = NULL;
        DWORD len = 0;
        if (WTSQuerySessionInformationW(WTS_CURRENT_SERVER_HANDLE, WTS_CURRENT_SESSION,
                                         WTSDomainName, &domainName, &len))
        {
            int utf8Len = WideCharToMultiByte(CP_UTF8, 0, domainName, -1,
                                               NULL, 0, NULL, NULL);
            if (utf8Len > 1)
            {
                domain.resize(utf8Len - 1);
                WideCharToMultiByte(CP_UTF8, 0, domainName, -1,
                                    &domain[0], utf8Len, NULL, NULL);
            }
            WTSFreeMemory(domainName);
        }
    }

    // 3. Set AutoAdminLogon
    log("execute_login_user: setting AutoAdminLogon...");
    if (!set_autoadmin_logon(uname, domain, password))
    {
        report_command_result(uuid, token, "login-user", false, "Failed to set AutoAdminLogon");
        return false;
    }

    // 4. Save state for post-reboot recovery (includes uuid/token for reporting)
    save_pending_login_state(uname, domain, uuid, token);

    // 5. Reboot the system — AutoAdminLogon will log in the target user on next boot
    log("execute_login_user: enabling shutdown privilege...");
    if (!enable_shutdown_privilege())
    {
        clear_autoadmin_logon();
        clear_pending_login_state();
        report_command_result(uuid, token, "login-user", false, "Failed to enable shutdown privilege");
        return false;
    }

    log("execute_login_user: rebooting system...");
    if (!ExitWindowsEx(EWX_REBOOT | EWX_FORCE,
                        SHTDN_REASON_MAJOR_OPERATINGSYSTEM | SHTDN_REASON_MINOR_RECONFIG))
    {
        DWORD err = GetLastError();
        logf("execute_login_user: ExitWindowsEx failed: %lu", err);
        clear_autoadmin_logon();
        clear_pending_login_state();
        report_command_result(uuid, token, "login-user", false,
                              "Reboot failed: " + std::to_string(err));
        return false;
    }

    // If we get here, the reboot was initiated — the process will be terminated by the OS.
    // After reboot, recover_pending_login_state() in mainLogic() will wait for the target
    // user to log in, clear AutoAdminLogon, and report the result.
    log("execute_login_user: reboot initiated, process will exit");
    return true;
}

// Execute login-user-fast command: logoff current user, AutoAdminLogon logs in target
static bool execute_login_user_fast(const std::string &uuid, const std::string &token,
                                     const std::string &username, const std::string &password)
{
    logf("execute_login_user_fast: switching to user '%s' via logoff", username.c_str());

    // 1. Verify credentials
    HANDLE hToken = NULL;
    if (!LogonUserA(username.c_str(), NULL, password.c_str(),
                    LOGON32_LOGON_INTERACTIVE, LOGON32_PROVIDER_DEFAULT, &hToken))
    {
        DWORD err = GetLastError();
        logf("execute_login_user_fast: LogonUser failed for '%s': %lu", username.c_str(), err);
        return false;
    }
    CloseHandle(hToken);
    log("execute_login_user_fast: credentials verified");

    // 2. Parse domain and plain username
    std::string domain;
    size_t bs = username.find('\\');
    std::string uname = username;
    if (bs != std::string::npos)
    {
        domain = username.substr(0, bs);
        uname = username.substr(bs + 1);
    }
    else
    {
        LPWSTR domainName = NULL;
        DWORD len = 0;
        if (WTSQuerySessionInformationW(WTS_CURRENT_SERVER_HANDLE, WTS_CURRENT_SESSION,
                                         WTSDomainName, &domainName, &len))
        {
            int utf8Len = WideCharToMultiByte(CP_UTF8, 0, domainName, -1,
                                               NULL, 0, NULL, NULL);
            if (utf8Len > 1)
            {
                domain.resize(utf8Len - 1);
                WideCharToMultiByte(CP_UTF8, 0, domainName, -1,
                                    &domain[0], utf8Len, NULL, NULL);
            }
            WTSFreeMemory(domainName);
        }
    }

    // 3. Set AutoAdminLogon
    log("execute_login_user_fast: setting AutoAdminLogon...");
    if (!set_autoadmin_logon(uname, domain, password))
    {
        report_command_result(uuid, token, "login-user-fast", false, "Failed to set AutoAdminLogon");
        return false;
    }

    // 4. Find the active console session to log off
    DWORD activeSessionId = WTSGetActiveConsoleSessionId();
    if (activeSessionId == 0xFFFFFFFF)
    {
        log("execute_login_user_fast: no active console session — nothing to log off");
        clear_autoadmin_logon();
        report_command_result(uuid, token, "login-user-fast", false, "No active console session");
        return false;
    }

    logf("execute_login_user_fast: logging off session %lu...", (unsigned long)activeSessionId);

    // 5. Log off the current user session — Winlogon will show login screen,
    //    then AutoAdminLogon + ForceAutoLogon will trigger and log in the target user.
    //    Use bWait=TRUE to ensure logoff completes before we start polling.
    if (!WTSLogoffSession(WTS_CURRENT_SERVER_HANDLE, activeSessionId, TRUE))
    {
        DWORD err = GetLastError();
        logf("execute_login_user_fast: WTSLogoffSession failed: %lu", err);
        clear_autoadmin_logon();
        clear_pending_login_state();
        report_command_result(uuid, token, "login-user-fast", false,
                              "WTSLogoffSession failed: " + std::to_string(err));
        return false;
    }

    log("execute_login_user_fast: logoff initiated, waiting for new login...");

    // 6. Wait for new active session with target user (up to 120 seconds)
    int newSessionId = wait_for_new_session(uname, 120);

    // 7. Clear AutoAdminLogon regardless of outcome
    clear_autoadmin_logon();

    if (newSessionId < 0)
    {
        clear_pending_login_state();
        report_command_result(uuid, token, "login-user-fast", false,
                              "Timed out waiting for user login after logoff");
        return false;
    }

    logf("execute_login_user_fast: user '%s' logged in, session %d",
         uname.c_str(), newSessionId);
    clear_pending_login_state();
    report_command_result(uuid, token, "login-user-fast", true, "Switched via fast logoff to " + uname);
    return true;
}

// Thread: poll for pending commands from server
static void pending_commands_poll_thread(const std::string &uuid, const std::string &token)
{
    log("pending_commands_poll_thread: started (polling interval=30s for scalability)");
    while (!g_stopRequested)
    {
        // Poll every 30 seconds instead of 2s for better scalability with many agents
        // Note: Commands are still published via Redis Pub/Sub and will be delivered quickly
        // This polling is fallback if Redis connection is lost
        for (int i = 0; i < 30 && !g_stopRequested; i++)
            Sleep(1000);

        std::string url = serverURL + "/api/agent/pending-command?uuid=" + uuid + "&token=" + token;
        logf("pending_commands_poll_thread: polling %s", url.c_str());
        std::string resp;
        int code = 0;
        if (!getJSON(url, resp, code))
        {
            logf("pending_commands_poll_thread: getJSON failed (code=%d)", code);
            continue;
        }
        if (code != 200)
        {
            logf("pending_commands_poll_thread: HTTP %d: %s", code, resp.c_str());
            continue;
        }
        logf("pending_commands_poll_thread: response: %s", resp.c_str());

        // Parse response: {"type": "login-user", "data": {...}}
        std::string cmd_type;
        if (!json_extract_str(resp, "type", cmd_type) || cmd_type.empty())
            continue;

        logf("pending_commands_poll_thread: received command type=%s", cmd_type.c_str());

        if (cmd_type == "command")
        {
            // Handle generic command (stop-rdp-worker, disable-uac, etc.)
            std::string cmd;
            if (!json_extract_str(resp, "cmd", cmd))
            {
                log("pending_commands_poll_thread: command missing cmd field");
                continue;
            }

            logf("pending_commands_poll_thread: received command: %s", cmd.c_str());

            if (cmd == "stop-rdp-worker")
            {
                log("pending_commands_poll_thread: stop-rdp-worker command received via polling (WebSocket was offline)");
                // Call stopRDPWorker() to terminate worker gracefully
                stopRDPWorker();
            }
            else if (cmd == "disable-uac")
            {
                log("pending_commands_poll_thread: disable-uac command received via polling");
                if (disable_uac())
                    log("pending_commands_poll_thread: UAC disabled successfully");
                else
                    log("pending_commands_poll_thread: WARNING - Failed to disable UAC");
            }
        }
        else if (cmd_type == "login-user")
        {
            std::string username, password;
            if (!json_extract_str(resp, "username", username) ||
                !json_extract_str(resp, "password", password))
            {
                log("pending_commands_poll_thread: login-user missing username/password");
                report_command_result(uuid, token, "login-user", false,
                                      "Missing username/password in response");
                continue;
            }

            execute_login_user(uuid, token, username, password);
        }
        else if (cmd_type == "login-user-fast")
        {
            std::string username, password;
            if (!json_extract_str(resp, "username", username) ||
                !json_extract_str(resp, "password", password))
            {
                log("pending_commands_poll_thread: login-user-fast missing username/password");
                report_command_result(uuid, token, "login-user-fast", false,
                                      "Missing username/password in response");
                continue;
            }

            execute_login_user_fast(uuid, token, username, password);
        }
    }
    log("pending_commands_poll_thread: stopped");
}

static void redis_pubsub_thread(const std::string &uuid, const std::string &redis_host)
{
    log("redis_pubsub_thread: started");
    
#ifdef HAVE_REDIS
    // Redis Pub/Sub for command delivery (real-time, not polled)
    redisContext *c = NULL;
    int reconnect_attempts = 0;
    const int max_reconnect_attempts = 5;
    const int reconnect_delay_ms = 1000;
    
    while (!g_stopRequested && reconnect_attempts < max_reconnect_attempts)
    {
        // Connect to Redis
        c = redisConnect(redis_host.c_str(), 6379);
        if (!c || c->err)
        {
            logf("redis_pubsub_thread: Failed to connect to Redis: %s", 
                 c ? c->errstr : "connection failed");
            
            if (c)
                redisFree(c);
            
            reconnect_attempts++;
            logf("redis_pubsub_thread: Reconnect attempt %d/%d, waiting %dms",
                 reconnect_attempts, max_reconnect_attempts, reconnect_delay_ms);
            Sleep(reconnect_delay_ms);
            continue;
        }
        
        reconnect_attempts = 0;  // Reset on successful connect
        logf("redis_pubsub_thread: Connected to Redis at %s:6379", redis_host.c_str());
        
        // Subscribe to agent commands channel
        std::string channel = "agent:" + uuid + ":commands";
        redisReply *reply = (redisReply *)redisCommand(c, "SUBSCRIBE %s", channel.c_str());
        if (!reply)
        {
            logf("redis_pubsub_thread: SUBSCRIBE command failed: %s", c->errstr);
            redisFree(c);
            Sleep(1000);
            continue;
        }
        
        logf("redis_pubsub_thread: Subscribed to channel: %s", channel.c_str());
        freeReplyObject(reply);
        
        // Listen for messages
        while (!g_stopRequested)
        {
            if (redisGetReply(c, (void **)&reply) != REDIS_OK)
            {
                logf("redis_pubsub_thread: Lost Redis connection: %s", c->errstr);
                break;
            }
            
            if (!reply)
                break;
            
            // Parse message
            if (reply->type == REDIS_REPLY_ARRAY && reply->elements >= 3)
            {
                // Subscription message format: [message_type, channel, data]
                if (strcmp(reply->element[0]->str, "message") == 0)
                {
                    const char *msg_data = reply->element[2]->str;
                    logf("redis_pubsub_thread: Received command: %s", msg_data);
                    
                    // Parse and handle command (same as pending-command polling)
                    std::string cmd_type;
                    if (json_extract_str(msg_data, "type", cmd_type))
                    {
                        if (cmd_type == "command")
                        {
                            std::string cmd;
                            if (json_extract_str(msg_data, "cmd", cmd))
                            {
                                if (cmd == "stop-rdp-worker")
                                {
                                    log("redis_pubsub_thread: Received stop-rdp-worker via Redis, stopping");
                                    g_stopRequested = true;
                                    break;
                                }
                            }
                        }
                    }
                }
            }
            
            freeReplyObject(reply);
        }
        
        logf("redis_pubsub_thread: Disconnected from Redis, reconnecting...");
        redisFree(c);
        Sleep(1000);
    }
    
    log("redis_pubsub_thread: stopped");
#else
    // Redis not available, just log
    logf("redis_pubsub_thread: Redis support not compiled (HAVE_REDIS not defined)");
    log("redis_pubsub_thread: Using HTTP polling fallback for commands");
#endif
}

bool installService()
{
    std::string exePath = getExePath();
    SC_HANDLE scm = OpenSCManager(NULL, NULL, SC_MANAGER_CREATE_SERVICE);
    if (!scm)
    {
        logf("OpenSCManager failed: %lu", GetLastError());
        return false;
    }
    SC_HANDLE svc = CreateServiceA(
        scm, "SystemMonitoringAgent", "System Monitoring Agent",
        SERVICE_ALL_ACCESS, SERVICE_WIN32_OWN_PROCESS,
        SERVICE_AUTO_START, SERVICE_ERROR_NORMAL,
        exePath.c_str(), NULL, NULL, NULL, NULL, NULL);
    if (!svc)
    {
        logf("CreateService failed: %lu", GetLastError());
        CloseServiceHandle(scm);
        return false;
    }
    SERVICE_FAILURE_ACTIONS actions = {0};
    SC_ACTION action = {SC_ACTION_RESTART, 1000};
    actions.cActions = 1;
    actions.lpsaActions = &action;
    actions.dwResetPeriod = 86400;
    ChangeServiceConfig2A(svc, SERVICE_CONFIG_FAILURE_ACTIONS, &actions);
    CloseServiceHandle(svc);
    CloseServiceHandle(scm);
    log("Service installed with auto-restart");
    return true;
}

bool isServiceInstalled()
{
    SC_HANDLE scm = OpenSCManager(NULL, NULL, SC_MANAGER_ENUMERATE_SERVICE);
    if (!scm)
        return false;
    SC_HANDLE svc = OpenServiceA(scm, "SystemMonitoringAgent", SERVICE_QUERY_CONFIG);
    bool exists = (svc != NULL);
    if (svc)
        CloseServiceHandle(svc);
    CloseServiceHandle(scm);
    return exists;
}

// ==================== MAIN / DISPATCHER ====================

int main(int argc, char *argv[])
{
    // ---- parse args ----
    bool worker_mode = false;
    std::string cli_server, cli_id, cli_shm;
    int cli_port = 443;
    bool cli_insecure = false;
    int cli_timeout = 0;
    for (int i = 1; i < argc; ++i)
    {
        std::string a = argv[i];
        if (a == "--rdp-worker")
            worker_mode = true;
        else if (a == "--insecure")
            cli_insecure = true;
        else if (a.rfind("--server=", 0) == 0)
            cli_server = a.substr(9);
        else if (a.rfind("--port=", 0) == 0)
        {
            try
            {
                cli_port = std::stoi(a.substr(7));
            }
            catch (...)
            {
            }
        }
        else if (a.rfind("--id=", 0) == 0)
            cli_id = a.substr(5);
        else if (a.rfind("--timeout=", 0) == 0)
        {
            try
            {
                cli_timeout = std::stoi(a.substr(10));
            }
            catch (...)
            {
            }
        }
        else if (a.rfind("--shm=", 0) == 0)
            cli_shm = a.substr(6);
    }

    // ---- mode dispatch ----
    if (worker_mode)
    {
        // worker пишет в отдельный лог, чтобы не смешивать с service-логом
        setupFileLogger("agent_rdp.log");
        log("=== Starting in RDP-WORKER mode ===");
        logf("worker args: server=%s port=%d id=%s verify=%d timeout=%d shm=%s",
             cli_server.c_str(), cli_port, cli_id.c_str(), !cli_insecure, cli_timeout, cli_shm.c_str());
        return run_rdp_worker(cli_server, cli_port, cli_id, !cli_insecure, cli_timeout, cli_shm);
    }

    // ---- service/install mode ----
    setupFileLogger("agent.log");
    log("Agent started as console app");

    if (!isServiceInstalled())
    {
        if (installService())
        {
            // Attempt to disable UAC for RMM functionality
            // log("Attempting to disable UAC...");
            // if (disable_uac())
            // {
            //     log("UAC disabled successfully");
            // }
            // else
            // {
            //     log("WARNING: Could not disable UAC - running with admin privileges may still have restrictions");
            // }

            SC_HANDLE scm = OpenSCManager(NULL, NULL, SC_MANAGER_CONNECT);
            if (scm)
            {
                SC_HANDLE svc = OpenServiceA(scm, "SystemMonitoringAgent", SERVICE_START);
                if (svc)
                {
                    StartServiceA(svc, 0, NULL);
                    CloseServiceHandle(svc);
                }
                CloseServiceHandle(scm);
            }
        }
        else
        {
            log("Warning: Could not install service");
        }
        return 0;
    }

    SERVICE_TABLE_ENTRYW table[] = {
        {(LPWSTR)L"SystemMonitoringAgent", serviceMain},
        {NULL, NULL}};
    log("Starting service dispatcher...");
    StartServiceCtrlDispatcherW(table);
    log("Service dispatcher exited");
    return 0;
}
