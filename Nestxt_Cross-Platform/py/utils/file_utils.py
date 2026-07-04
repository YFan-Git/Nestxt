"""
文件操作工具
"""
import os


def save_file(window, content: str, suggested_name: str = 'export.txt') -> dict:
    """
    弹出保存文件对话框，将内容写入用户选择的文件
    """
    import webview
    from config import SAVE_FILE_TYPES_JSON, SAVE_FILE_TYPES_TXT

    try:
        if window is None:
            return {"success": False, "error": "窗口未初始化"}

        if suggested_name.lower().endswith('.json'):
            file_types = SAVE_FILE_TYPES_JSON
        else:
            file_types = SAVE_FILE_TYPES_TXT

        result = window.create_file_dialog(
            webview.SAVE_DIALOG,
            save_filename=suggested_name,
            file_types=file_types
        )

        if not result:
            return {"success": False, "error": "用户取消"}

        file_path = result[0] if isinstance(result, (list, tuple)) else result
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        return {"success": True, "path": file_path}
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}


def import_file(window) -> dict:
    """
    弹出打开文件对话框，返回文件内容
    """
    import webview
    from config import OPEN_FILE_TYPES

    try:
        if window is None:
            return {"success": False, "error": "窗口未初始化"}

        result = window.create_file_dialog(
            webview.OPEN_DIALOG,
            directory='',
            allow_multiple=False,
            file_types=OPEN_FILE_TYPES
        )
        if not result:
            return {"success": False, "error": "用户取消"}

        file_path = result[0] if isinstance(result, (list, tuple)) else result
        file_name = os.path.basename(file_path)

        content = None
        for encoding in ['utf-8', 'gbk', 'gb2312', 'latin-1']:
            try:
                with open(file_path, 'r', encoding=encoding) as f:
                    content = f.read()
                break
            except (UnicodeDecodeError, UnicodeError):
                continue

        if content is None:
            return {"success": False, "error": "无法识别文件编码"}

        return {"success": True, "name": file_name, "content": content}
    except Exception as e:
        return {"success": False, "error": str(e)}
