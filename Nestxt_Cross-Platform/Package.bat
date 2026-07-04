@echo off
chcp 65001 >nul
cd /d "c:\Users\YFan-01\Desktop\PC-Nestxt-开发\Nestxt_PC"
pyinstaller build.spec --clean --noconfirm
echo.
echo 打包完成！exe 位于：dist\Nestxt.exe
pause