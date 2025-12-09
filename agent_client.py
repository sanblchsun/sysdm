# agent_client.py - пример клиента для агентов
import requests
import time
import socket
import platform
import psutil

class SysDMAgent:
    def __init__(self, server_url, agent_id):
        self.server_url = server_url
        self.agent_id = agent_id
        self.hostname = socket.gethostname()

    def collect_system_info(self):
        """Собрать информацию о системе"""
        return {
            "agent_id": self.agent_id,
            "hostname": self.hostname,
            "local_ip": socket.gethostbyname(self.hostname),
            "operating_system": platform.platform(),
            "platform": platform.system().lower(),
            "cpu_cores": psutil.cpu_count(),
            "total_ram": int(psutil.virtual_memory().total / 1024 / 1024),  # MB
            "agent_version": "1.0.0",
            "is_online": True
        }

    def register(self):
        """Зарегистрировать агента на сервере"""
        data = self.collect_system_info()
        try:
            resp = requests.post(
                f"{self.server_url}/api/v1/agents/register",
                json=data,
                timeout=5
            )
            if resp.status_code in [200, 201]:
                print(f"✅ Агент зарегистрирован: {resp.json()}")
                return True
            else:
                print(f"❌ Ошибка регистрации: {resp.status_code} - {resp.text}")
                return False
        except Exception as e:
            print(f"❌ Ошибка соединения: {e}")
            return False

    def send_heartbeat(self):
        """Отправить heartbeat"""
        try:
            resp = requests.post(
                f"{self.server_url}/api/v1/agents/{self.agent_id}/heartbeat",
                timeout=5
            )
            if resp.status_code == 200:
                print(f"✅ Heartbeat отправлен: {resp.json().get('last_seen')}")
                return True
            else:
                print(f"❌ Ошибка heartbeat: {resp.status_code}")
                return False
        except Exception as e:
            print(f"❌ Ошибка соединения: {e}")
            return False

    def run(self, interval_seconds=60):
        """Запустить агента"""
        print(f"🚀 Запуск агента {self.agent_id}...")

        # Регистрация
        if not self.register():
            return

        # Бесконечный цикл heartbeat
        while True:
            time.sleep(interval_seconds)
            self.send_heartbeat()

# Использование:
if __name__ == "__main__":
    agent = SysDMAgent("http://localhost:8000", "my-agent-001")
    agent.run()