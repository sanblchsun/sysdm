// app/static/js/app.js - ПОЛНАЯ ИСПРАВЛЕННАЯ ВЕРСИЯ С ДЕРЕВОМ
const API_BASE = '/api/v1';
let authToken = null;
let currentUser = null;
let currentPage = 'dashboard';

// =========== ИНИЦИАЛИЗАЦИЯ ===========

// Инициализация приложения
async function initApp() {
    console.log('Initializing app...');

    // Проверяем наличие токена
    authToken = localStorage.getItem('sysdm_token') || getCookie('access_token');

    if (authToken) {
        try {
            console.log('Found token, fetching user info...');
            currentUser = await fetchWithAuth(`${API_BASE}/auth/me`);
            console.log('User authenticated:', currentUser.username);
            renderApp();
            loadPageFromHash();
        } catch (error) {
            console.error('Auth error:', error);
            showLoginPage();
        }
    } else {
        console.log('No token found, showing login page');
        showLoginPage();
    }

    // Обработка навигации
    setupNavigation();
}

// =========== ОСНОВНОЙ РЕНДЕРИНГ ===========

function renderApp() {
    console.log('Rendering app interface...');

    document.getElementById('app').innerHTML = `
        <div class="app-container">
            <!-- Сайдбар -->
            <div class="sidebar">
                <div class="sidebar-header">
                    <h5><i class="bi bi-server text-primary me-2"></i>SysDM</h5>
                    <small class="text-muted">v${window.SYSDM_CONFIG?.app_version || '1.0.0'}</small>
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
    console.log('Loading page:', page);
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
        console.log('Loading dashboard...');
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
                                    ${(stats.recent_agents || []).map(agent => `
                                        <tr>
                                            <td>
                                                <strong>${escapeHtml(agent.hostname)}</strong><br>
                                                <small class="text-muted">${escapeHtml(agent.agent_id)}</small>
                                            </td>
                                            <td>
                                                ${agent.is_online
                                                    ? '<span class="badge bg-success"><i class="bi bi-check-circle"></i> Онлайн</span>'
                                                    : '<span class="badge bg-danger"><i class="bi bi-x-circle"></i> Оффлайн</span>'}
                                            </td>
                                            <td>${escapeHtml(agent.local_ip || 'N/A')}</td>
                                            <td><span class="badge bg-secondary">${escapeHtml(agent.platform || 'unknown')}</span></td>
                                            <td>${agent.last_seen ? formatDateTime(agent.last_seen) : 'Никогда'}</td>
                                            <td>
                                                <button class="btn btn-sm btn-outline-primary" onclick="viewAgentDetail('${escapeHtml(agent.agent_id)}')">
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
        console.error('Dashboard error:', error);
        container.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle"></i> Ошибка загрузки дашборда: ${escapeHtml(error.message)}
            </div>
        `;
    }
}

async function loadAgentsPage(container) {
    console.log('Loading agents page with tree view...');

    container.innerHTML = `
        <div class="agents-page">
            <!-- Шапка -->
            <div class="page-header mb-4">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h2><i class="bi bi-pc-display me-2"></i>Агенты</h2>
                        <p class="text-muted" id="currentViewTitle">Все агенты системы</p>
                    </div>
                    <div class="d-flex gap-2">
                        <button class="btn btn-outline-primary" onclick="refreshAgents()" id="refreshBtn">
                            <i class="bi bi-arrow-clockwise"></i> Обновить
                        </button>
                        <button class="btn btn-success" onclick="showAddAgentModal()">
                            <i class="bi bi-plus-circle"></i> Добавить агента
                        </button>
                        <button class="btn btn-info" onclick="toggleTreeView()" id="toggleTreeBtn">
                            <i class="bi bi-list-tree"></i> Показать дерево
                        </button>
                    </div>
                </div>
            </div>

            <div class="row">
                <!-- Левая панель: Дерево клиентов (изначально скрыта) -->
                <div class="col-md-4 d-none" id="treePanel">
                    <div class="card h-100">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h5 class="mb-0"><i class="bi bi-diagram-3 me-2"></i>Иерархия</h5>
                            <button class="btn btn-sm btn-outline-secondary" onclick="loadFullTree()">
                                <i class="bi bi-arrow-clockwise"></i>
                            </button>
                        </div>
                        <div class="card-body p-0">
                            <div class="p-3 border-bottom">
                                <div class="input-group">
                                    <span class="input-group-text"><i class="bi bi-search"></i></span>
                                    <input type="text" class="form-control" id="treeSearch"
                                           placeholder="Поиск в дереве..." oninput="searchInTree()">
                                </div>
                            </div>
                            <div id="clientTreeContainer" style="height: 600px; overflow-y: auto; padding: 15px;">
                                <div class="text-center py-5">
                                    <div class="spinner-border text-primary" role="status">
                                        <span class="visually-hidden">Загрузка...</span>
                                    </div>
                                    <p class="mt-2">Загрузка иерархии...</p>
                                </div>
                            </div>
                        </div>
                        <div class="card-footer text-muted">
                            <small><i class="bi bi-info-circle"></i> Кликните на отдел для просмотра агентов</small>
                        </div>
                    </div>
                </div>

                <!-- Правая панель: Агенты -->
                <div class="col-md-12" id="agentsPanel">
                    <div class="card">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <div>
                                <h5 class="mb-0" id="agentsPanelTitle">
                                    <i class="bi bi-pc-display me-2"></i>Все агенты
                                </h5>
                                <small class="text-muted" id="agentsCountText">Загрузка...</small>
                            </div>
                            <div class="d-flex gap-2">
                                <!-- Фильтры -->
                                <select class="form-select form-select-sm w-auto" id="agentsStatusFilter" onchange="filterAgents()">
                                    <option value="all">Все статусы</option>
                                    <option value="online">Только онлайн</option>
                                    <option value="offline">Только оффлайн</option>
                                </select>
                                <select class="form-select form-select-sm w-auto" id="agentsPlatformFilter" onchange="filterAgents()">
                                    <option value="all">Все платформы</option>
                                    <option value="windows">Windows</option>
                                    <option value="linux">Linux</option>
                                    <option value="macos">macOS</option>
                                </select>
                                <div class="input-group input-group-sm" style="width: 200px;">
                                    <span class="input-group-text"><i class="bi bi-search"></i></span>
                                    <input type="text" class="form-control" id="agentsSearch"
                                           placeholder="Поиск агентов...">
                                </div>
                            </div>
                        </div>
                        <div class="card-body p-0">
                            <!-- Таблица агентов -->
                            <div class="table-responsive">
                                <table class="table table-hover mb-0">
                                    <thead>
                                        <tr>
                                            <th width="50">
                                                <div class="form-check">
                                                    <input class="form-check-input" type="checkbox" id="selectAllAgents">
                                                </div>
                                            </th>
                                            <th>Имя хоста</th>
                                            <th>Статус</th>
                                            <th>IP адрес</th>
                                            <th>Отдел</th>
                                            <th>Платформа</th>
                                            <th>Ресурсы</th>
                                            <th>Последняя активность</th>
                                            <th>Действия</th>
                                        </tr>
                                    </thead>
                                    <tbody id="agentsTableBody">
                                        <tr>
                                            <td colspan="9" class="text-center py-5">
                                                <div class="spinner-border text-primary" role="status">
                                                    <span class="visually-hidden">Загрузка...</span>
                                                </div>
                                                <p class="mt-2">Загрузка агентов...</p>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div class="card-footer">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <button class="btn btn-sm btn-outline-secondary me-2" onclick="bulkAssignDepartment()">
                                        <i class="bi bi-folder-plus"></i> Назначить отдел
                                    </button>
                                    <button class="btn btn-sm btn-outline-danger" onclick="bulkDeleteAgents()">
                                        <i class="bi bi-trash"></i> Удалить выбранные
                                    </button>
                                </div>
                                <div class="d-flex align-items-center">
                                    <span class="me-3" id="selectedCountText">Выбрано: 0</span>
                                    <nav aria-label="Навигация по страницам">
                                        <ul class="pagination pagination-sm mb-0" id="agentsPagination">
                                            <!-- Пагинация будет добавлена динамически -->
                                        </ul>
                                    </nav>
                                </div>
                            </div>
                        </div>
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

    // Инициализация страницы
    await loadFullTree();
    await loadAllAgents();
    setupAgentsEventListeners();
}

