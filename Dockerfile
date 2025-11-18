FROM python:3.13.4-slim

# Устанавливаем зависимости для psycopg2
RUN apt update && apt install -y \
    gcc \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Копируем requirements.txt
COPY ./app/requirements.txt /app/requirements.txt

# Устанавливаем зависимости
RUN pip install --no-cache-dir -r /app/requirements.txt

# Копируем всё приложение
COPY ./app /app

EXPOSE 8000

# Команда запуска приложения
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
