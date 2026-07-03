# -*- mode: python ; coding: utf-8 -*-
"""
Nestxt PC 端 PyInstaller 打包配置
输出目录: Build/
"""

import os
import sys
from pathlib import Path

# 获取项目根目录
PROJECT_ROOT = Path(SPECPATH).parent if 'SPECPATH' in dir() else Path(__file__).parent

block_cipher = None

a = Analysis(
    ['py/app.py'],
    pathex=[],
    binaries=[],
    datas=[
        # Web 前端文件
        ('Web', 'Web'),
        # 图标文件
        ('icon_Dark.ico', '.'),
    ],
    hiddenimports=[
        'webview',
        'webview.platforms.edgechromium',
        'webview.platforms.winforms',
        'clr',
        'pythonnet',
        'ctypes',
        'win32gui',
        'win32con',
        'win32event',
        'win32clipboard',
        'winerror',
        'portalocker',
        'psutil',
        # core 包
        'core',
        'core.api',
        'core.storage',
        'core.singleton',
        'core.window',
        # utils 包
        'utils',
        'utils.clipboard_utils',
        'utils.file_utils',
        'utils.resource_utils',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='Nestxt',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,  # 不显示控制台
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon='icon_Dark.ico',  # exe 图标
)
