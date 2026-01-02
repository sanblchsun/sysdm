from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.database import get_session
from app.models.company import Company
from app.models.department import Department
from app.api.v1.schemas.tree import CompanyOut

router = APIRouter(prefix="/tree", tags=["Tree"])


@router.get("", response_model=List[CompanyOut])
async def get_tree(db: AsyncSession = Depends(get_session)):
    # загружаем все активные компании с отделами и агентами
    result = await db.execute(
        select(Company)
        .filter(Company.is_active == True)
        .options(selectinload(Company.departments).selectinload(Department.agents))
    )
    companies = result.scalars().unique().all()
    return companies
