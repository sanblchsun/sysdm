# app/crud/__init__.py
from .user import get_user_by_username, create_user, authenticate_user, get_users
from .agent import (
    get_agent, get_agent_by_agent_id, get_agents, get_agents_by_department,
    get_online_agents, get_agents_statistics, create_agent, update_agent,
    delete_agent, update_agent_heartbeat, bulk_update_agent_department,
    search_agents
)
from .client import (
    get_client, get_client_by_name, get_clients, create_client,
    update_client, delete_client
)
from .department import (
    get_department, get_departments, get_departments_by_client,
    create_department, update_department, delete_department,
    get_department_tree, get_agents_by_department_recursive
)

# Экспорт для удобного импорта
__all__ = [
    # User
    'get_user_by_username', 'create_user', 'authenticate_user', 'get_users',

    # Agent
    'get_agent', 'get_agent_by_agent_id', 'get_agents', 'get_agents_by_department',
    'get_online_agents', 'get_agents_statistics', 'create_agent', 'update_agent',
    'delete_agent', 'update_agent_heartbeat', 'bulk_update_agent_department',
    'search_agents',

    # Client
    'get_client', 'get_client_by_name', 'get_clients', 'create_client',
    'update_client', 'delete_client',

    # Department (НОВОЕ)
    'get_department', 'get_departments', 'get_departments_by_client',
    'create_department', 'update_department', 'delete_department',
    'get_department_tree', 'get_agents_by_department_recursive'
]