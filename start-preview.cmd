@echo off

chcp 65001 >nul

cd /d "%~dp0"

echo 预览地址：http://127.0.0.1:8767

node scripts/dev/server.mjs

pause

