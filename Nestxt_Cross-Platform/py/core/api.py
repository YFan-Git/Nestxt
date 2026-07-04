"""
API 接口类
职责：提供前端可调用的 Python 方法
"""

from core.storage import StorageEngine
from utils.file_utils import save_file, import_file
from utils.clipboard_utils import clipboard_copy, clipboard_paste


class Api:
    """Python API 接口，供前端调用"""

    def __init__(self):
        self.engine = StorageEngine()
        self._window = None

    def set_window(self, window):
        """设置窗口引用（用于文件对话框操作）"""
        self._window = window

    # ── 存储 API ──

    def setItem(self, key: str, value: str) -> dict:
        """存储数据"""
        print(f"[API] setItem: {key} (len={len(value)})")
        return self.engine.set_item(key, value)

    def getItem(self, key: str):
        """读取数据"""
        result = self.engine.get_item(key)
        print(f"[API] getItem: {key} -> {'<data>' if result else 'None'}")
        return result

    def removeItem(self, key: str) -> dict:
        """删除指定 key"""
        print(f"[API] removeItem: {key}")
        return self.engine.remove_item(key)

    def clear(self) -> dict:
        """清空所有数据"""
        print("[API] clear")
        return self.engine.clear()

    # ── 工具 API ──

    def ping(self) -> str:
        """测试 API 桥接是否正常"""
        print("[API] ping 被调用 - API 桥接正常！")
        return "pong"

    def debugLog(self, msg: str) -> None:
        """前端调试日志输出到 Python 终端"""
        print(f"[Frontend] {msg}")

    # ── 文件操作 API ──

    def saveFile(self, content: str, suggested_name: str = 'export.txt') -> dict:
        """弹出保存文件对话框，将内容写入用户选择的文件"""
        print(f"[API] saveFile 被调用: suggested_name={suggested_name}, content_len={len(content)}")
        return save_file(self._window, content, suggested_name)

    def importFile(self) -> dict:
        """弹出打开文件对话框，返回文件内容"""
        return import_file(self._window)

    # ── 窗口控制 API ──

    def closeWindow(self) -> dict:
        """关闭应用程序窗口（供前端 beforeunload 保存完成后调用）"""
        print("[API] closeWindow 被调用 - 关闭窗口")
        if self._window:
            self._window.destroy()
            return {"success": True}
        return {"success": False, "error": "窗口引用不存在"}

    # ── 剪贴板 API ──

    def clipboardCopy(self, text: str) -> dict:
        """复制文本到剪贴板"""
        return clipboard_copy(text)

    def clipboardPaste(self) -> dict:
        """从剪贴板获取文本"""
        return clipboard_paste()