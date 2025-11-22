const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const unzipper = require('unzipper');
const cors = require('cors');
const AIServiceClient = require('./ai_service_client');

const app = express();
const port = 5000;

// Initialize AI service client
const aiServiceClient = new AIServiceClient();

// Настройка CORS
app.use(cors({
    origin: 'http://localhost:3000', // ваш фронтенд
    methods: ['GET', 'POST'],
    credentials: true
}));

// Настройка Multer для загрузки файлов
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const safeName = Date.now() + '-' + Math.random().toString(36).substr(2, 9) + ext;
        cb(null, safeName);
    }
});
const upload = multer({ storage });

// Создаем директории при запуске
const sessionsDir = process.env.NODE_ENV === 'production' ? '/app/sessions' : path.join(__dirname, 'sessions');
const uploadsDir = process.env.NODE_ENV === 'production' ? '/app/uploads' : path.join(__dirname, 'uploads');
if (!fs.existsSync(sessionsDir)) fs.mkdirSync(sessionsDir);
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

// Поиск свободного номера сессии
const getFreeSessionId = () => {
    let id = 0;
    while (fs.existsSync(path.join(sessionsDir, String(id)))) id++;
    return id;
};

// Обработка загрузки файлов
app.post('/upload', upload.array('files'), async (req, res) => {
    const sessionId = getFreeSessionId();
    const sessionDir = path.join(sessionsDir, String(sessionId));
    fs.mkdirSync(sessionDir);
    fs.openSync(`${sessionDir}/results.json`, 'w');
    // Create mapping for original to server filenames
    const filenameMapping = {};
    const originalToServerNames = new Map(); // Map to track original to server name mapping

    // Проверка общего размера
    const totalSize = req.files.reduce((sum, file) => sum + file.size, 0);
    const MAX_SIZE = 10 * 1024 * 1024 * 1024; // 10 GB

    if (totalSize > MAX_SIZE) {
        // Удаляем загруженные файлы
        req.files.forEach(file => fs.unlinkSync(file.path));
        return res.status(400).json({ error: 'Общий размер файлов не может превышать 10 ГБ' });
    }

    // Обработка каждого файла
    const promises = req.files.map(async (file) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const validExtensions = ['.jpg', '.jpeg', '.png', '.tiff', '.raw', '.zip'];

        if (!validExtensions.includes(ext)) {
            fs.unlinkSync(file.path);
            return;
        }

        if (ext === '.zip') {
            try {
                // Проверяем существование файла перед распаковкой
                if (!fs.existsSync(file.path)) {
                    throw new Error(`Файл не найден: ${file.path}`);
                }

                const unzipStream = fs.createReadStream(file.path).pipe(unzipper.Extract({ path: sessionDir }));
                await new Promise((resolve, reject) => {
                    unzipStream.on('finish', resolve);
                    unzipStream.on('error', reject);
                });
                fs.unlinkSync(file.path);
            } catch (e) {
                console.error('Ошибка распаковки ZIP:', e);
                fs.unlinkSync(file.path);
                throw new Error('Невозможно распаковать архив');
            }
        } else {
            // Copy file with a temporary name that preserves original name info
            const tempName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${file.originalname}`;
            const tempPath = path.join(sessionDir, tempName);
            fs.copyFileSync(file.path, tempPath);
            fs.unlinkSync(file.path);
            
            // Store the mapping for later when we rename to sequential numbers
            originalToServerNames.set(tempName, file.originalname);
        }
    });

    await Promise.all(promises);

    // Переименовываем все файлы в последовательные числа и сохраняем mapping
    const files = fs.readdirSync(sessionDir);
    let serverFileIndex = 0;
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const ext = path.extname(file).toLowerCase();
        if (['.jpg', '.jpeg', '.png', '.tiff', '.raw'].includes(ext)) {
            // Create server filename (sequential number)
            const newFileName = `${serverFileIndex}${ext}`;
            const oldPath = path.join(sessionDir, file);
            const newPath = path.join(sessionDir, newFileName);
            
            fs.renameSync(oldPath, newPath);
            
            // Find the original name using our mapping
            const originalName = originalToServerNames.get(file) || newFileName;
            filenameMapping[originalName] = newFileName;
            
            serverFileIndex++;
        } else {
            fs.unlinkSync(path.join(sessionDir, file));
        }
    }

    // Save the filename mapping to metadata.json
    const metadataPath = path.join(sessionDir, 'metadata.json');
    const metadata = {
        filename_mapping: filenameMapping,
        upload_time: new Date().toISOString()
    };
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

    // Получаем список валидных файлов для ответа
    const validFiles = fs.readdirSync(sessionDir)
        .filter(file => {
            const ext = path.extname(file).toLowerCase();
            return ['.jpg', '.jpeg', '.png', '.tiff', '.raw'].includes(ext);
        })
        .map(file => ({
            name: file,
            size: fs.statSync(path.join(sessionDir, file)).size
        }));

    // Trigger AI analysis in the background
    setTimeout(() => {
        aiServiceClient.analyzeSession(sessionId)
        .then(data => {
            console.log(`AI analysis started for session ${sessionId}:`, data);
        })
        .catch(error => {
            console.error(`Error triggering AI analysis: ${error}`);
        });
    }, 100); // Small delay to ensure files are properly written

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

// Получение результатов анализа для сессии
app.get('/analysis/:sessionId/results', async (req, res) => {
    const sessionId = req.params.sessionId;
    const sessionDir = path.join(sessionsDir, sessionId);
    const resultsPath = path.join(sessionDir, 'results.json');

    // First, try to read results from the local file
    if (fs.existsSync(resultsPath)) {
        const readFile = fs.readFileSync(resultsPath, "utf8");
        if (readFile.length > 2) {
            const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
            return res.json(results);
        }
    }

    // If file doesn't exist, try to get results from AI service
    try {
        const results = await aiServiceClient.getResults(sessionId);
        return res.json(results);
    } catch (error) {
        console.error(`Error getting results from AI service: ${error}`);
        return res.status(404).json({ error: 'Результаты анализа не найдены' });
    }
});

// Получение статуса анализа для сессии
app.get('/analysis/:sessionId/status', async (req, res) => {
    const sessionId = req.params.sessionId;
    const sessionDir = path.join(sessionsDir, sessionId);
    const resultsPath = path.join(sessionDir, 'results.json');

    // Check if results exist
    if (fs.existsSync(resultsPath)) {
        return res.json({ status: 'completed' });
    }

    // Otherwise, check status from AI service
    try {
        const statusData = await aiServiceClient.getStatus(sessionId);
        res.json(statusData);
    } catch (error) {
        // If there's an error contacting the AI service, assume processing
        console.error(`Error getting status from AI service: ${error}`);
        res.json({ status: 'processing' });
    }
});

app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
});