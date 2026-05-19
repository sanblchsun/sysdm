// Real-time agent online/offline status sync via Redis Pub/Sub
function connectAgentStatusSync() {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const wsUrl = `${protocol}//${window.location.host}/relay/ws/agent-status-sync`;

  try {
    const ws = new WebSocket(wsUrl);

    ws.onopen = function () {
      console.log("[status-sync] Connected to agent status updates");
    };

    ws.onmessage = function (event) {
      try {
        const status = JSON.parse(event.data);
        const agentUuid = status.uuid;
        const isOnline = status.is_online;

        const rows = document.querySelectorAll("tr[data-agent-uuid]");
        for (const row of rows) {
          if (row.dataset.agentUuid === agentUuid) {
            const dot = row.querySelector(".online-dot");
            if (dot) {
              dot.classList.toggle("online", isOnline);
              dot.classList.toggle("offline", !isOnline);
            }
            break;
          }
        }
      } catch (e) {
        console.error("[status-sync] Failed to parse status message:", e);
      }
    };

    ws.onerror = function () {
      console.error("[status-sync] WebSocket error");
    };

    ws.onclose = function () {
      console.log("[status-sync] WebSocket closed, reconnecting in 3s...");
      setTimeout(connectAgentStatusSync, 3000);
    };
  } catch (e) {
    console.error("[status-sync] Failed to create WebSocket:", e);
  }
}

connectAgentStatusSync();
