@echo off
chcp 65001 >nul
title 运行 Nestxt PC 应用

echo ========================================
echo   正在启动 Nestxt PC 应用程序...
echo ========================================

REM 使用短路径名称方式（避免中文和空格问题）
pushd "C:\Users\YFan-01\Desktop\PC-Nestxt-开发\Nestxt_PC\py"

if errorlevel 1 (
    echo [错误] 无法进入目标目录！
    echo 请检查路径是否正确: C:\Users\YFan-01\Desktop\PC-Nestxt-开发\Nestxt_PC\py
    pause
    exit /b 1
)

echo 当前目录: %CD%
echo.

REM 使用 py 启动器（更可靠）
echo 正在运行 app.py ...
py app.py

if errorlevel 1 (
    echo.
    echo [错误] 运行失败，尝试使用 python 命令...
    python app.py
)

if errorlevel 1 (
    echo.
    echo [错误] 程序运行异常，请检查上方错误信息！
) else (
    echo.
    echo 程序已正常退出
)

popd
pause