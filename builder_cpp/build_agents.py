import asyncio
import os
import subprocess
import hashlib
import sys
import platform
import shutil
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from sqlalchemy import select, desc, update
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import settings
from app.models import AgentBuild
from app.database import Base

# Используем DB_HOST_SCRIPT для локального запуска скриптов
engine = create_async_engine(
    settings.DATABASE_URL_SCRIPT,
    echo=settings.DEBUG,
)

AsyncSessionLocal = async_sessionmaker(
    engine, expire_on_commit=False, class_=AsyncSession
)

CPP_AGENT_DIR = PROJECT_ROOT / "builder_cpp" / "agent"
DIST_DIR = PROJECT_ROOT / "dist" / "agents"
DIST_DIR.mkdir(parents=True, exist_ok=True)

FFMPEG_SOURCE = PROJECT_ROOT / "dist" / "ffmpeg.exe"

CPP_ENTRYPOINT = CPP_AGENT_DIR / "cmd" / "agent" / "main.cpp"
CPP_RDP_AGENT = CPP_AGENT_DIR / "cmd" / "agent" / "rdp_agent.cpp"

CURRENT_OS = platform.system()
if CURRENT_OS == "Windows":
    GXX = "C:/msys64/ucrt64/bin/g++.exe"
else:
    GXX = "x86_64-w64-mingw32-g++"


def increment_build_slug(last_slug: str | None) -> str:
    if not last_slug:
        return "1.0.0"
    parts = last_slug.split(".")
    if len(parts) != 3:
        return "1.0.0"
    major, minor, patch = map(int, parts)
    return f"{major}.{minor}.{patch + 1}"


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()


def build_exe(build_slug: str, server_url: str) -> Path:
    output_exe = DIST_DIR / f"agent_universal_{build_slug}.exe"
    DIST_DIR.mkdir(parents=True, exist_ok=True)

    print(f"[+] Building {output_exe.name}")
    print(f"[i] Compiler: {GXX}  Platform: {CURRENT_OS}")

    cmd = [
        GXX,
        "-std=c++17",
        "-O2",
        "-o",
        str(output_exe),
        f'-DSERVER_URL="{server_url}"',
        f'-DBUILD_SLUG="{build_slug}"',
        str(CPP_ENTRYPOINT),
        str(CPP_RDP_AGENT),
        "-lwinhttp",
        "-lws2_32",
        "-ladvapi32",
        "-luser32",
        "-lsecur32",
        "-lcrypt32",
        "-lwtsapi32",
        "-luserenv",
        "-static",
    ]

    if output_exe.exists():
        try:
            output_exe.unlink()
        except PermissionError:
            print("[!] Cannot delete existing file, trying to build anyway")

    print(f"[+] Running: {' '.join(cmd)}")
    if CURRENT_OS == "Windows":
        subprocess.run(" ".join(cmd), shell=True, check=True, cwd=str(CPP_AGENT_DIR))
    else:
        subprocess.run(cmd, check=True, cwd=str(CPP_AGENT_DIR))

    return output_exe


async def activate_build(session: AsyncSession, build_id: int):
    await session.execute(
        update(AgentBuild).where(AgentBuild.is_active.is_(True)).values(is_active=False)
    )
    await session.execute(
        update(AgentBuild).where(AgentBuild.id == build_id).values(is_active=True)
    )
    await session.commit()


async def build_agent() -> None:
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(AgentBuild).order_by(desc(AgentBuild.id)))
        last_build = result.scalars().first()
        last_slug = last_build.build_slug if last_build else None

        new_build_slug = increment_build_slug(last_slug)
        print(f"[i] New build slug: {new_build_slug}")

        server_url = str(settings.APP_HOST)
        exe_path = build_exe(new_build_slug, server_url)

        sha256 = sha256_file(exe_path)
        print(f"[i] SHA256: {sha256}")

        build = AgentBuild(build_slug=new_build_slug, sha256=sha256, is_active=False)
        session.add(build)
        await session.flush()

        await activate_build(session, build.id)
        print(f"[+] Universal agent built: {exe_path.name}")


if __name__ == "__main__":
    asyncio.run(build_agent())
