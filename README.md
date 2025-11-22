# Запуск

## 1. скачайте модель SAM: https://dl.fbaipublicfiles.com/segment_anything/sam_vit_b_01ec64.pth, и поместите его в ai_model/ai_model. Либо скачайте другую версию SAM, но переименуйте файл в sam_vit_b_01ec64.pth
## 2. Последовательно запустите следующие последовательности команд в разных экземплярах терминала
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
