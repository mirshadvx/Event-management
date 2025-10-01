FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1


WORKDIR /app

COPY requirements.txt .

RUN pip install --upgrade pip && pip install -r requirements.txt

COPY . .

# CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "event_management.asgi:application"]
CMD ["sh", "-c", "python manage.py migrate --noinput && daphne -b 0.0.0.0 -p $${PORT:-8000} event_management.asgi:application"]