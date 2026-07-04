"""
资源路径解析工具
"""
import sys
from pathlib import Path


def resolve_resource_path(relative_path: str) -> str:
    """
    解析资源文件路径
    开发模式: 相对于 py/ 目录的父目录 (项目根目录)
    打包模式: 相对于 PyInstaller 的 _MEIPASS 临时目录
    """
    if getattr(sys, 'frozen', False):
        base_path = Path(sys._MEIPASS)
    else:
        # py/utils/ -> py/ -> 项目根目录
        base_path = Path(__file__).parent.parent.parent
    return str(base_path / relative_path)
