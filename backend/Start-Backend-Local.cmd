@echo off
setlocal
REM Forzar entorno local de desarrollo
set NODE_ENV=development
set MONGODB_URI=mongodb://localhost:27017/pangea
set CORS_ORIGINS=http://localhost:3000

REM Arrancar backend en modo dev
npm run dev
