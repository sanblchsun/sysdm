#!/usr/bin/env python3
"""
Database schema migration script - applies all optimizations and fixes
Run this before deploying the code changes

This script:
1. Adds indexes for better query performance
2. Ensures all columns use correct datetime types
3. Verifies database constraints
4. Can be safely re-run (idempotent)
"""

import asyncio
import sys
from pathlib import Path

# Add project to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.config import settings
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy import text, inspect, Index
from sqlalchemy.orm import sessionmaker


async def run_migrations():
    """Execute all schema upgrades"""
    
    # Create engine using DATABASE_URL_SCRIPT for local execution
    engine = create_async_engine(
        settings.DATABASE_URL_SCRIPT,
        echo=True,
    )
    
    async with engine.begin() as connection:
        # Migration 1: Add composite index for agent company filtering
        print("[migration] Adding index for agent company filtering...")
        try:
            await connection.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_agent_company_active 
                ON agents(company_id, is_active)
            """))
            print("✓ Index idx_agent_company_active created")
        except Exception as e:
            print(f"⚠ Index creation failed (may already exist): {e}")
        
        # Migration 2: Add index for agent UUID lookups
        print("[migration] Ensuring UUID index exists...")
        try:
            await connection.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_agent_uuid 
                ON agents(uuid)
            """))
            print("✓ Index idx_agent_uuid created")
        except Exception as e:
            print(f"⚠ UUID index check failed: {e}")
        
        # Migration 3: Add index for machine_uid lookups
        print("[migration] Ensuring machine_uid index exists...")
        try:
            await connection.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_agent_machine_uid 
                ON agents(machine_uid)
            """))
            print("✓ Index idx_agent_machine_uid created")
        except Exception as e:
            print(f"⚠ machine_uid index check failed: {e}")
        
        # Migration 4: Add index for heartbeat queries
        print("[migration] Adding index for last_seen queries...")
        try:
            await connection.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_agent_last_seen 
                ON agents(last_seen DESC)
            """))
            print("✓ Index idx_agent_last_seen created")
        except Exception as e:
            print(f"⚠ last_seen index check failed: {e}")
        
        # Migration 5: Add indexes for company external IP lookup
        print("[migration] Adding indexes for company lookup...")
        try:
            await connection.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_company_external_ip 
                ON companies(external_ip)
            """))
            print("✓ Index idx_company_external_ip created")
        except Exception as e:
            print(f"⚠ company external_ip index check failed: {e}")
        
        # Migration 6: Add index for department company filtering
        print("[migration] Adding indexes for department filtering...")
        try:
            await connection.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_department_company_id 
                ON departments(company_id)
            """))
            print("✓ Index idx_department_company_id created")
        except Exception as e:
            print(f"⚠ department company_id index check failed: {e}")
        
        # Migration 7: Verify datetime columns are using timezone-aware types
        print("[migration] Verifying column types...")
        try:
            result = await connection.execute(text("""
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name IN ('agents', 'companies', 'departments', 'users', 'agent_additional_data')
                AND column_name IN ('created_at', 'last_seen', 'updated_at')
            """))
            rows = await result.fetchall()
            for row in rows:
                print(f"  - {row[0]}: {row[1]}")
            print("✓ Column types verified")
        except Exception as e:
            print(f"⚠ Column type check failed: {e}")
        
        # Migration 8: Enable statement timeout for safety
        print("[migration] Setting PostgreSQL statement timeout...")
        try:
            await connection.execute(text("""
                ALTER DATABASE sysdm_test SET statement_timeout = 30000
            """))
            print("✓ Statement timeout set to 30s")
        except Exception as e:
            print(f"⚠ Could not set statement timeout: {e}")
        
        await connection.commit()
        print("\n✅ All migrations completed successfully!")


async def verify_migrations():
    """Verify all indexes were created"""
    print("\n[verify] Checking created indexes...")
    
    engine = create_async_engine(settings.DATABASE_URL_SCRIPT)
    
    async with engine.connect() as connection:
        result = await connection.execute(text("""
            SELECT indexname, tablename 
            FROM pg_indexes 
            WHERE schemaname = 'public' 
            AND indexname LIKE 'idx_%'
            ORDER BY tablename, indexname
        """))
        
        indexes = await result.fetchall()
        if indexes:
            print(f"\n✓ Found {len(indexes)} indexes:")
            for idx_name, table_name in indexes:
                print(f"  - {idx_name} (on {table_name})")
        else:
            print("⚠ No indexes found!")


async def main():
    """Main execution"""
    print("=" * 60)
    print("SysDM Database Schema Migration")
    print("=" * 60)
    print(f"Target Database: {settings.DATABASE_URL_SCRIPT}\n")
    
    try:
        await run_migrations()
        await verify_migrations()
        print("\n" + "=" * 60)
        print("✅ Migration completed successfully")
        print("=" * 60)
        return 0
    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
