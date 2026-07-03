"""
单实例管理
职责：确保应用只有一个实例运行，使用 Windows 互斥体 (Mutex)
"""

import ctypes
import sys


# 互斥体句柄
_mutex_handle = None


def _show_message(title, message):
    """使用 Win32 MessageBox 弹窗提示"""
    MB_OK = 0
    MB_ICONINFORMATION = 0x40
    ctypes.windll.user32.MessageBoxW(0, message, title, MB_OK | MB_ICONINFORMATION)


def check_single_instance() -> bool:
    """
    检查是否已有实例运行
    :return: True 表示当前是唯一实例，False 表示已有实例运行
    """
    global _mutex_handle

    mutex_name = "NestxtApp_Mutex_{F7B3C8D9-E4A5-4F2C-9B8A-7D6E5F4C3B2A}"

    try:
        # 创建互斥体
        _mutex_handle = ctypes.windll.kernel32.CreateMutexW(None, False, mutex_name)

        if not _mutex_handle:
            print("[单实例] 创建互斥体失败")
            return True  # 创建失败时允许启动

        # 检查是否已有实例
        last_error = ctypes.windll.kernel32.GetLastError()
        if last_error == 183:  # ERROR_ALREADY_EXISTS
            print("[单实例] 检测到已有实例运行")
            if _mutex_handle:
                ctypes.windll.kernel32.CloseHandle(_mutex_handle)
                _mutex_handle = None
            # 弹窗提示用户
            _show_message("Nestxt", "Nestxt 已在运行，请勿重复启动。")
            return False

        print("[单实例] 互斥体创建成功，当前为唯一实例")
        return True

    except Exception as e:
        print(f"[单实例] 检查失败: {e}")
        return True


def release_mutex():
    """释放互斥体"""
    global _mutex_handle
    if _mutex_handle:
        try:
            ctypes.windll.kernel32.CloseHandle(_mutex_handle)
            _mutex_handle = None
            print("[单实例] 互斥体已释放")
        except Exception as e:
            print(f"[单实例] 释放互斥体失败: {e}")