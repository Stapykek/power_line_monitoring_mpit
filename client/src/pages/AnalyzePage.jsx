import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  LinearProgress,
  Container,
  IconButton,
  Pagination,
  Dialog,
  DialogContent,
  Toolbar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Collapse,
  Chip,
  Divider,
  Stack,
  Switch,
  FormControlLabel
} from '@mui/material';
import { ArrowBack, ExpandMore, ExpandLess, Close, ZoomIn, ZoomOut, ZoomOutMap } from '@mui/icons-material';
import { styled } from '@mui/system';
import EXIF from 'exif-js';
import BoundingBoxOverlay from '../components/BoundingBoxOverlay';
import SegmentationOverlay from '../components/SegmentationOverlay';
import SessionAnalyticsWidget from '../components/SessionAnalyticsWidget';

// Helper function to extract EXIF data from image
const getExifData = (imageSrc) => {
  return new Promise((resolve) => {
    // Create an image object to load the image
    const img = new Image();
    img.crossOrigin = 'Anonymous'; // Handle CORS if needed
    img.onload = () => {
      // Get basic image data (resolution)
      const resolution = `${img.width}x${img.height}`;
      
      // Extract EXIF data using exif-js library
      EXIF.getData(img, function() {
        // Get creation date from EXIF
        const creationDate = EXIF.getTag(this, "DateTime") || EXIF.getTag(this, "DateTimeOriginal") || "Unknown";
        
        // Get GPS coordinates from EXIF
        const gpsLat = EXIF.getTag(this, "GPSLatitude");
        const gpsLatRef = EXIF.getTag(this, "GPSLatitudeRef");
        const gpsLon = EXIF.getTag(this, "GPSLongitude");
        const gpsLonRef = EXIF.getTag(this, "GPSLongitudeRef");
        
        let coordinates = "N/A";
        if (gpsLat && gpsLatRef && gpsLon && gpsLonRef) {
          // Convert GPS coordinates from degrees, minutes, seconds to decimal degrees
          const lat = convertDMSToDD(gpsLat, gpsLatRef);
          const lon = convertDMSToDD(gpsLon, gpsLonRef);
          coordinates = `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
        }
        
        resolve({
          resolution: resolution,
          creationDate: creationDate,
          coordinates: coordinates
        });
      });
    };
    img.onerror = () => {
      // Handle error case
      resolve({
        resolution: "Unknown",
        creationDate: "Unknown",
        coordinates: "N/A"
      });
    };
    img.src = imageSrc;
  });
};

// Helper function to convert degrees, minutes, seconds to decimal degrees
const convertDMSToDD = (dms, ref) => {
  if (!dms) return 0;
  const d = dms[0] || 0;
  const m = dms[1] || 0;
  const s = dms[2] || 0;
  let dd = d + m / 60 + s / 3600;
  if (ref === 'S' || ref === 'W') dd *= -1;
  return dd;
};

const ImageGrid = styled(Grid)(({ theme }) => ({
  marginTop: theme.spacing(3),
  marginBottom: theme.spacing(3)
}));

const ImageItem = styled(Paper)(({ theme }) => ({
  position: 'relative',
  overflow: 'hidden',
  width: '100%',
  paddingTop: '100%', // 1:1 Aspect Ratio
  cursor: 'pointer',
  transition: 'transform 0.2s',
  '&:hover': {
    transform: 'scale(1.02)'
 }
}));

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-container': {
    alignItems: 'center',
    justifyContent: 'center'
  },
  '& .MuiDialog-paper': {
    height: '70vh',
    maxHeight: '70vh',
    margin: 0
  },
  '& .MuiDialogContent-root': {
    padding: 0,
    overflow: 'hidden'
  }
}));

const AnalyzePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sessionId, setSessionId] = useState(null);
 const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
 const [selectedImage, setSelectedImage] = useState(null);
 const [currentPage, setCurrentPage] = useState(1);
  const imagesPerPage = 9; // 3x3 grid

  // State for image analytics
  const [imageAnalytics, setImageAnalytics] = useState({});
  const [loadingAnalytics, setLoadingAnalytics] = useState({});
  const [analysisStatus, setAnalysisStatus] = useState('pending'); // pending, processing, completed
  
  // State for processing times
  const [processingStartTime, setProcessingStartTime] = useState(null);
  const [processingEndTime, setProcessingEndTime] = useState(null);

  // State for image zoom and drag
 const [zoomLevel, setZoomLevel] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageContainerRef = useRef(null);
  const imageRef = useRef(null);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  
  // State for segmentation
  const [segmentationEnabled, setSegmentationEnabled] = useState(false);
  const [maskCache, setMaskCache] = useState({});

  useEffect(() => {
    // Get sessionId from URL
    const params = new URLSearchParams(location.search);
    const sessionId = params.get('sessionId');
    setSessionId(sessionId);

    // Load session files
    const fetchFiles = async () => {
      try {
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        const response = await fetch(`${apiUrl}/sessions/${sessionId}/files`);
        const data = await response.json();
        setFiles(data);
        
        // Initialize analytics for each image with EXIF data only (no AI results yet)
        const analytics = {};
        const promises = data.map(async (file) => {
          // Get image URL
          const imageUrl = `${apiUrl}/sessions/${sessionId}/files/${file.name}`;
          
          // Extract EXIF data from image
          const exifData = await getExifData(imageUrl);
          
          // Initialize with empty objects array - will be populated when AI results are available
          analytics[file.name] = {
            resolution: exifData.resolution,
            creationDate: exifData.creationDate,
            coordinates: exifData.coordinates || "N/A",
            objects: [] // Start with empty objects, will be updated when AI results are available
          };
        });
        
        // Wait for all EXIF data to be processed
        await Promise.all(promises);
        setImageAnalytics(analytics);
        setIsLoading(false);
        
        // Check analysis status and fetch results when available
        checkAnalysisStatus(sessionId);
      } catch (error) {
        console.error('Error loading files:', error);
        setIsLoading(false);
      }
    };

    fetchFiles();
  }, [location.search]);

  // Function to check analysis status and fetch results when available
    const checkAnalysisStatus = async (sessionId) => {
      try {
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        const statusResponse = await fetch(`${apiUrl}/analysis/${sessionId}/status`);
        const statusData = await statusResponse.json();
        
        if (statusData.status === 'completed') {
          // Set processing end time when analysis completes
          setProcessingEndTime(new Date());
          // Fetch AI results
          const resultsResponse = await fetch(`${apiUrl}/analysis/${sessionId}/results`);
          const resultsData = await resultsResponse.json();
          updateImageAnalyticsWithAIResults(resultsData);
          setAnalysisStatus('completed');
        } else {
          // Set processing start time when first transitioning to processing state
          if (analysisStatus === 'pending') {
            setProcessingStartTime(new Date());
          }
          // Set status to processing and schedule a check in 2 seconds
          setAnalysisStatus('processing');
          setTimeout(() => checkAnalysisStatus(sessionId), 2000);
        }
      } catch (error) {
        console.error('Error checking analysis status:', error);
        // Retry after 2 seconds
        setTimeout(() => checkAnalysisStatus(sessionId), 2000);
      }
    };

  // Function to determine criticality based on class and confidence
  const getCriticality = (className, confidence) => {
    // Define criticality mapping for different classes
    const classCriticality = {
      'vibration_damper': 3,
      'bad_insulator': 5,
      'traverse': 1,
      'damaged_insulator': 3,
      'festoon_insulator': 1,
      'polymer_insulator': 1,
      'nest': 2,
      'safety_sign+': 2
    };
    
    // Get base criticality from class
    let baseCriticality = classCriticality[className] || 2; // Default to 2 if class not found
    
    // Adjust criticality based on confidence
    if (confidence > 0.8) {
      baseCriticality += 1; // Higher confidence = higher criticality
    } else if (confidence < 0.5) {
      baseCriticality -= 1; // Lower confidence = lower criticality
    }
    
    // Ensure criticality is between 1 and 5
    return Math.min(5, Math.max(1, baseCriticality));
  };

  // Function to update image analytics with AI results
  const updateImageAnalyticsWithAIResults = (resultsData) => {
    setImageAnalytics(prevAnalytics => {
      const updatedAnalytics = { ...prevAnalytics };
      
      // Process each server filename in the results
      Object.entries(resultsData.detections).forEach(([serverFilename, detections]) => {
        if (updatedAnalytics[serverFilename]) {
          // Update the objects array with AI detection results
          updatedAnalytics[serverFilename].objects = detections.map((detection, idx) => ({
            id: idx + 1, // Generate unique ID for each detection
            class: detection.class,
            confidence: detection.confidence,
            criticality: getCriticality(detection.class, detection.confidence),
            bbox: detection.bbox, // [x1, y1, x2, y2] coordinates
            showBoundingBox: true // Show bounding box by default
          }));
        }
      });
      
      return updatedAnalytics;
    });
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Б';
    const k = 1024;
    const sizes = ['Б', 'КБ', 'МБ', 'ГБ'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const openImage = (file) => {
    setSelectedImage(file);
 };

  const closeImage = () => {
    setSelectedImage(null);
  };

  // Calculate pagination
  const indexOfLastImage = currentPage * imagesPerPage;
  const indexOfFirstImage = indexOfLastImage - imagesPerPage;
  const currentImages = files.slice(indexOfFirstImage, indexOfLastImage);
  const totalPages = Math.ceil(files.length / imagesPerPage);

  const handlePageChange = (event, page) => {
    setCurrentPage(page);
    // Scroll to top of the image grid when page changes
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  // State for managing expanded object details
  const [expandedObjects, setExpandedObjects] = useState({});

  const toggleObjectDetails = (imageName, objectId) => {
    const key = `${imageName}-${objectId}`;
    setExpandedObjects(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
 };

  // Toggle bounding box visibility
  const toggleBoundingBox = (imageName, objectId) => {
    setImageAnalytics(prev => ({
      ...prev,
      [imageName]: {
        ...prev[imageName],
        objects: prev[imageName].objects.map(obj =>
          obj.id === objectId
            ? { ...obj, showBoundingBox: !obj.showBoundingBox }
            : obj
        )
      }
    }));
  };
  
  // Function to fetch segmentation mask for an image
  const fetchSegmentationMask = async (sessionId, filename) => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const maskFilename = `${filename.split('.')[0]}_mask.png`;
      const maskUrl = `${apiUrl}/sessions/${sessionId}/masks/${maskFilename}`;
      
      // Check if mask exists by trying to fetch it
      const response = await fetch(maskUrl);
      if (response.ok) {
        return maskUrl;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error fetching segmentation mask:', error);
      return null;
    }
  };
  
  // Function to check segmentation status for the session
  const checkSegmentationStatus = async (sessionId) => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/analysis/${sessionId}/segmentation-status`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error checking segmentation status:', error);
      return { status: 'error' };
    }
  };

  // Delete classification
  const deleteClassification = (imageName, objectId) => {
    setImageAnalytics(prev => ({
      ...prev,
      [imageName]: {
        ...prev[imageName],
        objects: prev[imageName].objects.filter(obj => obj.id !== objectId)
      }
    }));
  };

  // Get color based on criticality
  const getCriticalityColor = (criticality) => {
    if (criticality >= 5) return 'error';
    if (criticality >= 4) return 'warning';
    return 'success';
  };

  // Get color blob style based on criticality
  const getBlobColor = (criticality) => {
    if (criticality >= 5) return '#f44336'; // Red
    if (criticality >= 2) return '#ff9800'; // Yellow
    return '#4caf50'; // Green
  };

  // Zoom functions
  const zoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.2, 3)); // Max zoom 3x
  };

  const zoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.2, 0.5)); // Min zoom 0.5x
  };

  const resetZoom = () => {
    setZoomLevel(1);
    setPosition({ x: 0, y: 0 });
  };

  // Dragging functions
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Handle mouse up globally to stop dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);
  
  // Effect to load segmentation mask when segmentation is enabled and image changes
  useEffect(() => {
    const loadMask = async () => {
      if (selectedImage && segmentationEnabled && sessionId) {
        // Check if mask is already in cache
        if (!maskCache[selectedImage.name]) {
          const maskUrl = await fetchSegmentationMask(sessionId, selectedImage.name);
          if (maskUrl) {
            setMaskCache(prev => ({
              ...prev,
              [selectedImage.name]: maskUrl
            }));
          }
        }
      }
    };
    
    loadMask();
  }, [selectedImage, segmentationEnabled, sessionId, maskCache]);

  return (
    <Box sx={{ backgroundColor: '#EEEEEE', minHeight: '100vh', pt: 0, pb: 2 }}>
      <Container maxWidth="lg">

        <Typography variant="h4" gutterBottom sx={{ mb: 2 }}>
          Анализ изображений
        </Typography>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Box sx={{ flex: 1 }}>
            {isLoading ? (
              <Box sx={{ mt: 3 }}>
                <Typography variant="body1">Загрузка изображений...</Typography>
                <LinearProgress variant="indeterminate" sx={{ mt: 1 }} />
              </Box>
            ) : (
              <>

                {/* Analysis Status */}
                {analysisStatus === 'processing' && (
                  <Box sx={{ mt: 2, mb: 2 }}>
                    <Typography variant="body1" color="textSecondary">
                      Выполняется анализ изображений...
                    </Typography>
                    <LinearProgress variant="indeterminate" sx={{ mt: 1 }} />
                  </Box>
                )}


                <ImageGrid container spacing={2} justifyContent="center">
                  {currentImages.map((file, index) => (
                    <Grid item xs={4} key={index}>
                      <ImageItem onClick={() => openImage(file)}>
                        <img
                          src={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/sessions/${sessionId}/files/${file.name}`}
                          alt={file.name}
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                        />
                      </ImageItem>
                    </Grid>
                  ))}
                </ImageGrid>

                {/* Pagination */}
                {totalPages > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                    <Pagination
                      count={totalPages}
                      page={currentPage}
                      onChange={handlePageChange}
                      color="primary"
                      size="large"
                    />
                  </Box>
                )}
              </>
            )}
          </Box>

          {/* Session Analytics Widget */}
          <SessionAnalyticsWidget
            files={files}
            imageAnalytics={imageAnalytics}
            analysisStatus={analysisStatus}
            startTime={processingStartTime}
            endTime={processingEndTime}
            sessionId={sessionId}
            segmentationEnabled={segmentationEnabled}
            onSegmentationToggle={(e) => setSegmentationEnabled(e.target.checked)}
          />
        </Box>

        {/* Detailed Image View */}
        {selectedImage && imageAnalytics[selectedImage.name] && (
          <StyledDialog
            open={!!selectedImage}
            onClose={closeImage}
            maxWidth={false}
            fullWidth={false}
            sx={{
              '& .MuiDialog-paper': {
                width: selectedImage && imageAnalytics[selectedImage.name] && imageAnalytics[selectedImage.name].resolution !== "Unknown" ?
                  `calc(${parseInt(imageAnalytics[selectedImage.name].resolution.split('x')[0]) / 8}vw + 300px + 32px)` : 'auto',
                maxWidth: '90vw'
              }
            }}
          >
            <DialogContent dividers>
              <Box sx={{ display: 'flex', height: '100%' }}>
                {/* Image Viewer */}
                <Box
                  ref={imageContainerRef}
                  sx={{
                    flex: 1,
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'auto',
                    cursor: isDragging ? 'grabbing' : 'grab'
                  }}
                  onMouseDown={handleMouseDown}
                >
                  <IconButton
                    onClick={closeImage}
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      color: 'white',
                      backgroundColor: 'rgba(0,0,0.5)',
                      zIndex: 10,
                      '&:hover': { backgroundColor: 'rgba(0,0,0,0.7)' }
                    }}
                  >
                    <Close />
                  </IconButton>
                  
                  {/* Zoom Controls */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 8,
                      left: 8,
                      zIndex: 10,
                      display: 'flex',
                      gap: 1
                    }}
                  >
                  <IconButton
                    onClick={zoomIn}
                    sx={{
                      color: 'white',
                      backgroundColor: 'rgba(0,0,0.5)',
                      '&:hover': { backgroundColor: 'rgba(0,0,0,0.7)' }
                    }}
                  >
                    <ZoomIn />
                  </IconButton>
                  <IconButton
                    onClick={zoomOut}
                    sx={{
                      color: 'white',
                      backgroundColor: 'rgba(0,0,0,0.5)',
                      '&:hover': { backgroundColor: 'rgba(0,0,0,0.7)' }
                    }}
                  >
                    <ZoomOut />
                  </IconButton>
                  <IconButton
                    onClick={resetZoom}
                    sx={{
                      color: 'white',
                      backgroundColor: 'rgba(0,0,0,0.5)',
                      '&:hover': { backgroundColor: 'rgba(0,0,0,0.7)' }
                    }}
                  >
                    <ZoomOutMap />
                  </IconButton>
                  
                </Box>
                
                {/* Container for image and overlay with the same transformation */}
                <Box
                  sx={{
                    width: '100%',
                    height: '100%',
                    position: 'relative',
                    overflow: 'auto' // Allow scrolling when zoomed in
                  }}
                >
                  {/* Transform container for both image and overlay */}
                  <Box
                    sx={{
                      transform: `scale(${zoomLevel}) translate(${position.x}px, ${position.y}px)`,
                      transformOrigin: 'center center',
                      transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                      position: 'relative',
                      display: 'inline-block' // Ensure it only takes the space of the image
                    }}
                  >
                    {/* Image */}
                    <img
                      ref={imageRef}
                      src={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/sessions/${sessionId}/files/${selectedImage.name}`}
                      alt={selectedImage.name}
                      onLoad={async (e) => {
                        // Set the original image dimensions when the image loads
                        setImageDimensions({
                          width: e.target.naturalWidth,
                          height: e.target.naturalHeight
                        });
                        
                        // Preload segmentation mask if segmentation is enabled
                        if (segmentationEnabled && !maskCache[selectedImage.name]) {
                          const maskUrl = await fetchSegmentationMask(sessionId, selectedImage.name);
                          if (maskUrl) {
                            setMaskCache(prev => ({
                              ...prev,
                              [selectedImage.name]: maskUrl
                            }));
                          }
                        }
                      }}
                      style={{
                        width: '100%',
                        height: 'auto',
                        maxHeight: '100vh',
                        objectFit: 'contain',
                        display: 'block',
                        position: 'relative',
                        zIndex: 1
                      }}
                    />
                    
                    {/* Segmentation Overlay - shown when segmentation is enabled */}
                    {segmentationEnabled && maskCache[selectedImage.name] && (
                      <SegmentationOverlay
                        imageRef={imageRef}
                        maskSrc={maskCache[selectedImage.name]}
                        imageDimensions={imageDimensions}
                        segmentationVisible={segmentationEnabled}
                      />
                    )}
                    
                    {/* Bounding Box Overlay - hidden when segmentation is enabled */}
                    {!segmentationEnabled && imageAnalytics[selectedImage.name] && imageAnalytics[selectedImage.name].objects && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          zIndex: 2 // Above the image but below controls
                        }}
                      >
                        <BoundingBoxOverlay
                          imageRef={imageRef}
                          objects={imageAnalytics[selectedImage.name].objects}
                          imageDimensions={imageDimensions}
                        />
                      </Box>
                    )}
                  </Box>
                </Box>
              </Box>

              {/* Analytics Panel */}
              <Box sx={{ width: '300px', padding: 2, overflow: 'auto', borderLeft: '1px solid #e0e0' }}>
                <Typography variant="h6" gutterBottom>
                  Аналитика
                </Typography>

                {/* File Data Block */}
                <Paper sx={{ padding: 2, marginBottom: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Данные файла
                  </Typography>
                  <Typography variant="body2">
                    <strong>Разрешение:</strong> {imageAnalytics[selectedImage.name].resolution}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Дата создания:</strong> {imageAnalytics[selectedImage.name].creationDate}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Координаты:</strong> {imageAnalytics[selectedImage.name].coordinates}
                  </Typography>
                </Paper>

                {/* Found Objects Block */}
                <Paper sx={{ padding: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Найденные объекты
                  </Typography>
                  <List dense>
                    {imageAnalytics[selectedImage.name].objects.map((obj) => {
                      const key = `${selectedImage.name}-${obj.id}`;
                      const isExpanded = expandedObjects[key] || false;
                      
                      return (
                        <React.Fragment key={obj.id}>
                          <ListItem
                            secondaryAction={
                              <IconButton
                                edge="end"
                                onClick={() => toggleObjectDetails(selectedImage.name, obj.id)}
                              >
                                {isExpanded ? <ExpandLess /> : <ExpandMore />}
                              </IconButton>
                            }
                            sx={{ padding: '8px 0' }}
                          >
                            <ListItemIcon sx={{ minWidth: '30px', marginRight: 1 }}>
                              <Box
                                sx={{
                                  width: 16,
                                  height: 16,
                                  borderRadius: '50%',
                                  backgroundColor: getBlobColor(obj.criticality),
                                }}
                              />
                            </ListItemIcon>
                            <ListItemText
                              primary={obj.class}
                              primaryTypographyProps={{ variant: 'body2' }}
                            />
                          </ListItem>
                          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                            <Box sx={{ padding: '0 16px 8px 32px' }}>
                              <Typography variant="body2" color="textSecondary">
                                <strong>Доверие:</strong> {(obj.confidence * 100).toFixed(1)}%
                              </Typography>
                              <Typography variant="body2" color="textSecondary">
                                <strong>Критичность:</strong> {obj.criticality}/5
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                <Button
                                  size="small"
                                  variant={obj.showBoundingBox ? "contained" : "outlined"}
                                  onClick={() => toggleBoundingBox(selectedImage.name, obj.id)}
                                >
                                  BBox
                                </Button>
                                <Button
                                  size="small"
                                  color="error"
                                  variant="outlined"
                                  onClick={() => deleteClassification(selectedImage.name, obj.id)}
                                >
                                  Удалить
                                </Button>
                              </Box>
                            </Box>
                          </Collapse>
                        </React.Fragment>
                      );
                    })}
                  </List>
                </Paper>
              </Box>
            </Box>
          </DialogContent>
        </StyledDialog>
      )}
    </Container>
  </Box>
  );
};

export default AnalyzePage;