from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.database import get_session
from app.models import Company, Department
from app.api.v1.schemas.tree import CompanyOut

router = APIRouter(prefix="/tree", tags=["Tree"])


@router.get("", response_model=list[CompanyOut])
async def get_tree(db: AsyncSession = Depends(get_session)):
    # Асинхронно грузим все компании с отделами и агентами
    result = await db.execute(
        select(Company)
        .filter(Company.is_active == True)
        .options(selectinload(Company.departments).selectinload(Department.agents))
    )
    companies = result.scalars().unique().all()
    return companies
