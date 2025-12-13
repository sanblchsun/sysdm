# create_clients_departments_agents.py
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.models.client import Client
from app.models.department import Department
from app.models.agent import Agent
from datetime import datetime, timedelta
import random

def create_test_clients_departments_agents():
    db = SessionLocal()

    try:
        # Проверяем, есть ли уже клиенты
        existing_clients = db.query(Client).count()
        if existing_clients > 0:
            print(f"⚠️ В базе уже есть {existing_clients} клиентов")
            response = input("Продолжить и добавить еще? (y/n): ")
            if response.lower() != 'y':
                print("❌ Отменено")
                return

        # 1. Создаем клиентов (компании)
        clients = []
        client_names = ["Company 1", "Company 2", "Company 3", "Company 4", "Company 5", "Company 6"]

        for client_name in client_names:
            # Проверяем, не существует ли уже клиент с таким именем
            existing_client = db.query(Client).filter(Client.name == client_name).first()
            if existing_client:
                print(f"⚠️ Клиент '{client_name}' уже существует")
                clients.append(existing_client)
            else:
                client = Client(
                    name=client_name,
                    description=f"Тестовая компания {client_name}"
                )
                db.add(client)
                clients.append(client)

        db.commit()  # Сохраняем клиентов, чтобы получить ID

        print("✅ Клиенты созданы")

        # 2. Создаем отделы для клиентов
        departments = []

        # Для Company 5 создаем несколько отделов (как в вашей схеме)
        company5 = next((c for c in clients if c.name == "Company 5"), None)

        if company5:
            dept_names = ["HQ5", "LA Office 5", "NY Office 5"]
            for dept_name in dept_names:
                # Проверяем, не существует ли уже отдел
                existing_dept = db.query(Department).filter(
                    Department.name == dept_name,
                    Department.client_id == company5.id
                ).first()

                if existing_dept:
                    print(f"⚠️ Отдел '{dept_name}' для Company 5 уже существует")
                    departments.append(existing_dept)
                else:
                    department = Department(
                        name=dept_name,
                        client_id=company5.id,
                        description=f"Отдел {dept_name} компании Company 5"
                    )
                    db.add(department)
                    departments.append(department)

        # Для остальных компаний по 1-2 отдела
        for client in clients:
            if client.name != "Company 5":
                for j in range(1, 3):  # 2 отдела на компанию
                    dept_name = f"Office {j}"

                    # Проверяем, не существует ли уже отдел
                    existing_dept = db.query(Department).filter(
                        Department.name == dept_name,
                        Department.client_id == client.id
                    ).first()

                    if existing_dept:
                        print(f"⚠️ Отдел '{dept_name}' для {client.name} уже существует")
                        departments.append(existing_dept)
                    else:
                        department = Department(
                            name=dept_name,
                            client_id=client.id,
                            description=f"Офис {j} компании {client.name}"
                        )
                        db.add(department)
                        departments.append(department)

        db.commit()  # Сохраняем отделы
        print("✅ Отделы созданы")

        # 3. Создаем тестовых агентов (если их мало)
        existing_agents = db.query(Agent).count()
        if existing_agents < 10:  # Если агентов меньше 10, создаем еще
            platforms = ["windows", "linux", "macos"]
            os_versions = {
                "windows": ["Windows 10", "Windows 11", "Windows Server 2019"],
                "linux": ["Ubuntu 22.04", "CentOS 7", "Debian 11"],
                "macos": ["macOS Ventura", "macOS Monterey"]
            }

            for i in range(1, 21):  # 20 агентов
                platform = random.choice(platforms)
                os_version = random.choice(os_versions[platform])

                # Случайно назначаем агента отделу (если есть отделы)
                department = random.choice(departments) if departments else None

                agent_id = f"AGENT-TEST-{i:03d}"

                # Проверяем, не существует ли уже агент
                existing_agent = db.query(Agent).filter(Agent.agent_id == agent_id).first()
                if existing_agent:
                    print(f"⚠️ Агент {agent_id} уже существует")
                    continue

                agent = Agent(
                    agent_id=agent_id,
                    hostname=f"test-host-{i}.local",
                    local_ip=f"10.0.1.{i}",
                    public_ip=f"8.8.8.{i % 255}",
                    mac_address=f"00:1A:2B:3C:4D:{i:02X}",
                    operating_system=os_version,
                    platform=platform,
                    architecture="x86_64",
                    cpu_model="Intel Core i7",
                    cpu_cores=random.randint(2, 8),
                    total_ram=random.randint(4096, 32768),
                    disk_space={"total": 500, "used": random.randint(100, 400)},
                    is_online=random.choice([True, False]),
                    agent_version="1.0.0",
                    site_id=f"SITE-{random.randint(1, 5)}",
                    description=f"Тестовый агент {i}",
                    department_id=department.id if department else None,
                    last_seen=datetime.utcnow() - timedelta(minutes=random.randint(0, 60))
                )
                db.add(agent)

            db.commit()
            print("✅ Агенты созданы")
        else:
            print(f"⚠️ Агентов достаточно: {existing_agents} шт.")

        # 4. Выводим статистику
        print("\n📊 ИТОГОВАЯ СТАТИСТИКА:")
        print(f"👥 Клиентов: {db.query(Client).count()}")
        print(f"🏢 Отделов: {db.query(Department).count()}")
        print(f"🖥️ Агентов: {db.query(Agent).count()}")

        # Показываем структуру Company 5
        company5 = db.query(Client).filter(Client.name == "Company 5").first()
        if company5:
            print(f"\n🏢 Структура Company 5:")
            depts = db.query(Department).filter(Department.client_id == company5.id).all()
            for dept in depts:
                agent_count = db.query(Agent).filter(Agent.department_id == dept.id).count()
                print(f"  ├── {dept.name} ({agent_count} агентов)")

    except Exception as e:
        db.rollback()
        print(f"❌ Ошибка: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    create_test_clients_departments_agents()