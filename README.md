# Запуск

## Последовательно запустите следующие последовательности команд в разных экземплярах терминала
Запуск ИИ-микросервиса:
```bash
cd ai_model
python -m venv ai_env
python <ai_env>/bin/activate
pip install -r requirements.txt
python ai_service.py
```

Запуск фронтенда:
```bash
cd client
npm start
```

Запуск бэкенда:
```bash
cd server
npm start
```
