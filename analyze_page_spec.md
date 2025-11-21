# Analyze Page Specification

## Overview
The Analyze Page displays a paginated grid of images that users have uploaded. The page allows for detailed analysis of each image with associated metadata and AI detection results.

## Core Functionality

### Grid Display
- Displays a 3x3 grid (9 images per page)
- All images in the grid must be visible on screen at once without scrolling
- Images are square and properly sized to fit the screen
- No text overlays on the grid images
- Horizontally centered on the screen

### Pagination
- Pagination controls appear when there are more than 9 images
- Users can navigate between pages to see all uploaded images
- Pagination appears below the image grid

### Image Selection
- Clicking any image opens a detailed view modal
- Detailed view includes a zoomable image display
- Close button (✕) in the top-right corner of the modal
- Clicking outside the image area closes the modal

### Detailed View Layout
The detailed view has a two-column layout:
- Left column: The image (zoomable)
- Right column: Analytics widget (same height as the image)

### Analytics Widget
The analytics widget has two main sections:

#### Block 1: File Data
- Resolution (parsed from image metadata)
- Creation date (parsed from image metadata)
- Coordinates (parsed from image metadata, if available)

#### Block 2: Found Objects
- Displayed as a list of detected objects
- Each list item format: [color blob] [class name] [down arrow icon]
- Color blob is a small circle:
  - Green: Criticality < 2
  - Yellow: Criticality < 4
  - Red: Criticality = 5
- Down arrow reveals a dropdown with:
  - AI model's confidence
  - Criticality of the issue
  - Toggle button for bounding box visibility
  - Delete button to remove the classification from the image

## Technical Requirements
- The grid should be responsive and work on different screen sizes
- Images should maintain aspect ratio in both grid and detailed view
- The analytics panel should be scrollable if it contains many objects
- The detailed view should allow zoom functionality for detailed inspection
- All UI elements should follow Material UI design principles