from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.database import get_db
from app import crud
from app.schemas.client import ClientTree
from app.schemas.department import DepartmentTree
from app.schemas.agent import AgentWithDepartment

router = APIRouter()

@router.get("/clients-tree", response_model=List[ClientTree])
async def get_clients_tree(db: Session = Depends(get_db)):
    """
    Получить полное дерево клиентов с иерархией отделов
    """
    try:
        # Используем CRUD для построения дерева
        tree_data = crud.department.get_department_tree(db)

        # Преобразуем в формат, ожидаемый схемой ClientTree
        result = []
        for client_node in tree_data:
            client = client_node['client']

            # Функция для преобразования дерева отделов
            def build_department_tree(departments_data):
                departments = []
                for dept_node in departments_data:
                    dept = dept_node['department']
                    department_tree = DepartmentTree(
                        id=dept.id,
                        name=dept.name,
                        client_id=dept.client_id,
                        parent_id=dept.parent_id,
                        description=dept.description,
                        created_at=dept.created_at,
                        children=build_department_tree(dept_node['children'])
                    )
                    departments.append(department_tree)
                return departments

            # Создаем ClientTree объект
            client_tree = ClientTree(
                id=client.id,
                name=client.name,
                description=client.description,
                created_at=client.created_at,
                departments=build_department_tree(client_node['departments'])
            )
            result.append(client_tree)

        return result

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка при построении дерева: {str(e)}"
        )

@router.get("/departments/{department_id}/agents", response_model=List[AgentWithDepartment])
async def get_agents_by_department(
    department_id: int,
    include_children: bool = True,
    db: Session = Depends(get_db)
):
    """
    Получить агентов отдела
    - department_id: ID отдела
    - include_children: включить агентов из подотделов (по умолчанию True)
    """
    # Проверяем существование отдела
    department = crud.department.get_department(db, department_id)
    if not department:
        raise HTTPException(status_code=404, detail="Отдел не найден")

    # Получаем агентов (рекурсивно, если нужно)
    agents = crud.department.get_agents_by_department_recursive(
        db, department_id, include_children
    )

    return agents

@router.get("/clients/{client_id}/agents", response_model=List[AgentWithDepartment])
async def get_agents_by_client(
    client_id: int,
    db: Session = Depends(get_db)
):
    """
    Получить всех агентов клиента (из всех отделов)
    """
    # Получаем все отделы клиента
    departments = crud.department.get_departments_by_client(db, client_id)
    department_ids = [dept.id for dept in departments]

    if not department_ids:
        return []

    # Получаем всех агентов для этих отделов
    from app.crud.agent import get_agents
    all_agents = []

    for dept_id in department_ids:
        agents = crud.department.get_agents_by_department_recursive(db, dept_id, True)
        all_agents.extend(agents)

    # Удаляем дубликаты (если агент в нескольких отделах)
    unique_agents = []
    seen_ids = set()
    for agent in all_agents:
        if agent.id not in seen_ids:
            seen_ids.add(agent.id)
            unique_agents.append(agent)

    return unique_agents

@router.get("/statistics")
async def get_tree_statistics(db: Session = Depends(get_db)):
    """
    Получить статистику по дереву
    """
    from app.crud.client import get_clients
    from app.crud.agent import get_agents_statistics

    clients = get_clients(db)
    agent_stats = get_agents_statistics(db)

    # Считаем отделы по клиентам
    clients_with_dept_count = []
    for client in clients:
        dept_count = len(crud.department.get_departments_by_client(db, client.id))
        clients_with_dept_count.append({
            'id': client.id,
            'name': client.name,
            'department_count': dept_count
        })

    return {
        'total_clients': len(clients),
        'total_departments': db.query(crud.department.models.Department).count(),
        'clients': clients_with_dept_count,
        'agent_statistics': agent_stats
    }