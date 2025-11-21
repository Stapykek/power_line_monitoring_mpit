# Docker Setup for Power Line Maintenance System

This document provides instructions for setting up and running the Power Line Maintenance System using Docker and docker-compose.

## Prerequisites

- Docker Engine (version 20.10 or higher)
- Docker Compose (version 2.0 or higher)

## Setup Instructions

### 1. Prepare the YOLOv8 Model

Before building the Docker images, ensure you have the YOLOv8 model file:

1. Place the `yolov8s.pt` model file in the `ai_model/` directory
2. The file should be located at `ai_model/yolov8s.pt`

### 2. Build and Run with Docker Compose

Navigate to the project root directory and run:

```bash
docker-compose up --build
```

This will:
- Build all three services (client, server, ai-service)
- Start the containers
- Set up networking between services

### 3. Alternative: Run in Detached Mode

To run the services in the background:

```bash
docker-compose up --build -d
```

### 4. Access the Application

Once the containers are running:

- **Frontend**: http://localhost
- **Backend API**: http://localhost:5000
- **AI Service**: http://localhost:5001

## Docker Compose Services

The application consists of three services:

### client
- React frontend application
- Serves the user interface
- Proxies API requests to the server

### server
- Node.js backend server
- Handles file uploads and session management
- Coordinates with AI service for image analysis
- Exposes API endpoints for the frontend

### ai_service
- Python FastAPI service
- Runs YOLOv8 inference on uploaded images
- Processes images in background
- Stores results in JSON format

## Persistent Data

The following data is persisted using Docker volumes:
- Session data: stored in the `sessions` volume
- Uploaded files: stored in the `uploads` volume

## Useful Docker Commands

### View logs
```bash
docker-compose logs -f
```

### Stop services
```bash
docker-compose down
```

### Stop and remove containers, networks, and volumes
```bash
docker-compose down -v
```

### Rebuild a specific service
```bash
docker-compose build server
docker-compose up -d server
```

## Troubleshooting

### If you encounter Python package installation issues:
1. Check the ai_model/INSTALLATION.md file for detailed Python dependency installation instructions
2. Make sure you have the yolov8s.pt model file in the ai_model directory

### If the application fails to start:
1. Check that all required files are in place
2. Verify that ports 80 and 5000 are available
3. Review the container logs using `docker-compose logs`

## Development Notes

When developing with Docker:
- Changes to source code will require rebuilding the images
- For faster development cycles, consider mounting source directories as volumes
- The services are designed to work together, so all three containers should be running

## Production Considerations

For production deployment:
- Consider using environment variables for configuration
- Implement proper logging and monitoring
- Set up SSL certificates for HTTPS
- Configure proper authentication and authorization
- Implement backup strategies for persistent data