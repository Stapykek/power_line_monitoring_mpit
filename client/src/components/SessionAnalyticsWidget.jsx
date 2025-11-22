import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Collapse,
  Divider,
  TextField,
  Button,
  Chip,
  InputAdornment
} from '@mui/material';
import {
  ExpandMore,
  ExpandLess,
  Edit as EditIcon,
  AccountCircleOutlined,
  HelpOutlineOutlined,
  BorderAllOutlined,
  LibraryBooksOutlined,
  Bolt as BoltIcon
} from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const SessionAnalyticsWidget = ({ files, imageAnalytics, analysisStatus, startTime, endTime, sessionId }) => {
  // State for expanded blocks
  const [expandedBlocks, setExpandedBlocks] = useState({
    sessionInfo: true,
    criticality: true
  });

  // State for session name editing and upload time
  const [sessionName, setSessionName] = useState('Сессия анализа');
  const [isEditingName, setIsEditingName] = useState(false);
  const [uploadTime, setUploadTime] = useState(null);

  // Fetch upload time from metadata when component mounts
  useEffect(() => {
    const fetchUploadTime = async () => {
      if (sessionId) {
        try {
          const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
          const response = await fetch(`${apiUrl}/sessions/${sessionId}/files/metadata.json`);
          if (response.ok) {
            const metadata = await response.json();
            setUploadTime(metadata.upload_time || null);
          } else {
            // Fallback to current date if metadata not found
            setUploadTime(new Date().toISOString());
          }
        } catch (error) {
          console.error('Error fetching upload time:', error);
          setUploadTime(new Date().toISOString());
        }
      }
    };

    fetchUploadTime();
  }, [sessionId]);

  // Toggle block expansion
  const toggleBlock = (blockName) => {
    setExpandedBlocks(prev => ({
      ...prev,
      [blockName]: !prev[blockName]
    }));
  };

  // Calculate session statistics
  const calculateSessionStats = () => {
    if (!imageAnalytics) return {
      totalImages: 0,
      totalObjects: 0,
      totalDefects: 0,
      totalFileSize: 0
    };

    const totalImages = files.length;
    let totalObjects = 0;
    let totalDefects = 0;
    let totalFileSize = 0;

    // Calculate total objects and defects
    Object.values(imageAnalytics).forEach(imageData => {
      if (imageData && imageData.objects) {
        totalObjects += imageData.objects.length;
        
        // Count defects (objects with criticality >= 4)
        imageData.objects.forEach(obj => {
          if (obj.criticality >= 4) {
            totalDefects++;
          }
        });
      }
    });

    // Calculate total file size
    files.forEach(file => {
      totalFileSize += file.size || 0;
    });

    return {
      totalImages,
      totalObjects,
      totalDefects,
      totalFileSize
    };
  };

  // Get criticality distribution
  const getCriticalityDistribution = () => {
    if (!imageAnalytics) return [];

    const criticalityCount = {
      'Низкая': 0,
      'Средняя': 0,
      'Высокая': 0
    };

    Object.values(imageAnalytics).forEach(imageData => {
      if (imageData && imageData.objects) {
        imageData.objects.forEach(obj => {
          if (obj.criticality >= 1 && obj.criticality <= 2) {
            criticalityCount['Низкая']++;
          } else if (obj.criticality >= 3 && obj.criticality <= 4) {
            criticalityCount['Средняя']++;
          } else if (obj.criticality >= 5) {
            criticalityCount['Высокая']++;
          }
        });
      }
    });

    return [
      { name: 'Низкая', value: criticalityCount['Низкая'], color: '#4caf50' },
      { name: 'Средняя', value: criticalityCount['Средняя'], color: '#ff9800' },
      { name: 'Высокая', value: criticalityCount['Высокая'], color: '#f44336' }
    ];
  };

  const { totalImages, totalObjects, totalDefects, totalFileSize } = calculateSessionStats();
  const criticalityData = getCriticalityDistribution();

  // Format bytes to human-readable format
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Б';
    const k = 1024;
    const sizes = ['Б', 'КБ', 'МБ', 'ГБ'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format time duration
  const formatDuration = (start, end) => {
    if (!start || !end) return '00:00:00';
    
    const duration = new Date(end - start);
    const hours = duration.getUTCHours();
    const minutes = duration.getUTCMinutes();
    const seconds = duration.getUTCSeconds();
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return 'Неизвестно';
    return new Date(date).toLocaleString('ru-RU');
  };

  return (
    <Box sx={{ width: '350px', height: '100%', overflow: 'auto', ml: 2 }}>
      {/* Session Info Block */}
      <Paper 
        sx={{ 
          mb: 2, 
          borderRadius: '16px',
          overflow: 'hidden',
          backgroundColor: 'white'
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            p: 2,
            backgroundColor: '#f5f5f5',
            cursor: 'pointer'
          }}
          onClick={() => toggleBlock('sessionInfo')}
        >
          <Typography variant="h6">О сессии</Typography>
          <IconButton size="small">
            {expandedBlocks.sessionInfo ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Box>
        
        <Collapse in={expandedBlocks.sessionInfo}>
          <Box p={2}>
            {/* Session Name Editable Field */}
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2" sx={{ flex: 1 }}>Название сессии</Typography>
                <IconButton 
                  size="small" 
                  onClick={() => setIsEditingName(!isEditingName)}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Box>
              
              {isEditingName ? (
                <TextField
                  fullWidth
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  onBlur={() => setIsEditingName(false)}
                  size="small"
                  autoFocus
                />
              ) : (
                <Typography variant="body2">{sessionName}</Typography>
              )}
            </Box>
            
            <Divider sx={{ my: 1 }} />
            
            <List dense>
              {/* Date of Upload */}
              <ListItem>
                <ListItemIcon sx={{ minWidth: '30px', marginRight: 1 }}>
                  <AccountCircleOutlined fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary="Дата загрузки"
                  secondary={formatDate(uploadTime)}
                />
              </ListItem>
              
              <Divider variant="fullWidth" component="li" />
              
              {/* File Size */}
              <ListItem>
                <ListItemIcon sx={{ minWidth: '30px', marginRight: 1 }}>
                  <HelpOutlineOutlined fontSize="small" />
                </ListItemIcon>
                <ListItemText 
                  primary="Размер файлов" 
                  secondary={formatBytes(totalFileSize)}
                />
              </ListItem>
              
              <Divider variant="fullWidth" component="li" />
              
              {/* Total Images */}
              <ListItem>
                <ListItemIcon sx={{ minWidth: '30px', marginRight: 1 }}>
                  <BorderAllOutlined fontSize="small" />
                </ListItemIcon>
                <ListItemText 
                  primary="Всего изображений" 
                  secondary={totalImages}
                />
              </ListItem>
              
              <Divider variant="fullWidth" component="li" />
              
              {/* Found Objects */}
              <ListItem>
                <ListItemIcon sx={{ minWidth: '30px', marginRight: 1 }}>
                  <BorderAllOutlined fontSize="small" />
                </ListItemIcon>
                <ListItemText 
                  primary="Найдено объектов" 
                  secondary={totalObjects}
                />
              </ListItem>
              
              <Divider variant="fullWidth" component="li" />
              
              {/* Detected Defects */}
              <ListItem>
                <ListItemIcon sx={{ minWidth: '30px', marginRight: 1 }}>
                  <BorderAllOutlined fontSize="small" />
                </ListItemIcon>
                <ListItemText 
                  primary="Выявлено дефектов" 
                  secondary={totalDefects}
                />
              </ListItem>
              
              <Divider variant="fullWidth" component="li" />
              
              {/* Processing Time */}
              <ListItem>
                <ListItemIcon sx={{ minWidth: '30px', marginRight: 1 }}>
                  <LibraryBooksOutlined fontSize="small" />
                </ListItemIcon>
                <ListItemText 
                  primary="Время обработки" 
                  secondary={formatDuration(startTime, endTime)}
                />
              </ListItem>
            </List>
          </Box>
        </Collapse>
      </Paper>

      {/* Criticality Objects Block */}
      <Paper 
        sx={{ 
          mb: 2, 
          borderRadius: '16px',
          overflow: 'hidden',
          backgroundColor: 'white'
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            p: 2,
            backgroundColor: '#f5f5f5',
            cursor: 'pointer'
          }}
          onClick={() => toggleBlock('criticality')}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box
              sx={{
                width: 24,
                height: 24,
                borderRadius: '4px',
                backgroundColor: '#ED676A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mr: 1
              }}
            >
              <BoltIcon fontSize="small" sx={{ color: 'white' }} />
            </Box>
            <Typography variant="h6">Критичность объектов</Typography>
          </Box>
          <IconButton size="small">
            {expandedBlocks.criticality ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Box>
        
        <Collapse in={expandedBlocks.criticality}>
          <Box p={2}>
            <List dense>
              {/* Low Criticality */}
              <ListItem>
                <ListItemIcon sx={{ minWidth: '30px', marginRight: 1 }}>
                  <Box
                    sx={{
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      backgroundColor: '#4caf50',
                    }}
                  />
                </ListItemIcon>
                <ListItemText 
                  primary={`Низкая: ${criticalityData[0]?.value || 0} объектов`} 
                />
              </ListItem>
              
              <Divider variant="fullWidth" component="li" />
              
              {/* Medium Criticality */}
              <ListItem>
                <ListItemIcon sx={{ minWidth: '30px', marginRight: 1 }}>
                  <Box
                    sx={{
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      backgroundColor: '#ff9800',
                    }}
                  />
                </ListItemIcon>
                <ListItemText 
                  primary={`Средняя: ${criticalityData[1]?.value || 0} объектов`} 
                />
              </ListItem>
              
              <Divider variant="fullWidth" component="li" />
              
              {/* High Criticality */}
              <ListItem>
                <ListItemIcon sx={{ minWidth: '30px', marginRight: 1 }}>
                  <Box
                    sx={{
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      backgroundColor: '#f44336',
                    }}
                  />
                </ListItemIcon>
                <ListItemText 
                  primary={`Высокая: ${criticalityData[2]?.value || 0} объектов`} 
                />
              </ListItem>

              <Divider variant="fullWidth" component="li" />
            </List>
            
            {/* Total Objects and Pie Chart */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Всего объектов: {totalObjects}
              </Typography>
              <Box sx={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={criticalityData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {criticalityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [value, 'Количество']} />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </Box>
          </Box>
        </Collapse>
      </Paper>
    </Box>
  );
};

export default SessionAnalyticsWidget;