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
