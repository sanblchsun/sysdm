from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from app.models import department as models
from app.models import client as client_models
from app.schemas import department as schemas

def get_department(db: Session, department_id: int) -> Optional[models.Department]:
    """Получить отдел по ID"""
    return db.query(models.Department).filter(models.Department.id == department_id).first()

def get_departments(db: Session, skip: int = 0, limit: int = 100) -> List[models.Department]:
    """Получить список всех отделов"""
    return db.query(models.Department).offset(skip).limit(limit).all()

def get_departments_by_client(db: Session, client_id: int) -> List[models.Department]:
    """Получить все отделы клиента"""
    return db.query(models.Department).filter(models.Department.client_id == client_id).all()

def create_department(db: Session, department: schemas.DepartmentCreate) -> models.Department:
    """Создать новый отдел"""
    db_department = models.Department(**department.model_dump())
    db.add(db_department)
    db.commit()
    db.refresh(db_department)
    return db_department

def update_department(
    db: Session,
    department_id: int,
    department_update: schemas.DepartmentCreate
) -> Optional[models.Department]:
    """Обновить отдел"""
    db_department = get_department(db, department_id)
    if db_department:
        for key, value in department_update.model_dump().items():
            setattr(db_department, key, value)
        db.commit()
        db.refresh(db_department)
    return db_department

def delete_department(db: Session, department_id: int) -> bool:
    """Удалить отдел"""
    db_department = get_department(db, department_id)
    if db_department:
        db.delete(db_department)
        db.commit()
        return True
    return False

def get_department_tree(db: Session) -> List[Dict[str, Any]]:
    """
    Получить полное дерево клиентов с отделами
    Возвращает: [
        {
            'client': Client,
            'departments': [
                {
                    'department': Department,
                    'children': [...]  # рекурсивно
                }
            ]
        }
    ]
    """
    # Получаем всех клиентов
    clients = db.query(client_models.Client).all()
    result = []

    for client in clients:
        # Для каждого клиента получаем корневые отделы (без parent_id)
        root_departments = db.query(models.Department).filter(
            models.Department.client_id == client.id,
            models.Department.parent_id.is_(None)
        ).all()

        client_data = {
            'client': client,
            'departments': []
        }

        # Рекурсивно строим дерево отделов
        def build_department_tree(dept_id: Optional[int] = None):
            query = db.query(models.Department).filter(
                models.Department.client_id == client.id,
                models.Department.parent_id == dept_id
            ).all()

            departments = []
            for dept in query:
                department_data = {
                    'department': dept,
                    'children': build_department_tree(dept.id)
                }
                departments.append(department_data)

            return departments

        client_data['departments'] = build_department_tree(None)
        result.append(client_data)

    return result

def get_agents_by_department_recursive(
    db: Session,
    department_id: int,
    include_children: bool = True
) -> List[Any]:
    """
    Получить всех агентов отдела (включая подотделы, если нужно)
    """
    from app.models.agent import Agent

    department_ids = [department_id]

    if include_children:
        # Рекурсивно получаем все дочерние отделы
        def get_child_departments(parent_id: int):
            children = db.query(models.Department).filter(
                models.Department.parent_id == parent_id
            ).all()

            for child in children:
                department_ids.append(child.id)
                get_child_departments(child.id)

        get_child_departments(department_id)

    # Получаем всех агентов для найденных отделов
    return db.query(Agent).filter(Agent.department_id.in_(department_ids)).all()