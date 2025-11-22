from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Dict, Any
import os
import json
import cv2
import numpy as np
from PIL import Image
import uuid
from pathlib import Path
import asyncio
from concurrent.futures import ThreadPoolExecutor
import time

from inference import YOLOInference
from segmentation import create_segmentation_masks

app = FastAPI(title="Power Line Maintenance AI Service", version="1.0.0")

# Initialize the YOLO inference class
MODEL_PATH = "ai_model\\best.pt"
print(Path(MODEL_PATH))
inference = YOLOInference(MODEL_PATH, confidence_threshold=0.4)


# Configuration
SESSIONS_DIR = "../server/sessions"

# Store processing status
processing_status = {}
segmentation_status = {}

class DetectionResult(BaseModel):
    class_name: str
    confidence: float
    bbox: List[float]  # [x1, y1, x2, y2]

class ImageAnalysisResult(BaseModel):
    original_filename: str
    server_filename: str
    detections: List[DetectionResult]

class SessionAnalysisResponse(BaseModel):
    session_id: str
    total_images: int
    processed_images: int
    results: List[ImageAnalysisResult]

@app.post("/analyze/{session_id}")
async def analyze_session(session_id: str, background_tasks: BackgroundTasks):
    """
    Analyze all images in a session directory using YOLOv8
    """
    print(Path(SESSIONS_DIR))
    session_path = Path(SESSIONS_DIR) / session_id

    if not session_path.exists():
        raise HTTPException(status_code=404, detail=f"Session {session_id} not found")
    
    # Get all image files in the session
    image_files = []
    for ext in [".jpg", ".jpeg", ".png", ".tiff", ".raw"]:
        image_files.extend(session_path.glob(f"*{ext}"))
        image_files.extend(session_path.glob(f"*{ext.upper()}"))
    
    if not image_files:
        raise HTTPException(status_code=40, detail="No image files found in session")
    
    # Initialize processing status
    processing_status[session_id] = {
        "total": len(image_files),
        "processed": 0,
        "start_time": time.time(),
        "status": "processing"
    }
    
    # Process images in background
    background_tasks.add_task(process_images_background, session_id, image_files)
    
    return JSONResponse(
        content={
            "session_id": session_id,
            "total_images": len(image_files),
            "message": f"Started processing {len(image_files)} images"
        }
    )

@app.post("/segment/{session_id}")
async def segment_session(session_id: str, background_tasks: BackgroundTasks):
    """
    Create segmentation masks for detected defects in a session
    """
    session_path = Path(SESSIONS_DIR) / session_id
    results_path = session_path / "results.json"
    
    if not results_path.exists():
        raise HTTPException(status_code=404, detail="Detection results not found. Run analysis first.")
    
    # Initialize segmentation status
    segmentation_status[session_id] = {
        "status": "processing",
        "start_time": time.time()
    }
    
    # Process segmentation in background
    background_tasks.add_task(process_segmentation_background, session_id, str(session_path), str(results_path))
    
    return JSONResponse(
        content={
            "session_id": session_id,
            "message": "Started segmentation processing"
        }
    )

def process_segmentation_background(session_id: str, session_path: str, results_path: str):
    """
    Process segmentation in the background
    """
    try:
        # Initialize segmentation status if it doesn't exist
        if session_id not in segmentation_status:
            segmentation_status[session_id] = {
                "status": "processing",
                "start_time": time.time()
            }
        
        # Create segmentation masks
        result = create_segmentation_masks(
            session_id=session_id,
            session_path=session_path,
            results_path=results_path
        )
        
        # Update segmentation status
        segmentation_status[session_id].update({
            "status": "completed",
            "end_time": time.time(),
            "processed_images": result["processed_images"],
            "total_defects_masked": result["total_defects_masked"],
            "masks_directory": result["masks_directory"]
        })
        
        print(f"✅ Segmentation completed for session {session_id}")
    except Exception as e:
        print(f"❌ Error during segmentation for session {session_id}: {str(e)}")
        # Initialize the status if it doesn't exist before accessing it
        if session_id not in segmentation_status:
            segmentation_status[session_id] = {}
        segmentation_status[session_id]["status"] = "error"
        segmentation_status[session_id]["error"] = str(e)

