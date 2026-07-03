/**
 * ContextMenuController - 右键菜单控制器
 * 
 * 功能: 管理右键菜单的显示/隐藏，处理菜单项点击
 * 交互: 文件夹→新建/重命名/删除，文件→重命名/删除/另存为，空白→新建文件夹/文件
 */

const ContextMenuController = {
    /** @private 菜单元素 */
    _el: null,

    /** @private 当前上下文 */
    _context: {
        type: null,    // 'folder' | 'file' | 'blank'
        id: null,
        x: 0,
        y: 0
    },

    /**
     * 初始化
     * @param {string|HTMLElement} container - 菜单容器
     */
    init(container) {
        this._el = typeof container === 'string'
            ? document.querySelector(container)
            : container;

        // 隐藏菜单
        this._hide();
    },

    /**
     * 显示右键菜单
     * @param {Object} options
     * @param {'folder'|'file'|'blank'} options.type - 右键目标类型
     * @param {number} [options.id] - 目标ID
     * @param {number} options.x - 鼠标X
     * @param {number} options.y - 鼠标Y
     */
    show({ type, id, x, y }) {
        this._context = { type, id, x, y };

        let items = [];
        if (type === 'folder') {
            items = [
                { label: ICONS.FILE_ADD_CTX + ' 新建文件', action: 'new-file', id },
                { label: ICONS.FOLDER_ADD_CTX + ' 新建文件夹', action: 'new-folder', id },
                { label: ICONS.WRITE_CTX + ' 重命名', action: 'rename-folder', id },
                { label: ICONS.DELETE_CTX + ' 删除', action: 'delete-folder', id, danger: true }
            ];
        } else if (type === 'file') {
            items = [
                { label: ICONS.WRITE_CTX + ' 重命名', action: 'rename-file', id },
                { label: ICONS.COPY_FILE_CTX + ' 复制副本', action: 'copy-file', id },
                { label: ICONS.SAVE_CTX + ' 另存为', action: 'export-file', id },
                { label: ICONS.DELETE_CTX + ' 删除', action: 'delete-file', id, danger: true }
            ];
        } else if (type === 'blank') {
            items = [
                { label: ICONS.FILE_ADD_CTX + ' 新建文件', action: 'new-file' },
                { label: ICONS.FOLDER_ADD_CTX + ' 新建文件夹', action: 'new-folder' }
            ];
        }

        this._render(items);
        this._position(x, y);
        this._el.style.display = 'block';
    },

    /**
     * 渲染菜单项
     * @private
     */
    _render(items) {
        let html = items.map(item => `
            <div class="menu-item ${item.danger ? 'menu-item-danger' : ''}" 
                 data-action="${item.action}" 
                 data-id="${item.id !== undefined ? item.id : ''}">
                ${item.label}
            </div>
        `).join('');
        this._el.innerHTML = html;

        // 绑定点击事件
        this._el.querySelectorAll('.menu-item').forEach(el => {
            el.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = el.dataset.action;
                const id = el.dataset.id ? parseInt(el.dataset.id) : null;
                this._handleAction(action, id);
                this._hide();
            });
        });
    },

    /**
     * 定位菜单
     * @private
     */
    _position(x, y) {
        const viewportW = window.innerWidth;
        const viewportH = window.innerHeight;
        const menuW = 200;
        const menuH = this._el.firstChild ? this._el.children.length * 32 + 10 : 200;

        let left = x;
        let top = y;

        if (left + menuW > viewportW) left = viewportW - menuW - 10;
        if (top + menuH > viewportH) top = viewportH - menuH - 10;

        this._el.style.left = left + 'px';
        this._el.style.top = top + 'px';
    },

    /**
     * 隐藏菜单
     * @private
     */
    _hide() {
        this._el.style.display = 'none';
        this._el.innerHTML = '';
    },

    /**
     * 处理菜单操作
     * @private
     */
    _handleAction(action, id) {
        switch (action) {
            case 'new-file':
                signal.emit('ui:newFile', { folderId: id });
                break;
            case 'new-folder':
                signal.emit('ui:newFolder', { parentId: id });
                break;
            case 'rename-file':
                signal.emit('ui:renameFile', { fileId: id });
                break;
            case 'rename-folder':
                signal.emit('ui:renameFolder', { folderId: id });
                break;
            case 'delete-file':
                signal.emit('ui:deleteFile', { fileId: id });
                break;
            case 'delete-folder':
                signal.emit('ui:deleteFolder', { folderId: id });
                break;
            case 'export-file':
                signal.emit('ui:exportFile', { fileId: id });
                break;
            case 'copy-file':
                signal.emit('ui:copyFile', { fileId: id });
                break;
        }
    }
};
