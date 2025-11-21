from ultralytics import YOLO
import cv2
import numpy as np
from PIL import Image
from typing import List, Dict, Any
import os

class YOLOInference:
    def __init__(self, model_path: str, confidence_threshold: float = 0.4):
        """
        Initialize the YOLO inference class
        
        Args:
            model_path: Path to the YOLO model file
            confidence_threshold: Minimum confidence for detections (default 0.4)
        """
        self.model = YOLO(model_path)
        self.confidence_threshold = confidence_threshold
    
    def process_image(self, image_path: str) -> List[Dict[str, Any]]:
        """
        Process a single image and return detection results
        
        Args:
            image_path: Path to the image file
            
        Returns:
            List of detection results, each containing class, confidence, and bbox
        """
        # Run YOLOv8 inference
        results = self.model(image_path)
        
        detections = []
        
        # Process the results
        for result in results:
            boxes = result.boxes  # Boxes object for bbox outputs
            if boxes is not None:
                for box in boxes:
                    # Extract bounding box coordinates
                    x1, y1, x2, y2 = box.xyxy[0].tolist()  # Convert tensor to list
                    
                    # Extract confidence score
                    conf = float(box.conf[0])
                    
                    # Extract class name
                    cls = int(box.cls[0])
                    class_name = self.model.names[cls]
                    
                    # Apply confidence threshold
                    if conf >= self.confidence_threshold:
                        detection = {
                            "class": class_name,
                            "confidence": conf,
                            "bbox": [x1, y1, x2, y2]
                        }
                        detections.append(detection)
        
        return detections
    
    def process_image_from_array(self, image_array: np.ndarray) -> List[Dict[str, Any]]:
        """
        Process an image from a numpy array and return detection results
        
        Args:
            image_array: Image as numpy array (BGR format from OpenCV)
            
        Returns:
            List of detection results
        """
        # Run YOLOv8 inference
        results = self.model(image_array)
        
        detections = []
        
        # Process the results
        for result in results:
            boxes = result.boxes  # Boxes object for bbox outputs
            if boxes is not None:
                for box in boxes:
                    # Extract bounding box coordinates
                    x1, y1, x2, y2 = box.xyxy[0].tolist()
                    
                    # Extract confidence score
                    conf = float(box.conf[0])
                    
                    # Extract class name
                    cls = int(box.cls[0])
                    class_name = self.model.names[cls]
                    
                    # Apply confidence threshold
                    if conf >= self.confidence_threshold:
                        detection = {
                            "class": class_name,
                            "confidence": conf,
                            "bbox": [x1, y1, x2, y2]
                        }
                        detections.append(detection)
        
        return detections

    def get_model_classes(self) -> List[str]:
        """
        Get the list of classes that the model can detect
        
        Returns:
            List of class names
        """
        return list(self.model.names.values())
    
    def draw_bounding_boxes(self, image_path: str, output_path: str = None) -> np.ndarray:
        """
        Draw bounding boxes on the image and return the result
        
        Args:
            image_path: Path to input image
            output_path: Optional path to save annotated image
            
        Returns:
            Image with bounding boxes drawn
        """
        # Load image
        image = cv2.imread(image_path)
        
        # Get detections
        detections = self.process_image(image_path)
        
        # Draw bounding boxes
        for detection in detections:
            x1, y1, x2, y2 = map(int, detection['bbox'])
            confidence = detection['confidence']
            class_name = detection['class']
            
            # Draw rectangle
            cv2.rectangle(image, (x1, y1), (x2, y2), (0, 255, 0), 2)
            
            # Draw label
            label = f"{class_name}: {confidence:.2f}"
            cv2.putText(image, label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
        
        # Save if output path provided
        if output_path:
            cv2.imwrite(output_path, image)
        
        return image