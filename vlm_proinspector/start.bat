@echo off
echo Starting ProInspector Development Servers...

echo.
echo ====================================================
echo Starting FastAPI backend (http://localhost:8000)
echo ====================================================
echo.

start cmd /k "cd backend && python -m uvicorn main:app --reload"

echo.
echo ====================================================
echo Starting React frontend (http://localhost:5173)
echo ====================================================
echo.

start cmd /k "cd frontend && npm run dev"

echo.
echo ProInspector development servers started!
echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173
echo.
echo Press any key to exit this window...
pause > nul
