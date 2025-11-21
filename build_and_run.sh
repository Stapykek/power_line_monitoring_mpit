#!/bin/bash

# Build and run the Power Line Maintenance System using Docker Compose

echo "🚀 Power Line Maintenance System - Docker Setup"

# Check if Docker is installed
if ! [ -x "$(command -v docker)" ]; then
  echo "❌ Docker is not installed. Please install Docker first."
  exit 1
fi

# Check if Docker Compose is installed
if ! [ -x "$(command -v docker-compose)" ]; then
  echo "❌ Docker Compose is not installed. Please install Docker Compose first."
  exit 1
fi

# Check if the yolov8s.pt model file exists
if [ ! -f "ai_model/yolov8s.pt" ]; then
 echo "❌ yolov8s.pt model file not found in ai_model/ directory"
  echo "Please place the yolov8s.pt file in the ai_model/ directory before continuing"
  exit 1
fi

echo "✅ All prerequisites checked successfully"

# Build and start the services
echo "🔨 Building Docker images..."
docker-compose build

if [ $? -eq 0 ]; then
  echo "✅ Docker images built successfully"
  
  echo "🚀 Starting services..."
  docker-compose up -d
  
  if [ $? -eq 0 ]; then
    echo "✅ Services started successfully"
    echo ""
    echo "📋 Services are now running:"
    echo "   - Frontend: http://localhost"
    echo "   - Backend API: http://localhost:5000"
    echo "   - AI Service: http://localhost:5001"
    echo ""
    echo "💡 To view logs: docker-compose logs -f"
    echo "💡 To stop services: docker-compose down"
  else
    echo "❌ Failed to start services"
    exit 1
  fi
else
  echo "❌ Failed to build Docker images"
  exit 1
fi