// =========== ФУНКЦИИ ДЛЯ ДЕРЕВА ===========

let currentTreeView = 'all'; // 'all', 'client', 'department'
let currentSelectedId = null;

async function loadFullTree() {
    try {
        const container = document.getElementById('clientTreeContainer');
        container.innerHTML = `
            <div class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Загрузка...</span>
                </div>
                <p class="mt-2">Загрузка иерархии...</p>
            </div>
        `;

        const data = await fetchWithAuth('/api/v1/tree/clients-tree');
        console.log('Tree data loaded:', data);
        renderClientTree(data);
    } catch (error) {
        console.error('Ошибка загрузки дерева:', error);
        document.getElementById('clientTreeContainer').innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle"></i> Ошибка загрузки дерева: ${escapeHtml(error.message)}
            </div>
        `;
    }
}

function renderClientTree(clients) {
    const container = document.getElementById('clientTreeContainer');

    if (!clients || clients.length === 0) {
        container.innerHTML = `
            <div class="alert alert-info">
                <i class="bi bi-info-circle"></i> Нет клиентов для отображения
            </div>
        `;
        return;
    }

    let html = '<div class="tree">';

    clients.forEach(client => {
        html += `
            <div class="tree-node client-node" data-id="client_${client.id}" data-type="client">
                <div class="tree-item" onclick="selectTreeNode('client', ${client.id})">
                    <i class="bi bi-building tree-icon"></i>
                    <span class="tree-label">${escapeHtml(client.name)}</span>
                    <span class="badge bg-secondary ms-2">${client.departments?.length || 0}</span>
                </div>
                <div class="tree-children">
        `;

        // Рекурсивная функция для отображения отделов
        function renderDepartments(departments, level = 0) {
            let deptHtml = '';
            departments.forEach(dept => {
                const padding = 20 + (level * 20);
                deptHtml += `
                    <div class="tree-node department-node" data-id="dept_${dept.id}" data-type="department"
                         style="margin-left: ${padding}px;">
                        <div class="tree-item" onclick="selectTreeNode('department', ${dept.id}, ${dept.client_id})">
                            <i class="bi bi-folder tree-icon"></i>
                            <span class="tree-label">${escapeHtml(dept.name)}</span>
                            <span class="badge bg-info ms-2">${countAgentsInDepartment(dept)}</span>
                        </div>
                        <div class="tree-children">
                `;

                if (dept.children && dept.children.length > 0) {
                    deptHtml += renderDepartments(dept.children, level + 1);
                }

                deptHtml += '</div></div>';
            });
            return deptHtml;
        }

        if (client.departments && client.departments.length > 0) {
            html += renderDepartments(client.departments);
        }

        html += '</div></div>';
    });

    html += '</div>';
    container.innerHTML = html;

    // Добавляем обработчики для раскрытия/сворачивания
    document.querySelectorAll('.tree-item').forEach(item => {
        item.addEventListener('click', function(e) {
            if (e.target.closest('.tree-label') || e.target.closest('.tree-icon')) {
                const node = this.parentElement;
                const children = node.querySelector('.tree-children');
                if (children) {
                    children.classList.toggle('collapsed');
                    const icon = this.querySelector('.tree-icon');
                    if (icon) {
                        if (children.classList.contains('collapsed')) {
                            icon.classList.remove('bi-folder');
                            icon.classList.add('bi-folder2');
                        } else {
                            icon.classList.remove('bi-folder2');
                            icon.classList.add('bi-folder');
                        }
                    }
                }
            }
        });
    });
}

function countAgentsInDepartment(department) {
    // Эта функция должна считать агентов в отделе
    // Пока возвращаем 0, можно будет улучшить когда будет статистика
    return department.agents_count || 0;
}

function selectTreeNode(type, id, clientId = null) {
    console.log('Selected tree node:', type, id);
    currentTreeView = type;
    currentSelectedId = id;

    // Обновляем выделение в дереве
    document.querySelectorAll('.tree-item').forEach(item => {
        item.classList.remove('selected');
    });

    const selectedNode = document.querySelector(`[data-id="${type}_${id}"] .tree-item`);
    if (selectedNode) {
        selectedNode.classList.add('selected');
    }

    // Загружаем соответствующих агентов
    if (type === 'client') {
        loadAgentsByClient(id);
    } else if (type === 'department') {
        loadAgentsByDepartment(id);
    }
}

async function loadAgentsByClient(clientId) {
    try {
        updateUIForLoading(`Агенты клиента`, true);
        const agents = await fetchWithAuth(`/api/v1/tree/clients/${clientId}/agents`);
        console.log('Agents by client:', agents);
        renderAgentsTable(agents);
        updateUIAfterLoading(`Агенты клиента`, agents.length);
    } catch (error) {
        console.error('Ошибка загрузки агентов клиента:', error);
        showError('Ошибка загрузки агентов клиента');
    }
}

async function loadAgentsByDepartment(departmentId) {
    try {
        updateUIForLoading(`Агенты отдела`, true);
        const agents = await fetchWithAuth(`/api/v1/tree/departments/${departmentId}/agents`);
        console.log('Agents by department:', agents);
        renderAgentsTable(agents);
        updateUIAfterLoading(`Агенты отдела`, agents.length);
    } catch (error) {
        console.error('Ошибка загрузки агентов отдела:', error);
        showError('Ошибка загрузки агентов отдела');
    }
}

async function loadAllAgents() {
    try {
        updateUIForLoading('Все агенты', true);
        const agents = await fetchWithAuth('/api/v1/agents/search?limit=1000');
        console.log('All agents loaded:', agents.length);
        renderAgentsTable(agents);
        updateUIAfterLoading('Все агенты', agents.length);
    } catch (error) {
        console.error('Ошибка загрузки всех агентов:', error);
        showError('Ошибка загрузки агентов');
    }
}

function updateUIForLoading(title, showSpinner = true) {
    document.getElementById('agentsPanelTitle').innerHTML = `
        <i class="bi bi-pc-display me-2"></i>${escapeHtml(title)}
    `;
    document.getElementById('agentsCountText').textContent = 'Загрузка...';

    if (showSpinner) {
        document.getElementById('agentsTableBody').innerHTML = `
            <tr>
                <td colspan="9" class="text-center py-5">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Загрузка...</span>
                    </div>
                    <p class="mt-2">Загрузка агентов...</p>
                </td>
            </tr>
        `;
    }
}

function updateUIAfterLoading(title, count) {
    document.getElementById('agentsCountText').textContent = `Найдено: ${count} агентов`;
    document.getElementById('currentViewTitle').textContent = title;
}

// =========== ТАБЛИЦА АГЕНТОВ ===========

let allAgents = [];
let filteredAgents = [];
let currentPageNum = 1;
let itemsPerPage = 25;

function renderAgentsTable(agents) {
    const tbody = document.getElementById('agentsTableBody');
    allAgents = agents;
    filteredAgents = [...agents];
    currentPageNum = 1;

    renderAgentsTablePage();
    updatePagination();
    updateSelectedCount();
}

function renderAgentsTablePage() {
    const tbody = document.getElementById('agentsTableBody');

    if (!filteredAgents || filteredAgents.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center py-5">
                    <div class="text-muted">
                        <i class="bi bi-inbox fs-1"></i>
                        <p class="mt-2">Агенты не найдены</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    // Пагинация
    const startIndex = (currentPageNum - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageAgents = filteredAgents.slice(startIndex, endIndex);

    let html = '';

    pageAgents.forEach(agent => {
        const lastSeen = agent.last_seen ?
            new Date(agent.last_seen).toLocaleString() : 'Никогда';

        html += `
            <tr data-agent-id="${agent.id}">
                <td>
                    <div class="form-check">
                        <input class="form-check-input agent-checkbox" type="checkbox" value="${agent.id}">
                    </div>
                </td>
                <td>
                    <div class="d-flex align-items-center">
                        <div class="status-indicator ${agent.is_online ? 'online' : 'offline'} me-2"></div>
                        <div>
                            <strong>${escapeHtml(agent.hostname)}</strong><br>
                            <small class="text-muted">${escapeHtml(agent.agent_id)}</small>
                        </div>
                    </div>
                </td>
                <td>
                    ${agent.is_online ?
                        '<span class="badge bg-success"><i class="bi bi-check-circle"></i> Онлайн</span>' :
                        '<span class="badge bg-danger"><i class="bi bi-x-circle"></i> Оффлайн</span>'}
                </td>
                <td>${escapeHtml(agent.local_ip || 'N/A')}</td>
                <td>
                    ${agent.department ?
                        `<span class="badge bg-secondary">${escapeHtml(agent.department.name)}</span>` :
                        '<span class="text-muted">Не назначен</span>'}
                </td>
                <td><span class="badge bg-info">${escapeHtml(agent.platform || 'unknown')}</span></td>
                <td>
                    <small>
                        CPU: ${agent.cpu_cores || '?'} ядер<br>
                        RAM: ${agent.total_ram ? Math.round(agent.total_ram / 1024) + ' GB' : '?'}
                    </small>
                </td>
                <td>
                    <small>${lastSeen}</small>
                </td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary" onclick="viewAgentDetail('${escapeHtml(agent.agent_id)}')">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button class="btn btn-outline-warning" onclick="editAgent(${agent.id})">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-outline-info" onclick="showAgentCommands('${escapeHtml(agent.agent_id)}')">
                            <i class="bi bi-terminal"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
    updateAgentsInfo();
}

function filterAgents() {
    const statusFilter = document.getElementById('agentsStatusFilter').value;
    const platformFilter = document.getElementById('agentsPlatformFilter').value;
    const searchTerm = document.getElementById('agentsSearch').value.toLowerCase();

    filteredAgents = allAgents.filter(agent => {
        const status = agent.is_online ? 'online' : 'offline';
        const platform = agent.platform ? agent.platform.toLowerCase() : '';
        const hostname = agent.hostname ? agent.hostname.toLowerCase() : '';
        const agentId = agent.agent_id ? agent.agent_id.toLowerCase() : '';
        const ip = agent.local_ip ? agent.local_ip.toLowerCase() : '';

        let show = true;

        // Фильтр по статусу
        if (statusFilter !== 'all') {
            if (statusFilter !== status) show = false;
        }

        // Фильтр по платформе
        if (platformFilter !== 'all') {
            if (!platform.includes(platformFilter)) show = false;
        }

        // Поиск
        if (searchTerm && !hostname.includes(searchTerm) &&
            !agentId.includes(searchTerm) && !ip.includes(searchTerm)) {
            show = false;
        }

        return show;
    });

    currentPageNum = 1;
    renderAgentsTablePage();
    updatePagination();
}

function updatePagination() {
    const totalPages = Math.ceil(filteredAgents.length / itemsPerPage);
    const pagination = document.getElementById('agentsPagination');

    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }

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
    renderAgentsTablePage();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateAgentsInfo() {
    const onlineCount = filteredAgents.filter(a => a.is_online).length;
    const offlineCount = filteredAgents.length - onlineCount;

    document.getElementById('agentsInfo')?.innerHTML = `
        <span class="badge bg-success">${onlineCount} онлайн</span>
        <span class="badge bg-danger ms-2">${offlineCount} оффлайн</span>
    `;
}

function updateAgentsCount() {
    if (allAgents.length > 0) {
        document.getElementById('agentsCount').textContent = allAgents.length;
    }
}

// =========== УПРАВЛЕНИЕ ДЕРЕВОМ ===========

function toggleTreeView() {
    const treePanel = document.getElementById('treePanel');
    const agentsPanel = document.getElementById('agentsPanel');
    const toggleBtn = document.getElementById('toggleTreeBtn');

    if (treePanel.classList.contains('d-none')) {
        // Показываем дерево
        treePanel.classList.remove('d-none');
        treePanel.classList.add('col-md-4');
        agentsPanel.classList.remove('col-md-12');
        agentsPanel.classList.add('col-md-8');
        toggleBtn.innerHTML = '<i class="bi bi-list"></i> Скрыть дерево';
    } else {
        // Скрываем дерево
        treePanel.classList.add('d-none');
        treePanel.classList.remove('col-md-4');
        agentsPanel.classList.remove('col-md-8');
        agentsPanel.classList.add('col-md-12');
        toggleBtn.innerHTML = '<i class="bi bi-list-tree"></i> Показать дерево';
    }
}

function searchInTree() {
    const searchTerm = document.getElementById('treeSearch').value.toLowerCase();
    const treeNodes = document.querySelectorAll('.tree-node');

    treeNodes.forEach(node => {
        const label = node.querySelector('.tree-label');
        if (label) {
            const text = label.textContent.toLowerCase();
            if (searchTerm === '' || text.includes(searchTerm)) {
                node.style.display = '';
                // Показываем родительские элементы
                let parent = node.parentElement;
                while (parent && parent.classList.contains('tree-children')) {
                    parent.parentElement.style.display = '';
                    parent = parent.parentElement.parentElement;
                }
            } else {
                node.style.display = 'none';
            }
        }
    });
}

// =========== ОБРАБОТЧИКИ СОБЫТИЙ ===========

function setupAgentsEventListeners() {
    // Выделение всех агентов
    document.getElementById('selectAllAgents')?.addEventListener('change', function() {
        const checkboxes = document.querySelectorAll('.agent-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = this.checked;
        });
        updateSelectedCount();
    });

    // Обновление счетчика выбранных
    document.addEventListener('change', function(e) {
        if (e.target.classList.contains('agent-checkbox')) {
            updateSelectedCount();
        }
    });

    // Поиск агентов с задержкой
    let searchTimeout;
    document.getElementById('agentsSearch')?.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(filterAgents, 300);
    });
}

