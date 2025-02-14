@echo off
SETLOCAL ENABLEDELAYEDEXPANSION

:: Step 1: Check if Python is Installed
where python >nul 2>nul
IF %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Python is not installed. Please install Python first.
    exit /b
)

:: Step 2: Check if Node.js is Installed
where node >nul 2>nul
IF %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js first.
    exit /b
)

:: Step 3: Check if MySQL is Installed
where mysql >nul 2>nul
IF %ERRORLEVEL% NEQ 0 (
    echo [ERROR] MySQL is not installed. Please install MySQL first.
    exit /b
)

:: Step 4: Create Database if it doesn't exist
echo [INFO] Setting up MySQL database...
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS project_db;"

:: Step 5: Import SQL Dump if Available
IF EXIST "project_db.sql" (
    echo [INFO] Importing database from project_db.sql...
    mysql -u root -p project_db < project_db.sql
) ELSE (
    echo [WARNING] project_db.sql not found. Skipping import.
)

:: Step 6: Create & Activate Python Virtual Environment
echo [INFO] Setting up Python virtual environment...
cd backend
python -m venv ../.venv
CALL ..\.venv\Scripts\activate

:: Step 7: Install Python Dependencies
echo [INFO] Installing backend dependencies...
pip install --upgrade pip
pip install -r ../requirements.txt

:: Step 8: Run Flask Migrations (Ensure DB is Up to Date)
echo [INFO] Running database migrations...
flask db upgrade

:: Step 9: Start Flask Server in New Terminal
start cmd /k "CALL ..\.venv\Scripts\activate && flask run"

:: Step 10: Setup React Frontend
cd ../frontend
echo [INFO] Installing frontend dependencies...
CALL npm install

:: Step 11: Start React Development Server in New Terminal
start cmd /k "cd ..\frontend && npm start"

echo [INFO] Setup complete! Flask and React servers are running.
ENDLOCAL
exit /b
