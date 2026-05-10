import asyncio
import os
import shutil
import subprocess
import sys
import urllib.request
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models import AgentBuild

INSTALL_CMD = PROJECT_ROOT / "builder_cpp" / "install.cmd"
DIST_DIR = PROJECT_ROOT / "dist"
AGENTS_DIR = DIST_DIR / "agents"
FFMPEG = DIST_DIR / "ffmpeg.exe"
BUILD_DIR = PROJECT_ROOT / "build" / "setup_tmp"
OUTPUT = DIST_DIR / "sysdm_setup.exe"

SFX_DIR = PROJECT_ROOT / "builder_cpp" / "sfx"
SFX_WIN = SFX_DIR / "7z.sfx"

SFX_DOWNLOAD_URL = "https://www.7-zip.org/a/7z2301.exe"
SFX_EXTRACT_NAME = "7z.sfx"


def get_latest_build_slug() -> str | None:
    agents = sorted(
        [f for f in os.listdir(AGENTS_DIR) if f.startswith("agent_universal_")],
        reverse=True,
    )
    if not agents:
        return None
    name = agents[0]
    return name.replace("agent_universal_", "").replace(".exe", "")


async def get_active_build_slug() -> str | None:
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(AgentBuild).where(AgentBuild.is_active.is_(True))
        )
        build = result.scalar()
        if build:
            return build.build_slug
    return get_latest_build_slug()


def ensure_sfx():
    if SFX_WIN.exists():
        return
    SFX_DIR.mkdir(parents=True, exist_ok=True)
    installer_exe = SFX_DIR / "7z2301.exe"
    print(f"[+] Downloading 7-Zip for Windows (SFX module)...")
    urllib.request.urlretrieve(SFX_DOWNLOAD_URL, installer_exe)
    print(f"[+] Extracting {SFX_EXTRACT_NAME}...")
    subprocess.run(
        ["7z", "e", str(installer_exe), f"-o{SFX_DIR}", SFX_EXTRACT_NAME, "-y"],
        check=True, capture_output=True,
    )
    installer_exe.unlink()
    if SFX_WIN.exists():
        print(f"[+] {SFX_EXTRACT_NAME} ready ({SFX_WIN.stat().st_size} bytes)")
    else:
        print(f"[!] {SFX_EXTRACT_NAME} not found in 7z installer, aborting")
        sys.exit(1)


def build_setup(build_slug: str):
    agent_exe = AGENTS_DIR / f"agent_universal_{build_slug}.exe"
    if not agent_exe.exists():
        print(f"[!] Agent exe not found: {agent_exe}")
        sys.exit(1)
    if not FFMPEG.exists():
        print(f"[!] ffmpeg.exe not found: {FFMPEG}")
        sys.exit(1)

    BUILD_DIR.mkdir(parents=True, exist_ok=True)
    BUILD_DIR_EXTRACT = BUILD_DIR / "extract"
    BUILD_DIR_EXTRACT.mkdir(parents=True, exist_ok=True)

    print(f"[+] Building sysdm_setup.exe (agent v{build_slug})")
    print(f"[i] Agent: {agent_exe.name} ({agent_exe.stat().st_size // 1024} KB)")
    print(f"[i] ffmpeg: {FFMPEG.name} ({FFMPEG.stat().st_size // 1024} KB)")

    rename_agent = BUILD_DIR_EXTRACT / "agent.exe"
    shutil.copy2(agent_exe, rename_agent)
    shutil.copy2(FFMPEG, BUILD_DIR_EXTRACT / "ffmpeg.exe")
    shutil.copy2(INSTALL_CMD, BUILD_DIR_EXTRACT / "install.cmd")

    archive_7z = BUILD_DIR / "sysdm_setup.7z"
    subprocess.run(
        ["7z", "a", "-mx=7", "-ms=on", str(archive_7z), "."],
        cwd=str(BUILD_DIR_EXTRACT), check=True, capture_output=True,
    )
    print(f"[+] Archive created: {archive_7z} ({archive_7z.stat().st_size // 1024} KB)")

    config = b";!@Install@!UTF-8!\r\nTitle=\"sysdm Agent Setup\"\r\nRunProgram=\"install.cmd\"\r\n;!@InstallEnd@!\r\n"

    with open(OUTPUT, "wb") as f:
        f.write(SFX_WIN.read_bytes())
        f.write(config)
        f.write(archive_7z.read_bytes())

    os.chmod(OUTPUT, 0o755)

    if OUTPUT.exists():
        size_kb = OUTPUT.stat().st_size // 1024
        print(f"[+] Setup created: {OUTPUT} ({size_kb} KB)")
    else:
        print(f"[!] Output not found: {OUTPUT}")
        sys.exit(1)


async def main():
    build_slug = await get_active_build_slug()
    if not build_slug:
        print("[!] No active build found")
        sys.exit(1)
    ensure_sfx()
    build_setup(build_slug)


if __name__ == "__main__":
    asyncio.run(main())
