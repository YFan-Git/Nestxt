"""
窗口管理
职责：创建和管理 pywebview 窗口
"""

import os
import time
import ctypes
import win32con
import win32gui
import webview

from config import (
    ICON_FILE,
    WINDOW_BACKGROUND_COLOR,
    WINDOW_HEIGHT,
    WINDOW_MIN_HEIGHT,
    WINDOW_MIN_WIDTH,
    WINDOW_TITLE,
    WINDOW_WIDTH,
)
from utils.resource_utils import resolve_resource_path

_main_window = None
_api_instance = None


def set_api(api):
    """注入 API 实例（供 closing 事件直写 data.json 使用）"""
    global _api_instance
    _api_instance = api


def create_window(api) -> webview.Window:
    """创建主窗口"""
    global _main_window
    html_path = resolve_resource_path("Web/index.html")

    window = webview.create_window(
        title=WINDOW_TITLE,
        url=html_path,
        js_api=api,
        width=WINDOW_WIDTH,
        height=WINDOW_HEIGHT,
        resizable=True,
        min_size=(WINDOW_MIN_WIDTH, WINDOW_MIN_HEIGHT),
        background_color=WINDOW_BACKGROUND_COLOR,
    )

    _main_window = window
    window.events.loaded += _on_window_loaded
    window.events.closed += _on_window_closed
    return window


def start():
    """启动 pywebview 事件循环"""
    webview.start()


def _on_window_loaded():
    """窗口加载完成后设置图标"""
    print("[Nestxt] 窗口加载完成")
    _set_window_icon()


def _on_window_closed():
    """窗口关闭时清理资源"""
    print("[Nestxt] 窗口已关闭")
    from core.singleton import release_mutex
    release_mutex()


def _set_window_icon():
    """设置窗口图标"""
    try:
        icon_path = resolve_resource_path(ICON_FILE)
        if not os.path.exists(icon_path):
            print(f"[警告] 图标文件不存在: {icon_path}")
            return

        time.sleep(0.1)
        hwnd = win32gui.FindWindow(None, WINDOW_TITLE)
        if not hwnd:
            hwnd = win32gui.FindWindow("Chrome_WidgetWin_1", None)

        if hwnd:
            icon_handle = ctypes.windll.user32.LoadImageW(
                None, icon_path, win32con.IMAGE_ICON, 0, 0,
                win32con.LR_LOADFROMFILE | win32con.LR_DEFAULTSIZE
            )
            if icon_handle:
                win32gui.SendMessage(hwnd, win32con.WM_SETICON, win32con.ICON_BIG, icon_handle)
                win32gui.SendMessage(hwnd, win32con.WM_SETICON, win32con.ICON_SMALL, icon_handle)
                print("[Nestxt] 窗口图标已设置")
        else:
            print("[警告] 未找到窗口句柄")
    except Exception as e:
        print(f"[警告] 设置窗口图标失败: {e}")