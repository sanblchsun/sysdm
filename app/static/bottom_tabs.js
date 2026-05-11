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

// Load selected agents from localStorage
function getSelectedAgents() {
  const data = localStorage.getItem("rdp_selected_agents");
  return data ? JSON.parse(data) : {};
}

// ==================== TAKE CONTROL (RDP START) ====================
let _takeControlBusy = false;
async function takeControl() {
  if (_takeControlBusy) return;
  _takeControlBusy = true;
  console.log("[takeControl] Clicked");

  const bottomPanel = document.querySelector('.bottom-panel');
  const agentId = bottomPanel ? (bottomPanel.getAttribute('data-agent-id') || null) : null;

  if (!agentId) {
    alert("Agent not selected. Please select an agent first.");
    return;
  }

  // Check if this agent has RDP checkbox checked
  const selected = getSelectedAgents();
  const agentUuid = bottomPanel.getAttribute('data-agent-uuid') || null;

  if (agentUuid && !selected[agentUuid]) {
    if (!confirm("Агент не отмечен для RDP (галочка RDP в таблице). Всё равно запустить?")) {
      return;
    }
  }

  try {
    const response = await fetch(`/api/agent/${agentId}/start-rdp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    console.log("[takeControl] Response:", data);

    if (data.agent_connected) {
      alert("✓ Команда запуска RDP отправлена агенту. Открываю дашборд...");
    } else {
      alert("Агент не подключён к WebSocket. Попробуйте позже.");
      return;
    }
  } catch (error) {
    console.error("[takeControl] Error:", error);
    alert("Failed to start RDP: " + error.message);
    _takeControlBusy = false;
    return;
  }

  window.open('/rdp/dashboard', '_blank');
  _takeControlBusy = false;
}

// ==================== LOGIN SESSION (Switch Windows User) ====================
// Reboot-based approach (safe, works always — but reboots the machine)
async function loginSessionReboot() {
  const agentId = getAgentId();
  if (!agentId) return;

  const username = prompt("Windows username (e.g. user@domain or DOMAIN\\user):");
  if (!username) return;

  const password = prompt("Password for " + username + ":");
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

  const password = prompt("Password for " + username + ":");
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
