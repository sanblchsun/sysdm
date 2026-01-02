from fastapi import APIRouter
from .tree import router as tree_router
from .agents import router as agents_router


api_router = APIRouter()
api_router.include_router(tree_router)
api_router.include_router(agents_router)
