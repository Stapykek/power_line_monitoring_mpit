# AI Model Microservice Architecture

## Overview
This document outlines the architecture for the AI model microservice that will process power line maintenance images using YOLOv8s model.

## System Components

### 1. Python AI Service
- **Language**: Python 3.8+
- **Framework**: FastAPI (for HTTP endpoints)
- **Model**: YOLOv8s loaded from `ai_model/yolov8s.pt`
- **Dependencies**: 
  - ultralytics
  - opencv-python
  - numpy
  - fastapi
  - uvicorn

### 2. Image Processing Pipeline
- Accepts image files via HTTP POST requests
- Runs inference using YOLOv8s model
- Filters results by confidence threshold (40%+)
- Extracts bounding boxes and class information
- Saves results to JSON format

### 3. Results Storage Format
```json
{
  "image_mapping": {
    "original_filename": "server_filename"
  },
  "detections": {
    "server_filename": [
      {
        "class": "object_class",
        "confidence": 0.85,
        "bbox": [x1, y1, x2, y2],
        "criticality": 3
      }
    ]
  }
}
```

### 4. API Endpoints
- `POST /analyze` - Submit images for analysis
- `GET /results/{session_id}` - Get analysis results for a session
- `GET /status/{session_id}` - Get processing status for a session

### 5. Background Processing
- Queue-based system to handle large batches
- Progress tracking for long-running tasks
- First page results available immediately

## Integration with Existing System

### Node.js Server Integration
The existing Node.js server will:
1. Receive image uploads
2. Save images to session directories
3. Trigger the Python AI service for processing
4. Provide API endpoints for frontend to access results

### Frontend Integration
The AnalyzePage will:
1. Initially show images without AI results
2. Poll for results as they become available
3. Display first page immediately while processing continues in background

## Implementation Plan

### Phase 1: Core AI Service
- Set up Python environment
- Load YOLOv8s model
- Implement basic inference functionality

### Phase 2: API Integration
- Create FastAPI endpoints
- Implement JSON result storage
- Add confidence threshold filtering

### Phase 3: Background Processing
- Implement queue system
- Add progress tracking
- Optimize for large batch processing

### Phase 4: Frontend Integration
- Update AnalyzePage to consume new API
- Add polling for results
- Implement background processing indicators

## File Structure
```
ai_model/
├── yolov8s.pt                 # Pre-trained model
├── ai_service.py              # Python AI service
├── inference.py               # Core inference logic
└── requirements.txt          # Python dependencies

server/
├── ai_service_client.js      # Node.js client for AI service
└── routes/ai.js              # AI-related API routes
```

## Security Considerations
- Validate image file types
- Limit file sizes
- Implement rate limiting
- Secure API endpoints

## Performance Considerations
- GPU acceleration if available
- Batch processing for efficiency
- Memory management for large datasets
- Caching for repeated requests