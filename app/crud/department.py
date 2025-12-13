# app/crud/department.py
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import Optional, List, Dict, Any
from app.models import department as models
from app.models import client as client_models
from app.schemas import department as schemas
from app.schemas import client as client_schemas

def get_department(db: Session, department_id: int) -> Optional[models.Department]:
    """Получить отдел по ID"""
    return db.query(models.Department).filter(models.Department.id == department_id).first()

def get_department_by_name(db: Session, name: str, client_id: Optional[int] = None) -> Optional[models.Department]:
    """Получить отдел по имени (опционально с фильтром по клиенту)"""
    query = db.query(models.Department).filter(models.Department.name == name)
    if client_id:
        query = query.filter(models.Department.client_id == client_id)
    return query.first()

def get_departments(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    client_id: Optional[int] = None,
    parent_id: Optional[int] = None,
    only_root: bool = False
) -> List[models.Department]:
    """Получить список отделов с фильтрацией"""
    query = db.query(models.Department)

    if client_id is not None:
        query = query.filter(models.Department.client_id == client_id)

    if parent_id is not None:
        query = query.filter(models.Department.parent_id == parent_id)
    elif only_root:
        query = query.filter(models.Department.parent_id.is_(None))

    return query.offset(skip).limit(limit).all()

def get_department_tree(db: Session, client_id: Optional[int] = None) -> List[Dict[str, Any]]:
    """Получить иерархическое дерево отделов"""
    if client_id:
        departments = db.query(models.Department).filter(
            models.Department.client_id == client_id
        ).all()
    else:
        departments = db.query(models.Department).all()

    # Строим дерево
    dept_map = {}
    root_departments = []

    # Создаем словарь всех отделов
    for dept in departments:
        dept_map[dept.id] = {
            'id': dept.id,
            'name': dept.name,
            'client_id': dept.client_id,
            'parent_id': dept.parent_id,
            'description': dept.description,
            'created_at': dept.created_at,
            'children': [],
            'agent_count': len(dept.agents) if dept.agents else 0
        }

    # Связываем детей с родителями
    for dept in departments:
        if dept.parent_id and dept.parent_id in dept_map:
            dept_map[dept.parent_id]['children'].append(dept_map[dept.id])

    # Находим корневые отделы (без родителя)
    for dept in departments:
        if not dept.parent_id:
            root_departments.append(dept_map[dept.id])

    return root_departments

def create_department(db: Session, department: schemas.DepartmentCreate) -> models.Department:
    """Создать новый отдел"""

    # Проверяем существование клиента
    client = db.query(client_models.Client).filter(
        client_models.Client.id == department.client_id
    ).first()

    if not client:
        raise ValueError(f"Client with id {department.client_id} does not exist")

    # Проверяем уникальность имени в пределах клиента
    existing = get_department_by_name(db, department.name, department.client_id)
    if existing:
        raise ValueError(f"Department with name '{department.name}' already exists for this client")

    # Проверяем существование родительского отдела (если указан)
    if department.parent_id:
        parent = get_department(db, department.parent_id)
        if not parent:
            raise ValueError(f"Parent department with id {department.parent_id} does not exist")
        if parent.client_id != department.client_id:
            raise ValueError("Parent department must belong to the same client")

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
    if not db_department:
        return None

    # Проверяем уникальность нового имени
    if department_update.name != db_department.name:
        existing = get_department_by_name(db, department_update.name, department_update.client_id)
        if existing and existing.id != department_id:
            raise ValueError(f"Department with name '{department_update.name}' already exists for this client")

    # Проверяем, чтобы не создавалась циклическая ссылка
    if department_update.parent_id == department_id:
        raise ValueError("Department cannot be its own parent")

    # Проверяем существование родительского отдела
    if department_update.parent_id:
        parent = get_department(db, department_update.parent_id)
        if not parent:
            raise ValueError(f"Parent department with id {department_update.parent_id} does not exist")
        if parent.client_id != department_update.client_id:
            raise ValueError("Parent department must belong to the same client")

    update_data = department_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_department, field, value)

    db.commit()
    db.refresh(db_department)
    return db_department

def delete_department(db: Session, department_id: int) -> bool:
    """Удалить отдел"""
    db_department = get_department(db, department_id)
    if not db_department:
        return False

    # Проверяем, есть ли дочерние отделы
    children = get_departments(db, parent_id=department_id)
    if children:
        raise ValueError("Cannot delete department with child departments")

    # Проверяем, есть ли агенты в этом отделе
    if db_department.agents:
        raise ValueError("Cannot delete department with assigned agents")

    db.delete(db_department)
    db.commit()
    return True

def get_departments_with_agent_count(db: Session, client_id: Optional[int] = None) -> List[Dict[str, Any]]:
    """Получить отделы с количеством агентов"""
    query = db.query(
        models.Department,
        db.func.count(models.Department.agents).label('agent_count')
    ).outerjoin(models.Department.agents).group_by(models.Department.id)

    if client_id:
        query = query.filter(models.Department.client_id == client_id)

    results = query.all()

    return [
        {
            'id': dept.id,
            'name': dept.name,
            'client_id': dept.client_id,
            'parent_id': dept.parent_id,
            'description': dept.description,
            'created_at': dept.created_at,
            'agent_count': agent_count
        }
        for dept, agent_count in results
    ]