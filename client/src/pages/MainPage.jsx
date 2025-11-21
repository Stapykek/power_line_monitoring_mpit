import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, LinearProgress, Paper, Grid, Container } from '@mui/material';
import { CloudUpload, ArrowBack } from '@mui/icons-material';
import Instructions from "../components/Instructions";

const MainPage = () => {
    const [isDragging, setIsDragging] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const navigate = useNavigate();

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

        setUploadedFiles(validFiles);
    };

    const handleFileInput = (e) => {
        const files = Array.from(e.target.files);
        const validFiles = files.filter(file =>
            validExtensions.includes(getFileExtension(file.name))
        );

        setUploadedFiles(validFiles);
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
        <Container maxWidth="sm" sx={{ py: 4 }}>
            <Box textAlign="center">
                <Typography variant="h4" gutterBottom>
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
                    <CloudUpload sx={{ fontSize: 60, color: '#666', mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                        Перетащите файлы сюда
                    </Typography>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
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
                            sx={{ mt: 1 }}
                        >
                            Выбрать файлы
                        </Button>
                    </label>

                    <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                        Поддерживаемые форматы: JPG, JPEG, PNG, TIFF, RAW, ZIP
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
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
                                <li key={index} style={{ padding: '8px 0', borderBottom: '1px solid #eee' }}>
                                    <Typography variant="body2">{file.name} ({formatBytes(file.size)})</Typography>
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
                    sx={{ mt: 3, py: 1.5 }}
                >
                    Начать анализ
                </Button>
            </Box>
            <Instructions/>
        </Container>
    );
};

export default MainPage;