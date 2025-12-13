// app/static/js/app.js - ОБНОВЛЕННАЯ ФУНКЦИЯ loadAgentsPage
// ... существующий код до функции loadAgentsPage ...

async function loadAgentsPage(container) {
    currentPage = 'agents';

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
        renderClientTree(data);
    } catch (error) {
        console.error('Ошибка загрузки дерева:', error);
        document.getElementById('clientTreeContainer').innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle"></i> Ошибка загрузки дерева
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
                    <span class="tree-label">${client.name}</span>
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
                            <span class="tree-label">${dept.name}</span>
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
        const agents = await fetchWithAuth('/api/v1/agents?limit=1000');
        renderAgentsTable(agents);
        updateUIAfterLoading('Все агенты', agents.length);
    } catch (error) {
        console.error('Ошибка загрузки всех агентов:', error);
        showError('Ошибка загрузки агентов');
    }
}

function updateUIForLoading(title, showSpinner = true) {
    document.getElementById('agentsPanelTitle').innerHTML = `
        <i class="bi bi-pc-display me-2"></i>${title}
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
}

function renderAgentsTable(agents) {
    const tbody = document.getElementById('agentsTableBody');

    if (!agents || agents.length === 0) {
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

    let html = '';

    agents.forEach(agent => {
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
                            <strong>${agent.hostname}</strong><br>
                            <small class="text-muted">${agent.agent_id}</small>
                        </div>
                    </div>
                </td>
                <td>
                    ${agent.is_online ?
                        '<span class="badge bg-success"><i class="bi bi-check-circle"></i> Онлайн</span>' :
                        '<span class="badge bg-danger"><i class="bi bi-x-circle"></i> Оффлайн</span>'}
                </td>
                <td>${agent.local_ip || 'N/A'}</td>
                <td>
                    ${agent.department ?
                        `<span class="badge bg-secondary">${agent.department.name}</span>` :
                        '<span class="text-muted">Не назначен</span>'}
                </td>
                <td><span class="badge bg-info">${agent.platform || 'unknown'}</span></td>
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
                        <button class="btn btn-outline-primary" onclick="viewAgentDetail('${agent.agent_id}')">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button class="btn btn-outline-warning" onclick="editAgent(${agent.id})">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-outline-info" onclick="showAgentCommands('${agent.agent_id}')">
                            <i class="bi bi-terminal"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
    updateSelectedCount();
}

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

function setupAgentsEventListeners() {
    // Выделение всех агентов
    document.getElementById('selectAllAgents').addEventListener('change', function() {
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
    document.getElementById('agentsSearch').addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(filterAgents, 300);
    });
}

function filterAgents() {
    const statusFilter = document.getElementById('agentsStatusFilter').value;
    const platformFilter = document.getElementById('agentsPlatformFilter').value;
    const searchTerm = document.getElementById('agentsSearch').value.toLowerCase();

    const rows = document.querySelectorAll('#agentsTableBody tr[data-agent-id]');

    rows.forEach(row => {
        const status = row.querySelector('.badge').textContent.toLowerCase();
        const platform = row.querySelector('td:nth-child(6)').textContent.toLowerCase();
        const hostname = row.querySelector('td:nth-child(2) strong').textContent.toLowerCase();
        const agentId = row.querySelector('td:nth-child(2) small').textContent.toLowerCase();
        const ip = row.querySelector('td:nth-child(4)').textContent.toLowerCase();

        let show = true;

        // Фильтр по статусу
        if (statusFilter !== 'all') {
            if (statusFilter === 'online' && !status.includes('онлайн')) show = false;
            if (statusFilter === 'offline' && !status.includes('оффлайн')) show = false;
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

        row.style.display = show ? '' : 'none';
    });

    // Обновляем счетчик видимых агентов
    const visibleCount = Array.from(rows).filter(row => row.style.display !== 'none').length;
    document.getElementById('agentsCountText').textContent = `Показано: ${visibleCount} из ${rows.length} агентов`;
}

function updateSelectedCount() {
    const selected = document.querySelectorAll('.agent-checkbox:checked').length;
    document.getElementById('selectedCountText').textContent = `Выбрано: ${selected}`;
}

function bulkAssignDepartment() {
    const selectedIds = Array.from(document.querySelectorAll('.agent-checkbox:checked'))
        .map(cb => cb.value);

    if (selectedIds.length === 0) {
        showError('Выберите хотя бы одного агента');
        return;
    }

    // Здесь можно открыть модальное окно для выбора отдела
    showDepartmentSelectionModal(selectedIds);
}

function bulkDeleteAgents() {
    const selectedIds = Array.from(document.querySelectorAll('.agent-checkbox:checked'))
        .map(cb => cb.value);

    if (selectedIds.length === 0) {
        showError('Выберите хотя бы одного агента');
        return;
    }

    if (confirm(`Удалить ${selectedIds.length} выбранных агентов?`)) {
        // Отправляем запрос на удаление
        selectedIds.forEach(id => {
            // Вызов API удаления агента
            console.log('Удаление агента:', id);
        });
    }
}

// Вспомогательные функции
function showError(message) {
    // Можно использовать toast или alert
    alert(message);
}

function refreshAgents() {
    const btn = document.getElementById('refreshBtn');
    btn.innerHTML = '<i class="bi bi-arrow-clockwise spin"></i> Обновление...';
    btn.disabled = true;

    if (currentTreeView === 'all') {
        loadAllAgents();
    } else if (currentTreeView === 'client') {
        loadAgentsByClient(currentSelectedId);
    } else if (currentTreeView === 'department') {
        loadAgentsByDepartment(currentSelectedId);
    }

    setTimeout(() => {
        btn.innerHTML = '<i class="bi bi-arrow-clockwise"></i> Обновить';
        btn.disabled = false;
    }, 1000);
}

// Инициализация при загрузке страницы
window.addEventListener('DOMContentLoaded', () => {
    // Если мы на странице агентов, обновляем дерево
    if (window.location.hash === '#agents') {
        setTimeout(loadFullTree, 500);
    }
});