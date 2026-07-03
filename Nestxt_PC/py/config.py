"""
应用配置常量
"""

# 单实例控制
MUTEX_NAME = "Global\\NestxtSingleInstanceMutex"

# 窗口配置
WINDOW_TITLE = "Nestxt 文本编辑器"
WINDOW_WIDTH = 1200
WINDOW_HEIGHT = 800
WINDOW_MIN_WIDTH = 800
WINDOW_MIN_HEIGHT = 600
WINDOW_BACKGROUND_COLOR = "#212326"

# 资源文件
ICON_FILE = "icon_Dark.ico"
FRONTEND_PATH = "Web/index.html"

# 文件对话框
SAVE_FILE_TYPES_JSON = ("JSON 文件 (*.json)",)
SAVE_FILE_TYPES_TXT = ("文本文件 (*.txt)",)
OPEN_FILE_TYPES = (
    "文本文件 (*.txt;*.csv;*.log;*.ini;*.json;*.xml;*.html;*.css;*.js;*.py;*.c;*.cpp)",
    "所有文件 (*.*)"
)

# 存储配置
APP_DATA_DIR = "Nestxt/UserData"
DATA_FILE_NAME = "data.json"
DATA_BACKUP_SUFFIX = ".json.bak"
