FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1


WORKDIR /app

COPY requirements.txt .

RUN pip install --upgrade pip && pip install -r requirements.txt

COPY . .

CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "event_management.asgi:application"]



# FROM python:3.11-slim

# # Set environment variables
# ENV PYTHONDONTWRITEBYTECODE 1
# ENV PYTHONUNBUFFERED 1

# # Set work directory
# WORKDIR /app

# # Install dependencies
# COPY requirements.txt /app/
# RUN pip install --upgrade pip
# RUN pip install -r requirements.txt

# # Copy project
# COPY . /app/

# RUN python manage.py collectstatic --noinput

# # Expose port (for Daphne)
# EXPOSE 8000

# # Start Daphne server (ASGI server for Django Channels)
# CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "event_management.asgi:application"]
