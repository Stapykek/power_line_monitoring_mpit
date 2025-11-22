import React from 'react';
import { Box } from '@mui/material';

const BoundingBoxOverlay = ({
  imageRef,
  objects = [],
 imageDimensions
}) => {
  // Calculate the scale factor based on original image dimensions and natural image size
  const calculateBoundingBoxPosition = (bbox) => {
    if (!imageRef.current || !imageDimensions || !bbox) return null;
    
    const img = imageRef.current;
    const originalWidth = imageDimensions.width;
    const originalHeight = imageDimensions.height;
    
    // Get the natural display size of the image (before transforms)
    const displayWidth = img.clientWidth;
    const displayHeight = img.clientHeight;
    
    // Calculate scale factors
    const scaleX = displayWidth / originalWidth;
    const scaleY = displayHeight / originalHeight;
    
    // Calculate bounding box dimensions in display coordinates
    const [x1, y1, x2, y2] = bbox;
    const left = x1 * scaleX;
    const top = y1 * scaleY;
    const width = (x2 - x1) * scaleX;
    const height = (y2 - y1) * scaleY;
    
    return {
      left: `${left}px`,
      top: `${top}px`,
      width: `${width}px`,
      height: `${height}px`
    };
  };

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none', // Allow clicks to pass through to the image
        overflow: 'visible',
        zIndex: 2 // Ensure it's above the image but below controls
      }}
    >
      {objects.map((obj) => {
        if (!obj.showBoundingBox || !obj.bbox) return null;
        
        const bboxStyle = calculateBoundingBoxPosition(obj.bbox);
        if (!bboxStyle) return null;
        
        return (
          <Box
            key={obj.id}
            sx={{
              position: 'absolute',
              border: '2px solid',
              borderColor: (theme) => {
                // Use the same color mapping as getBlobColor function
                if (obj.criticality >= 5) return '#f44336'; // Red
                if (obj.criticality >= 2) return '#ff9800'; // Yellow
                return '#4caf50'; // Green
              },
              boxSizing: 'border-box',
              ...bboxStyle,
            }}
          >
            {/* Label for the bounding box */}
            <Box
              sx={{
                position: 'absolute',
                top: '-18px',
                left: '0px',
                backgroundColor: (theme) => {
                  // Use the same color mapping as border
                  if (obj.criticality >= 5) return '#f44336'; // Red
                  if (obj.criticality >= 2) return '#ff9800'; // Yellow
                  return '#4caf50'; // Green
                },
                color: 'white',
                fontSize: '10px',
                padding: '1px 4px',
                borderRadius: '2px',
              }}
            >
              {obj.class}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
};

export default BoundingBoxOverlay;