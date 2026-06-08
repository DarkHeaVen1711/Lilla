#!/bin/bash

# Terminate all background processes on script exit
trap "kill 0" EXIT

echo "=================================================="
echo "          LILLA - Development Servers            "
echo "=================================================="

# Start Django Backend
echo "--> Starting Django backend on http://127.0.0.1:8000..."
python backend/manage.py runserver &

# Wait briefly for backend server to spin up
sleep 2

# Start Next.js Frontend
echo "--> Starting Next.js frontend..."
cd frontend
npm run dev

# Wait for all background tasks
wait
