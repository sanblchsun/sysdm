import asyncio
import os
import subprocess
import hashlib
import sys
import platform
import shutil
from pathlib import Path
import urllib.request
import tarfile

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
VENDOR_DIR = PROJECT_ROOT / "builder_cpp" / "vendor"
VENDOR_DIR.mkdir(parents=True, exist_ok=True)

FFMPEG_SOURCE = PROJECT_ROOT / "dist" / "ffmpeg.exe"

CPP_ENTRYPOINT = CPP_AGENT_DIR / "cmd" / "agent" / "main.cpp"
CPP_RDP_AGENT = CPP_AGENT_DIR / "cmd" / "agent" / "rdp_agent.cpp"

CURRENT_OS = platform.system()
if CURRENT_OS == "Windows":
    GXX = "C:/msys64/ucrt64/bin/g++.exe"
else:
    GXX = "x86_64-w64-mingw32-g++"

# Redis C++ library (hiredis)
HIREDIS_VERSION = "1.2.0"
HIREDIS_DIR = VENDOR_DIR / f"hiredis-{HIREDIS_VERSION}"
HIREDIS_LIB = HIREDIS_DIR / "hiredis.a"


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


def ensure_hiredis():
    """Download and compile hiredis if not already compiled"""
    if HIREDIS_LIB.exists():
        print(f"[i] hiredis already compiled: {HIREDIS_LIB}")
        return HIREDIS_LIB

    print(f"[+] Preparing hiredis v{HIREDIS_VERSION}")

    # Download hiredis
    if not HIREDIS_DIR.exists():
        url = f"https://github.com/redis/hiredis/archive/v{HIREDIS_VERSION}.tar.gz"
        tar_path = VENDOR_DIR / f"hiredis-{HIREDIS_VERSION}.tar.gz"
        print(f"[+] Downloading hiredis from {url}")
        try:
            urllib.request.urlretrieve(url, str(tar_path))
            with tarfile.open(tar_path, "r:gz") as tar:
                tar.extractall(str(VENDOR_DIR))
            tar_path.unlink()
            print(f"[+] Extracted hiredis to {HIREDIS_DIR}")
        except Exception as e:
            print(f"[!] Failed to download hiredis: {e}")
            return None

    # Compile hiredis manually without strict error flags
    print(f"[+] Compiling hiredis with x86_64-w64-mingw32-gcc (C compiler)")
    
    gcc_path = GXX.replace("g++", "gcc")  # Convert to gcc path
    ar_path = "x86_64-w64-mingw32-ar"
    
    # Compile individual hiredis source files (Windows compatibility added in net.c)
    src_files = ["alloc.c", "net.c", "hiredis.c", "read.c", "sds.c"]
    obj_files = []
    
    try:
        for src in src_files:
            src_path = HIREDIS_DIR / src
            obj_path = HIREDIS_DIR / src.replace(".c", ".o")
            
            if obj_path.exists():
                print(f"[i] {src} already compiled")
                obj_files.append(obj_path)
                continue
            
            # Compile with minimal flags to avoid -Werror issues
            compile_cmd = [
                gcc_path,
                "-std=c99",
                "-O2",
                "-fPIC",
                "-c",
                str(src_path),
                "-o", str(obj_path),
            ]
            
            print(f"[+] Compiling {src}...")
            subprocess.run(compile_cmd, check=True, cwd=str(HIREDIS_DIR))
            obj_files.append(obj_path)
        
        # Create static library
        ar_cmd = [ar_path, "rcs", str(HIREDIS_LIB)] + [str(o) for o in obj_files]
        print(f"[+] Creating static library with {ar_path}...")
        subprocess.run(ar_cmd, check=True, cwd=str(HIREDIS_DIR))
        
        if HIREDIS_LIB.exists():
            print(f"[+] hiredis compiled successfully: {HIREDIS_LIB}")
            return HIREDIS_LIB
        else:
            print(f"[!] hiredis.a not created")
            return None
            
    except Exception as e:
        print(f"[!] Failed to compile hiredis: {e}")
        return None


def build_exe(build_slug: str, server_url: str) -> Path:
    output_exe = DIST_DIR / f"agent_universal_{build_slug}.exe"
    DIST_DIR.mkdir(parents=True, exist_ok=True)

    print(f"[+] Building {output_exe.name}")
    print(f"[i] Compiler: {GXX}  Platform: {CURRENT_OS}")

    # Ensure hiredis is available
    hiredis_lib = ensure_hiredis()

    cmd = [
        GXX,
        "-std=c++17",
        "-O2",
        "-o",
        str(output_exe),
        f'-DSERVER_URL="{server_url}"',
        f'-DBUILD_SLUG="{build_slug}"',
        f'-I{HIREDIS_DIR}',  # Include hiredis headers
        str(CPP_ENTRYPOINT),
        str(CPP_RDP_AGENT),
    ]

    # Add hiredis library if compiled successfully
    if hiredis_lib and hiredis_lib.exists():
        cmd.insert(2, "-DHAVE_REDIS")  # Define HAVE_REDIS for conditional compilation
        cmd.append(f'-L{hiredis_lib.parent}')  # Library path
        # Use -l:filename instead of -l prefix because hiredis.a doesn't follow libXXX.a convention
        cmd.append("-l:hiredis.a")
        print(f"[i] Linking against hiredis: {hiredis_lib}")
        print(f"[i] Redis Pub/Sub support ENABLED")
    else:
        print(f"[!] WARNING: hiredis not available, Redis Pub/Sub support DISABLED")
        print(f"[i] Will use HTTP polling fallback for commands (30s interval)")

    # Standard Windows libs
    cmd.extend([
        "-lwinhttp",
        "-lws2_32",
        "-ladvapi32",
        "-luser32",
        "-lsecur32",
        "-lcrypt32",
        "-lwtsapi32",
        "-luserenv",
        "-lnetapi32",
        "-liphlpapi",
        "-static",
    ])

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
