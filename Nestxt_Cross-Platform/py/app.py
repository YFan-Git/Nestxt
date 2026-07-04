"""
Nestxt PC 端 - pywebview 主入口
职责：创建桌面窗口，注入 Python API
"""

import sys
import os
from core.api import Api
from core.singleton import check_single_instance, release_mutex
from core.window import create_window, start, set_api
from utils.resource_utils import resolve_resource_path


def main():
    """主函数"""
    print("[Nestxt] 应用启动...")

    # 单实例检查
    if not check_single_instance():
        print("[Nestxt] 已有实例运行，当前进程退出")
        sys.exit(0)

    # 验证前端文件存在
    html_path = resolve_resource_path("Web/index.html")
    if not os.path.exists(html_path):
        print(f"[错误] 找不到前端文件: {html_path}")
        print(f"当前工作目录: {os.getcwd()}")
        return

    print(f"[Nestxt] 加载前端: {html_path}")

    # 创建 API 实例
    api = Api()

    # 注入 API 实例到窗口模块（供 closing 事件直写 data.json）
    set_api(api)

    # 创建窗口
    window = create_window(api)

    # 将窗口引用注入到 API（用于文件对话框等操作）
    api.set_window(window)

    print("[Nestxt] 启动事件循环...")

    try:
        start()
    except Exception as e:
        print(f"[Nestxt] 事件循环异常: {e}")
    finally:
        print("[Nestxt] 清理资源...")
        release_mutex()
        print("[Nestxt] 应用退出")


if __name__ == '__main__':
    main()