@app.get("/segmentation-status/{session_id}")
async def get_segmentation_status(session_id: str):
    """
    Get segmentation processing status for a session
    """
    if session_id in segmentation_status:
        return JSONResponse(content=segmentation_status[session_id])
    else:
        session_path = Path(SESSIONS_DIR) / session_id
        masks_path = session_path / "masks"
        if masks_path.exists():
            return JSONResponse(content={"status": "completed"})
        else:
            raise HTTPException(status_code=404, detail="Segmentation not found for this session")

def process_images_background(session_id: str, image_files: List[Path]):
    """
    Process images in the background and save results to JSON
    """
    session_path = Path(SESSIONS_DIR) / session_id
    results_path = session_path / "results.json"
    
    # Initialize results structure
    results = {
        "image_mapping": {},
        "detections": {},
        "processing_info": {
            "session_id": session_id,
            "total_images": len(image_files),
            "start_time": processing_status[session_id]["start_time"],
            "status": "processing"
        }
    }
    
    # Process each image
    for idx, image_path in enumerate(image_files):
        try:
            # Process the image
            detections = process_single_image(str(image_path))
            
            # Map original filename to server filename
            # For now, we're using the same filename, but in a real scenario
            # this would be mapped based on the upload process
            original_filename = image_path.name
            server_filename = image_path.name  # This would be the actual server filename
            
            results["image_mapping"][original_filename] = server_filename
            results["detections"][server_filename] = detections
            
            # Update processing status
            processing_status[session_id]["processed"] = idx + 1
            
        except Exception as e:
            print(f"Error processing {image_path}: {str(e)}")
            continue
    
    # Update final status
    processing_status[session_id]["status"] = "completed"
    processing_status[session_id]["end_time"] = time.time()
    results["processing_info"]["status"] = "completed"
    results["processing_info"]["end_time"] = time.time()
    
    # Save results to JSON file
    with open(results_path, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    # Automatically trigger segmentation after detection is complete
    try:
        from threading import Thread
        def run_segmentation():
            import time
            # Add a small delay to ensure the results file is fully written
            time.sleep(1)
            # Initialize segmentation status for this session when running automatically
            if session_id not in segmentation_status:
                segmentation_status[session_id] = {
                    "status": "processing",
                    "start_time": time.time()
                }
            process_segmentation_background(session_id, str(session_path), str(results_path))
        
        thread = Thread(target=run_segmentation)
        thread.start()
    except Exception as e:
        print(f"Error starting segmentation after detection: {str(e)}")

def process_single_image(image_path: str) -> List[Dict[str, Any]]:
    """
    Process a single image and return detection results
    """
    # Use the inference module to process the image
    detections = inference.process_image(image_path)
    
    # Transform the results to the expected format
    formatted_detections = []
    for detection in detections:
        formatted_detections.append({
            "class": detection["class"],
            "confidence": detection["confidence"],
            "bbox": detection["bbox"]
        })
    
    return formatted_detections

@app.get("/results/{session_id}")
async def get_results(session_id: str):
    """
    Get analysis results for a session
    """
    session_path = Path(SESSIONS_DIR) / session_id
    results_path = session_path / "results.json"
    
    if not results_path.exists():
        raise HTTPException(status_code=404, detail="Results not found for this session")
    
    with open(results_path, 'r', encoding='utf-8') as f:
        results = json.load(f)
    
    return JSONResponse(content=results)

@app.get("/status/{session_id}")
async def get_status(session_id: str):
    """
    Get processing status for a session
    """
    if session_id in processing_status:
        return JSONResponse(content=processing_status[session_id])
    else:
        session_path = Path(SESSIONS_DIR) / session_id
        results_path = session_path / "results.json"
        if results_path.exists():
            return JSONResponse(content={"status": "completed", "processed": "unknown", "total": "unknown"})
        else:
            raise HTTPException(status_code=404, detail="Session not found")

@app.get("/health")
async def health_check():
    """
    Health check endpoint
    """
    return {"status": "healthy", "model_loaded": True}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5001)