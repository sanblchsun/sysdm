# test_register.py
"""Примеры использования:
1. Простая регистрация:
bash
python test_register.py
2. Регистрация с указанием группы:
bash
python test_register.py --site "office-moscow" --department "IT Department"
3. Регистрация на другом сервере:
bash
python test_register.py --url "http://192.168.1.100:8000"
4. Регистрация с heartbeat и проверкой статуса:
bash
python test_register.py --heartbeat --status
5. Только проверка подключения:
bash
python test_register.py --test-only
6. Регистрация с описанием:
bash
python test_register.py --description "Рабочая станция бухгалтера""""
import requests
import json
import socket
import platform
import psutil
import uuid
import sys
from datetime import datetime


class SysDMAgent:
    """Клиент для регистрации агента в SysDM"""

    def __init__(self, base_url="http://localhost:8000"):
        self.base_url = base_url
        self.agent_id = None

    def get_system_info(self):
        """Собираем информацию о системе"""
        system_info = {
            "hostname": socket.gethostname(),
            "local_ip": self.get_local_ip(),
            "operating_system": f"{platform.system()} {platform.release()}",
            "platform": platform.system().lower(),
            "architecture": platform.machine(),
        }

        try:
            # Информация о CPU
            cpu_info = platform.processor()
            if not cpu_info or cpu_info == "":
                cpu_info = "Unknown"

            system_info["cpu_model"] = cpu_info
            system_info["cpu_cores"] = psutil.cpu_count(logical=True)

            # Информация о RAM
            ram = psutil.virtual_memory()
            system_info["total_ram"] = ram.total // (1024 * 1024)  # MB

            # Информация о дисках
            disk_info = {}
            for partition in psutil.disk_partitions():
                try:
                    usage = psutil.disk_usage(partition.mountpoint)
                    disk_info[partition.device] = {
                        "mountpoint": partition.mountpoint,
                        "fstype": partition.fstype,
                        "total": usage.total,
                        "used": usage.used,
                        "free": usage.free,
                        "percent": usage.percent
                    }
                except (PermissionError, FileNotFoundError):
                    continue

            system_info["disk_space"] = disk_info

            # Сетевая информация
            system_info["mac_address"] = self.get_mac_address()
            system_info["public_ip"] = self.get_public_ip()

        except Exception as e:
            print(f"⚠️  Не удалось собрать полную информацию о системе: {e}")
            # Устанавливаем значения по умолчанию
            system_info.update({
                "cpu_model": "Unknown",
                "cpu_cores": 1,
                "total_ram": 1024,
                "disk_space": {},
                "mac_address": None,
                "public_ip": None
            })

        return system_info

    def get_local_ip(self):
        """Получаем локальный IP адрес"""
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.settimeout(0.1)
            s.connect(('8.8.8.8', 80))
            ip = s.getsockname()[0]
            s.close()
            return ip
        except Exception:
            # Возвращаем локальный IP
            try:
                return socket.gethostbyname(socket.gethostname())
            except:
                return "127.0.0.1"

    def get_mac_address(self):
        """Получаем MAC адрес"""
        try:
            for interface, addrs in psutil.net_if_addrs().items():
                if interface not in ['lo', 'Loopback']:
                    for addr in addrs:
                        if addr.family == psutil.AF_LINK:
                            return addr.address
        except Exception:
            pass
        return None

    def get_public_ip(self):
        """Получаем публичный IP (опционально)"""
        try:
            response = requests.get('https://api.ipify.org?format=json', timeout=3)
            if response.status_code == 200:
                return response.json()['ip']
        except Exception:
            pass
        return None

    def generate_agent_id(self):
        """Генерируем уникальный ID агента"""
        hostname = socket.gethostname().lower().replace(' ', '-').replace('.', '-')
        unique_id = str(uuid.uuid4())[:8]  # Берем первые 8 символов UUID
        return f"{hostname}-{unique_id}"

    def register(self, site_id=None, department=None, description=None):
        """Регистрация агента в SysDM"""

        # Генерируем ID агента
        self.agent_id = self.generate_agent_id()

        # Собираем информацию о системе
        system_info = self.get_system_info()

        # Формируем данные для отправки
        agent_data = {
            "agent_id": self.agent_id,
            "hostname": system_info["hostname"],
            "local_ip": system_info["local_ip"],
            "operating_system": system_info["operating_system"],
            "platform": system_info["platform"],
            "architecture": system_info["architecture"],
            "cpu_model": system_info["cpu_model"],
            "cpu_cores": system_info["cpu_cores"],
            "total_ram": system_info["total_ram"],
            "disk_space": system_info["disk_space"],
            "mac_address": system_info["mac_address"],
            "public_ip": system_info["public_ip"],
            "site_id": site_id,
            "department": department,
            "description": description or f"Автоматическая регистрация {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
        }

        print("=" * 60)
        print("📡 РЕГИСТРАЦИЯ АГЕНТА В SysDM")
        print("=" * 60)
        print(f"🆔 Agent ID: {self.agent_id}")
        print(f"🖥️  Hostname: {system_info['hostname']}")
        print(f"📍 Local IP: {system_info['local_ip']}")
        print(f"💻 OS: {system_info['operating_system']}")
        print(f"⚙️  Platform: {system_info['platform']}")
        print(f"🧠 CPU: {system_info['cpu_model']} ({system_info['cpu_cores']} cores)")
        print(f"💾 RAM: {system_info['total_ram']} MB")
        print("=" * 60)

        try:
            # Отправляем запрос на регистрацию
            response = requests.post(
                f"{self.base_url}/api/v1/agents/register",
                json=agent_data,
                timeout=30,
                headers={"Content-Type": "application/json", "User-Agent": "SysDM-Agent/1.0"}
            )

            print(f"📤 Отправка данных на {self.base_url}...")

            if response.status_code == 201:
                result = response.json()
                print("✅ Агент успешно зарегистрирован!")
                print(f"📋 ID в базе: {result.get('id')}")
                print(f"🔗 Просмотр: {self.base_url}/api/v1/agents/{self.agent_id}")
                return result
            else:
                print(f"❌ Ошибка регистрации: {response.status_code}")
                print(f"Сообщение: {response.text}")
                return None

        except requests.exceptions.ConnectionError:
            print("❌ Не удалось подключиться к серверу SysDM")
            print(f"   Проверьте, что сервер запущен на {self.base_url}")
            return None
        except requests.exceptions.Timeout:
            print("❌ Таймаут подключения к серверу")
            return None
        except Exception as e:
            print(f"❌ Неизвестная ошибка: {str(e)}")
            return None

    def send_heartbeat(self):
        """Отправка heartbeat сигнала"""
        if not self.agent_id:
            print("⚠️  Агент не зарегистрирован. Сначала вызовите register()")
            return False

        try:
            response = requests.put(
                f"{self.base_url}/api/v1/agents/{self.agent_id}/heartbeat",
                timeout=10
            )

            if response.status_code == 200:
                print(f"❤️  Heartbeat отправлен для агента {self.agent_id}")
                return True
            elif response.status_code == 404:
                print(f"⚠️  Агент {self.agent_id} не найден на сервере")
                return False
            else:
                print(f"❌ Ошибка heartbeat: {response.status_code}")
                return False

        except Exception as e:
            print(f"❌ Ошибка отправки heartbeat: {str(e)}")
            return False

    def check_status(self):
        """Проверка статуса агента"""
        if not self.agent_id:
            print("⚠️  Агент не зарегистрирован")
            return None

        try:
            response = requests.get(
                f"{self.base_url}/api/v1/agents/{self.agent_id}/status",
                timeout=10
            )

            if response.status_code == 200:
                status = response.json()
                print("📊 Статус агента:")
                print(f"   Online: {'✅' if status['is_online'] else '❌'}")
                print(f"   Last Seen: {status['last_seen']}")
                return status
            else:
                print(f"❌ Ошибка получения статуса: {response.status_code}")
                return None

        except Exception as e:
            print(f"❌ Ошибка проверки статуса: {str(e)}")
            return None


