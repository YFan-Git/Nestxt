"""
剪贴板操作工具
"""


def clipboard_copy(text: str) -> dict:
    """复制文本到剪贴板"""
    try:
        import win32clipboard
        win32clipboard.OpenClipboard()
        win32clipboard.EmptyClipboard()
        win32clipboard.SetClipboardText(text, win32clipboard.CF_UNICODETEXT)
        win32clipboard.CloseClipboard()
        return {"success": True}
    except Exception as e:
        return {"success": False, "error": str(e)}


def clipboard_paste() -> dict:
    """从剪贴板获取文本"""
    try:
        import win32clipboard
        win32clipboard.OpenClipboard()
        try:
            text = win32clipboard.GetClipboardData(win32clipboard.CF_UNICODETEXT)
        except Exception:
            text = ""
        win32clipboard.CloseClipboard()
        return {"success": True, "text": text}
    except Exception as e:
        return {"success": False, "error": str(e)}
