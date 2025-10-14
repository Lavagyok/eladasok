@echo off
title Hungarian Inventory & Bookkeeping App
echo.
echo ========================================
echo  Hungarian Inventory & Bookkeeping App
echo ========================================
echo.
echo Starting the application...
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    echo.
)

REM Start the development server
echo Opening the application in your browser...
echo.
echo The application will be available at: http://localhost:5173
echo.
echo To stop the application, press Ctrl+C in this window
echo.
npm run dev

pause