def test_api_connection(base_url):
    """Тестирование подключения к API"""
    print("\n🔍 Проверка подключения к SysDM API...")
    try:
        # Проверка health endpoint
        health_response = requests.get(f"{base_url}/health", timeout=5)
        if health_response.status_code == 200:
            health_data = health_response.json()
            print(f"✅ Сервер доступен: {health_data.get('service')} v{health_data.get('version')}")
            return True
        else:
            print(f"❌ Сервер вернул ошибку: {health_response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print(f"❌ Не удалось подключиться к {base_url}")
        return False
    except Exception as e:
        print(f"❌ Ошибка подключения: {str(e)}")
        return False


def main():
    """Основная функция"""
    import argparse

    parser = argparse.ArgumentParser(description='Регистрация агента в SysDM')
    parser.add_argument('--url', default='http://localhost:8000',
                       help='URL сервера SysDM (по умолчанию: http://localhost:8000)')
    parser.add_argument('--site', help='ID сайта/группы')
    parser.add_argument('--department', help='Отдел/подразделение')
    parser.add_argument('--description', help='Описание агента')
    parser.add_argument('--heartbeat', action='store_true',
                       help='Отправить heartbeat после регистрации')
    parser.add_argument('--status', action='store_true',
                       help='Проверить статус после регистрации')
    parser.add_argument('--test-only', action='store_true',
                       help='Только проверить подключение к API')

    args = parser.parse_args()

    # Создаем клиент
    agent = SysDMAgent(base_url=args.url)

    # Тестируем подключение
    if not test_api_connection(args.url):
        sys.exit(1)

    if args.test_only:
        print("\n✅ Тест подключения завершен успешно")
        return

    # Регистрируем агента
    result = agent.register(
        site_id=args.site,
        department=args.department,
        description=args.description
    )

    if not result:
        sys.exit(1)

    # Дополнительные действия
    if args.heartbeat:
        print("\n🫀 Отправка heartbeat...")
        agent.send_heartbeat()

    if args.status:
        print("\n📊 Проверка статуса...")
        agent.check_status()

    print("\n" + "=" * 60)
    print("✅ Регистрация завершена!")
    print(f"🔗 API эндпоинты:")
    print(f"   - Информация об агенте: {args.url}/api/v1/agents/{agent.agent_id}")
    print(f"   - Список агентов: {args.url}/api/v1/agents/")
    print(f"   - Документация API: {args.url}/docs")
    print("=" * 60)


if __name__ == "__main__":
    main()