/**
 * app.js - Nestxt 应用入口（精简版）
 * 
 * 功能: 初始化所有服务和控制器，注册全局信号监听
 * 子模块:
 *   app/dialogs.js       - 通用对话框
 *   app/version-panel.js  - 版本管理面板
 *   app/trash-panel.js    - 回收站面板
 *   app/file-ops.js       - 文件操作
 *   app/settings.js       - 设置菜单
 */

(function () {
    'use strict';

    // 确保 App 命名空间已由子模块初始化
    if (!window.App) window.App = {};

    /** ============================================
     *  第一步：初始化数据服务
     *  ============================================ */
    function initServices() {
        // 存储服务无需初始化，直接可用

        // 文件夹和文件服务必须先初始化
        FolderService.init();
        FileService.init();

        // 标签页服务依赖文件服务，后初始化
        TabService.init();

        // 回收站服务
        TrashService.init();

        // 定时器服务
        TimeService.init();

        // 注册到 Autoload
        Autoload.register('folderService', FolderService);
        Autoload.register('fileService', FileService);
        Autoload.register('tabService', TabService);
        Autoload.register('trashService', TrashService);
        Autoload.register('timeService', TimeService);
    }

    /** ============================================
     *  第二步：初始化 UI 控制器
     *  ============================================ */
    function initControllers() {
        // 主题控制器（最先初始化，确保主题在渲染前生效）
        ThemeController.init();

        // 侧边栏树
        SidebarController.init('.sidebar-tree');

        // 标签页栏
        TabController.init('.tabbar');

        // 编辑器
        EditorController.init('.editor-panel');

        // 右键菜单
        ContextMenuController.init('.context-menu');

        // 搜索面板
        SearchController.init('.search-panel');

        // 拖拽控制器
        DragController.init();

        // 编码控制器
        EncodingController.init();
    }

    /** ============================================
     *  第三步：注册全局 UI 信号处理
     *  ============================================ */
    function initUIHandlers() {
        // ========== 新建文件 ==========
        signal.on('ui:newFile', (data) => {
            App.showNewFileDialog(data.folderId);
        });

        // ========== 新建文件夹 ==========
        signal.on('ui:newFolder', (data) => {
            App.showNewFolderDialog(data.parentId);
        });

        // ========== 重命名文件 ==========
        signal.on('ui:renameFile', (data) => {
            const file = FileService.getById(data.fileId);
            if (file) App.showRenameDialog('file', file.name, file.id);
        });

        // ========== 重命名文件夹 ==========
        signal.on('ui:renameFolder', (data) => {
            const folder = FolderService.getById(data.folderId);
            if (folder) App.showRenameDialog('folder', folder.name, folder.id);
        });

        // ========== 删除文件 ==========
        signal.on('ui:deleteFile', (data) => {
            const file = FileService.getById(data.fileId);
            if (file) App.showDeleteFileDialog(file);
        });

        // ========== 删除文件夹 ==========
        signal.on('ui:deleteFolder', (data) => {
            const folder = FolderService.getById(data.folderId);
            if (folder) App.showDeleteFolderDialog(folder);
        });

        // ========== 导出文件 ==========
        signal.on('ui:exportFile', (data) => {
            const file = FileService.getById(data.fileId);
            if (file) App.exportFile(file);
        });

        // ========== 复制副本 ==========
        signal.on('ui:copyFile', (data) => {
            const file = FileService.getById(data.fileId);
            if (file) App.copyFile(file);
        });
    }

    /** ============================================
     *  第四步：注册键盘快捷键（移除所有自动聚焦）
     *  ============================================ */
    function initShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+N - 新建文件
            if (e.key === 'n' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                signal.emit('ui:newFile', { folderId: SidebarController.getSelectedFolderId() });
            }

            // Ctrl+O - 导入文件
            if (e.key === 'o' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                App.importFile();
            }

            // Ctrl+F - 不再自动聚焦搜索框，只触发搜索事件（用户需要手动点击搜索框）
            // 移除自动聚焦代码

            // F2 - 重命名当前选中的文件或文件夹
            if (e.key === 'F2') {
                e.preventDefault();
                SidebarController.startRenameOnActive();
            }

            // Escape - 关闭右键菜单
            if (e.key === 'Escape') {
                ContextMenuController.show({ type: 'blank', x: 0, y: 0 }); // hide
                document.querySelector('.context-menu').style.display = 'none';
            }
        });
    }

    /** ============================================
     *  第五步：注册侧边栏右键事件
     *  ============================================ */
    function initContextMenuEvents() {
        const sidebarTree = document.querySelector('.sidebar-tree');

        sidebarTree.addEventListener('contextmenu', (e) => {
            e.preventDefault();

            const folderEl = e.target.closest('.tree-folder');
            const fileEl = e.target.closest('.tree-file');

            if (folderEl) {
                const folderId = parseInt(folderEl.dataset.folderId);
                // 右键时也选中文件夹
                FolderTreeStateManager.setSelectedFolder(folderId);
                ContextMenuController.show({ type: 'folder', id: folderId, x: e.clientX, y: e.clientY });
            } else if (fileEl) {
                const fileId = parseInt(fileEl.dataset.fileId);
                ContextMenuController.show({ type: 'file', id: fileId, x: e.clientX, y: e.clientY });
            } else {
                ContextMenuController.show({ type: 'blank', x: e.clientX, y: e.clientY });
            }
        });

        // 点击其他地方关闭菜单
        document.addEventListener('click', () => {
            document.querySelector('.context-menu').style.display = 'none';
        });
    }

    /** ============================================
     *  第六步：注册侧边栏按钮事件
     *  ============================================ */
    function initSidebarButtons() {
        document.querySelectorAll('[data-action="new-file"]').forEach(btn => {
            btn.addEventListener('click', () => {
                // 始终在主目录新建文件（与右键菜单功能分离）
                signal.emit('ui:newFile', { folderId: null });
            });
        });

        document.querySelectorAll('[data-action="new-folder"]').forEach(btn => {
            btn.addEventListener('click', () => {
                // 始终在主目录新建文件夹（与右键菜单功能分离）
                signal.emit('ui:newFolder', { parentId: null });
            });
        });

        // 侧边栏底部回收站入口
        document.querySelector('[data-action="toggle-trash"]')?.addEventListener('click', () => {
            App.toggleTrashPanel();
        });
    }

    /** ============================================
     *  第七步：注册标题栏按钮事件
     *  ============================================ */
    function initTitlebarButtons() {
        // 移除搜索按钮的自动聚焦，只保留点击事件
        document.getElementById('btn-search')?.addEventListener('click', () => {
            // 只触发搜索，不自动聚焦输入框
            const input = document.querySelector('.search-input');
            if (input && input.value.trim()) {
                SearchController._doSearch();
            }
        });

        // 点击标题栏 logo（统一打开关于页面）
        document.querySelectorAll('.titlebar-logo').forEach(logo => {
            logo.addEventListener('click', () => {
                App.handleAbout();
            });
        });
    }

    /** ============================================
     *  第八步：编辑工具栏事件
     *  ============================================ */

    /**
     * 更新工具栏按钮状态
     * 无文件打开时禁用除导入外的所有按钮，有文件时启用
     */
    function updateToolbarState() {
        const hasFile = EditorController.getCurrentFileId() !== null;

        // 导入按钮始终可用
        const btnImport = document.getElementById('btn-import');
        if (btnImport) btnImport.disabled = false;

        // 其余按钮跟随文件状态
        const fileDependentIds = [
            'btn-save', 'btn-copy-all',
            'btn-font-minus', 'btn-font-plus',
            'btn-export', 'btn-version', 'btn-treeview'
        ];
        fileDependentIds.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) btn.disabled = !hasFile;
        });

        // 字号标签也跟随状态
        const fontsizeLabel = document.getElementById('fontsize-label');
        if (fontsizeLabel) {
            fontsizeLabel.style.opacity = hasFile ? '' : '0.4';
        }
    }

    function initToolbarButtons() {
        // 导入
        document.getElementById('btn-import')?.addEventListener('click', () => {
            App.importFile();
        });

        // 保存
        document.getElementById('btn-save')?.addEventListener('click', () => {
            EditorController.save();
        });

        // 全选复制
        document.getElementById('btn-copy-all')?.addEventListener('click', () => {
            const textarea = document.querySelector('.editor-textarea');
            if (!textarea) return;
            textarea.select();
            document.execCommand('copy');
        });

        // 缩小字号
        document.getElementById('btn-font-minus')?.addEventListener('click', () => {
            App.adjustFontSize(-1);
        });

        // 增大字号
        document.getElementById('btn-font-plus')?.addEventListener('click', () => {
            App.adjustFontSize(1);
        });

        // 导出
        document.getElementById('btn-export')?.addEventListener('click', () => {
            const fileId = EditorController.getCurrentFileId();
            if (fileId === null) return;
            const file = FileService.getById(fileId);
            if (file) App.exportFile(file);
        });

        // 版本管理
        document.getElementById('btn-version')?.addEventListener('click', () => {
            App.toggleVersionPanel();
        });

        // 树图可视化
        document.getElementById('btn-treeview')?.addEventListener('click', () => {
            signal.emit(Constants.EVENTS.TREE_VIEW_TOGGLE);
        });

        // 监听标签页事件，联动工具栏状态
        signal.on(Constants.EVENTS.TAB_OPENED, () => updateToolbarState());
        signal.on(Constants.EVENTS.TAB_CLOSED, () => updateToolbarState());
        signal.on(Constants.EVENTS.TAB_SWITCHED, () => updateToolbarState());
        signal.on(Constants.EVENTS.TAB_CLOSE_ALL, () => updateToolbarState());

        // 初始状态
        updateToolbarState();
    }

    /**
     * 初始化主题切换开关
     */
    function initThemeToggle() {
        const toggle = document.getElementById('theme-toggle');
        if (toggle) {
            toggle.addEventListener('click', (e) => {
                e.stopPropagation();
                ThemeController.toggle();
            });
        }
    }

    /** ============================================
     *  第九步：状态栏交互
     *  ============================================ */
    function initStatusbar() {
        // 自动换行切换
        const wordWrapBtn = document.getElementById('status-wordwrap');
        if (wordWrapBtn) {
            const updateLabel = () => {
                const wrap = StorageService.load('wordwrap', false);
                wordWrapBtn.textContent = '自动换行: ' + (wrap ? '开' : '关');
            };
            updateLabel();
            wordWrapBtn.addEventListener('click', () => {
                const wrap = StorageService.load('wordwrap', false);
                StorageService.save('wordwrap', !wrap);
                signal.emit(Constants.EVENTS.WORD_WRAP_TOGGLE, { wrap: !wrap });
                updateLabel();
            });
        }

        // 行号切换
        const lineNumBtn = document.getElementById('status-line-num');
        if (lineNumBtn) {
            const updateLabel = () => {
                const show = StorageService.load('linenum', true);
                lineNumBtn.textContent = '行号: ' + (show ? '开' : '关');
            };
            updateLabel();
            lineNumBtn.addEventListener('click', () => {
                const show = StorageService.load('linenum', true);
                StorageService.save('linenum', !show);
                signal.emit(Constants.EVENTS.LINE_NUM_TOGGLE, { show: !show });
                updateLabel();
            });
        }

        // 语法高亮切换
        const syntaxHighlightBtn = document.getElementById('status-syntax-highlight');
        if (syntaxHighlightBtn) {
            const updateLabel = () => {
                const show = StorageService.load('syntax_highlight', true);
                syntaxHighlightBtn.textContent = '语法高亮: ' + (show ? '开' : '关');
            };
            updateLabel();
            syntaxHighlightBtn.addEventListener('click', () => {
                const show = StorageService.load('syntax_highlight', true);
                StorageService.save('syntax_highlight', !show);
                signal.emit(Constants.EVENTS.SYNTAX_HIGHLIGHT_TOGGLE, { show: !show });
                updateLabel();
            });
        }

        // 更新标签计数
        const updateTabCount = () => {
            const tabCountEl = document.getElementById('status-tab-count');
            if (tabCountEl) {
                tabCountEl.textContent = '标签: ' + TabService.getCount();
            }
        };
        signal.on(Constants.EVENTS.TAB_OPENED, updateTabCount);
        signal.on(Constants.EVENTS.TAB_CLOSED, updateTabCount);
        signal.on(Constants.EVENTS.TAB_SWITCHED, () => {
            const panel = document.querySelector('.version-panel');
            if (panel && panel.style.display !== 'none') {
                App.renderVersionList();
            }
        });

        // 文件重命名时刷新版本面板
        signal.on(Constants.EVENTS.FILE_RENAMED, () => {
            const panel = document.querySelector('.version-panel');
            if (panel && panel.style.display !== 'none') {
                App.renderVersionList();
            }
        });
        updateTabCount();

        // 文件保存状态
        signal.on(Constants.EVENTS.FILE_SAVED, () => {
            const statusEl = document.getElementById('status-save');
            if (statusEl) {
                statusEl.textContent = '√ 保存完成';
                statusEl.style.color = 'var(--success)';
                setTimeout(() => {
                    statusEl.textContent = '已保存 ' + new Date().toLocaleTimeString();
                    statusEl.style.color = '';
                }, 1000);
            }
        });
    }

    /** ============================================
     *  第十步：侧边栏宽度调整
     *  ============================================ */
    function initSidebarResize() {
        const sidebar = document.querySelector('.sidebar');
        const resizer = document.querySelector('.sidebar-resizer');
        let isResizing = false;

        resizer.addEventListener('mousedown', (e) => {
            isResizing = true;
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            let width = e.clientX;
            width = Math.max(Constants.SIZES.SIDEBAR_MIN_WIDTH, Math.min(width, Constants.SIZES.SIDEBAR_MAX_WIDTH));
            sidebar.style.width = width + 'px';
        });

        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
                const currentWidth = parseInt(sidebar.style.width) || Constants.SIZES.SIDEBAR_DEFAULT_WIDTH;
                StorageService.save('sidebar_width', currentWidth);
            }
        });

        // 恢复保存的宽度
        const savedWidth = StorageService.load('sidebar_width', Constants.SIZES.SIDEBAR_DEFAULT_WIDTH);
        sidebar.style.width = savedWidth + 'px';
    }

    /** ============================================
     *  启动应用
     *  ============================================ */
    async function startApp() {
        try {
            // 初始化静态 HTML 中的 data-icon 占位符
            document.querySelectorAll('[data-icon]').forEach(function(el) {
                el.outerHTML = ICONS[el.dataset.icon];
            });
            // 第一步：从后端加载持久化数据
            await StorageService.init();

            initServices();
            initControllers();
            initUIHandlers();
            initShortcuts();
            initContextMenuEvents();
            initSidebarButtons();
            initThemeToggle();
            initTitlebarButtons();
            App.initSettingsMenu();
            App.initVersionPanelClose();
            App.initVersionModal();
            initToolbarButtons();
            App.initFontSize();
            initStatusbar();
            initSidebarResize();
            App.initVersionPanelResize();
            App.initTrashPanel();

            // 启动自动保存
            AutoSaveService.start();

            // 恢复上次打开的标签页内容
            const activeTabId = TabService.getActiveId();
            if (activeTabId !== null) {
                signal.emit(Constants.EVENTS.TAB_SWITCHED, { fileId: activeTabId });
            }

            // 所有初始化完成后，移除加载状态并显示页面
            document.documentElement.classList.remove('loading');
            document.querySelector('.app-container').classList.add('ready');

            // 移除启动态，取消所有元素的焦点（避免聚焦边框残留）
            document.body.classList.remove('startup');
            // 强制取消 textarea 焦点
            if (document.activeElement && document.activeElement !== document.body) {
                document.activeElement.blur();
            }
            document.body.focus();


        } catch (err) {
            console.error('[App] 启动失败:', err);
        }
    }

    // 启动应用：监听 pywebviewready 和 DOMContentLoaded
    function bootApp() {
        let started = false;

        function tryStart(source) {
            if (started) return;
            started = true;
            startApp();
        }

        // 方式 1：监听 pywebviewready（pywebview 环境）
        window.addEventListener('pywebviewready', function () {
            tryStart('pywebviewready');
        });

        // 方式 2：DOMContentLoaded 兜底（延迟 200ms 等待 pywebview 初始化）
        function onDomReady() {
            setTimeout(function () {
                tryStart('DOMContentLoaded');
            }, 200);
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', onDomReady);
        } else {
            onDomReady();
        }
    }

    bootApp();

})();