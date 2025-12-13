// app/static/js/app.js - ПОЛНАЯ ВЕРСИЯ С СТРАНИЦЕЙ АГЕНТОВ
const API_BASE = '/api/v1';
let authToken = null;
let currentUser = null;
let currentPage = 'dashboard';

// Инициализация приложения
async function initApp() {
    // Проверяем наличие токена
    authToken = localStorage.getItem('sysdm_token') || getCookie('access_token');

    if (authToken) {
        try {
            currentUser = await fetchWithAuth(`${API_BASE}/auth/me`);
            renderApp();
            loadPageFromHash();
        } catch (error) {
            console.error('Auth error:', error);
            showLoginPage();
        }
    } else {
        showLoginPage();
    }

    // Обработка навигации
    setupNavigation();
}

// =========== ОСНОВНОЙ РЕНДЕРИНГ ===========

function renderApp() {
    document.getElementById('app').innerHTML = `
        <div class="app-container">
            <!-- Сайдбар -->
            <div class="sidebar">
                <div class="sidebar-header">
                    <h5><i class="bi bi-server text-primary me-2"></i>SysDM</h5>
                    <small class="text-muted">v${window.SYSDM_CONFIG.app_version}</small>
                </div>

                <nav class="sidebar-nav">
                    <a href="#dashboard" class="nav-item ${currentPage === 'dashboard' ? 'active' : ''}" data-page="dashboard">
                        <i class="bi bi-speedometer2"></i> Дашборд
                    </a>
                    <a href="#agents" class="nav-item ${currentPage === 'agents' ? 'active' : ''}" data-page="agents">
                        <i class="bi bi-pc-display"></i> Агенты
                        <span class="badge bg-secondary float-end" id="agentsCount">0</span>
                    </a>
                    <a href="#scripts" class="nav-item" data-page="scripts">
                        <i class="bi bi-terminal"></i> Скрипты
                    </a>
                    <a href="#tasks" class="nav-item" data-page="tasks">
                        <i class="bi bi-list-task"></i> Задачи
                    </a>
                    <a href="#settings" class="nav-item" data-page="settings">
                        <i class="bi bi-gear"></i> Настройки
                    </a>
                </nav>

                <div class="sidebar-footer">
                    <div class="user-info">
                        <i class="bi bi-person-circle fs-5"></i>
                        <div class="ms-2">
                            <div class="fw-bold">${currentUser.username}</div>
                            <small class="text-muted">${currentUser.is_admin ? 'Администратор' : 'Пользователь'}</small>
                        </div>
                    </div>
                    <button onclick="logout()" class="btn btn-sm btn-outline-danger mt-3 w-100">
                        <i class="bi bi-box-arrow-right"></i> Выход
                    </button>
                </div>
            </div>

            <!-- Основной контент -->
            <div class="main-content">
                <div id="content" class="fade-in">
                    <!-- Контент будет загружен здесь -->
                </div>
            </div>
        </div>
    `;

    // Обновляем счетчик агентов
    updateAgentsCount();
}

// =========== СТРАНИЦЫ ===========

async function loadPage(page) {
    currentPage = page;
    const content = document.getElementById('content');

    switch (page) {
        case 'dashboard':
            await loadDashboard(content);
            break;
        case 'agents':
            await loadAgentsPage(content);
            break;
        case 'scripts':
            content.innerHTML = renderSimplePage('Скрипты', 'Страница в разработке...');
            break;
        case 'tasks':
            content.innerHTML = renderSimplePage('Задачи', 'Страница в разработке...');
            break;
        case 'settings':
            content.innerHTML = renderSimplePage('Настройки', 'Страница в разработке...');
            break;
        default:
            await loadDashboard(content);
    }

    // Обновляем активный элемент в навигации
    updateActiveNav(page);
}

