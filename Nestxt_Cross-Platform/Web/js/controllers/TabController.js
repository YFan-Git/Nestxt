/**
 * TabController - 标签页UI控制器
 * 
 * 功能: 渲染标签页栏，处理标签切换、关闭、高亮
 * 交互: 所有标签页在容器内横向滚动显示，支持拖拽排序
 */

const TabController = {
    /** @private 标签容器元素 */
    _tabsContainer: null,

    /** @private 右键菜单元素 */
    _contextMenuEl: null,

    /** @private 右键点击的标签页ID */
    _rightClickedFileId: null,

    /** @private 右键菜单是否已初始化 */
    _contextMenuInited: false,

    /**
     * 初始化
     * @param {string|HTMLElement} container - tabbar 容器元素或选择器
     */
    init(container) {
        const barEl = typeof container === 'string'
            ? document.querySelector(container)
            : container;

        this._tabsContainer = barEl.querySelector('#tabs-container');
        this._contextMenuEl = document.getElementById('tab-context-menu');

        // 监听事件
        signal.on(Constants.EVENTS.TAB_OPENED, () => this.render());
        signal.on(Constants.EVENTS.TAB_CLOSED, () => this.render());
        signal.on(Constants.EVENTS.TAB_SWITCHED, () => this.render());
        signal.on(Constants.EVENTS.TAB_REORDERED, () => this.render());
        signal.on(Constants.EVENTS.TAB_CLOSE_ALL, () => this.render());
        signal.on(Constants.EVENTS.FILE_RENAMED, () => this.render());

        // 窗口大小变化时重新渲染
        window.addEventListener('resize', () => this.render());

        // 右键菜单事件（只初始化一次）
        this._initTabContextMenuEvents();

        // 点击其他地方关闭右键菜单（用 mousedown 响应更快）
        document.addEventListener('mousedown', (e) => {
            if (this._contextMenuEl && this._contextMenuEl.style.display === 'block') {
                if (!this._contextMenuEl.contains(e.target)) {
                    this._hideTabContextMenu();
                }
            }
        });

        this.render();
    },

    /**
     * 渲染标签页
     */
    render() {
        if (!this._tabsContainer) return;
        const tabIds = TabService.getAll();
        const activeId = TabService.getActiveId();

        if (tabIds.length === 0) {
            this._tabsContainer.innerHTML = '<div class="tabs-empty">未打开文件</div>';
            return;
        }

        // 渲染所有标签
        let html = '';
        tabIds.forEach(fileId => {
            const file = FileService.getById(fileId);
            if (!file) return;
            const isActive = fileId === activeId;
            html += `<div class="tab-item ${isActive ? 'tab-active' : ''}" data-file-id="${fileId}">
                <span class="tab-name">${this._escapeHtml(file.name)}</span>
                <span class="tab-close" data-file-id="${fileId}">✕</span>
            </div>`;
        });

        this._tabsContainer.innerHTML = html;
        this._bindTabEvents();
        // 滚动条归位到开头
        this._tabsContainer.scrollLeft = 0;
    },

    /**
     * HTML转义
     * @private
     */
    _escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    /**
     * 绑定标签事件
     * @private
     */
    _bindTabEvents() {
        // 点击标签切换
        this._tabsContainer.querySelectorAll('.tab-item').forEach(el => {
            el.addEventListener('click', (e) => {
                if (e.target.closest('.tab-close')) return;
                const fileId = parseInt(el.dataset.fileId);
                TabService.switchTo(fileId);
            });
        });

        // 关闭按钮
        this._tabsContainer.querySelectorAll('.tab-close').forEach(el => {
            el.addEventListener('click', (e) => {
                e.stopPropagation();
                const fileId = parseInt(el.dataset.fileId);
                TabService.close(fileId);
            });
        });

        // 拖拽排序
        this._initDragSort();
    },

    /**
     * 初始化右键菜单项事件（仅在 init 时调用一次）
     * @private
     */
    _initTabContextMenuEvents() {
        if (!this._contextMenuEl || this._contextMenuInited) return;
        this._contextMenuInited = true;

        // 在 tabs-container 上用事件委托处理右键，比逐个 tab-item 绑定更可靠
        this._tabsContainer.addEventListener('contextmenu', (e) => {
            const tabEl = e.target.closest('.tab-item');
            if (!tabEl) return;
            e.preventDefault();
            e.stopPropagation();
            this._rightClickedFileId = parseInt(tabEl.dataset.fileId);
            this._showTabContextMenu(e.clientX, e.clientY);
        });

        // 菜单项点击：用 mousedown 代替 click，响应更快更可靠
        this._contextMenuEl.querySelectorAll('.tab-context-menu-item[data-action]').forEach(el => {
            el.addEventListener('mousedown', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const action = el.dataset.action;
                this._hideTabContextMenu();
                this._handleTabContextAction(action);
            });
        });
    },

    /**
     * 显示标签右键菜单
     * @private
     * @param {number} x - 鼠标X坐标
     * @param {number} y - 鼠标Y坐标
     */
    _showTabContextMenu(x, y) {
        if (!this._contextMenuEl) return;
        // 先强制 display:none 再设 display:block 确保 WebView2 正确渲染
        this._contextMenuEl.style.display = 'none';
        // 用 requestAnimationFrame 确保 DOM 更新后再显示
        requestAnimationFrame(() => {
            if (!this._contextMenuEl) return;
            const viewportW = window.innerWidth;
            const viewportH = window.innerHeight;
            const menuW = this._contextMenuEl.offsetWidth || 120;
            const menuH = this._contextMenuEl.offsetHeight || 80;

            let left = x;
            let top = y;

            if (left + menuW > viewportW) left = viewportW - menuW - 10;
            if (top + menuH > viewportH) top = viewportH - menuH - 10;

            this._contextMenuEl.style.left = left + 'px';
            this._contextMenuEl.style.top = top + 'px';
            this._contextMenuEl.style.display = 'block';
        });
    },

    /**
     * 隐藏标签右键菜单
     * @private
     */
    _hideTabContextMenu() {
        if (this._contextMenuEl) {
            this._contextMenuEl.style.display = 'none';
        }
    },

    /**
     * 处理右键菜单操作
     * @private
     * @param {string} action
     */
    _handleTabContextAction(action) {
        switch (action) {
            case 'close':
                if (this._rightClickedFileId !== null) {
                    const fileId = this._rightClickedFileId;
                    this._rightClickedFileId = null;
                    TabService.close(fileId);
                }
                break;
            case 'close-all':
                TabService.closeAll();
                break;
        }
    },

    /**
     * 初始化拖拽排序
     * @private
     */
    _initDragSort() {
        const tabItems = this._tabsContainer.querySelectorAll('.tab-item');
        let draggedEl = null;

        tabItems.forEach(el => {
            el.draggable = true;

            el.addEventListener('dragstart', (e) => {
                draggedEl = el;
                el.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', el.dataset.fileId);
            });

            el.addEventListener('dragend', () => {
                el.classList.remove('dragging');
                draggedEl = null;
                tabItems.forEach(item => item.classList.remove('drag-over'));
            });

            el.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (el !== draggedEl) {
                    el.classList.add('drag-over');
                }
            });

            el.addEventListener('dragleave', () => {
                el.classList.remove('drag-over');
            });

            el.addEventListener('drop', (e) => {
                e.preventDefault();
                el.classList.remove('drag-over');
                if (!draggedEl || el === draggedEl) return;

                const fromFileId = parseInt(draggedEl.dataset.fileId);
                const toFileId = parseInt(el.dataset.fileId);
                TabService.reorder(fromFileId, toFileId);
            });
        });
    }
};
