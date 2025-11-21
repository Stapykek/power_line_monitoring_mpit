@echo off
echo Installing AI Model dependencies...

REM Update pip first
python -m pip install --upgrade pip

REM Install numpy first (often the problematic package)
echo Installing numpy...
pip install numpy --only-binary=all

REM Install other dependencies one by one
echo Installing Pillow...
pip install Pillow --only-binary=all

echo Installing opencv-python...
pip install opencv-python --only-binary=all

echo Installing fastapi...
pip install fastapi

echo Installing uvicorn...
pip install uvicorn

echo Installing python-multipart...
pip install python-multipart

echo Installing ultralytics...
pip install ultralytics --only-binary=all

echo All dependencies installed successfully!
pause