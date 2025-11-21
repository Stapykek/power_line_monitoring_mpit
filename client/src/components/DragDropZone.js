import React, { useState } from 'react';
import { Box, Button, Typography, TextField, Alert } from '@mui/material';
import { styled } from '@mui/system';

const VisuallyHiddenInput = styled('input')`
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  height: 1px;
  overflow: hidden;
  position: absolute;
  bottom: 0;
  left: 0;
  white-space: nowrap;
  width: 1px;
`;

export default function DragDropZone() {
    const [file, setFile] = useState(null);
    const [error, setError] = useState('');

    const handleDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        validateFile(file);
    };

    const handleSelect = (e) => {
        const file = e.target.files[0];
        validateFile(file);
    };

    const validateFile = (file) => {
        const maxSize = 10 * 1024 * 1024 * 1024; // 10GB
        const allowedTypes = [
            'image/jpeg',
            'image/png',
            'image/tiff',
            'application/zip',
            'application/x-zip-compressed',
            'application/x-tar',
            'image/raw'
        ];

        if (!file) return;

        if (file.size > maxSize) {
            setError('Превышен размер 10 ГБ');
            return;
        }

        if (!allowedTypes.includes(file.type)) {
            setError('Недопустимый формат файла');
            return;
        }

        setFile(file);
        setError('');
    };

    return (
        <Box
            sx={{
                border: '2px dashed #ccc',
                borderRadius: 2,
                p: 4,
                textAlign: 'center',
                mb: 4,
                cursor: 'pointer',
                backgroundColor: '#f5f5f5'
            }}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
        >
            <Typography variant="h6" gutterBottom>
                Перетащите файлы сюда или нажмите для выбора
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
                Поддерживаются: JPG, JPEG, PNG, TIFF, RAW, ZIP (максимум 10 ГБ)
            </Typography>
            <Button variant="contained" component="label">
                Выбрать файл
                <VisuallyHiddenInput
                    type="file"
                    onChange={handleSelect}
                    accept=".jpg,.jpeg,.png,.tiff,.raw,.zip"
                />
            </Button>
            {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                    {error}
                </Alert>
            )}
            {file && (
                <Alert severity="success" sx={{ mt: 2 }}>
                    Файл "{file.name}" готов к анализу
                </Alert>
            )}
        </Box>
    );
}