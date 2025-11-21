# Power Line Maintenance System

This project is designed to help with power line maintenance by analyzing images to detect potential issues like damaged insulators, vibration dampers, and other critical components.

## Features

- Image upload and management
- Session-based organization
- Image gallery with pagination
- AI-powered object detection for maintenance issues
- Confidence-based filtering of results
- Real-time analysis status

## Project Structure

- `client/` - React frontend application
- `server/` - Node.js backend server
- `ai_model/` - Python AI inference service with YOLOv8

## Setup Instructions

### Backend Server
1. Navigate to the server directory: `cd server`
2. Install dependencies: `npm install`
3. Start the server: `npm start`

### AI Model Service
1. Navigate to the AI model directory: `cd ai_model`
2. Install Python dependencies (see [INSTALLATION.md](ai_model/INSTALLATION.md) for detailed instructions)
3. Start the AI service: `python ai_service.py`

### Frontend Client
1. Navigate to the client directory: `cd client`
2. Install dependencies: `npm install`
3. Start the development server: `npm start`

## AI Model Integration

The system includes a YOLOv8-based AI service that:
- Processes uploaded images in the background
- Detects power line components and potential issues
- Filters results by confidence (40%+ threshold)
- Stores results in session-specific JSON files
- Provides real-time status updates to the frontend

## Usage

1. Upload images through the web interface
2. View images immediately in the gallery
3. Monitor analysis progress
4. View AI-detected objects with bounding boxes
5. Access detailed information about detected issues

## Dependencies

- Node.js (for backend server)
- Python 3.8+ (for AI service)
- React (for frontend)
- YOLOv8 (for object detection)
- FastAPI (for AI service API)
- OpenCV (for image processing)
## Docker Setup

The application can be run using Docker Compose. See [DOCKER_SETUP.md](DOCKER_SETUP.md) for detailed instructions.

To run with Docker:
1. Ensure you have `yolov8s.pt` in the `ai_model/` directory
2. Run `docker-compose up --build`
3. Access the application at http://localhost
