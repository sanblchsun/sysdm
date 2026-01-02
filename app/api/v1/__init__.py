from fastapi import APIRouter
from .tree import router as tree_router

api_router = APIRouter()
api_router.include_router(tree_router)