function updateSelectedCount() {
    const selected = document.querySelectorAll('.agent-checkbox:checked').length;
    document.getElementById('selectedCountText').textContent = `Выбрано: ${selected}`;
}

// =========== ДЕЙСТВИЯ С АГЕНТАМИ ===========

async function viewAgentDetail(agentId) {
    try {
        const agent = await fetchWithAuth(`${API_BASE}/agents/${agentId}`);

        document.getElementById('agentDetailTitle').textContent = `Агент: ${escapeHtml(agent.hostname)}`;
        document.getElementById('agentDetailContent').innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <div class="card mb-3">
                        <div class="card-header">
                            <h6 class="mb-0">Основная информация</h6>
                        </div>
                        <div class="card-body">
                            <table class="table table-sm">
                                <tr>
                                    <td width="40%"><strong>ID агента:</strong></td>
                                    <td><code>${escapeHtml(agent.agent_id)}</code></td>
                                </tr>
                                <tr>
                                    <td><strong>Хостнейм:</strong></td>
                                    <td>${escapeHtml(agent.hostname)}</td>
                                </tr>
                                <tr>
                                    <td><strong>Статус:</strong></td>
                                    <td>
                                        ${agent.is_online
                                            ? '<span class="badge bg-success"><i class="bi bi-check-circle"></i> Онлайн</span>'
                                            : '<span class="badge bg-danger"><i class="bi bi-x-circle"></i> Оффлайн</span>'}
                                    </td>
                                </tr>
                            </table>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card mb-3">
                        <div class="card-header">
                            <h6 class="mb-0">Действия</h6>
                        </div>
                        <div class="card-body">
                            <div class="d-grid gap-2">
                                <button class="btn btn-primary" onclick="sendHeartbeat('${escapeHtml(agent.agent_id)}')">
                                    <i class="bi bi-heart-pulse"></i> Отправить heartbeat
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Показываем модальное окно
        const modalElement = document.getElementById('agentDetailModal');
        if (modalElement) {
            const modal = new bootstrap.Modal(modalElement);
            modal.show();
        }
    } catch (error) {
        console.error('Error loading agent details:', error);
        showToast(`Ошибка загрузки деталей агента: ${error.message}`, 'danger');
    }
}

