#ifndef RDP_AGENT_H
#define RDP_AGENT_H

#define WIN32_LEAN_AND_MEAN
#define SECURITY_WIN32
#include <windows.h>
#include <winsock2.h>
#include <ws2tcpip.h>
#include <security.h>
#include <schannel.h>
#include <string>
#include <vector>
#include <mutex>
#include <atomic>
#include <thread>
#include <memory>

// ============ INTERNAL STRUCTURES ============

struct RDPConfig
{
    std::string server_host = "127.0.0.1";
    int server_port = 443;
    std::string agent_id = "agent1";
    bool verify_cert = true;

    std::string codec = "mjpeg";
    std::string encoder = "cpu";
    std::string bitrate = "4M";
    int framerate = 30;
    int mjpeg_q = 4;

    std::string ffmpeg_path = "ffmpeg.exe";
    std::string input_fmt = "gdigrab";
    std::string input = "desktop";
    std::string video_size = "";
    int config_poll_ms = 2000;
};

struct RDPRuntime
{
    std::mutex m;
    std::string codec, encoder, bitrate;
    int framerate = 30;
    int mjpeg_q = 4;
    std::atomic<bool> restart{false};
    std::atomic<bool> stop{false};

    std::mutex ctrl_sock_m;
    struct TlsConn* ctrl_conn = nullptr;
};

struct TlsConn;

// ============ RDP AGENT CLASS ============

class RDPAgent
{
public:
    RDPAgent(const RDPConfig& config);
    ~RDPAgent();

    // Lifecycle
    void start();
    void stop();
    bool isRunning() const;

    // Status
    struct Status
    {
        int screen_w = 1920;
        int screen_h = 1080;
        bool is_connected = false;
        std::string last_error;
        int mjpeg_frames = 0;
        int h264_frames = 0;
    };
    Status getStatus() const;

private:
    RDPConfig config;
    RDPRuntime runtime;
    std::vector<std::thread> threads;
    bool running = false;

    // ========== TLS ==========
    static TlsConn* tls_connect(const std::string& host, int port, bool verify_cert);
    static void tls_close(TlsConn* c);
    static bool tls_handshake(TlsConn* c, const std::string& host, bool verify_cert);
    static bool tls_send_all(TlsConn* c, const char* p, int n);
    static int tls_recv_some(TlsConn* c, char* buf, int want);
    static int tls_recv_n(TlsConn* c, char* p, int n);

    // ========== Raw TCP ==========
    static bool send_all_raw(SOCKET s, const char* p, int n);
    static int recv_n_raw(SOCKET s, char* p, int n);
    static SOCKET tcp_connect(const std::string& host, int port);

    // ========== WebSocket ==========
    static bool ws_handshake(TlsConn* c, const std::string& host, int port, const std::string& path);
    static bool ws_send(TlsConn* c, int op, const void* data, size_t len);
    static int ws_recv(TlsConn* c, std::vector<uint8_t>& payload);
    static std::string b64(const unsigned char* d, size_t n);

    // ========== HTTP ==========
    static std::string http_get(const std::string& host, int port, const std::string& path, bool verify_cert);

    // ========== JSON ==========
    static bool json_str(const std::string& j, const std::string& k, std::string& out);
    static bool json_int(const std::string& j, const std::string& k, int& out);
    static bool json_str_ex(const std::string& j, const std::string& k, std::string& out);
    static std::string json_escape(const std::string& s);

    // ========== INPUT HANDLERS ==========
    static void do_mouse_move(int x, int y);
    static void do_mouse_button(int button, bool down);
    static void do_mouse_wheel(int delta);
    static void do_text_input(const std::string& utf8);
    static int code_to_vk(const std::string& code);
    static void do_key(const std::string& code, bool down);
    static std::string clipboard_read_utf8();
    static void clipboard_write_utf8(const std::string& utf8);
    static void handle_control(const std::string& j);

    // ========== SCREEN METRICS ==========
    static bool read_screen_metrics(int& w, int& h, int& ox, int& oy);
    static void init_screen_metrics();

    // ========== FFMPEG ==========
    static std::string build_ffmpeg_cmd(const RDPConfig& base, const RDPRuntime& r);
    static HANDLE start_ffmpeg(const std::string& cmdline, PROCESS_INFORMATION& pi);

    // ========== CONTROL ==========
    void ctrl_send_hello();
    void ctrl_send_clipboard(const std::string& text);
    static std::string make_hello_json();

    // ========== LOOP THREADS ==========
    void control_loop();
    void poll_config_loop();
    void resolution_watch_loop();
    void clipboard_watch_loop();
    void run_session();

    // ========== LOGGING ==========
    static void log(const std::string& s);
    static void logf(const char* fmt, ...);

    // ========== GLOBALS (static for access) ==========
    static std::atomic<int> g_screen_w;
    static std::atomic<int> g_screen_h;
    static std::atomic<int> g_screen_origin_x;
    static std::atomic<int> g_screen_origin_y;
    static std::mutex g_clip_m;
    static std::string g_last_clip;
};

#endif // RDP_AGENT_H
