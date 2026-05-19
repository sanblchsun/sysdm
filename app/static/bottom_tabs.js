// app/static/bottom_tabs.js
"use strict";

function initBottomTabs() {
  const tabs = document.querySelectorAll(".bottom-tabs .tab");
  const panes = document.querySelectorAll(".tab-pane");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const name = tab.dataset.tab;

      tabs.forEach((t) => t.classList.remove("active"));
      panes.forEach((p) => p.classList.remove("active"));

      tab.classList.add("active");

      const pane = document.getElementById(`tab-${name}`);
      if (pane) pane.classList.add("active");
    });
  });
}

document.addEventListener("DOMContentLoaded", initBottomTabs);
document.addEventListener("htmx:afterSwap", initBottomTabs);

function initActionsDropdown() {
  const btn = document.getElementById("actions-btn");
  const menu = document.getElementById("actions-menu");

  if (!btn || !menu) return;

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const open = menu.classList.toggle("open");
    btn.setAttribute("aria-expanded", open);
  });

  document.addEventListener("click", () => {
    menu.classList.remove("open");
    btn.setAttribute("aria-expanded", "false");
  });

  menu.addEventListener("click", (e) => {
    e.stopPropagation();
  });
}

document.addEventListener("DOMContentLoaded", initActionsDropdown);
document.addEventListener("htmx:afterSwap", initActionsDropdown);

// ==================== TAKE CONTROL BUTTON HANDLER ====================
function initTakeControlButton() {
  const btn = document.getElementById("take-control-btn");
  if (!btn) {
    console.log("[initTakeControlButton] Button not found");
    return;
  }

  console.log("[initTakeControlButton] Initializing Take Control button");
  
  // Удаляем старые обработчики
  const newBtn = btn.cloneNode(true);
  btn.parentNode.replaceChild(newBtn, btn);
  
  // Добавляем новый обработчик
  const updatedBtn = document.getElementById("take-control-btn");
  updatedBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("[takeControlButton] Click handler triggered");
    await takeControl();
  });
}

document.addEventListener("DOMContentLoaded", initTakeControlButton);
document.addEventListener("htmx:afterSwap", initTakeControlButton);

// ==================== UAC CONTROL ====================
async function disableUAC() {
  console.log("[disableUAC] Clicked");
  
  // Get agent ID from current page context
  const bottomPanel = document.querySelector('.bottom-panel');
  console.log("[disableUAC] Bottom panel:", bottomPanel);
  
  let agentId = null;
  
  // Try 1: data-agent-id attribute
  if (bottomPanel && bottomPanel.dataset.agentId) {
    agentId = bottomPanel.dataset.agentId;
    console.log("[disableUAC] Agent ID from data attribute:", agentId);
  }
  
  // Try 2: window.currentAgentId (set by template)
  if (!agentId && window.currentAgentId) {
    agentId = window.currentAgentId;
    console.log("[disableUAC] Agent ID from window.currentAgentId:", agentId);
  }
  
  // Try 3: URL query string
  if (!agentId) {
    const urlParams = new URLSearchParams(window.location.search);
    agentId = urlParams.get('agent_id');
    console.log("[disableUAC] Agent ID from URL:", agentId);
  }
  
  if (!agentId) {
    const msg = "Agent ID not found. Please select an agent first.";
    console.error("[disableUAC] " + msg);
    console.log("[disableUAC] Debugging info:", {
      bottomPanelDataAttr: bottomPanel?.dataset?.agentId,
      windowCurrentAgentId: window.currentAgentId,
      urlParams: new URLSearchParams(window.location.search).toString(),
    });
    alert(msg);
    return;
  }
  
  if (!confirm("Disable UAC on this machine? This requires a reboot to take effect.")) {
    console.log("[disableUAC] User cancelled");
    return;
  }

  console.log("[disableUAC] Sending request to /api/agent/" + agentId + "/control-uac");
  
  try {
    const response = await fetch(`/api/agent/${agentId}/control-uac`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action: "disable" }),
    });

    console.log("[disableUAC] Response status:", response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("[disableUAC] HTTP error:", response.status, errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log("[disableUAC] Response data:", data);
    
    alert(`✓ UAC disable command sent to agent.\n\n${data.message}\n\nThe machine will need to be rebooted for changes to take effect.`);
  } catch (error) {
    console.error("[disableUAC] Error:", error);
    alert("Failed to send UAC disable command: " + error.message);
  }

  // Close the actions menu
  const menu = document.getElementById("actions-menu");
  const btn = document.getElementById("actions-btn");
  if (menu) menu.classList.remove("open");
  if (btn) btn.setAttribute("aria-expanded", "false");
}