function bulkAssignDepartment() {
    const selectedIds = Array.from(document.querySelectorAll('.agent-checkbox:checked'))
        .map(cb => cb.value);

    if (selectedIds.length === 0) {
        showError('Выберите хотя бы одного агента');
        return;
    }

    showToast(`Выбрано ${selectedIds.length} агентов для назначения отдела`, 'info');
}

function bulkDeleteAgents() {
    const selectedIds = Array.from(document.querySelectorAll('.agent-checkbox:checked'))
        .map(cb => cb.value);

    if (selectedIds.length === 0) {
        showError('Выберите хотя бы одного агента');
        return;
    }

    if (confirm(`Удалить ${selectedIds.length} выбранных агентов?`)) {
        showToast(`Запрос на удаление ${selectedIds.length} агентов отправлен`, 'warning');
    }
}

// =========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ===========

async function fetchWithAuth(url, options = {}) {
    if (!authToken) {
        throw new Error('Not authenticated');
    }

    const headers = {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
        ...options.headers
    };

    const response = await fetch(url, { ...options, headers });

    if (response.status === 401) {
        // Неавторизован
        localStorage.removeItem('sysdm_token');
        authToken = null;
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
    return null;
}

function formatDateTime(dateString) {
    if (!dateString) return 'Никогда';
    try {
        const date = new Date(dateString);
        return date.toLocaleString('ru-RU');
    } catch (e) {
        return dateString;
    }
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU');
    } catch (e) {
        return dateString;
    }
}

