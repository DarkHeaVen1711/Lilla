@echo off
title Lilla Development Server
echo ==================================================
echo           LILLA - Development Servers            
echo ==================================================

echo --^> Starting Django backend on http://127.0.0.1:8000 in a new window...
start "Lilla Backend" cmd /c "python backend/manage.py runserver --skip-checks"

echo --^> Starting Next.js frontend...
cd frontend
set NODE_OPTIONS=--max-old-space-size=4096
npm run dev
