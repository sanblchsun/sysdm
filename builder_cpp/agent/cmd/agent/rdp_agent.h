// builder_cpp/agent/cmd/agent/rdp_agent.h
#ifndef RDP_AGENT_H
#define RDP_AGENT_H

#define WIN32_LEAN_AND_MEAN
#define SECURITY_WIN32
#define NOMINMAX
#include <winsock2.h>
#include <ws2tcpip.h>
#include <windows.h>
#include <security.h>
#include <schannel.h>
#include <string>
#include <vector>
#include <mutex>
#include <atomic>
#include <thread>
#include <memory>
#include <chrono>

// ============ LOGGING (реализуется в main.cpp) ============
extern void log(const char *msg);
extern void log(const std::string &msg);
extern void logf(const char *fmt, ...);
extern bool disable_uac();  // UAC control (реализуется в main.cpp)

// ============ INTERNAL STRUCTURES ============

// Shared memory between main process (SYSTEM) and RDP worker (user session)
struct ActivityShm
{
    volatile LONG64 last_activity_time; // written by worker on input events
    volatile LONG timeout_min;          // written by worker from config poll
};

struct RDPConfig
{
    std::string server_host = "127.0.0.1";
    int server_port = 443;
    std::string agent_id = "agent1";
    bool verify_cert = true;

    std::string codec;
    std::string encoder;
    std::string bitrate;
    int framerate = 30;
    int mjpeg_q = 4;

    std::string ffmpeg_path = "ffmpeg.exe";
    std::string input_fmt = "gdigrab";
    std::string input = "desktop";
    std::string video_size = "";
    int timeout_min = 30;
    std::string shm_name; // shared memory name for activity tracking
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
    struct TlsConn *ctrl_conn = nullptr;

    // Retry logic for intermittent ffmpeg errors
    int consecutive_ffmpeg_errors = 0;
    std::chrono::steady_clock::time_point last_ffmpeg_error_time;
    std::string last_ffmpeg_error;

    // Inactivity timeout tracking (shared with parent process)
    int timeout_min = 30;
    std::chrono::steady_clock::time_point last_activity_time;
};

struct TlsConn
{
    SOCKET sock = INVALID_SOCKET;
    CredHandle cred = {};
    CtxtHandle ctx = {};
    bool cred_ok = false;
    bool ctx_ok = false;
    SecPkgContext_StreamSizes sizes = {};
    std::vector<uint8_t> raw;
    std::vector<uint8_t> plain;
};

// ============ RDP AGENT CLASS ============

class RDPAgent
{
public:
    RDPAgent(const RDPConfig &config);
    ~RDPAgent();

    void start();
    void stop();
    bool isRunning() const;

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

    // Public API used by main.cpp control command loop
    static TlsConn *tls_connect(const std::string &host, int port, bool verify_cert);
    static void tls_close(TlsConn *c);
    static bool ws_handshake(TlsConn *c, const std::string &host, int port, const std::string &path);
    static int ws_recv(TlsConn *c, std::vector<uint8_t> &payload);
    static bool ws_send(TlsConn *c, int op, const void *data, size_t len);
    static bool json_str(const std::string &j, const std::string &k, std::string &out);
    static bool json_int(const std::string &j, const std::string &k, int &out);

private:
    RDPConfig config;
    RDPRuntime runtime;
    std::string last_config_sig;
    std::vector<std::thread> threads;
    bool running = false;

    // Shared memory for activity tracking (written by worker, read by main process)
    HANDLE shm_handle = nullptr;
    ActivityShm *shm = nullptr;

    // TLS (internal)
    static bool tls_handshake(TlsConn *c, const std::string &host, bool verify_cert);
    static bool tls_send_all(TlsConn *c, const char *p, int n);
    static int tls_recv_some(TlsConn *c, char *buf, int want);
    static int tls_recv_n(TlsConn *c, char *p, int n);

    // Raw TCP
    static bool send_all_raw(SOCKET s, const char *p, int n);
    static int recv_n_raw(SOCKET s, char *p, int n);
    static SOCKET tcp_connect(const std::string &host, int port);

    // WebSocket (internal)
    static std::string b64(const unsigned char *d, size_t n);

    // JSON (internal)
    static bool json_str_ex(const std::string &j, const std::string &k, std::string &out);
    static std::string json_escape(const std::string &s);

    // Input
    static void do_mouse_move(int x, int y);
    static void do_mouse_button(int button, bool down);
    static void do_mouse_wheel(int delta);
    static void do_text_input(const std::string &utf8);
    static int code_to_vk(const std::string &code);
    static void do_key(const std::string &code, bool down);
    static std::string clipboard_read_utf8();
    static void clipboard_write_utf8(const std::string &utf8);
    void handle_control(const std::string &j);

    // Screen metrics
    static bool read_screen_metrics(int &w, int &h, int &ox, int &oy);
    static void init_screen_metrics();

    // Ffmpeg (запускается обычным CreateProcessA - мы уже в сессии пользователя)
    static std::string build_ffmpeg_cmd(const RDPConfig &base, const RDPRuntime &r);
    static HANDLE start_ffmpeg(const std::string &cmdline, PROCESS_INFORMATION &pi);
    static bool is_secure_desktop_active();
    static bool is_consent_exe_running();

    // Control
    void ctrl_send_hello();
    void ctrl_send_clipboard(const std::string &text);
    static std::string make_hello_json();

    // Loops
    void control_loop();
    void resolution_watch_loop();
    void clipboard_watch_loop();
    void run_session();

    // Globals
    static std::atomic<int> g_screen_w;
    static std::atomic<int> g_screen_h;
    static std::atomic<int> g_screen_origin_x;
    static std::atomic<int> g_screen_origin_y;
    static std::mutex g_clip_m;
    static std::string g_last_clip;
};

// ============ USER-SESSION WORKER ENTRYPOINT ============
// Вызывается из main.cpp при флаге --rdp-worker.
// Блокирует поток до завершения процесса (TerminateProcess извне).
int run_rdp_worker(const std::string &host, int port,
                   const std::string &agent_id, bool verify_cert,
                   int timeout_min = 30,
                   const std::string &shm_name = "",
                   const std::string &codec = "",
                   const std::string &encoder = "",
                   const std::string &bitrate = "",
                   int fps = 0, int mjpeg_q = 0);

#endif // RDP_AGENT_H
