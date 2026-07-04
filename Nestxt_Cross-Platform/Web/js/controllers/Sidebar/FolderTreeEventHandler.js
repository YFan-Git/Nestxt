/**
 * FolderTreeEventHandler - 文件夹树事件管理
 * 
 * 职责:
 * - 统一使用事件委托，处理点击/双击/拖拽
 * - 通过回调函数与外部通信，不直接依赖 Service
 * - 在重命名期间阻止其他事件处理
 * - 使用定时器区分单击/双击，避免双击时先触发单击导致 DOM 重建
 * - 提供即时视觉反馈，优化点击响应速度
 */

const FolderTreeEventHandler = {
    /** @private 容器元素 */
    _el: null,

    /** @private 事件委托处理器引用 */
    _clickHandler: null,
    _dblClickHandler: null,
    _dragOverHandler: null,
    _dropHandler: null,
    _dragEndHandler: null,

    /** @private 回调函数 */
    _callbacks: {},

    /** @private 是否正在重命名（阻止其他事件处理） */
    _isRenamingActive: false,

    /** @private 文件夹单击定时器（用于区分单击/双击） */
    _folderClickTimer: null,

    /** @private 文件单击定时器（用于区分单击/双击） */
    _fileClickTimer: null,

    /** @private 当前拖拽目标文件夹组（用于 dragleave 判断） */
    _currentDragTarget: null,

    /** @private 上次点击的文件元素（用于即时视觉反馈） */
    _lastClickedFileEl: null,

    /** @private 单击/双击延迟（毫秒）- 平衡双击检测与响应速度 */
    _clickDelay: 200,

    /**
     * 初始化
     * @param {HTMLElement} el - 容器元素
     * @param {Object} callbacks - 回调函数集合
     * @param {Function} callbacks.onToggleFolder - (folderId) => void
     * @param {Function} callbacks.onSelectFolder - (folderId) => void
     * @param {Function} callbacks.onOpenFile - (fileId) => void
     * @param {Function} callbacks.onDeleteFile - (fileId) => void
     * @param {Function} callbacks.onDeleteFolder - (folderId) => void
     * @param {Function} callbacks.onStartRename - (nameEl, type) => void
     * @param {Function} callbacks.onRenameStart - () => void 通知重命名开始
     * @param {Function} callbacks.onRenameEnd - () => void 通知重命名结束
     * @param {Function} callbacks.onFileMove - (fileId, targetFolderId) => void 移动文件到文件夹
     * @param {Function} callbacks.onFolderMove - (folderId, targetFolderId) => void 移动文件夹到文件夹
     */
    init(el, callbacks) {
        this._el = el;
        this._callbacks = callbacks;

        this._bindEvents();
    },

    /**
     * 设置重命名状态标志
     * @param {boolean} active
     */
    setRenamingActive(active) {
        this._isRenamingActive = active;
    },

    /**
     * 绑定事件委托
     * @private
     */
    _bindEvents() {
        // 移除旧的处理器
        if (this._clickHandler) {
            this._el.removeEventListener('click', this._clickHandler);
            this._el.removeEventListener('dblclick', this._dblClickHandler);
        }

        // 单击处理
        this._clickHandler = (e) => {
            // 重命名期间阻止所有点击事件
            if (this._isRenamingActive) return;

            // 删除按钮
            const delBtn = e.target.closest('.tree-del-btn');
            if (delBtn) {
                e.stopPropagation();
                const action = delBtn.dataset.action;
                const id = parseInt(delBtn.dataset.id);
                if (action === 'delete-file') {
                    this._callbacks.onDeleteFile?.(id);
                } else if (action === 'delete-folder') {
                    this._callbacks.onDeleteFolder?.(id);
                }
                return;
            }

            // 重命名输入框内点击不处理
            if (e.target.closest('.tree-rename-input')) return;

            // === 文件夹单击（延迟执行，避免与双击冲突） ===
            // 先检查是否点击在文件上（文件在组容器内，需要排除）
            if (!e.target.closest('.tree-file')) {
                const folderEl = e.target.closest('.tree-folder');
                const groupEl = e.target.closest('.tree-folder-group');
                const targetFolderEl = folderEl || (groupEl ? groupEl.querySelector('.tree-folder') : null);

                if (targetFolderEl) {
                    const folderId = parseInt(targetFolderEl.dataset.folderId);

                    // 清除之前的定时器
                    if (this._folderClickTimer) {
                        clearTimeout(this._folderClickTimer);
                        this._folderClickTimer = null;
                    }

                    // 延迟执行单击逻辑，如果期间发生双击则取消
                    this._folderClickTimer = setTimeout(() => {
                        this._folderClickTimer = null;
                        this._callbacks.onToggleFolder?.(folderId);
                        this._callbacks.onSelectFolder?.(folderId);
                    }, this._clickDelay);
                    return;
                }
            }

            // === 文件单击（即时视觉反馈 + 延迟执行逻辑） ===
            const fileEl = e.target.closest('.tree-file');
            if (fileEl) {
                // 图标区域点击不打开文件
                if (e.target.closest('.tree-file-icon')) {
                    return;
                }

                const fileId = parseInt(fileEl.dataset.fileId);

                // 即时视觉反馈：立即高亮选中的文件
                this._el.querySelectorAll('.tree-file.active').forEach(el => el.classList.remove('active'));
                fileEl.classList.add('active');
                this._lastClickedFileEl = fileEl;

                // 清除之前的定时器
                if (this._fileClickTimer) {
                    clearTimeout(this._fileClickTimer);
                    this._fileClickTimer = null;
                }

                // 延迟执行单击逻辑，如果期间发生双击则取消
                this._fileClickTimer = setTimeout(() => {
                    this._fileClickTimer = null;
                    this._callbacks.onOpenFile?.(fileId);
                }, this._clickDelay);
                return;
            }
        };

        // 双击处理（重命名）
        this._dblClickHandler = (e) => {
            // 重命名期间阻止所有双击事件
            if (this._isRenamingActive) return;

            // 重命名输入框内双击不处理
            if (e.target.closest('.tree-rename-input')) return;

            // 文件双击重命名（优先检查，因为文件在文件夹组内）
            const fileEl = e.target.closest('.tree-file');
            if (fileEl) {
                e.preventDefault();
                e.stopPropagation();

                // 取消待执行的单击定时器
                if (this._fileClickTimer) {
                    clearTimeout(this._fileClickTimer);
                    this._fileClickTimer = null;
                }

                const nameEl = fileEl.querySelector('.tree-file-name');
                if (nameEl) this._callbacks.onStartRename?.(nameEl, 'file');
                return;
            }

            // 文件夹双击重命名
            const folderEl = e.target.closest('.tree-folder');
            if (folderEl) {
                e.preventDefault();
                e.stopPropagation();

                // 取消待执行的单击定时器
                if (this._folderClickTimer) {
                    clearTimeout(this._folderClickTimer);
                    this._folderClickTimer = null;
                }

                const nameEl = folderEl.querySelector('.tree-folder-name');
                if (nameEl) this._callbacks.onStartRename?.(nameEl, 'folder');
                return;
            }

            // 文件夹组容器空白区域双击（也触发重命名）
            const groupEl = e.target.closest('.tree-folder-group');
            if (groupEl) {
                const targetFolderEl = groupEl.querySelector('.tree-folder');
                if (targetFolderEl) {
                    e.preventDefault();
                    e.stopPropagation();

                    if (this._folderClickTimer) {
                        clearTimeout(this._folderClickTimer);
                        this._folderClickTimer = null;
                    }

                    const nameEl = targetFolderEl.querySelector('.tree-folder-name');
                    if (nameEl) this._callbacks.onStartRename?.(nameEl, 'folder');
                    return;
                }
            }
        };

        this._el.addEventListener('click', this._clickHandler);
        this._el.addEventListener('dblclick', this._dblClickHandler);

        // 拖拽事件
        this._bindDragEvents();
    },

    /**
     * 绑定拖拽事件
     * @private
     */
    _bindDragEvents() {
        // 移除旧的容器级拖拽监听器（防止重复绑定导致性能问题）
        if (this._dragOverHandler) {
            this._el.removeEventListener('dragover', this._dragOverHandler);
        }
        if (this._dropHandler) {
            this._el.removeEventListener('drop', this._dropHandler);
        }
        if (this._dragEndHandler) {
            this._el.removeEventListener('dragend', this._dragEndHandler);
        }

        // 文件拖拽源（DOM 已重建，旧元素已销毁，无需手动移除）
        this._el.querySelectorAll('.tree-file').forEach(el => {
            el.addEventListener('dragstart', (e) => {
                const fileId = parseInt(el.dataset.fileId);
                e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'file', id: fileId }));
                e.dataTransfer.effectAllowed = 'move';
                el.classList.add('dragging');
            });
            el.addEventListener('dragend', () => {
                el.classList.remove('dragging');
                // 清除所有拖拽目标高亮
                this._el.querySelectorAll('.tree-folder-group.drag-target').forEach(f => f.classList.remove('drag-target'));
                this._el.classList.remove('drag-target-root');
            });
        });

        // 文件夹拖拽源
        this._el.querySelectorAll('.tree-folder').forEach(el => {
            el.addEventListener('dragstart', (e) => {
                const folderId = parseInt(el.dataset.folderId);
                e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'folder', id: folderId }));
                e.dataTransfer.effectAllowed = 'move';
                el.classList.add('dragging');
                // 阻止事件冒泡到 folder-group
                e.stopPropagation();
            });
            el.addEventListener('dragend', () => {
                el.classList.remove('dragging');
                // 清除所有拖拽目标高亮
                this._el.querySelectorAll('.tree-folder-group.drag-target').forEach(f => f.classList.remove('drag-target'));
                this._el.classList.remove('drag-target-root');
            });
        });

        // 文件夹拖拽目标 - 使用事件委托，解决嵌套文件夹的拖拽问题
        this._dragOverHandler = (e) => {
            // 外部文件拖拽时，不显示树区域的拖拽框（由 DragController 处理编辑器区域的拖入）
            if (e.dataTransfer.types.includes('Files')) return;

            const groupEl = e.target.closest('.tree-folder-group');

            if (groupEl) {
                // 拖入某个文件夹内部
                e.stopPropagation();
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';

                if (this._currentDragTarget === groupEl) return;

                // 清除之前所有的高亮
                this._el.querySelectorAll('.tree-folder-group.drag-target').forEach(f => f.classList.remove('drag-target'));
                this._el.classList.remove('drag-target-root');

                groupEl.classList.add('drag-target');
                this._currentDragTarget = groupEl;
                return;
            }

            // 没有命中任何文件夹组 → 拖动到根目录区域
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            this._el.querySelectorAll('.tree-folder-group.drag-target').forEach(f => f.classList.remove('drag-target'));
            this._currentDragTarget = null;
            this._el.classList.add('drag-target-root');
        };
        this._el.addEventListener('dragover', this._dragOverHandler);

        this._dropHandler = (e) => {
            const groupEl = e.target.closest('.tree-folder-group');

            e.preventDefault();
            e.stopPropagation();

            // 清除所有高亮
            if (groupEl) {
                groupEl.classList.remove('drag-target');
            }
            this._el.classList.remove('drag-target-root');
            this._currentDragTarget = null;

            // 目标文件夹ID：命中 group 则取其 ID，否则为 null（根目录）
            const targetFolderId = groupEl ? parseInt(groupEl.dataset.folderId) : null;

            try {
                const rawData = e.dataTransfer.getData('text/plain');
                const dragData = JSON.parse(rawData);

                if (dragData.type === 'file') {
                    // 文件可以移动到文件夹或根目录
                    this._callbacks.onFileMove?.(dragData.id, targetFolderId);
                } else if (dragData.type === 'folder') {
                    // 文件夹可以移动到其他文件夹或根目录
                    this._callbacks.onFolderMove?.(dragData.id, targetFolderId);
                }
            } catch (err) {
                // 兼容旧格式（纯数字 = 文件ID）
                const fileId = parseInt(rawData);
                if (fileId) {
                    this._callbacks.onFileMove?.(fileId, targetFolderId);
                }
            }
        };
        this._el.addEventListener('drop', this._dropHandler);

        // 容器级 dragend - 拖拽结束时清除所有高亮（包括拖出侧边栏的情况）
        this._dragEndHandler = () => {
            if (this._currentDragTarget) {
                this._currentDragTarget.classList.remove('drag-target');
                this._currentDragTarget = null;
            }
            this._el.classList.remove('drag-target-root');
        };
        this._el.addEventListener('dragend', this._dragEndHandler);
    },

    /**
     * 重新绑定拖拽事件（全量渲染后调用）
     */
    rebindDragEvents() {
        this._bindDragEvents();
    },

    /**
     * 销毁事件监听
     */
    destroy() {
        if (this._clickHandler) {
            this._el.removeEventListener('click', this._clickHandler);
            this._el.removeEventListener('dblclick', this._dblClickHandler);
        }
        if (this._dragOverHandler) {
            this._el.removeEventListener('dragover', this._dragOverHandler);
        }
        if (this._dropHandler) {
            this._el.removeEventListener('drop', this._dropHandler);
        }
        if (this._dragEndHandler) {
            this._el.removeEventListener('dragend', this._dragEndHandler);
        }
        if (this._folderClickTimer) clearTimeout(this._folderClickTimer);
        if (this._fileClickTimer) clearTimeout(this._fileClickTimer);
    }
};
