/**
 * SidebarController - 侧边栏文件夹树控制器（重构后 Facade 门面）
 * 
 * 职责:
 * - 仅做模块组装和对外 API 暴露
 * - 控制渲染节流（requestAnimationFrame）
 * - 协调子模块间通信
 * 
 * 子模块:
 * - FolderTreeStateManager: 状态与数据管理
 * - FolderTreeRenderer: 纯渲染函数
 * - FolderTreeEventHandler: 事件管理
 * - InlineRenameHelper: 内联重命名辅助
 */

const SidebarController = {
    /** @private 容器元素 */
    _el: null,

    /** @private 渲染防重入锁 */
    _rendering: false,

    /** @private 待渲染标志（requestAnimationFrame 节流） */
    _pendingRender: false,

    /** @private 展开/折叠渲染防重入锁 */
    _pendingToggleRender: false,

    /**
     * 初始化
     * @param {string|HTMLElement} container - 容器元素或选择器
     */
    init(container) {
        this._el = typeof container === 'string'
            ? document.querySelector(container)
            : container;

        if (!this._el) return;

        // 初始化渲染器
        FolderTreeRenderer.init(this._el);

        // 初始化状态管理器（状态变化时触发渲染）
        FolderTreeStateManager.init(() => this._onStateChange());

        // 初始化事件处理器
        FolderTreeEventHandler.init(this._el, {
            onToggleFolder: (folderId) => FolderService.toggleExpand(folderId),
            onSelectFolder: (folderId) => FolderTreeStateManager.setSelectedFolder(folderId),
            onOpenFile: (fileId) => this._handleOpenFile(fileId),
            onDeleteFile: (fileId) => signal.emit('ui:deleteFile', { fileId }),
            onDeleteFolder: (folderId) => signal.emit('ui:deleteFolder', { folderId }),
            onStartRename: (nameEl, type) => this._handleStartRename(nameEl, type),
            onFileMove: (fileId, targetFolderId) => FileService.move(fileId, targetFolderId),
            onFolderMove: (folderId, targetFolderId) => {
                const result = FolderService.move(folderId, targetFolderId);
                // 如果移动到某个文件夹内，展开目标文件夹及其祖先
                if (result && targetFolderId !== null) {
                    FolderTreeStateManager.expandAncestors(targetFolderId);
                    // 也展开目标文件夹本身
                    const target = FolderService.getById(targetFolderId);
                    if (target && !target.expanded) {
                        FolderService.toggleExpand(targetFolderId);
                    }
                }
                return result;
            },
            onRenameStart: () => {
                FolderTreeEventHandler.setRenamingActive(true);
            },
            onRenameEnd: () => {
                FolderTreeEventHandler.setRenamingActive(false);
            }
        });

        // 监听 Service 事件触发渲染
        this._bindServiceEvents();

        // 初始渲染
        this.render();
    },

    /**
     * 监听 Service 事件
     * @private
     */
    _bindServiceEvents() {
        signal.on(Constants.EVENTS.FILE_CREATED, () => this.render());
        signal.on(Constants.EVENTS.FILE_DELETED, () => this.render());
        signal.on(Constants.EVENTS.FILE_RENAMED, () => this.render());
        signal.on(Constants.EVENTS.FILE_MOVED, () => this.render());
        signal.on(Constants.EVENTS.FOLDER_CREATED, () => this.render());
        signal.on(Constants.EVENTS.FOLDER_DELETED, () => this.render());
        signal.on(Constants.EVENTS.FOLDER_RENAMED, () => this.render());
        signal.on(Constants.EVENTS.FOLDER_MOVED, () => this.render());
        signal.on(Constants.EVENTS.FOLDER_EXPANDED, () => this._throttledToggleRender());
        signal.on(Constants.EVENTS.FOLDER_COLLAPSED, () => this._throttledToggleRender());
        signal.on(Constants.EVENTS.ITEM_RESTORED, () => this.render());
        signal.on('sidebar:startRename', (data) => this._startRenameAfterRender(data.fileId));
        signal.on(Constants.EVENTS.TAB_SWITCHED, () => this._onTabSwitchedFromSidebar());
    },

    /**
     * 状态变化回调（由 StateManager 触发）
     * @private
     */
    _onStateChange() {
        // 使用 requestAnimationFrame 节流，避免频繁全量渲染
        if (this._pendingRender) return;
        this._pendingRender = true;

        requestAnimationFrame(() => {
            this._pendingRender = false;
            this._updateHighlight();
        });
    },

    /**
     * 展开/折叠渲染节流（避免快速切换时频繁全量渲染）
     * @private
     */
    _throttledToggleRender() {
        if (this._pendingToggleRender) return;
        this._pendingToggleRender = true;

        requestAnimationFrame(() => {
            this._pendingToggleRender = false;
            this.render();
        });
    },

    /**
     * 处理打开文件
     * @private
     */
    _handleOpenFile(fileId) {
        const file = FileService.getById(fileId);
        if (!file) return;

        TabService.open(fileId);

        // 清除文件夹选中，让文件本身高亮
        FolderTreeStateManager.clearSelection();

        // 静默展开祖先文件夹
        if (file.folderId !== null) {
            FolderTreeStateManager.expandAncestors(file.folderId);
        }
    },

    /**
     * 处理开始重命名
     * @private
     */
    _handleStartRename(nameEl, type) {
        const parentEl = nameEl.closest(type === 'folder' ? '.tree-folder' : '.tree-file');
        if (!parentEl) return;

        const id = parseInt(parentEl.dataset[type === 'folder' ? 'folderId' : 'fileId']);

        InlineRenameHelper.start(nameEl, type, id, {
            onRenameStart: () => {
                FolderTreeEventHandler.setRenamingActive(true);
            },
            onRenameEnd: () => {
                FolderTreeEventHandler.setRenamingActive(false);
            },
            onSave: (id, newName) => {
                if (type === 'folder') {
                    FolderService.rename(id, newName);
                } else {
                    FileService.rename(id, newName);
                }
            },
            onRestoreDOM: () => {
                // 重命名完成后重新渲染恢复 DOM
                this.render();
            }
        });
    },

    /**
     * 全量渲染
     */
    render() {
        if (!this._el || this._rendering) return;
        this._rendering = true;

        const state = FolderTreeStateManager.getState();
        FolderTreeRenderer.renderFull(state);
        FolderTreeEventHandler.rebindDragEvents();

        this._rendering = false;
    },

    /**
     * 增量更新高亮（不重建 DOM）
     * @private
     */
    _updateHighlight() {
        const state = FolderTreeStateManager.getState();
        const updated = FolderTreeRenderer.updateIncremental(state);

        // 如果增量更新失败（元素不在 DOM 中），执行全量渲染
        if (!updated) {
            this.render();
        }
    },

    /**
     * 开始重命名当前激活的文件或文件夹（F2快捷键调用）
     * @returns {boolean} 是否成功进入重命名
     */
    startRenameOnActive() {
        // 如果正在重命名，跳过
        if (InlineRenameHelper.isRenaming()) return false;

        const activeId = TabService.getActiveId();
        if (activeId !== null) {
            const fileEl = this._el.querySelector(`.tree-file[data-file-id="${activeId}"]`);
            if (fileEl) {
                const nameEl = fileEl.querySelector('.tree-file-name');
                if (nameEl) {
                    this._handleStartRename(nameEl, 'file');
                    return true;
                }
            }
        }

        // 如果没有激活的文件，尝试重命名选中的文件夹
        const selectedFolderId = FolderTreeStateManager.getSelectedFolderId();
        if (selectedFolderId !== null) {
            const folderEl = this._el.querySelector(`.tree-folder[data-folder-id="${selectedFolderId}"]`);
            if (folderEl) {
                const nameEl = folderEl.querySelector('.tree-folder-name');
                if (nameEl) {
                    this._handleStartRename(nameEl, 'folder');
                    return true;
                }
            }
        }

        return false;
    },

    /**
     * 获取当前选中的文件夹ID
     * @returns {number|null}
     */
    getSelectedFolderId() {
        return FolderTreeStateManager.getSelectedFolderId();
    },

    /**
     * 标签页切换时同步文件树：展开祖先文件夹并全量渲染
     * @private
     */
    _onTabSwitchedFromSidebar() {
        const activeId = TabService.getActiveId();
        if (activeId !== null) {
            const file = FileService.getById(activeId);
            if (file && file.folderId !== null) {
                FolderTreeStateManager.expandAncestors(file.folderId);
            }
        }
        this.render();
    },

    /**
     * 渲染完成后自动进入重命名状态
     * @private
     * @param {number} fileId - 文件ID
     */
    _startRenameAfterRender(fileId) {
        // 先展开文件所在的文件夹及其祖先
        const file = FileService.getById(fileId);
        if (file && file.folderId !== null) {
            FolderTreeStateManager.expandAncestors(file.folderId);
        }

        // 重新渲染以确保文件可见
        this.render();

        // 使用 setTimeout 确保渲染完成后再执行
        setTimeout(() => {
            const fileEl = this._el.querySelector(`.tree-file[data-file-id="${fileId}"]`);
            if (fileEl) {
                const nameEl = fileEl.querySelector('.tree-file-name');
                if (nameEl) {
                    this._handleStartRename(nameEl, 'file');
                }
            }
        }, 50);
    }
};
