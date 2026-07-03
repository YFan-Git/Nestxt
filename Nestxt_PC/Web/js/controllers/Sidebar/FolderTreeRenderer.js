/**
 * FolderTreeRenderer - 纯渲染函数
 * 
 * 职责:
 * - 接收状态数据，输出 HTML 字符串
 * - 提供增量更新方法（展开/折叠/高亮/选中）
 * - 不依赖 Service，仅消费传入的数据
 */

const FolderTreeRenderer = {
    /** @private 容器元素 */
    _el: null,

    /** @private 上一次的 activeFileId（用于增量更新比对） */
    _lastActiveFileId: null,

    /** @private 上一次的 selectedFolderId（用于增量更新比对） */
    _lastSelectedFolderId: null,

    /**
     * 初始化容器
     * @param {HTMLElement} el
     */
    init(el) {
        this._el = el;
    },

    /**
     * 全量渲染整个树
     * @param {Object} state - 状态快照
     */
    renderFull(state) {
        if (!this._el) return;

        const { folders, files, selectedFolderId, activeFileId } = state;

        // 构建根级树（传递 activeFileId 和 selectedFolderId 用于互斥高亮）
        let html = this._renderFolderTree(null, folders, files, selectedFolderId, activeFileId, 0);

        // 添加根目录文件（仅当没有选中文件夹时才高亮文件）
        const rootFiles = files.filter(f => f.folderId === null);
        rootFiles.forEach(file => {
            html += this._renderFileItem(file, 0, activeFileId, selectedFolderId);
        });

        if (!html) {
            html = '<div class="sidebar-empty">暂无文件，右键新建</div>';
        }

        this._el.innerHTML = html;
        this._lastActiveFileId = activeFileId;
        this._lastSelectedFolderId = selectedFolderId;
    },

    /**
     * 增量更新：仅更新高亮和选中状态（不重建整个 DOM）
     * @param {Object} state - 状态快照
     * @returns {boolean} 是否成功执行了增量更新
     */
    updateIncremental(state) {
        if (!this._el) return false;

        const { selectedFolderId, activeFileId } = state;
        let changed = false;

        // 更新文件高亮（需考虑 selectedFolderId 互斥）
        if (this._lastActiveFileId !== activeFileId || this._lastSelectedFolderId !== selectedFolderId) {
            this._updateFileHighlight(activeFileId, selectedFolderId);
            this._lastActiveFileId = activeFileId;
            changed = true;
        }

        // 更新文件夹选中高亮
        if (this._lastSelectedFolderId !== selectedFolderId) {
            this._updateFolderSelection(this._lastSelectedFolderId, selectedFolderId);
            this._lastSelectedFolderId = selectedFolderId;
            changed = true;
        }

        return changed;
    },

    /**
     * 更新文件高亮（仅操作 DOM class）
     * @private
     * @param {number|null} activeFileId
     * @param {number|null} selectedFolderId - 有文件夹选中时清除所有文件高亮
     */
    _updateFileHighlight(activeFileId, selectedFolderId) {
        // 移除所有文件高亮
        this._el.querySelectorAll('.tree-file.active').forEach(el => {
            el.classList.remove('active');
        });

        // 仅当没有选中文件夹时，才高亮活动文件
        if (selectedFolderId === null && activeFileId !== null) {
            const activeEl = this._el.querySelector(`.tree-file[data-file-id="${activeFileId}"]`);
            if (activeEl) {
                activeEl.classList.add('active');
            }
        }
    },

    /**
     * 更新文件夹选中状态（仅操作 DOM class）
     * @private
     */
    _updateFolderSelection(oldFolderId, newFolderId) {
        // 移除旧的高亮
        if (oldFolderId !== null) {
            const oldEl = this._el.querySelector(`.tree-folder[data-folder-id="${oldFolderId}"]`);
            if (oldEl) {
                oldEl.classList.remove('active');
            }
        }

        // 添加新的高亮
        if (newFolderId !== null) {
            const newEl = this._el.querySelector(`.tree-folder[data-folder-id="${newFolderId}"]`);
            if (newEl) {
                newEl.classList.add('active');
            }
        }
    },

    /**
     * 递归渲染文件夹树
     * @private
     */
    _renderFolderTree(parentId, folders, files, selectedFolderId, activeFileId, depth) {
        const children = folders.filter(f => f.parentId === parentId);
        if (children.length === 0 && parentId === null) return '';

        let html = '';
        children.forEach(folder => {
            const hasChildren = folders.some(f => f.parentId === folder.id);
            const folderFiles = files.filter(f => f.folderId === folder.id);
            const expanded = folder.expanded;
            const arrow = hasChildren || folderFiles.length > 0
                ? (expanded ? ICONS.ARROW_DOWN : ICONS.ARROW_RIGHT)
                : '';

            // 使用容器包裹文件夹标题和子项，扩大拖拽目标区域
            const isSelected = selectedFolderId === folder.id;
            html += `<div class="tree-folder-group" data-folder-id="${folder.id}">`;
            html += `<div class="tree-folder${isSelected ? ' active' : ''}" draggable="true" data-folder-id="${folder.id}" style="padding-left:${depth * 16}px">`;
            html += `<span class="tree-arrow">${arrow}</span>`;
            const folderIcon = expanded ? ICONS.FOLDER_OPEN_TREE : ICONS.FOLDER_TREE;
            html += `<span class="tree-folder-icon">${folderIcon}</span>`;
            html += `<span class="tree-folder-name">${this._escapeHtml(folder.name)}</span>`;
            html += `<span class="tree-del-btn" data-action="delete-folder" data-id="${folder.id}">${ICONS.CLOSE}</span>`;
            html += `</div>`;

            // 展开时渲染子项
            if (expanded) {
                // 子文件夹
                html += this._renderFolderTree(folder.id, folders, files, selectedFolderId, activeFileId, depth + 1);
                // 子文件（仅当没有选中文件夹时才高亮文件）
                folderFiles.forEach(file => {
                    html += this._renderFileItem(file, depth + 1, activeFileId, selectedFolderId);
                });
            }

            html += `</div>`; // 关闭 tree-folder-group
        });

        return html;
    },

    /**
     * 渲染文件项
     * @private
     * @param {Object} file - 文件对象
     * @param {number} depth - 缩进层级
     * @param {number|null} activeFileId - 当前活动文件ID
     * @param {number|null} selectedFolderId - 当前选中的文件夹ID（有文件夹选中时文件不高亮）
     */
    _renderFileItem(file, depth, activeFileId, selectedFolderId) {
        // 仅当没有选中文件夹时，才高亮活动文件
        const isActive = (selectedFolderId === null) && (activeFileId === file.id);
        return `<div class="tree-file${isActive ? ' active' : ''}" draggable="true" data-file-id="${file.id}" style="padding-left:${depth * 16 + 16}px">
            <span class="tree-file-icon">${ICONS.NOTE_TREE}</span>
            <span class="tree-file-name">${this._escapeHtml(file.name)}</span>
            <span class="tree-del-btn" data-action="delete-file" data-id="${file.id}">${ICONS.CLOSE}</span>
        </div>`;
    },

    /**
     * HTML转义
     * @private
     */
    _escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
};