// ==================== REBOOT AGENT ====================
async function rebootAgent() {
  const agentId = getAgentId();
  if (!agentId) return;

  if (!confirm("Reboot this machine? All running applications will be closed.")) return;

  try {
    const response = await fetch(`/api/agent/${agentId}/reboot`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    alert(`✓ ${data.message}`);
  } catch (error) {
    alert("Failed to send reboot command: " + error.message);
  }

  closeActionsMenu();
}

// ==================== TAKE CONTROL (RDP START) ====================
const TAKE_CONTROL_STATE = {
  inProgress: false,
  timeoutId: null,
  maxTimeout: 30000, // 30 секунд максимум
};

async function takeControl() {
  console.log("[takeControl] Clicked, inProgress:", TAKE_CONTROL_STATE.inProgress);
  
  // Предотвращаем одновременное выполнение
  if (TAKE_CONTROL_STATE.inProgress) {
    console.warn("[takeControl] Already in progress, ignoring click");
    return;
  }

  // Получаем и отключаем кнопку
  const btn = document.getElementById("take-control-btn");
  
  if (btn) {
    btn.disabled = true;
    btn.style.opacity = "0.6";
    btn.style.cursor = "not-allowed";
  }

  TAKE_CONTROL_STATE.inProgress = true;

  // Таймаут безопасности - если функция зависает, сбросим состояние через 30 сек
  TAKE_CONTROL_STATE.timeoutId = setTimeout(() => {
    console.error("[takeControl] Timeout exceeded, resetting state");
    resetTakeControlButton();
  }, TAKE_CONTROL_STATE.maxTimeout);

  try {
    console.log("[takeControl] Getting agent info...");
    const bottomPanel = document.querySelector('.bottom-panel');
    const agentId = bottomPanel ? (bottomPanel.getAttribute('data-agent-id') || null) : null;

    if (!agentId) {
      console.error("[takeControl] Agent ID not found");
      alert("Agent not selected. Please select an agent first.");
      return;
    }

    console.log("[takeControl] Agent ID:", agentId);

    console.log("[takeControl] Sending request to /api/agent/" + agentId + "/start-rdp");
    
    const response = await fetch(`/api/agent/${agentId}/start-rdp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log("[takeControl] Response:", data);

    if (data.agent_connected) {
      console.log("[takeControl] Agent connected, opening dashboard");
      alert("✓ Команда запуска RDP отправлена агенту. Открываю дашборд...");
      const agentUuid = bottomPanel.getAttribute('data-agent-uuid') || '';
      const url = agentUuid ? `/rdp/dashboard?agent=${encodeURIComponent(agentUuid)}` : '/rdp/dashboard';
      window.open(url, '_blank');
    } else {
      console.warn("[takeControl] Agent not connected via WebSocket");
      alert("Агент не подключён к WebSocket. Попробуйте позже.");
    }
  } catch (error) {
    console.error("[takeControl] Error:", error);
    alert("Failed to start RDP: " + error.message);
  } finally {
    // Очищаем таймаут и восстанавливаем кнопку
    resetTakeControlButton();
  }
}

function resetTakeControlButton() {
  console.log("[takeControl] Resetting state...");
  
  // Очищаем таймаут
  if (TAKE_CONTROL_STATE.timeoutId) {
    clearTimeout(TAKE_CONTROL_STATE.timeoutId);
    TAKE_CONTROL_STATE.timeoutId = null;
  }

  // Включаем кнопку
  const btn = document.getElementById("take-control-btn");
  
  if (btn) {
    btn.disabled = false;
    btn.style.opacity = "1";
    btn.style.cursor = "pointer";
  }

  TAKE_CONTROL_STATE.inProgress = false;
  console.log("[takeControl] State reset complete");
}

// ==================== PASSWORD PROMPT (masked input) ====================
function passwordPrompt(message) {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.style.cssText =
      "position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:99999";
    const box = document.createElement("div");
    box.style.cssText =
      "background:#1b1b1b;border:1px solid #444;border-radius:8px;padding:24px;min-width:360px;color:#eee;font-family:system-ui,Arial";
    box.innerHTML =
      `<p style="margin:0 0 12px;font-size:14px">${message}</p>` +
      `<input type="password" style="width:100%;padding:8px;border:1px solid #555;border-radius:4px;background:#222;color:#eee;font:inherit;box-sizing:border-box" autofocus>` +
      `<div style="margin-top:12px;display:flex;gap:8px;justify-content:flex-end">` +
      `<button id="pp-cancel" style="padding:6px 16px;border:1px solid #555;border-radius:4px;background:#333;color:#eee;cursor:pointer">Cancel</button>` +
      `<button id="pp-ok" style="padding:6px 16px;border:1px solid #3a5a3a;border-radius:4px;background:#2a3b2a;color:#e7ffe7;cursor:pointer">OK</button>` +
      `</div>`;
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    const input = box.querySelector("input");
    input.focus();

    const cleanup = (val) => {
      document.body.removeChild(overlay);
      resolve(val);
    };

    box.querySelector("#pp-ok").onclick = () => cleanup(input.value);
    box.querySelector("#pp-cancel").onclick = () => cleanup(null);
    input.onkeydown = (e) => {
      if (e.key === "Enter") cleanup(input.value);
      if (e.key === "Escape") cleanup(null);
    };
  });
}

// ==================== LOGIN SESSION (Switch Windows User) ====================
// Reboot-based approach (safe, works always — but reboots the machine)
async function loginSessionReboot() {
  const agentId = getAgentId();
  if (!agentId) return;

  const username = prompt("Windows username (e.g. user@domain or DOMAIN\\user):");
  if (!username) return;

  const password = await passwordPrompt("Password for " + username + ":");
  if (!password) return;

  if (!confirm(`Switch to user "${username}"? The machine will REBOOT.`)) return;

  try {
    const response = await fetch(`/api/agent/${agentId}/login-session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    alert(`✓ ${data.message}\n\nThe machine will reboot and log in as "${username}".`);
  } catch (error) {
    alert("Failed to send login command: " + error.message);
  }

  closeActionsMenu();
}

// Fast logoff-based approach (no reboot, but logsoff current user session)
async function loginSessionFast() {
  const agentId = getAgentId();
  if (!agentId) return;

  const username = prompt("Windows username (e.g. user@domain or DOMAIN\\user):");
  if (!username) return;

  const password = await passwordPrompt("Password for " + username + ":");
  if (!password) return;

  if (!confirm(`Switch to user "${username}" via fast user switch? Current session will be logged off.`)) return;

  try {
    const response = await fetch(`/api/agent/${agentId}/login-session-fast`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    alert(`✓ ${data.message}\n\nThe agent will log off current user and log in as "${username}".`);
  } catch (error) {
    alert("Failed to send login command: " + error.message);
  }

  closeActionsMenu();
}

function getAgentId() {
  const bottomPanel = document.querySelector('.bottom-panel');
  const id = bottomPanel?.getAttribute('data-agent-id') || window.currentAgentId || null;
  if (!id) {
    alert("Agent not selected. Please select an agent first.");
    return null;
  }
  return id;
}

function closeActionsMenu() {
  const menu = document.getElementById("actions-menu");
  const btn = document.getElementById("actions-btn");
  if (menu) menu.classList.remove("open");
  if (btn) btn.setAttribute("aria-expanded", "false");
}
