import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Typography, Grid, Paper, Button, LinearProgress, Container, IconButton } from '@mui/material';
import { ArrowBack, ZoomIn, ZoomOut } from '@mui/icons-material';
import { styled } from '@mui/system';

const ImageGrid = styled(Grid)(({ theme }) => ({
    marginTop: theme.spacing(3),
    marginBottom: theme.spacing(3)
}));

const ImageItem = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(1),
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'transform 0.2s',
    '&:hover': {
        transform: 'scale(1.02)'
    }
}));

const AnalyzePage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [sessionId, setSessionId] = useState(null);
    const [files, setFiles] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [progress, setProgress] = useState(0);
    const [selectedImage, setSelectedImage] = useState(null);

    useEffect(() => {
        // Получаем sessionId из URL
        const params = new URLSearchParams(location.search);
        const sessionId = params.get('sessionId');
        setSessionId(sessionId);

        // Загружаем файлы сессии
        const fetchFiles = async () => {
            try {
                const response = await fetch(`http://localhost:5000/sessions/${sessionId}/files`);
                const data = await response.json();
                setFiles(data);
                setIsLoading(false);
            } catch (error) {
                console.error('Ошибка загрузки файлов:', error);
                setIsLoading(false);
            }
        };

        fetchFiles();
    }, [location.search]);

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

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Button
                startIcon={<ArrowBack />}
                onClick={() => navigate('/')}
                sx={{ mb: 3 }}
            >
                Назад
            </Button>

            <Typography variant="h4" gutterBottom>
                Анализ изображений
            </Typography>

            {isLoading ? (
                <Box sx={{ mt: 3 }}>
                    <Typography variant="body1">Загрузка изображений...</Typography>
                    <LinearProgress variant="indeterminate" sx={{ mt: 1 }} />
                </Box>
            ) : (
                <>
                    <Typography variant="body1" color="textSecondary" gutterBottom>
                        Всего загружено: {files.length} изображений
                    </Typography>

                    <ImageGrid container spacing={2}>
                        {files.map((file, index) => (
                            <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                                <ImageItem onClick={() => openImage(file)}>
                                    <img
                                        src={`http://localhost:5000/sessions/${sessionId}/files/${file.name}`}
                                        alt={file.name}
                                        style={{ width: '100%', height: '150px', objectFit: 'cover' }}
                                    />
                                    <Typography variant="body2" noWrap>
                                        {file.name}
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                        {formatBytes(file.size)}
                                    </Typography>
                                </ImageItem>
                            </Grid>
                        ))}
                    </ImageGrid>

                    {selectedImage && (
                        <Box
                            sx={{
                                position: 'fixed',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                backgroundColor: 'rgba(0,0,0,0.8)',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                zIndex: 1000,
                                padding: 2
                            }}
                            onClick={closeImage}
                        >
                            <Box
                                sx={{
                                    position: 'relative',
                                    maxWidth: '90%',
                                    maxHeight: '90%',
                                    backgroundColor: 'white',
                                    borderRadius: 2,
                                    overflow: 'hidden'
                                }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <IconButton
                                    onClick={closeImage}
                                    sx={{
                                        position: 'absolute',
                                        top: 10,
                                        right: 10,
                                        color: 'white',
                                        backgroundColor: 'rgba(0,0,0,0.5)',
                                        '&:hover': { backgroundColor: 'rgba(0,0,0,0.7)' }
                                    }}
                                >
                                    ✕
                                </IconButton>
                                <img
                                    src={`http://localhost:5000/sessions/${sessionId}/files/${selectedImage.name}`}
                                    alt={selectedImage.name}
                                    style={{
                                        maxWidth: '100%',
                                        maxHeight: '80vh',
                                        display: 'block'
                                    }}
                                />
                            </Box>
                        </Box>
                    )}
                </>
            )}
        </Container>
    );
};

export default AnalyzePage;