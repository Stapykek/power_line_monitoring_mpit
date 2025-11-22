import React from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { NotificationsOutlined, AccountCircleOutlined, MapOutlined } from '@mui/icons-material';

const HeaderBar = () => {
  const navigate = useNavigate();

  const handleLogoClick = () => {
    navigate('/');
  };

  return (
    <Box
      sx={{
        backgroundColor: '#111119',
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        pl: '15%', // 15% padding on left side
        pr: '15%', // 15% padding on right side
        width: '100%',
        boxSizing: 'border-box', // Include padding in width calculation
        position: 'relative',
        zIndex: 1000, // Ensure header is above other content
      }}
    >
      {/* Left side: Logo and Title */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box
          component="img"
          src="/Icon.svg"
          alt="VisorAI Logo"
          sx={{
            height: 32,
            width: 32,
            cursor: 'pointer',
          }}
          onClick={handleLogoClick}
        />
        <Typography
          variant="h6"
          sx={{
            color: 'white',
            fontFamily: '"Rozha One", serif', // Using quotes around the font name
            fontWeight: 'normal',
            fontSize: '32px', // Set font size to 32px
            cursor: 'pointer',
          }}
          onClick={handleLogoClick}
        >
          VisorAI
        </Typography>
      </Box>

      {/* Right side: Placeholder buttons */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton sx={{ color: 'white' }}>
          <NotificationsOutlined />
        </IconButton>
        <IconButton sx={{ color: 'white' }}>
          <AccountCircleOutlined />
        </IconButton>
        <IconButton sx={{ color: 'white' }}>
          <MapOutlined />
        </IconButton>
      </Box>
    </Box>
  );
};

export default HeaderBar;