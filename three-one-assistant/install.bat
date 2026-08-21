@echo off
cd /d "D:\Desktop\VibeCoding\三位一体辅助系统\three-one-assistant"
rmdir /s /q node_modules 2>nul
del package-lock.json 2>nul
call npm install
echo DONE
