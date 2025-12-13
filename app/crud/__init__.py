# app/crud/__init__.py
from .agent import (
    get_agent, get_agent_by_agent_id, get_agents, get_agents_by_department,
    get_online_agents, get_agents_statistics, create_agent, update_agent,
    delete_agent, update_agent_heartbeat, bulk_update_agent_department,
    search_agents
)

from .user import (
    get_users, create_user,
    authenticate_user, get_user_by_username
)

from .client import (
    get_client, get_client_by_name, get_clients, create_client,
    update_client, delete_client
)

from .department import (
    get_department, get_department_by_name, get_departments,
    get_department_tree, create_department, update_department,
    delete_department, get_departments_with_agent_count
)