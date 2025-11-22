import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, LinearProgress, Paper, Grid, Container } from '@mui/material';
import { FileUploadOutlined, ArrowBack } from '@mui/icons-material';
import Instructions from "../components/Instructions";

const MainPage = () => {
    const [isDragging, setIsDragging] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const navigate = useNavigate();

    const removeFile = (index) => {
        const newFiles = [...uploadedFiles];
        newFiles.splice(index, 1);
        setUploadedFiles(newFiles);
    };

    const validExtensions = ['.jpg', '.jpeg', '.png', '.tiff', '.raw', '.zip'];

    const getFileExtension = (filename) => {
        const lastDot = filename.lastIndexOf('.');
        if (lastDot === -1) return '';
        return filename.substring(lastDot).toLowerCase();
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files);
        const validFiles = files.filter(file =>
            validExtensions.includes(getFileExtension(file.name))
        );

        setUploadedFiles(prevFiles => [...prevFiles, ...validFiles]);
    };

    const handleFileInput = (e) => {
        const files = Array.from(e.target.files);
        const validFiles = files.filter(file =>
            validExtensions.includes(getFileExtension(file.name))
        );

        setUploadedFiles(prevFiles => [...prevFiles, ...validFiles]);
    };

    const getTotalSize = () => {
        return uploadedFiles.reduce((sum, file) => sum + file.size, 0);
    };

    const formatBytes = (bytes) => {
        if (bytes === 0) return '0 Б';
        const k = 1024;
        const sizes = ['Б', 'КБ', 'МБ', 'ГБ'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const handleUpload = async () => {
        if (uploadedFiles.length === 0) return;

        setIsUploading(true);
        setUploadProgress(0);

        const formData = new FormData();
        uploadedFiles.forEach(file => formData.append('files', file));

        try {
            // Загрузка на сервер
            const response = await fetch('http://localhost:5000/upload', {
                method: 'POST',
                body: formData,
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(percentCompleted);
                }
            });

            const data = await response.json();
            if (response.ok) {
                navigate(`/analyze?sessionId=${data.sessionId}`);
            } else {
                throw new Error(data.error || 'Ошибка загрузки');
            }
        } catch (error) {
            console.error('Ошибка:', error);
            alert(error.message);
            setIsUploading(false);
        }
    };

    return (
        <Box sx={{ backgroundColor: '#FFFFFF', minHeight: '100vh', width: '100%', margin: 0, padding: 0 }}>
            <Box sx={{
                position: 'relative',
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    height: '120px', // Height of the gradient area
                    background: 'linear-gradient(180deg, rgba(140, 177, 255, 0.39) 0%, rgba(245, 245, 250, 0) 100%)',
                    zIndex: 0,
                    pointerEvents: 'none'
                }
            }}>
                <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1, px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 3 } }}>
                    <Box textAlign="center">
                    <Typography variant="h4" gutterBottom fontWeight="bold">
                        Искусственный интеллект для анализа состояния виброгасителей, изоляторов и траверсов ЛЭП
                    </Typography>
                    <Typography variant="body1" color="textSecondary" gutterBottom>
                        Загрузите фотографии с дрона — ИИ определит повреждения автоматически
                    </Typography>

                    <Paper
                        sx={{
                            p: 4,
                            border: '3px dashed #ccc',
                            borderRadius: 2,
                            backgroundColor: isDragging ? '#e6f2ff' : '#f9f9f9',
                            transition: 'all 0.3s ease'
                        }}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        <FileUploadOutlined sx={{ fontSize: 60, color: '#2841A1', mb: 2 }} />
                        <Typography variant="h6" gutterBottom sx={{ color: '#252B42', fontSize: '16px' }}>
                            Перетащите файлы сюда
                        </Typography>
                        <Typography variant="body2" color="#808080" gutterBottom sx={{ fontSize: '14px' }}>
                            или
                        </Typography>
                        <input
                            type="file"
                            multiple
                            accept=".jpg,.jpeg,.png,.tiff,.raw,.zip"
                            style={{ display: 'none' }}
                            onChange={handleFileInput}
                            id="file-input"
                        />
                        <label htmlFor="file-input">
                            <Button
                                variant="contained"
                                component="span"
                                sx={{
                                    mt: 1,
                                    backgroundColor: '#252B42',
                                    borderRadius: '8px',
                                    textTransform: 'none',
                                    fontSize: '14px',
                                    padding: '12px 25px'
                                }}
                            >
                                Выбрать файлы
                            </Button>
                        </label>

                        <Typography variant="body2" color="#808080" sx={{ mt: 2, fontSize: '14px' }}>
                            Поддерживаемые форматы: JPG, JPEG, PNG, TIFF, RAW, ZIP
                        </Typography>
                        <Typography variant="body2" color="#808080" sx={{ mt: 1, fontSize: '14px' }}>
                            Максимальный размер: 10 ГБ
                        </Typography>
                    </Paper>

                    {uploadedFiles.length > 0 && (
                        <Box sx={{ mt: 3 }}>
                            <Typography variant="subtitle1" gutterBottom>
                                Загруженные файлы ({uploadedFiles.length})
                            </Typography>
                            <ul style={{ listStyle: 'none', padding: 0 }}>
                                {uploadedFiles.map((file, index) => (
                                    <li key={index} style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '8px 0',
                                        borderBottom: '1px solid #eee'
                                    }}>
                                        <Typography variant="body2" sx={{ flexGrow: 1 }}>{file.name} ({formatBytes(file.size)})</Typography>
                                        <Button
                                            onClick={() => removeFile(index)}
                                            sx={{ minWidth: 'auto', color: '#808080' }}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                                <line x1="6" y1="6" x2="18" y2="18"></line>
                                            </svg>
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                            <Typography variant="body2" color="textSecondary">
                                Общий размер: {formatBytes(getTotalSize())} / 10 ГБ
                            </Typography>
                        </Box>
                    )}

                    {isUploading && (
                        <Box sx={{ mt: 3 }}>
                            <Typography variant="body1">Загрузка...</Typography>
                            <LinearProgress variant="determinate" value={uploadProgress} sx={{ mt: 1 }} />
                            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                                {uploadProgress}% загружено
                            </Typography>
                        </Box>
                    )}

                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleUpload}
                        disabled={uploadedFiles.length === 0 || isUploading}
                        fullWidth
                        sx={{
                            mt: 3,
                            backgroundColor: '#252B42',
                            borderRadius: '8px',
                            textTransform: 'none',
                            fontSize: '14px',
                            padding: '12px 25px'
                        }}
                    >
                        Начать анализ
                    </Button>
                </Box>
                <Instructions/>
                </Container>
            </Box>
        </Box>
    );
};

export default MainPage;