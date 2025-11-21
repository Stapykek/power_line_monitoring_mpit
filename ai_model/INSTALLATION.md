# AI Model Service Installation Guide

This guide helps you install the dependencies for the AI model microservice, addressing common compatibility issues.

## Prerequisites

- Python 3.8-3.12 (Python 3.13 has some compatibility issues with certain packages)
- pip package manager

## Installation Steps

### Option 1: Using the Installation Script (Recommended for Windows)

1. Navigate to the ai_model directory:
   ```
   cd ai_model
   ```

2. Run the installation script:
   ```
   install_dependencies.bat
   ```

### Option 2: Manual Installation

1. Update pip:
   ```
   python -m pip install --upgrade pip
   ```

2. Install packages individually with binary wheels (to avoid compilation issues):
   ```
   pip install numpy --only-binary=all
   pip install Pillow --only-binary=all
   pip install opencv-python --only-binary=all
   pip install fastapi
   pip install uvicorn
   pip install python-multipart
   pip install ultralytics --only-binary=all
   ```

### Option 3: Using Virtual Environment

1. Create a virtual environment:
   ```
   python -m venv ai_env
   ```

2. Activate it:
   - On Windows:
     ```
     ai_env\Scripts\activate
     ```
   - On macOS/Linux:
     ```
     source ai_env/bin/activate
     ```

3. Follow either Option 1 or Option 2 above.

## Python Version Compatibility Note

If you're using Python 3.13, you may encounter compatibility issues with some packages due to the removal of `pkgutil.ImpImporter`. If this happens:

1. Try using the `--only-binary=all` flag when installing packages
2. Consider using Python 3.11 or 3.12 instead
3. If you must use Python 3.13, some packages may need to be installed from pre-compiled wheels

## Verification

After installation, you can test if the service works:

```
cd ai_model
python ai_service.py
```

The service should start on `http://localhost:5001`.