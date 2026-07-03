# Nestxt 文本编辑器

---

## 📋 项目概述

Nestxt 是一款采用**事件驱动架构**与**三层存储设计**的企业级文本编辑器，提供 Web 端与 PC 桌面端双平台支持。系统支持无限层级文件夹管理、多标签并发编辑、版本控制、自定义语法高亮、多编码智能识别等企业级功能。

| 版本 | 架构模式 | 技术栈 | 部署方式 |
|------|----------|--------|----------|
| **Web 版** | 纯前端 MVC | ES6 + CSS3 + localStorage | Netlify 静态托管 |
| **PC 版** | 混合架构 (Web + Native) | Python + pywebview + PyInstaller | 独立可执行文件 |

- Nestxt Web 地址：[https://nestxt-web-yfan.netlify.app/](https://nestxt-web-yfan.netlify.app/)
- Nestxt PC 下载地址：[Nestxt_Winx64_exe.zip](https://github.com/YFan-Git/Nestxt/releases/download/Nestxt_v1.0/Nestxt_Winx64_exe.zip)

---

## 🏗️ 架构设计

### 整体架构

Nestxt 采用分层解耦的架构设计，核心模块职责清晰：

```
┌──────────────────────────────────────────────────────────────┐
│                    应用层 (Application Layer)               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Dialogs   │  │Version Panel│  │   Settings Panel    │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
├──────────────────────────────────────────────────────────────┤
│                   控制器层 (Controller Layer)               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Editor    │  │  Sidebar    │  │  Tab / Search / Drag│ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
├──────────────────────────────────────────────────────────────┤
│                    服务层 (Service Layer)                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │  FolderSvc  │  │   FileSvc   │  │  TabSvc / TrashSvc  │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                StorageService (业务存储层)              │ │
│  └─────────────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────────────┤
│                   核心层 (Core Layer)                       │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │   Signal 事件总线  ·  Constants  ·  Icons  ·  Autoload │ │
│  └─────────────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────────────┤
│                   存储层 (Storage Layer)                    │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │   StorageBridge (技术层) → localStorage / Python FS    │ │
│  └─────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

### PC 版混合架构详解

PC 版通过 **pywebview** 实现 Web 技术与原生能力的融合：

```
┌──────────────────────────────────────────────────────────────┐
│                    Web 前端层 (代码共享)                     │
│              HTML/CSS/JS · 与 Web 版 100% 复用              │
├──────────────────────────────────────────────────────────────┤
│              StorageBridge (存储桥接层)                      │
│            setEngine() 注入自定义存储引擎                    │
├──────────────────────────────────────────────────────────────┤
│              pywebview JS API 桥接                          │
│            JS ↔ Python 跨进程通信 (IPC)                     │
├──────────────────────────────────────────────────────────────┤
│                Python API 层                                │
│      setItem / getItem / saveFile / clipboardCopy           │
├──────────────────────────────────────────────────────────────┤
│                Python 后端层                                │
│    Window Manager · StorageEngine · Singleton Controller    │
└──────────────────────────────────────────────────────────────┘
```

### 三层存储架构

| 层级 | 职责 | Web 实现 | PC 实现 |
|------|------|----------|---------|
| **技术层** (StorageBridge) | 原始读写接口 | localStorage | Python StorageEngine |
| **业务层** (StorageService) | 16 个数据键管理 + 防抖写入 | 共享代码 | 共享代码 |
| **服务层** (Folder/File/Trash) | 业务语义封装 | 共享代码 | 共享代码 |

---

## ✨ 核心功能矩阵

### 基础功能

| 功能模块 | 能力描述 | 技术实现 |
|----------|----------|----------|
| **文件夹管理** | 无限层级嵌套、拖拽移动、内联重命名 | 树形数据结构 + 递归算法 |
| **多标签编辑** | 无限制标签页、拖拽排序、激活状态管理 | TabService + 事件驱动 |
| **版本控制** | 每文件 20 个历史快照、标签命名、版本切换 | 快照模式 + 时间戳 ID |
| **语法高亮** | 自定义正则规则、HEX 色值、实时渲染 | 覆盖层 + 正则匹配 + 降级策略 |
| **编码识别** | UTF-8/GBK/GB2312/Big5 自动检测 | BOM 检测 + UTF-8 验证 + 多编码回退 |
| **回收站** | 软删除、恢复、永久删除、清空 | 独立存储 + 元数据保留 |
| **搜索系统** | 文件名 + 内容搜索、防抖处理 | 线性搜索 + 300ms 防抖 |
| **自动保存** | 可配置间隔 (30s/2m/5m/10m) | TimeService 定时器 |

### PC 版独家功能

| 功能 | 实现方案 |
|------|----------|
| **本地文件存储** | `%APPDATA%/Nestxt/UserData/data.json`，自动备份 `.bak` |
| **系统文件对话框** | pywebview `create_file_dialog` |
| **剪贴板集成** | Win32 API (`win32clipboard`) |
| **单实例控制** | Windows Mutex 互斥体 |
| **窗口管理** | 图标设置、尺寸控制、事件监听 |
| **资源路径自适应** | `sys.frozen` + `sys._MEIPASS` 自动切换 |

---

## 📁 项目结构

```
Nestxt/
│
├── Nestxt_Web/                         # Web 端 (纯前端)
│   ├── index.html                      # 主入口
│   ├── docs.html                       # 在线文档
│   ├── css/                            # 样式系统
│   │   ├── base.css                    # CSS 变量 + 全局重置 + 主题
│   │   ├── layout.css                  # 标题栏 + 侧边栏
│   │   ├── tree.css                    # 文件树
│   │   ├── tabs.css                    # 标签页栏
│   │   ├── editor.css                  # 编辑器 + 工具栏
│   │   └── version.css                 # 版本面板
│   ├── js/
│   │   ├── app.js                      # 应用入口 & 初始化
│   │   ├── core/                       # 核心基础设施
│   │   │   ├── Signal.js               # 事件总线 (发布-订阅)
│   │   │   ├── Constants.js            # 全局常量 & 事件定义
│   │   │   ├── Icons.js                # 图标统一管理
│   │   │   └── Autoload.js             # 服务注册 & DI
│   │   ├── services/                   # 服务层 (业务逻辑)
│   │   │   ├── StorageBridge.js        # 存储桥接 (可注入引擎)
│   │   │   ├── StorageService.js       # 业务存储 (16 数据键)
│   │   │   ├── FolderService.js        # 文件夹 CRUD
│   │   │   ├── FileService.js          # 文件 + 版本管理
│   │   │   ├── TabService.js           # 标签页管理
│   │   │   ├── TrashService.js         # 回收站管理
│   │   │   ├── AutoSaveService.js      # 自动保存
│   │   │   └── TextFileReader.js       # 多格式读取 + 编码检测
│   │   ├── controllers/                # 控制器层 (UI 交互)
│   │   │   ├── EditorController.js     # 编辑器核心 (行号/高亮/树图)
│   │   │   ├── SidebarController.js    # 侧边栏门面 (Facade)
│   │   │   ├── TabController.js        # 标签栏渲染
│   │   │   ├── ThemeController.js      # 主题切换
│   │   │   ├── SearchController.js     # 搜索功能
│   │   │   ├── DragController.js       # 拖拽交互
│   │   │   └── ContextMenuController.js # 右键菜单
│   │   └── app/                        # 应用组件
│   │       ├── dialogs.js              # 对话框系统
│   │       ├── version-panel.js        # 版本面板
│   │       ├── trash-panel.js          # 回收站面板
│   │       ├── file-ops.js             # 文件操作
│   │       └── settings.js             # 设置菜单
│   ├── icon/                           # 图标资源
│   ├── font/                           # 字体文件
│   └── docs/                           # 在线文档
│
└── Nestxt_PC/                          # PC 桌面端
    ├── py/                             # Python 后端
    │   ├── app.py                      # 应用主入口
    │   ├── config.py                   # 配置常量
    │   ├── requirements.txt            # Python 依赖
    │   ├── core/                       # 核心模块
    │   │   ├── api.py                  # API 接口类 (JS 桥接)
    │   │   ├── storage.py              # StorageEngine (本地文件)
    │   │   ├── window.py               # 窗口管理
    │   │   └── singleton.py            # 单实例控制 (Mutex)
    │   └── utils/                      # 工具模块
    │       ├── file_utils.py           # 文件对话框
    │       ├── clipboard_utils.py      # 剪贴板操作
    │       └── resource_utils.py       # 路径自适应
    ├── Web/                            # 前端代码 (与 Web 版共享)
    ├── data/                           # 开发环境数据目录
    ├── dist/                           # 打包输出
    ├── build.spec                      # PyInstaller 配置
    └── icon_Dark.ico                   # 应用图标
```

---

## 🔧 技术实现要点

### 事件驱动通信

所有模块通过 `Signal` 事件总线进行解耦通信：

```javascript
// 事件定义
signal.emit(FILE_SAVED, { fileId, content });

// 事件监听
signal.on(FILE_SAVED, ({ fileId }) => {
    updateStatusBar(fileId);
});
```

**核心事件分类**：文件事件、文件夹事件、标签页事件、编辑器事件、主题事件、视图事件、回收站事件、搜索事件、拖拽事件、版本管理事件、编码事件、存储事件（共 40+ 事件类型）

### 语法高亮实现

- **双图层技术**：`textarea` 输入层（透明文字）+ `pre` 高亮层（彩色 HTML）
- **滚动同步**：CSS `transform: translate(-scrollLeft, -scrollTop)` 像素级对齐
- **性能降级**：高亮匹配 > 3000 个时自动切换为纯文本显示
- **自定义规则**：支持数字匹配 + 自定义正则表达式 + HEX 色值

### 版本管理系统

- **快照模式**：版本保存后不可变，形成历史时间线
- **编辑状态跟踪**：`_editingVersionMap` 按文件 ID 独立维护
- **容量控制**：每文件最多 20 个版本，超限自动清理最早版本
- **预览机制**：查看历史版本内容不进入编辑模式

### PC 端存储引擎

```python
class StorageEngine:
    def __init__(self):
        self._lock = threading.Lock()  # 线程安全
    
    def set_item(self, key: str, value: str) -> dict:
        with self._lock:
            # 1. 自动备份 data.json → data.json.bak
            # 2. 写入新数据
            # 3. 返回操作结果
```

**数据路径**：`%APPDATA%/Nestxt/UserData/data.json`

---

## 📊 核心数据结构

### TypeScript 接口定义

```typescript
// 文件夹
interface Folder {
    id: number;
    name: string;
    parentId: number | null;
    expanded: boolean;
}

// 文件
interface File {
    id: number;
    name: string;
    folderId: number | null;
    content: string;
    encoding: string;          // UTF-8 | GBK | GB2312 | Big5
    createdAt: string;         // ISO 8601
    updatedAt: string;         // ISO 8601
    versions?: Version[];
}

// 版本
interface Version {
    id: number;                // 时间戳
    content: string;
    label: string;
    createdAt: string;
}

// 回收站
interface TrashItem {
    id: number;
    type: 'file' | 'folder';
    name: string;
    parentId: number | null;
    content: string | null;
    deletedAt: string;
}

// 语法规则
interface SyntaxRule {
    name: string;
    type: 'number' | 'custom';
    color: string;             // HEX
    pattern?: string;          // 自定义正则
}
```

### 存储键定义

```javascript
const STORAGE_KEYS = {
    FOLDERS: 'nestxt_folders',
    FILES: 'nestxt_files',
    TABS: 'nestxt_tabs',
    ACTIVE_TAB: 'nestxt_activeTab',
    TRASH: 'nestxt_trash',
    THEME: 'nestxt_theme',
    FONTSIZE: 'nestxt_fontsize',
    LINENUM: 'nestxt_linenum',
    SIDEBAR_WIDTH: 'nestxt_sidebar_width',
    WORDWRAP: 'nestxt_wordwrap',
    VERSION_PANEL_WIDTH: 'nestxt_version_panel_width',
    AUTOSAVE_INTERVAL: 'nestxt_autosave_interval',
    SYNTAX: 'nestxt_syntax',
    SYNTAX_HIGHLIGHT: 'nestxt_syntax_highlight',
    EDITING_VERSIONS: 'nestxt_editing_versions'
};
```

---

## 📖 API 参考

### 前端 API (StorageBridge)

```javascript
// 存储操作 (返回 Promise)
await StorageBridge.setItem('key', value);
const data = await StorageBridge.getItem('key');
await StorageBridge.removeItem('key');
await StorageBridge.clear();

// 注入自定义存储引擎 (PC 版)
StorageBridge.setEngine(window.pywebview.api);
```

### PC 版 Python API

```python
class Api:
    # 存储接口
    def setItem(self, key: str, value: str) -> dict
    def getItem(self, key: str) -> str | None
    def removeItem(self, key: str) -> dict
    def clear(self) -> dict
    
    # 系统接口
    def saveFile(self, content: str, suggested_name: str = 'export.txt') -> dict
    def importFile(self) -> dict
    def clipboardCopy(self, text: str) -> dict
    def clipboardPaste(self) -> dict
    def closeWindow(self) -> dict
    
    # 诊断接口
    def ping(self) -> str
    def debugLog(self, msg: str) -> None
```

### 服务层 API

```javascript
// FolderService
FolderService.create(name, parentId)
FolderService.rename(id, newName)
FolderService.remove(id)          // 递归删除
FolderService.move(id, targetId)

// FileService
FileService.create(name, folderId, content)
FileService.saveContent(id, content)
FileService.saveVersion(fileId, label, content)
FileService.restoreVersion(fileId, versionId)
FileService.search(query)          // 文件名 + 内容
FileService.move(fileId, targetFolderId)

// TabService
TabService.open(fileId)
TabService.close(fileId)
TabService.switchTo(fileId)
TabService.reorder(fromId, toId)

// TrashService
TrashService.addFile(file)
TrashService.restore(trashId)
TrashService.empty()
```

---

## 🚀 部署指南

### Web 版部署 (Netlify)

```bash
# 1. 打包项目 (扁平结构，根目录含 index.html)
zip -r nestxt-web.zip Nestxt_Web/*

# 2. 登录 Netlify 拖拽部署
# 访问 https://app.netlify.com/
# 站点: nestxt-web-yfan
# 拖拽 zip 包到 Deploys 区域
```

**部署地址**：https://nestxt-web-yfan.netlify.app/

### PC 版打包 (PyInstaller)

**开发环境运行：**
```bash
cd Nestxt_PC/py
pip install -r requirements.txt
python app.py
```

**生产环境打包：**
```bash
cd Nestxt_PC
pip install pyinstaller
pyinstaller build.spec
# 输出: dist/Nestxt.exe
```

**关键配置 (build.spec)：**
```python
datas=[
    ('Web', 'Web'),          # 前端资源
    ('icon_Dark.ico', '.'),  # 应用图标
]
console=False                # 无控制台窗口
hiddenimports=['webview', 'win32gui', 'win32clipboard', ...]
```

**系统要求：** Windows 10/11 (EdgeChromium 渲染引擎)

---

## 🧪 测试策略

### 单元测试框架

- **框架**：Jest + jsdom
- **覆盖目标**：核心层 90%+ / 服务层 85%+ / 控制器层 70%+ / 总体 80%+

### 关键测试用例

```javascript
// StorageBridge 测试
test('setItem 自动添加 nestxt_ 前缀', async () => {
    await StorageBridge.setItem('test', 'value');
    expect(localStorage.getItem('nestxt_test')).toBe('"value"');
});

// FolderService 递归删除测试
test('remove 递归删除所有子文件夹', () => {
    const parent = FolderService.create('父', null);
    const child = FolderService.create('子', parent.id);
    const ids = FolderService.remove(parent.id);
    expect(ids).toContain(parent.id);
    expect(ids).toContain(child.id);
});

// FileService 版本数量限制测试
test('saveVersion 限制最多 20 个版本', () => {
    for (let i = 0; i < 25; i++) {
        FileService.saveVersion(file.id, `v${i}`);
    }
    expect(FileService.getVersions(file.id).length).toBe(20);
});
```

---

## 🛡️ 安全机制

| 风险类型 | 防护措施 |
|----------|----------|
| **XSS 攻击** | `escapeHtml()` / `escapeAttr()` 转义所有用户输入；textarea 天然防护 |
| **存储安全** | 数据明文存储 (localStorage/JSON)，建议用户定期导出备份 |
| **文件安全** | 纯文本处理，不执行任何脚本；`eval()` / `exec()` 禁用 |
| **单实例控制** | Windows Mutex 互斥体，防止多开数据冲突 |
| **数据完整性** | 每次写入前自动创建 `.bak` 备份 (PC 版) |

---

## 📊 性能优化

| 优化领域 | 策略 | 效果 |
|----------|------|------|
| **渲染** | 增量更新 + requestAnimationFrame 节流 | 减少 DOM 重建次数 |
| **事件** | 事件委托 (容器绑定) | 避免监听器累积 |
| **存储** | 300ms 防抖写入 | 减少 localStorage 写入次数 |
| **高亮** | 匹配 > 3000 自动降级 | 防止浏览器渲染卡顿 |
| **拖拽** | 目标跟踪 + 阻止冒泡 | 避免重复操作和闪烁 |

---

## 📦 依赖项

### Web 版
- **无第三方依赖** — 纯原生 JavaScript

### PC 版
```txt
pywebview>=4.0.0      # Web 渲染容器
pywin32>=306          # Windows API 封装
pyinstaller>=6.0.0    # 打包工具
```

---

## 📝 版本历史

### v1.0 (2026-07-03)

**核心功能：**
- ✅ 文件夹管理 (无限层级嵌套)
- ✅ 多标签编辑 (无限制)
- ✅ 版本控制 (每文件 20 个快照)
- ✅ 自定义语法高亮
- ✅ 多编码智能识别 (UTF-8/GBK/GB2312/Big5)
- ✅ 回收站系统
- ✅ 文件名 + 内容搜索
- ✅ 树图可视化
- ✅ 自动保存

**PC 版：**
- ✅ pywebview 混合架构
- ✅ 本地 JSON 文件存储 + 自动备份
- ✅ 系统文件对话框
- ✅ 剪贴板集成
- ✅ 单实例控制

---

## 👥 贡献指南

1. Fork 本仓库
2. 创建功能分支：`git checkout -b feature/your-feature`
3. 提交更改：`git commit -m 'feat: add some feature'`
4. 推送到分支：`git push origin feature/your-feature`
5. 提交 Pull Request

**代码规范：**
- JavaScript：ES6 标准
- Python：PEP 8
- 提交信息：[Conventional Commits](https://www.conventionalcommits.org/)

---

## 📄 许可证

Nestxt 文本编辑器 © 2026 YFan

本程序是自由软件：您可以根据自由软件基金会发布的 **GNU 通用公共许可证** 第 3 版（或您选择的任何更高版本）的条款重新分发和/或修改它。

本程序的分发是希望它有用，但 **没有任何担保**；甚至没有对 **适销性** 或 **特定用途的适用性** 的暗示担保。有关详细信息，请参阅 GNU 通用公共许可证。

您应该已经随本程序收到了一份 GNU 通用公共许可证的副本。如果没有，请参阅 https://www.gnu.org/licenses/。

---

### GNU 通用公共许可证 v3.0 要点

```
Copyright (C) 2026 YFan

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
```

**完整许可证文本**：请参阅项目根目录的 [LICENSE](LICENSE) 文件或访问 https://www.gnu.org/licenses/gpl-3.0.html

---

## 📞 联系方式

- **作者**：YFan
- **邮箱**：603349580@qq.com
- **微信**：a603349580

---

✦ Nestxt — 让文本编辑回归纯粹与高效 ✦
