import React from 'react';
import { Box } from '@mui/material';

const SegmentationOverlay = ({
  imageRef,
  maskSrc,
  imageDimensions,
  segmentationVisible
}) => {
 if (!segmentationVisible || !maskSrc) {
    return null;
  }

 return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none', // Allow clicks to pass through to the image
        overflow: 'hidden',
        zIndex: 2, // Ensure it's above the image but below controls
        opacity: 0.7, // Make the mask semi-transparent
      }}
    >
      <Box
        component="img"
        src={maskSrc}
        alt="Segmentation mask"
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'fill',
          mixBlendMode: 'screen', // Use screen blend mode for bright red overlay
        }}
      />
    </Box>
  );
};

export default SegmentationOverlay;