function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function renderSimplePage(title, content) {
    return `
        <div class="page-header mb-4">
            <h2>${escapeHtml(title)}</h2>
            <p class="text-muted">${escapeHtml(content)}</p>
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
    setTimeout(function() {
        if (toast.parentElement) {
            toast.remove();
        }
    }, 3000);
}

function showError(message) {
    showToast(message, 'danger');
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
    console.log('Showing login page');

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
                    <small class="text-muted">Версия ${window.SYSDM_CONFIG?.app_version || '1.0.0'}</small>
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
    const btn = document.getElementById('refreshBtn');
    if (btn) {
        const originalHtml = btn.innerHTML;
        btn.innerHTML = '<i class="bi bi-arrow-clockwise spin"></i> Обновление...';
        btn.disabled = true;

        setTimeout(() => {
            btn.innerHTML = originalHtml;
            btn.disabled = false;
        }, 1000);
    }

    if (currentTreeView === 'all') {
        loadAllAgents();
    } else if (currentTreeView === 'client' && currentSelectedId) {
        loadAgentsByClient(currentSelectedId);
    } else if (currentTreeView === 'department' && currentSelectedId) {
        loadAgentsByDepartment(currentSelectedId);
    }

    showToast('🔄 Список агентов обновляется...', 'info');
}

// =========== ЗАПУСК ===========

// Экспортируем функции в глобальную область видимости
window.loadPage = loadPage;
window.viewAgentDetail = viewAgentDetail;
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
window.loadFullTree = loadFullTree;
window.selectTreeNode = selectTreeNode;
window.toggleTreeView = toggleTreeView;
window.searchInTree = searchInTree;
window.bulkAssignDepartment = bulkAssignDepartment;
window.bulkDeleteAgents = bulkDeleteAgents;

// Запускаем приложение
document.addEventListener('DOMContentLoaded', initApp);