async function loadDashboard(container) {
    try {
        const stats = await fetchWithAuth(`${API_BASE}/dashboard/stats`);

        container.innerHTML = `
            <div class="dashboard-page">
                <div class="page-header mb-4">
                    <h2><i class="bi bi-speedometer2 me-2"></i>Дашборд</h2>
                    <p class="text-muted">Обзор системы мониторинга</p>
                </div>

                <!-- Статистика -->
                <div class="row mb-4">
                    <div class="col-md-3">
                        <div class="stat-card bg-primary">
                            <h3>${stats.total_agents}</h3>
                            <p>Всего агентов</p>
                            <i class="bi bi-pc-display stat-icon"></i>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="stat-card bg-success">
                            <h3>${stats.online_agents}</h3>
                            <p>Онлайн</p>
                            <i class="bi bi-check-circle stat-icon"></i>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="stat-card bg-warning">
                            <h3>${stats.warning_agents}</h3>
                            <p>Предупреждения</p>
                            <i class="bi bi-exclamation-triangle stat-icon"></i>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="stat-card bg-danger">
                            <h3>${stats.offline_agents}</h3>
                            <p>Оффлайн</p>
                            <i class="bi bi-x-circle stat-icon"></i>
                        </div>
                    </div>
                </div>

                <!-- Последние агенты -->
                <div class="card">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h5 class="mb-0">Последние агенты</h5>
                        <button class="btn btn-sm btn-primary" onclick="loadPage('agents')">
                            <i class="bi bi-arrow-right"></i> Все агенты
                        </button>
                    </div>
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-hover">
                                <thead>
                                    <tr>
                                        <th>Имя</th>
                                        <th>Статус</th>
                                        <th>IP адрес</th>
                                        <th>Платформа</th>
                                        <th>Последняя активность</th>
                                        <th>Действия</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${stats.recent_agents.map(agent => `
                                        <tr>
                                            <td>
                                                <strong>${agent.hostname}</strong><br>
                                                <small class="text-muted">${agent.agent_id}</small>
                                            </td>
                                            <td>
                                                ${agent.is_online
                                                    ? '<span class="badge bg-success"><i class="bi bi-check-circle"></i> Онлайн</span>'
                                                    : '<span class="badge bg-danger"><i class="bi bi-x-circle"></i> Оффлайн</span>'}
                                            </td>
                                            <td>${agent.local_ip || 'N/A'}</td>
                                            <td><span class="badge bg-secondary">${agent.platform || 'unknown'}</span></td>
                                            <td>${agent.last_seen ? formatDateTime(agent.last_seen) : 'Никогда'}</td>
                                            <td>
                                                <button class="btn btn-sm btn-outline-primary" onclick="viewAgentDetail('${agent.agent_id}')">
                                                    <i class="bi bi-eye"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        container.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle"></i> Ошибка загрузки дашборда: ${error.message}
            </div>
        `;
    }
}

async function loadAgentsPage(container) {
    container.innerHTML = `
        <div class="agents-page">
            <!-- Шапка -->
            <div class="page-header mb-4">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h2><i class="bi bi-pc-display me-2"></i>Агенты</h2>
                        <p class="text-muted">Управление всеми агентами системы</p>
                    </div>
                    <div class="d-flex gap-2">
                        <button class="btn btn-primary" onclick="refreshAgents()">
                            <i class="bi bi-arrow-clockwise"></i> Обновить
                        </button>
                        <button class="btn btn-success" onclick="showAddAgentModal()">
                            <i class="bi bi-plus-circle"></i> Добавить агента
                        </button>
                    </div>
                </div>
            </div>

            <!-- Фильтры и поиск -->
            <div class="card mb-4">
                <div class="card-body">
                    <div class="row g-3">
                        <div class="col-md-4">
                            <div class="input-group">
                                <span class="input-group-text"><i class="bi bi-search"></i></span>
                                <input type="text" class="form-control" id="agentsSearch" placeholder="Поиск по имени, ID или IP..." oninput="filterAgents()">
                            </div>
                        </div>
                        <div class="col-md-2">
                            <select class="form-select" id="agentsStatusFilter" onchange="filterAgents()">
                                <option value="all">Все статусы</option>
                                <option value="online">Только онлайн</option>
                                <option value="offline">Только оффлайн</option>
                            </select>
                        </div>
                        <div class="col-md-2">
                            <select class="form-select" id="agentsPlatformFilter" onchange="filterAgents()">
                                <option value="all">Все платформы</option>
                                <option value="windows">Windows</option>
                                <option value="linux">Linux</option>
                                <option value="macos">macOS</option>
                            </select>
                        </div>
                        <div class="col-md-2">
                            <select class="form-select" id="agentsSort" onchange="sortAgents()">
                                <option value="name">Сортировка: По имени</option>
                                <option value="status">По статусу</option>
                                <option value="last_seen">По активности</option>
                            </select>
                        </div>
                        <div class="col-md-2">
                            <select class="form-select" id="agentsPerPage" onchange="changePerPage()">
                                <option value="10">10 на странице</option>
                                <option value="25" selected>25 на странице</option>
                                <option value="50">50 на странице</option>
                                <option value="100">100 на странице</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Таблица агентов -->
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">Список агентов</h5>
                    <span class="text-muted" id="agentsInfo">Загрузка...</span>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table table-hover mb-0">
                            <thead>
                                <tr>
                                    <th width="50"></th>
                                    <th>Агент</th>
                                    <th>IP адрес</th>
                                    <th>Платформа</th>
                                    <th>ОС</th>
                                    <th>Ресурсы</th>
                                    <th>Активность</th>
                                    <th>Действия</th>
                                </tr>
                            </thead>
                            <tbody id="agentsTableBody">
                                <!-- Данные будут загружены здесь -->
                            </tbody>
                        </table>
                    </div>
                </div>
                <div class="card-footer">
                    <div class="d-flex justify-content-between align-items-center">
                        <div id="paginationInfo"></div>
                        <nav aria-label="Навигация">
                            <ul class="pagination pagination-sm mb-0" id="agentsPagination"></ul>
                        </nav>
                    </div>
                </div>
            </div>
        </div>

        <!-- Модальное окно деталей агента -->
        <div class="modal fade" id="agentDetailModal" tabindex="-1">
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="agentDetailTitle">Детали агента</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body" id="agentDetailContent">
                        Загрузка...
                    </div>
                </div>
            </div>
        </div>
    `;

    // Загружаем данные агентов
    await loadAgentsData();
}

// =========== ЗАГРУЗКА И ФИЛЬТРАЦИЯ АГЕНТОВ ===========

let allAgents = [];
let filteredAgents = [];
let currentPageNum = 1;
let itemsPerPage = 25;

async function loadAgentsData() {
    try {
        allAgents = await fetchWithAuth(`${API_BASE}/agents/search?limit=1000`);
        filteredAgents = [...allAgents];
        renderAgentsTable();
        updateAgentsInfo();
    } catch (error) {
        console.error('Error loading agents:', error);
        document.getElementById('agentsTableBody').innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-4">
                    <div class="alert alert-danger">
                        <i class="bi bi-exclamation-triangle"></i> Ошибка загрузки агентов: ${error.message}
                    </div>
                </td>
            </tr>
        `;
    }
}

