FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    netcat-openbsd \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --upgrade pip && pip install --no-cache-dir -r requirements.txt

# Copy project
COPY . .

# Create directories for static and media files
RUN mkdir -p /app/staticfiles /app/media

# Expose port
EXPOSE 8000

# Default command (can be overridden in docker-compose)
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
