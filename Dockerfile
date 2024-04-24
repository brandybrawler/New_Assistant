# Use an official Python runtime as a base image
FROM python:3.9-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set the working directory in the container
WORKDIR /code

# Install system dependencies for Python
RUN apt-get update && apt-get install -y \
    gcc \
    musl-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt /code/
RUN pip install --upgrade pip \
    && pip install -r requirements.txt

# Copy the rest of the Python application code
COPY . /code/


# Run the application
CMD ["gunicorn", "--worker-class", "uvicorn.workers.UvicornWorker", "voice_assistant.asgi:application", "--bind", "0.0.0.0:8000"]
