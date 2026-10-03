# Use official Python image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Copy and install dependencies first
COPY requirements.txt ./
RUN pip install -r requirements.txt

# Copy the rest of the backend code
COPY . .

# Expose FastAPI port
EXPOSE 8000

# Start the FastAPI server
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]