# app/crud/client.py
from sqlalchemy.orm import Session
from typing import Optional, List
from app.models import client as models
from app.schemas import client as schemas

def get_client(db: Session, client_id: int) -> Optional[models.Client]:
    return db.query(models.Client).filter(models.Client.id == client_id).first()

def get_client_by_name(db: Session, name: str) -> Optional[models.Client]:
    return db.query(models.Client).filter(models.Client.name == name).first()

def get_clients(db: Session, skip: int = 0, limit: int = 100) -> List[models.Client]:
    return db.query(models.Client).offset(skip).limit(limit).all()

def create_client(db: Session, client: schemas.ClientCreate) -> models.Client:
    db_client = models.Client(**client.model_dump())
    db.add(db_client)
    db.commit()
    db.refresh(db_client)
    return db_client

def update_client(db: Session, client_id: int, client_update: schemas.ClientCreate) -> Optional[models.Client]:
    db_client = get_client(db, client_id)
    if db_client:
        for key, value in client_update.model_dump().items():
            setattr(db_client, key, value)
        db.commit()
        db.refresh(db_client)
    return db_client

def delete_client(db: Session, client_id: int) -> bool:
    db_client = get_client(db, client_id)
    if db_client:
        db.delete(db_client)
        db.commit()
        return True
    return False