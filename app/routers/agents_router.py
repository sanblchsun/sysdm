from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app import crud, schemas
from app.database import SessionLocal
from fastapi.templating import Jinja2Templates

templates = Jinja2Templates(directory="app/templates")

router = APIRouter(
    tags=["agents"]
)

@router.get("/")
def agents_page():
    return {"message": "agents list"}

@router.get("/{agent_id}")
def get_agent(agent_id: int):
    return {"agent_id": agent_id}

#
# def get_db():
#     db = SessionLocal()
#     try:
#         yield db
#     finally:
#         db.close()
#
# @router.post("/register", response_model=schemas.AgentOut)
# def register_agent(agent: schemas.AgentCreate, db: Session = Depends(get_db)):
#     existing = crud.get_agent_by_uuid(db, agent.agent_uuid)
#     if existing:
#         existing.inventory = __import__("json").dumps(agent.inventory or {})
#         existing.is_online = True
#         db.add(existing)
#         db.commit()
#         db.refresh(existing)
#         return existing
#     return crud.create_agent(db, agent)
#
# @router.get("/", response_model=List[schemas.AgentOut])
# def list_agents(db: Session = Depends(get_db)):
#     return crud.list_agents(db)
#
# @router.get("/{agent_id}", response_model=schemas.AgentOut)
# def agent_detail(agent_id: int, db: Session = Depends(get_db)):
#     a = crud.get_agent(db, agent_id)
#     if not a:
#         raise HTTPException(status_code=404, detail="Agent not found")
#     import json
#     a.inventory = json.loads(a.inventory) if a.inventory else {}
#     return a
