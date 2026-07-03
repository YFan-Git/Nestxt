"""
StorageEngine - 存储引擎实现
职责：提供本地文件存储，对接 StorageBridge 的 4 个 API
特性：线程安全、路径自适应、备份写入防数据损坏
"""

import json
import os
import threading
from pathlib import Path

from config import APP_DATA_DIR, DATA_FILE_NAME, DATA_BACKUP_SUFFIX


class StorageEngine:
    """本地文件存储引擎"""

    def __init__(self):
        """初始化存储引擎，自动创建数据文件"""
        self._lock = threading.Lock()
        self._data_path = self._resolve_data_path()
        self._ensure_data_file()

    def _resolve_data_path(self) -> Path:
        """
        解析数据文件路径
        统一存储到 %APPDATA%/Nestxt/UserData/data.json
        """
        appdata = os.getenv('APPDATA')
        if not appdata:
            appdata = str(Path.home() / 'AppData' / 'Roaming')
        base_dir = Path(appdata) / APP_DATA_DIR
        return base_dir / DATA_FILE_NAME

    def _ensure_data_file(self):
        """确保数据文件存在，不存在则创建空文件"""
        try:
            self._data_path.parent.mkdir(parents=True, exist_ok=True)
            if not self._data_path.exists():
                self._write_data({})
                print(f"[StorageEngine] 创建数据文件: {self._data_path}")
        except Exception as e:
            print(f"[StorageEngine] 创建数据文件失败: {e}")

    def _read_data(self) -> dict:
        """读取数据文件（内部方法，需在锁内调用）"""
        try:
            if not self._data_path.exists():
                return {}
            with open(self._data_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"[StorageEngine] 读取数据失败: {e}")
            return {}

    def _write_data(self, data: dict) -> bool:
        """
        写入数据文件（内部方法，需在锁内调用）
        策略：先备份再覆盖，防止数据损坏
        """
        try:
            if self._data_path.exists():
                backup_path = self._data_path.with_suffix(DATA_BACKUP_SUFFIX)
                try:
                    with open(self._data_path, 'r', encoding='utf-8') as src:
                        content = src.read()
                    with open(backup_path, 'w', encoding='utf-8') as dst:
                        dst.write(content)
                except Exception as e:
                    print(f"[StorageEngine] 备份失败: {e}")

            with open(self._data_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            return True
        except Exception as e:
            print(f"[StorageEngine] 写入数据失败: {e}")
            return False

    def set_item(self, key: str, value: str) -> dict:
        """存储数据"""
        with self._lock:
            try:
                data = self._read_data()
                data[key] = value
                if self._write_data(data):
                    return {"success": True}
                return {"success": False, "error": "写入失败"}
            except Exception as e:
                print(f"[StorageEngine] set_item 错误: {e}")
                return {"success": False, "error": str(e)}

    def get_item(self, key: str):
        """读取数据"""
        with self._lock:
            try:
                data = self._read_data()
                return data.get(key)
            except Exception as e:
                print(f"[StorageEngine] get_item 错误: {e}")
                return None

    def remove_item(self, key: str) -> dict:
        """删除指定 key"""
        with self._lock:
            try:
                data = self._read_data()
                if key in data:
                    del data[key]
                    if self._write_data(data):
                        return {"success": True}
                    return {"success": False, "error": "写入失败"}
                return {"success": True}
            except Exception as e:
                print(f"[StorageEngine] remove_item 错误: {e}")
                return {"success": False, "error": str(e)}

    def clear(self) -> dict:
        """清空所有数据"""
        with self._lock:
            try:
                if self._write_data({}):
                    return {"success": True}
                return {"success": False, "error": "写入失败"}
            except Exception as e:
                print(f"[StorageEngine] clear 错误: {e}")
                return {"success": False, "error": str(e)}