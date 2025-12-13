# app/api/v1/__init__.py
from .auth_router import router as auth_router
from .agents_router import router as agents_router
from .tree_router import router as tree_router  # Добавляем новый роутер

__all__ = [
    'auth_router',
    'agents_router',
    'tree_router'  # Экспортируем новый роутер
]