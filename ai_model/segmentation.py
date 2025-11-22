import os
import json
from pathlib import Path
import cv2
import numpy as np
from PIL import Image
from ultralytics import YOLO
from segment_anything import sam_model_registry, SamPredictor
from typing import List, Dict, Any
import time


def create_segmentation_masks(
    session_id: str,
    session_path: str,
    results_path: str,
    sam_checkpoint: str = "ai_model/sam_vit_b_01ec64.pth",
    target_classes: set = {5, 6, 7},  # Default to classes 5 and 6 as in the original seg_file.py
    device: str = "cpu"
) -> Dict[str, Any]:
    """
    Create segmentation masks for detected defects in a session.
    
    Args:
        session_id: The session ID
        session_path: Path to the session directory
        results_path: Path to the results.json file
        sam_checkpoint: Path to SAM model checkpoint
        target_classes: Set of class IDs to segment
        device: Device to run SAM on ("cpu" or "cuda")
    
    Returns:
        Dictionary with processing results
    """
    session_path = Path(session_path)
    masks_path = session_path / "masks"
    masks_path.mkdir(parents=True, exist_ok=True)
    
    # Load detection results
    with open(results_path, 'r', encoding='utf-8') as f:
        results = json.load(f)
    
    # Determine target classes based on class names if needed
    # For now, we'll assume that bad_insulator and nest are the target classes
    # We need to map class names to the appropriate class IDs
    # Based on the project, let's assume bad_insulator might be class 5 and nest might be class 6
    # But we'll also check by class name in case the IDs are different
    target_class_names = {"bad_insulator", "damaged_insulator", "nest"}  # Add any other defect classes
    
    # Load SAM model
    print("🔁 Загружаем SAM...")
    sam = sam_model_registry["vit_b"](checkpoint=sam_checkpoint)
    sam.to(device=device)
    sam_predictor = SamPredictor(sam)
    
    # Process each image in the session
    processed_images = 0
    total_defects = 0
    
    for image_filename, detections in results["detections"].items():
        image_path = session_path / image_filename
        mask_path = masks_path / f"{Path(image_filename).stem}_mask.png"
        
        if not image_path.exists():
            print(f"⚠️ Image not found: {image_path}")
            continue
            
        # Load image
        image = cv2.imread(str(image_path))
        if image is None:
            print(f"⚠️ Could not load image: {image_path}")
            continue
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Set image for SAM predictor
        sam_predictor.set_image(image_rgb)
        
        H, W = image_rgb.shape[:2]
        combined_mask = np.zeros((H, W), dtype=np.uint8)
        
        # Find target defects in detections
        target_detections = []
        for detection in detections:
            class_name = detection["class"]
            bbox = detection["bbox"]
            
            # Check if this is a target class (by name or ID)
            if class_name in target_class_names:
                target_detections.append(bbox)
        
        # Process each target detection with SAM
        for bbox in target_detections:
            x1, y1, x2, y2 = map(int, bbox)
            input_box = np.array([x1, y1, x2, y2])
            
            try:
                masks, _, _ = sam_predictor.predict(box=input_box, multimask_output=False)
                if len(masks) > 0:
                    mask = masks[0]
                    combined_mask = np.logical_or(combined_mask, mask)
                    total_defects += 1
            except Exception as e:
                print(f"❌ Error segmenting {image_filename}, bbox {input_box}: {e}")
                continue
        
        # Create a 4-channel image (RGBA) with red mask and transparent background
        # Create an RGBA image where red channel has the mask, and alpha channel controls transparency
        h, w = combined_mask.shape
        rgba_mask = np.zeros((h, w, 4), dtype=np.uint8)
        rgba_mask[:, :, 0] = combined_mask * 255  # Red channel (red color for defects)
        rgba_mask[:, :, 1] = 0  # Green channel (0 for red color)
        rgba_mask[:, :, 2] = 0  # Blue channel (0 for red color)
        rgba_mask[:, :, 3] = combined_mask * 255  # Alpha channel (255=opaque, 0=transparent for black pixels)
        
        # Save as PNG with transparency
        cv2.imwrite(str(mask_path), rgba_mask, [cv2.IMWRITE_PNG_COMPRESSION, 9])
        processed_images += 1
        print(f"✅ Mask saved: {mask_path.name}")
    
    return {
        "status": "completed",
        "processed_images": processed_images,
        "total_defects_masked": total_defects,
        "masks_directory": str(masks_path)
    }


def get_class_mapping():
    """
    Return a mapping of class names to IDs based on the YOLO model.
    This function helps identify which class IDs correspond to defect types.
    """
    # This is a placeholder - in a real implementation, you'd load the model
    # and get the actual class mapping
    return {
        "vibration_damper": 0,
        "traverse": 1,
        "polymer_insulator": 2,
        "festoon_insulator": 3,
        "safety_sign+": 4,
        "bad_insulator": 5,  # Assuming this is a defect class
        "nest": 6,           # Assuming this is a defect class
        "damaged_insulator": 7
    }