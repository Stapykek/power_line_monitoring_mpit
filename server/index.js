const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { unzip } = require('unzipper');
const cors = require('cors');

const app = express();
const port = 5000;

// Настройка CORS
app.use(cors({
    origin: 'http://localhost:3000', // ваш фронтенд
    methods: ['GET', 'POST'],
    credentials: true
}));

// Настройка Multer для загрузки файлов
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// Создаем директории при запуске
const sessionsDir = path.join(__dirname, 'sessions');
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(sessionsDir)) fs.mkdirSync(sessionsDir);
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

// Поиск свободного номера сессии
const getFreeSessionId = () => {
    let id = 0;
    while (fs.existsSync(path.join(sessionsDir, String(id)))) id++;
    return id;
};

// Обработка загрузки файлов
app.post('/upload', upload.array('files'), (req, res) => {
    const sessionId = getFreeSessionId();
    const sessionDir = path.join(sessionsDir, String(sessionId));
    fs.mkdirSync(sessionDir);

    // Проверка общего размера
    const totalSize = req.files.reduce((sum, file) => sum + file.size, 0);
    const MAX_SIZE = 10 * 1024 * 1024 * 1024; // 10 GB

    if (totalSize > MAX_SIZE) {
        // Удаляем загруженные файлы
        req.files.forEach(file => fs.unlinkSync(file.path));
        return res.status(400).json({ error: 'Общий размер файлов не может превышать 10 ГБ' });
    }

    // Обработка каждого файла
    req.files.forEach(file => {
        const ext = path.extname(file.originalname).toLowerCase();
        const validExtensions = ['.jpg', '.jpeg', '.png', '.tiff', '.raw', '.zip'];

        if (validExtensions.includes(ext)) {
            if (ext === '.zip') {
                // Распаковка архива
                try {
                    fs.createReadStream(file.path)
                        .pipe(unzip.Extract({ path: sessionDir }))
                        .on('finish', () => fs.unlinkSync(file.path));
                } catch (e) {
                    console.error('Ошибка распаковки:', e);
                    fs.unlinkSync(file.path);
                }
            } else {
                // Просто копируем файл
                fs.copyFileSync(file.path, path.join(sessionDir, file.originalname));
                fs.unlinkSync(file.path);
            }
        } else {
            // Удаляем невалидный файл
            fs.unlinkSync(file.path);
        }
    });

    // Сканируем сессию и оставляем только валидные изображения
    const validFiles = [];
    fs.readdirSync(sessionDir).forEach(file => {
        const ext = path.extname(file).toLowerCase();
        if (['.jpg', '.jpeg', '.png', '.tiff', '.raw'].includes(ext)) {
            validFiles.push(file);
        } else {
            fs.unlinkSync(path.join(sessionDir, file));
        }
    });

    res.json({ sessionId, totalFiles: validFiles.length });
});

// Получение файлов сессии
app.get('/sessions/:sessionId/files', (req, res) => {
    const sessionId = req.params.sessionId;
    const sessionDir = path.join(sessionsDir, sessionId);

    if (!fs.existsSync(sessionDir)) {
        return res.status(404).json({ error: 'Сессия не найдена' });
    }

    const files = fs.readdirSync(sessionDir)
        .filter(file => {
            const ext = path.extname(file).toLowerCase();
            return ['.jpg', '.jpeg', '.png', '.tiff', '.raw'].includes(ext);
        })
        .map(file => ({
            name: file,
            size: fs.statSync(path.join(sessionDir, file)).size
        }));

    res.json(files);
});

// Получение файла из сессии
app.get('/sessions/:sessionId/files/:filename', (req, res) => {
    const sessionId = req.params.sessionId;
    const filename = req.params.filename;
    const filePath = path.join(sessionsDir, sessionId, filename);

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Файл не найден' });
    }

    res.sendFile(filePath);
});

app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
});