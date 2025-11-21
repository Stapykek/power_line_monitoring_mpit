#!/bin/bash
echo "Installing AI Model dependencies..."

# Update pip first
python3 -m pip install --upgrade pip

# Install numpy first (often the problematic package)
echo "Installing numpy..."
pip3 install numpy --only-binary=all

# Install other dependencies one by one
echo "Installing Pillow..."
pip3 install Pillow --only-binary=all

echo "Installing opencv-python..."
pip3 install opencv-python --only-binary=all

echo "Installing fastapi..."
pip3 install fastapi

echo "Installing uvicorn..."
pip3 install uvicorn

echo "Installing python-multipart..."
pip3 install python-multipart

echo "Installing ultralytics..."
pip3 install ultralytics --only-binary=all

echo "All dependencies installed successfully!"