# Bounding Box Feature Implementation Plan

## Overview
This document outlines the implementation plan for adding bounding box visualization to the AnalyzePage.jsx. The feature will allow users to toggle the display of bounding boxes around detected objects with colors corresponding to their criticality level.

## Current State Analysis
- The AnalyzePage.jsx currently displays a list of detected objects in the right analytics panel
- Each object has a class, confidence, and criticality value
- There's a "BBox" button that currently only toggles a `showBoundingBox` flag
- The results.json contains bounding box coordinates in the format `[x1, y1, x2, y2]`
- There's no visual representation of bounding boxes on the image itself

## Implementation Requirements

### 1. Update Object Data Structure
The `updateImageAnalyticsWithAIResults` function needs to be modified to include bounding box data from the results.json:

```javascript
// Current structure:
{
  id: idx + 1,
  class: detection.class,
  confidence: detection.confidence,
  criticality: getCriticality(detection.class, detection.confidence),
  showBoundingBox: true // Show bounding box by default
}

// Updated structure:
{
  id: idx + 1,
  class: detection.class,
  confidence: detection.confidence,
  criticality: getCriticality(detection.class, detection.confidence),
  bbox: detection.bbox, // [x1, y1, x2, y2] coordinates
  showBoundingBox: true // Show bounding box by default
}
```

### 2. Create Bounding Box Overlay Component
A new overlay component needs to be created to draw bounding boxes on top of the displayed image. This should be implemented as an absolutely positioned div with the following characteristics:

- Positioned relative to the image container
- Contains SVG elements or styled divs for each bounding box
- Dynamically updates based on zoom level and pan position
- Each bounding box should be styled with:
  - Border color based on criticality (using getBlobColor function)
  - Border width (e.g., 2px)
  - Optional label showing the class name
  - Visibility controlled by the showBoundingBox flag

### 3. Integrate Overlay with Image Viewer
The bounding box overlay needs to be integrated into the image viewer section of the detailed view modal. It should be positioned exactly on top of the image and update its position when the user zooms or pans.

### 4. Update Toggle Functionality
The existing `toggleBoundingBox` function should continue to work as is, since it already manages the `showBoundingBox` flag. The overlay component will simply check this flag to determine whether to display each bounding box.

### 5. Handle Object Deletion
The existing `deleteClassification` function should automatically hide the bounding box since it removes the object from the analytics state, which will cause the overlay to no longer render that bounding box.

## Technical Implementation Details

### Image Coordinate System
The bounding box coordinates from results.json are in absolute image coordinates (pixels). When displaying on screen, these need to be transformed based on:
- Image's actual size vs display size
- Current zoom level
- Current pan position

### Position Calculation
For each bounding box:
```
// Original bbox coordinates from results.json: [x1, y1, x2, y2]
bbox_width = x2 - x1
bbox_height = y2 - y1

// Convert to percentage or ratio based on original image dimensions
// Then scale based on current display size and zoom level
```

### Component Structure
The detailed view will be updated to include:

```
Image Container
├── Original Image
├── Bounding Box Overlay
│   ├── BBox 1 (if showBoundingBox is true)
│   ├── BBox 2 (if showBoundingBox is true)
│   └── ...
└── Zoom Controls
```

## Implementation Steps

### Step 1: Update Data Structure
Modify the `updateImageAnalyticsWithAIResults` function to include bbox data from the results.

### Step 2: Create Bounding Box Overlay Component
Create a React component that:
- Takes image dimensions, zoom level, pan position, and objects array as props
- Maps through objects that have `showBoundingBox: true`
- Calculates proper positioning based on image transformation
- Renders each bounding box with appropriate styling

### Step 3: Integrate Overlay Component
Add the overlay component to the detailed view modal in the correct position.

### Step 4: Synchronize Positioning
Ensure the overlay moves and scales with the image when zooming or panning.

### Step 5: Test Functionality
Verify that:
- Bounding boxes appear when BBOX button is clicked
- Bounding boxes disappear when BBOX button is clicked again
- Bounding boxes disappear when object is deleted
- Bounding box colors match criticality colors
- Bounding boxes scale properly with zoom
- Bounding boxes maintain correct position during panning

## Criticality to Color Mapping
The existing `getBlobColor` function already handles the criticality to color mapping:
- Criticality >= 5: Red (#f4436)
- Criticality >= 2: Yellow (#ff9800) 
- Criticality < 2: Green (#4caf50)

This same function should be used for bounding box border colors.

## Error Handling
- Handle cases where bbox coordinates might be invalid
- Handle cases where image dimensions are not available
- Ensure proper rendering even when zoom level is changed