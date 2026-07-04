/**
 * TabService - 标签页管理服务
 * 
 * 功能: 管理已打开文件的标签页列表、当前激活标签页
 * 限制: 最多同时打开 MAX_TABS 个标签页
 */

const TabService = {
    /** @private 标签页ID数组（按打开顺序） */
    _tabs: [],

    /** @private 当前激活的文件ID */
    _activeId: null,

    /**
     * 初始化：从存储加载
     */
    init() {
        this._tabs = StorageService.getTabs();
        // 恢复上次激活的标签页
        const savedActiveId = StorageService.getActiveTab();
        // 清除可能无效的ID（文件已被删除的）
        const files = FileService.getAll();
        this._tabs = this._tabs.filter(id => files.some(f => f.id === id));
        // 优先使用保存的 activeTab，其次用最后一个
        if (savedActiveId && this._tabs.includes(savedActiveId)) {
            this._activeId = savedActiveId;
        } else {
            this._activeId = this._tabs.length > 0 ? this._tabs[this._tabs.length - 1] : null;
        }
        // 只保存 tabs 数组，不保存 activeTab（避免覆盖）
        StorageService.saveTabs(this._tabs);
    },

    /**
     * 保存到存储
     * @private
     */
    _save() {
        StorageService.saveTabs(this._tabs);
        StorageService.saveActiveTab(this._activeId);
    },

    /**
     * 获取所有标签页ID
     * @returns {number[]}
     */
    getAll() {
        return [...this._tabs];
    },

    /**
     * 获取当前激活的文件ID
     * @returns {number|null}
     */
    getActiveId() {
        return this._activeId;
    },

    /**
     * 获取标签页数量
     * @returns {number}
     */
    getCount() {
        return this._tabs.length;
    },

    /**
     * 判断标签页是否已满
     * @returns {boolean}
     */
    isFull() {
        return this._tabs.length >= Constants.LIMITS.MAX_TABS;
    },

    /**
     * 判断文件是否已在标签页中打开
     * @param {number} fileId
     * @returns {boolean}
     */
    isOpen(fileId) {
        return this._tabs.includes(fileId);
    },

    /**
     * 打开标签页（无数量限制）
     * @param {number} fileId
     * @returns {boolean}
     */
    open(fileId) {
        if (!FileService.getById(fileId)) return false;

        // 如果已打开，切换到它并移到第一位
        if (this.isOpen(fileId)) {
            const index = this._tabs.indexOf(fileId);
            if (index > 0) {
                this._tabs.splice(index, 1);
                this._tabs.unshift(fileId);
            }
            this._activeId = fileId;
            this._save();
            signal.emit(Constants.EVENTS.TAB_REORDERED, { tabs: [...this._tabs] });
            signal.emit(Constants.EVENTS.TAB_SWITCHED, { fileId });
            return true;
        }

        this._tabs.unshift(fileId);
        this._activeId = fileId;
        this._save();
        signal.emit(Constants.EVENTS.TAB_OPENED, { fileId });
        signal.emit(Constants.EVENTS.TAB_SWITCHED, { fileId });
        return true;
    },

    /**
     * 关闭标签页
     * @param {number} fileId
     * @returns {boolean}
     */
    close(fileId) {
        const index = this._tabs.indexOf(fileId);
        if (index === -1) return false;

        this._tabs.splice(index, 1);

        // 如果关闭的是当前激活的标签页，自动切换到相邻标签
        if (this._activeId === fileId) {
            if (this._tabs.length === 0) {
                this._activeId = null;
            } else if (index < this._tabs.length) {
                this._activeId = this._tabs[index];
            } else {
                this._activeId = this._tabs[this._tabs.length - 1];
            }
        }

        this._save();
        signal.emit(Constants.EVENTS.TAB_CLOSED, { fileId, activeId: this._activeId });
        return true;
    },

    /**
     * 切换到指定标签页
     * @param {number} fileId
     */
    switchTo(fileId) {
        if (!this.isOpen(fileId)) return;
        this._activeId = fileId;
        this._save();
        signal.emit(Constants.EVENTS.TAB_SWITCHED, { fileId });
    },

    /**
     * 关闭所有标签页
     */
    closeAll() {
        this._tabs = [];
        this._activeId = null;
        this._save();
        signal.emit(Constants.EVENTS.TAB_CLOSE_ALL, {});
    },

    /**
     * 重新排序标签页
     * @param {number} fromFileId - 拖动的文件ID
     * @param {number} toFileId - 目标位置的文件ID
     */
    reorder(fromFileId, toFileId) {
        const fromIndex = this._tabs.indexOf(fromFileId);
        const toIndex = this._tabs.indexOf(toFileId);
        if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return;

        this._tabs.splice(fromIndex, 1);
        this._tabs.splice(toIndex, 0, fromFileId);
        this._save();
        signal.emit(Constants.EVENTS.TAB_REORDERED, { tabs: [...this._tabs] });
    }
};
