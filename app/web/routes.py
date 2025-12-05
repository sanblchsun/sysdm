# app/web/routes.py
from fastapi import APIRouter, Request, Depends
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse, RedirectResponse
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional

from app.database import get_db
from app.crud.agent import crud_agent
from app.models.agent import Agent

router = APIRouter(tags=["web"])
templates = Jinja2Templates(directory="app/templates")

# Фильтр для Jinja2 - форматирование времени
def time_ago(value: Optional[datetime]) -> str:
    """Простой фильтр времени"""
    if not value:
        return "Никогда"

    try:
        # Просто выводим в читаемом формате
        if isinstance(value, datetime):
            return value.strftime("%Y-%m-%d %H:%M")
        return str(value)
    except:
        return str(value)

# Добавляем фильтр в шаблоны
templates.env.filters["time_ago"] = time_ago

@router.get("/dashboard", response_class=HTMLResponse)
async def web_dashboard(request: Request, db: Session = Depends(get_db)):
    """Главная страница дашборда"""

    # Получаем агентов
    agents = crud_agent.get_agents(db, limit=50)

    # Статистика
    total_agents = len(agents)
    online_agents = len([a for a in agents if a.is_online])
    offline_agents = total_agents - online_agents

    # Статистика по платформам
    platform_stats = {}
    for agent in agents:
        platform = agent.platform or "unknown"
        platform_stats[platform] = platform_stats.get(platform, 0) + 1

    # Последние события (симулируем)
    recent_events = [
        {
            "type": "success",
            "message": "Система запущена",
            "timestamp": datetime.utcnow() - timedelta(minutes=5)
        }
    ]

    # Добавляем событие если есть агенты
    if agents:
        recent_events.append({
            "type": "info",
            "message": f"Зарегистрирован агент: {agents[0].hostname}",
            "timestamp": datetime.utcnow() - timedelta(minutes=30)
        })

    return templates.TemplateResponse("dashboard.html", {
        "request": request,
        "agents": agents,
        "stats": {
            "total_agents": total_agents,
            "online_agents": online_agents,
            "offline_agents": offline_agents,
            "warnings": offline_agents
        },
        "platform_stats": platform_stats,
        "platform_labels": list(platform_stats.keys()),
        "platform_data": list(platform_stats.values()),
        "recent_events": recent_events,
        "online_count": online_agents,
        "offline_count": offline_agents,
        "version": "1.0.0",
        "current_time": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    })

@router.get("/agents", response_class=HTMLResponse)
async def web_agents(request: Request, db: Session = Depends(get_db)):
    """Страница со списком всех агентов"""
    agents = crud_agent.get_agents(db)

    return templates.TemplateResponse("agents/list.html", {
        "request": request,
        "agents": agents,
        "title": "Все агенты"
    })

@router.get("/agents/{agent_id}", response_class=HTMLResponse)
async def web_agent_detail(request: Request, agent_id: str, db: Session = Depends(get_db)):
    """Детальная страница агента"""
    agent = crud_agent.get_agent(db, agent_id)
    if not agent:
        return RedirectResponse("/agents")

    return templates.TemplateResponse("agents/detail.html", {
        "request": request,
        "agent": agent,
        "title": f"Агент: {agent.hostname}"
    })

@router.get("/tasks", response_class=HTMLResponse)
async def web_tasks(request: Request):
    """Страница задач"""
    return templates.TemplateResponse("tasks/list.html", {
        "request": request,
        "title": "Задачи"
    })

@router.get("/scripts", response_class=HTMLResponse)
async def web_scripts(request: Request):
    """Страница скриптов"""
    return templates.TemplateResponse("scripts/list.html", {
        "request": request,
        "title": "Скрипты"
    })

@router.get("/settings", response_class=HTMLResponse)
async def web_settings(request: Request):
    """Страница настроек"""
    return templates.TemplateResponse("settings/index.html", {
        "request": request,
        "title": "Настройки"
    })