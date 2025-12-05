// app/static/js/main.js
// Основной JavaScript файл для SysDM

document.addEventListener('DOMContentLoaded', function() {
    // Инициализация tooltips
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Инициализация popovers
    var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    var popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });
});

// Функция для показа уведомлений
function showNotification(message, type = 'info') {
    const container = document.getElementById('notification-container') || createNotificationContainer();

    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    container.appendChild(alert);

    // Автоудаление через 5 секунд
    setTimeout(() => {
        if (alert.parentNode) {
            alert.remove();
        }
    }, 5000);
}

function createNotificationContainer() {
    const container = document.createElement('div');
    container.id = 'notification-container';
    container.className = 'position-fixed top-0 end-0 p-3';
    container.style.zIndex = '1050';
    document.body.appendChild(container);
    return container;
}

// Функция для подтверждения действий
function confirmAction(message, callback) {
    if (confirm(message)) {
        callback();
    }
}

// Функция для загрузки данных через htmx
function loadData(url, target) {
    htmx.ajax('GET', url, target);
}

// Функция для обновления статуса агента
function refreshAgentStatus(agentId) {
    fetch(`/api/v1/agents/${agentId}/status`)
        .then(response => response.json())
        .then(data => {
            const statusElement = document.getElementById(`status-${agentId}`);
            if (statusElement) {
                statusElement.innerHTML = data.is_online ?
                    '<span class="badge bg-success">Online</span>' :
                    '<span class="badge bg-danger">Offline</span>';
            }
        });
}

// Периодическое обновление статуса агентов
function startAutoRefresh(interval = 30000) {
    setInterval(() => {
        document.querySelectorAll('[data-agent-id]').forEach(element => {
            const agentId = element.getAttribute('data-agent-id');
            refreshAgentStatus(agentId);
        });
    }, interval);
}

// Экспорт функций для использования в шаблонах
window.SysDM = {
    showNotification,
    confirmAction,
    loadData,
    refreshAgentStatus,
    startAutoRefresh
};