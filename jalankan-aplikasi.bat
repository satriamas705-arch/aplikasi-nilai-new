@echo off
title Server Aplikasi Penilaian Terpadu SMP
echo ===============================================================
echo   MENJALANKAN APLIKASI PENILAIAN TERPADU SMP
echo   URL Akses: http://localhost:8080
echo ===============================================================
start http://localhost:8080
if exist "C:\xampp\php\php.exe" (
    "C:\xampp\php\php.exe" -S localhost:8080 -t "%~dp0"
) else (
    php -S localhost:8080 -t "%~dp0"
)
pause