function renderAgentsTable() {
    const tbody = document.getElementById('agentsTableBody');

    // Пагинация
    const startIndex = (currentPageNum - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageAgents = filteredAgents.slice(startIndex, endIndex);

    if (pageAgents.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-4">
                    <div class="text-muted">
                        <i class="bi bi-inbox display-4 d-block mb-2"></i>
                        <h5>Агенты не найдены</h5>
                        <p>Попробуйте изменить параметры поиска</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = pageAgents.map(agent => `
        <tr>
            <td>
                ${agent.is_online
                    ? '<i class="bi bi-circle-fill text-success" title="Онлайн"></i>'
                    : '<i class="bi bi-circle-fill text-danger" title="Оффлайн"></i>'}
            </td>
            <td>
                <div class="fw-bold">${agent.hostname}</div>
                <small class="text-muted">ID: ${agent.agent_id}</small>
                ${agent.description ? `<br><small class="text-muted">${agent.description}</small>` : ''}
            </td>
            <td>
                ${agent.local_ip || '<span class="text-muted">N/A</span>'}
            </td>
            <td>
                <span class="badge ${getPlatformBadgeClass(agent.platform)}">
                    ${agent.platform || 'unknown'}
                </span>
            </td>
            <td>
                <small>${agent.operating_system || 'Неизвестно'}</small>
            </td>
            <td>
                <small>${agent.cpu_cores || '?'} ядер</small><br>
                <small>${agent.total_ram ? formatBytes(agent.total_ram * 1024 * 1024) : '?'} RAM</small>
            </td>
            <td>
                <small>${agent.last_seen ? formatDateTime(agent.last_seen) : 'Никогда'}</small><br>
                <small class="text-muted">Создан: ${agent.created_at ? formatDate(agent.created_at) : 'N/A'}</small>
            </td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary" onclick="showAgentDetail('${agent.agent_id}')" title="Детали">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-outline-success" onclick="sendHeartbeat('${agent.agent_id}')" title="Отправить heartbeat">
                        <i class="bi bi-heart-pulse"></i>
                    </button>
                    <button class="btn btn-outline-danger" onclick="deleteAgent('${agent.agent_id}')" title="Удалить">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');

    // Обновляем пагинацию
    updatePagination();
}

function filterAgents() {
    const searchTerm = document.getElementById('agentsSearch').value.toLowerCase();
    const statusFilter = document.getElementById('agentsStatusFilter').value;
    const platformFilter = document.getElementById('agentsPlatformFilter').value;

    filteredAgents = allAgents.filter(agent => {
        // Поиск по тексту
        const searchMatch = !searchTerm ||
            agent.agent_id.toLowerCase().includes(searchTerm) ||
            agent.hostname.toLowerCase().includes(searchTerm) ||
            (agent.local_ip && agent.local_ip.toLowerCase().includes(searchTerm)) ||
            (agent.description && agent.description.toLowerCase().includes(searchTerm));

        // Фильтр по статусу
        let statusMatch = true;
        if (statusFilter === 'online') {
            statusMatch = agent.is_online === true;
        } else if (statusFilter === 'offline') {
            statusMatch = agent.is_online === false;
        }

        // Фильтр по платформе
        let platformMatch = true;
        if (platformFilter !== 'all' && agent.platform) {
            platformMatch = agent.platform.toLowerCase() === platformFilter.toLowerCase();
        }

        return searchMatch && statusMatch && platformMatch;
    });

    currentPageNum = 1;
    renderAgentsTable();
    updateAgentsInfo();
}

function sortAgents() {
    const sortBy = document.getElementById('agentsSort').value;

    filteredAgents.sort((a, b) => {
        switch (sortBy) {
            case 'name':
                return a.hostname.localeCompare(b.hostname);
            case 'status':
                return (b.is_online === a.is_online) ? 0 : b.is_online ? 1 : -1;
            case 'last_seen':
                const timeA = a.last_seen ? new Date(a.last_seen).getTime() : 0;
                const timeB = b.last_seen ? new Date(b.last_seen).getTime() : 0;
                return timeB - timeA;
            default:
                return 0;
        }
    });

    renderAgentsTable();
}

function changePerPage() {
    itemsPerPage = parseInt(document.getElementById('agentsPerPage').value);
    currentPageNum = 1;
    renderAgentsTable();
}

function updatePagination() {
    const totalPages = Math.ceil(filteredAgents.length / itemsPerPage);
    const pagination = document.getElementById('agentsPagination');
    const paginationInfo = document.getElementById('paginationInfo');

    if (totalPages <= 1) {
        pagination.innerHTML = '';
        paginationInfo.textContent = '';
        return;
    }

    // Информация о странице
    const startItem = (currentPageNum - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPageNum * itemsPerPage, filteredAgents.length);
    paginationInfo.textContent = `Показано ${startItem}-${endItem} из ${filteredAgents.length}`;

    // Кнопки пагинации
    let html = '';

    // Предыдущая страница
    html += `
        <li class="page-item ${currentPageNum === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPageNum - 1}); return false;">
                <i class="bi bi-chevron-left"></i>
            </a>
        </li>
    `;

    // Страницы
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPageNum - 1 && i <= currentPageNum + 1)) {
            html += `
                <li class="page-item ${i === currentPageNum ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="changePage(${i}); return false;">${i}</a>
                </li>
            `;
        } else if (i === currentPageNum - 2 || i === currentPageNum + 2) {
            html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
        }
    }

    // Следующая страница
    html += `
        <li class="page-item ${currentPageNum === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPageNum + 1}); return false;">
                <i class="bi bi-chevron-right"></i>
            </a>
        </li>
    `;

    pagination.innerHTML = html;
}

function changePage(page) {
    currentPageNum = page;
    renderAgentsTable();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateAgentsInfo() {
    const onlineCount = filteredAgents.filter(a => a.is_online).length;
    const offlineCount = filteredAgents.length - onlineCount;

    document.getElementById('agentsInfo').innerHTML = `
        <span class="badge bg-success">${onlineCount} онлайн</span>
        <span class="badge bg-danger ms-2">${offlineCount} оффлайн</span>
    `;
}

function updateAgentsCount() {
    if (allAgents.length > 0) {
        document.getElementById('agentsCount').textContent = allAgents.length;
    }
}

// =========== ДЕТАЛИ АГЕНТА ===========

async function showAgentDetail(agentId) {
    try {
        const agent = await fetchWithAuth(`${API_BASE}/agents/${agentId}`);

        document.getElementById('agentDetailTitle').textContent = `Агент: ${agent.hostname}`;
        document.getElementById('agentDetailContent').innerHTML = `
            <div class="row">
                <!-- Левая колонка -->
                <div class="col-md-6">
                    <div class="card mb-3">
                        <div class="card-header">
                            <h6 class="mb-0">Основная информация</h6>
                        </div>
                        <div class="card-body">
                            <table class="table table-sm">
                                <tr>
                                    <td width="40%"><strong>ID агента:</strong></td>
                                    <td><code>${agent.agent_id}</code></td>
                                </tr>
                                <tr>
                                    <td><strong>Хостнейм:</strong></td>
                                    <td>${agent.hostname}</td>
                                </tr>
                                <tr>
                                    <td><strong>Статус:</strong></td>
                                    <td>
                                        ${agent.is_online
                                            ? '<span class="badge bg-success"><i class="bi bi-check-circle"></i> Онлайн</span>'
                                            : '<span class="badge bg-danger"><i class="bi bi-x-circle"></i> Оффлайн</span>'}
                                    </td>
                                </tr>
                                <tr>
                                    <td><strong>IP адрес:</strong></td>
                                    <td>${agent.local_ip || 'Не указан'}</td>
                                </tr>
                                <tr>
                                    <td><strong>Операционная система:</strong></td>
                                    <td>${agent.operating_system || 'Неизвестно'}</td>
                                </tr>
                                <tr>
                                    <td><strong>Платформа:</strong></td>
                                    <td><span class="badge ${getPlatformBadgeClass(agent.platform)}">${agent.platform || 'unknown'}</span></td>
                                </tr>
                                <tr>
                                    <td><strong>Версия агента:</strong></td>
                                    <td>${agent.agent_version || '1.0.0'}</td>
                                </tr>
                            </table>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-header">
                            <h6 class="mb-0">Аппаратное обеспечение</h6>
                        </div>
                        <div class="card-body">
                            <table class="table table-sm">
                                <tr>
                                    <td width="40%"><strong>Процессор:</strong></td>
                                    <td>${agent.cpu_info || 'Неизвестно'}</td>
                                </tr>
                                <tr>
                                    <td><strong>Ядра:</strong></td>
                                    <td>${agent.cpu_cores || 'Неизвестно'}</td>
                                </tr>
                                <tr>
                                    <td><strong>Память:</strong></td>
                                    <td>${agent.total_ram ? formatBytes(agent.total_ram * 1024 * 1024) : 'Неизвестно'}</td>
                                </tr>
                                <tr>
                                    <td><strong>Диски:</strong></td>
                                    <td>${agent.disks_info || 'Неизвестно'}</td>
                                </tr>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- Правая колонка -->
                <div class="col-md-6">
                    <div class="card mb-3">
                        <div class="card-header">
                            <h6 class="mb-0">Активность</h6>
                        </div>
                        <div class="card-body">
                            <table class="table table-sm">
                                <tr>
                                    <td width="40%"><strong>Создан:</strong></td>
                                    <td>${agent.created_at ? formatDateTime(agent.created_at) : 'Неизвестно'}</td>
                                </tr>
                                <tr>
                                    <td><strong>Последняя активность:</strong></td>
                                    <td>${agent.last_seen ? formatDateTime(agent.last_seen) : 'Никогда'}</td>
                                </tr>
                                <tr>
                                    <td><strong>Время работы:</strong></td>
                                    <td>${agent.uptime || 'Неизвестно'}</td>
                                </tr>
                                <tr>
                                    <td><strong>Описание:</strong></td>
                                    <td>${agent.description || 'Нет описания'}</td>
                                </tr>
                            </table>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-header">
                            <h6 class="mb-0">Действия</h6>
                        </div>
                        <div class="card-body">
                            <div class="d-grid gap-2">
                                <button class="btn btn-primary" onclick="sendCommand('${agent.agent_id}', 'ping')">
                                    <i class="bi bi-wifi"></i> Отправить Ping
                                </button>
                                <button class="btn btn-secondary" onclick="sendCommand('${agent.agent_id}', 'restart')">
                                    <i class="bi bi-arrow-clockwise"></i> Перезапустить агента
                                </button>
                                <button class="btn btn-warning" onclick="sendCommand('${agent.agent_id}', 'update')">
                                    <i class="bi bi-cloud-arrow-down"></i> Обновить агента
                                </button>
                                <button class="btn btn-danger" onclick="deleteAgentWithConfirm('${agent.agent_id}')">
                                    <i class="bi bi-trash"></i> Удалить агента
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Показываем модальное окно
        const modal = new bootstrap.Modal(document.getElementById('agentDetailModal'));
        modal.show();
    } catch (error) {
        alert(`Ошибка загрузки деталей агента: ${error.message}`);
    }
}

// =========== ДЕЙСТВИЯ С АГЕНТАМИ ===========

async function sendHeartbeat(agentId) {
    try {
        const response = await fetch(`${API_BASE}/agents/${agentId}/heartbeat`, {
            method: 'POST'
        });

        if (response.ok) {
            showToast('✅ Heartbeat отправлен', 'success');
            await loadAgentsData();
        } else {
            showToast('❌ Ошибка отправки heartbeat', 'danger');
        }
    } catch (error) {
        console.error('Heartbeat error:', error);
        showToast('❌ Ошибка соединения', 'danger');
    }
}

async function deleteAgent(agentId) {
    if (confirm(`Удалить агента ${agentId}?`)) {
        try {
            const response = await fetchWithAuth(`${API_BASE}/agents/${agentId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                showToast('✅ Агент удален', 'success');
                await loadAgentsData();

                // Закрываем модальное окно если оно открыто
                const modal = bootstrap.Modal.getInstance(document.getElementById('agentDetailModal'));
                if (modal) modal.hide();
            } else {
                showToast('❌ Ошибка удаления агента', 'danger');
            }
        } catch (error) {
            console.error('Delete agent error:', error);
            showToast('❌ Ошибка соединения', 'danger');
        }
    }
}

function deleteAgentWithConfirm(agentId) {
    if (confirm(`Вы уверены, что хотите удалить агента ${agentId}?\nЭто действие нельзя отменить.`)) {
        deleteAgent(agentId);
        const modal = bootstrap.Modal.getInstance(document.getElementById('agentDetailModal'));
        if (modal) modal.hide();
    }
}

async function sendCommand(agentId, command) {
    showToast(`📤 Команда "${command}" отправлена агенту ${agentId}`, 'info');
    // Здесь можно добавить реальную отправку команд
}

function showAddAgentModal() {
    showToast('📝 Функция добавления агента в разработке', 'info');
    // Здесь можно добавить модальное окно добавления агента
}

// =========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ===========

async function fetchWithAuth(url, options = {}) {
    const headers = {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
        ...options.headers
    };

    const response = await fetch(url, { ...options, headers });

    if (response.status === 401) {
        // Неавторизован
        localStorage.removeItem('sysdm_token');
        showLoginPage();
        throw new Error('Not authenticated');
    }

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return response.json();
}

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

function formatDateTime(dateString) {
    if (!dateString) return 'Никогда';
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU');
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
}

function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function getPlatformBadgeClass(platform) {
    if (!platform) return 'bg-secondary';

    const platformLower = platform.toLowerCase();
    if (platformLower.includes('windows')) return 'bg-primary';
    if (platformLower.includes('linux')) return 'bg-success';
    if (platformLower.includes('mac') || platformLower.includes('darwin')) return 'bg-info';
    return 'bg-secondary';
}

function renderSimplePage(title, content) {
    return `
        <div class="page-header mb-4">
            <h2>${title}</h2>
            <p class="text-muted">${content}</p>
        </div>
    `;
}

function updateActiveNav(page) {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-page') === page) {
            item.classList.add('active');
        }
    });
}

function showToast(message, type = 'info') {
    // Создаем временное уведомление
    const toast = document.createElement('div');
    toast.className = `alert alert-${type} position-fixed`;
    toast.style.cssText = `
        top: 20px;
        right: 20px;
        z-index: 9999;
        min-width: 300px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    toast.innerHTML = `
        <div class="d-flex align-items-center">
            <div class="flex-grow-1">${escapeHtml(message)}</div>
            <button type="button" class="btn-close btn-close-white ms-2" onclick="this.parentElement.parentElement.remove()"></button>
        </div>
    `;

    document.body.appendChild(toast);

    // Автоматическое удаление через 3 секунды
    window.setTimeout(function() {        // <-- ИСПРАВЛЕННАЯ СТРОКА
        if (toast.parentElement) {
            toast.remove();
        }
    }, 3000);
}

// =========== НАВИГАЦИЯ ===========

function setupNavigation() {
    // Обработка кликов по навигации
    document.addEventListener('click', function(e) {
        if (e.target.closest('.nav-item')) {
            e.preventDefault();
            const link = e.target.closest('.nav-item');
            const page = link.getAttribute('data-page');
            if (page) {
                window.location.hash = page;
            }
        }
    });

    // Обработка изменения hash
    window.addEventListener('hashchange', loadPageFromHash);
}

function loadPageFromHash() {
    const hash = window.location.hash.substring(1) || 'dashboard';
    loadPage(hash);
}

// =========== АВТОРИЗАЦИЯ ===========

function showLoginPage() {
    document.getElementById('app').innerHTML = `
        <div class="login-container">
            <div class="login-card">
                <h3 class="text-center mb-4">
                    <i class="bi bi-server text-primary me-2"></i>SysDM
                </h3>
                <p class="text-center text-muted mb-4">Вход в систему управления</p>

                <form id="loginForm" onsubmit="handleLogin(event)">
                    <div class="mb-3">
                        <label class="form-label">Имя пользователя</label>
                        <input type="text" class="form-control" name="username" required>
                    </div>

                    <div class="mb-3">
                        <label class="form-label">Пароль</label>
                        <input type="password" class="form-control" name="password" required>
                    </div>

                    <div class="mb-3 form-check">
                        <input type="checkbox" class="form-check-input" name="remember">
                        <label class="form-check-label">Запомнить меня</label>
                    </div>

                    <button type="submit" class="btn btn-primary w-100">
                        <i class="bi bi-box-arrow-in-right"></i> Войти
                    </button>
                </form>

                <div class="mt-3 text-center">
                    <small class="text-muted">Версия ${window.SYSDM_CONFIG.app_version}</small>
                </div>
            </div>
        </div>
    `;
}

async function handleLogin(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData.entries());

    try {
        const response = await fetch('/api/v1/auth/login-spa', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams(data)
        });

        const result = await response.json();

        if (result.success) {
            authToken = result.access_token;
            localStorage.setItem('sysdm_token', authToken);
            currentUser = result.user;
            renderApp();
            loadPageFromHash();
        } else {
            alert(result.detail || 'Ошибка входа');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Ошибка соединения');
    }
}

async function logout() {
    try {
        await fetch(`${API_BASE}/auth/logout`, { method: 'POST' });
    } catch (error) {
        // Игнорируем ошибки при выходе
    }

    localStorage.removeItem('sysdm_token');
    authToken = null;
    currentUser = null;
    showLoginPage();
}

function refreshAgents() {
    loadAgentsData();
    showToast('🔄 Список агентов обновляется...', 'info');
}

// =========== ЗАПУСК ===========

// Экспортируем функции в глобальную область видимости
window.loadPage = loadPage;
window.viewAgentDetail = showAgentDetail;
window.sendHeartbeat = sendHeartbeat;
window.deleteAgent = deleteAgent;
window.sendCommand = sendCommand;
window.refreshAgents = refreshAgents;
window.showAddAgentModal = showAddAgentModal;
window.changePage = changePage;
window.filterAgents = filterAgents;
window.sortAgents = sortAgents;
window.changePerPage = changePerPage;
window.handleLogin = handleLogin;
window.logout = logout;

// Запускаем приложение
document.addEventListener('DOMContentLoaded', initApp);