/**
 * FolderTreeStateManager - 文件夹树状态与数据管理
 * 
 * 职责:
 * - 管理展开状态、选中ID、高亮状态
 * - 提供 getState() 供渲染器消费
 * - 监听 Service 事件，触发状态更新回调而非直接渲染
 */

const FolderTreeStateManager = {
    /** @private 当前选中的文件夹ID */
    _selectedFolderId: null,

    /** @private 回调函数：状态变化时触发 */
    _onStateChange: null,

    /**
     * 初始化
     * @param {Function} onStateChange - 状态变化回调 (state) => void
     */
    init(onStateChange) {
        this._onStateChange = onStateChange;

        // 监听标签切换事件，更新选中状态
        signal.on(Constants.EVENTS.TAB_SWITCHED, () => this._onTabSwitched());
        signal.on(Constants.EVENTS.TAB_CLOSED, () => this._onTabSwitched());
        signal.on(Constants.EVENTS.TAB_CLOSE_ALL, () => this._onTabSwitched());
    },

    /**
     * 获取完整状态快照（供渲染器消费）
     * @returns {Object}
     */
    getState() {
        return {
            selectedFolderId: this._selectedFolderId,
            folders: FolderService.getAll(),
            files: FileService.getAll(),
            activeFileId: TabService.getActiveId()
        };
    },

    /**
     * 获取当前选中的文件夹ID
     * @returns {number|null}
     */
    getSelectedFolderId() {
        return this._selectedFolderId;
    },

    /**
     * 统一设置选中的文件夹ID（唯一入口）
     * @param {number|null} folderId
     */
    setSelectedFolder(folderId) {
        if (this._selectedFolderId === folderId) return;
        this._selectedFolderId = folderId;
        this._notifyChange();
    },

    /**
     * 清除选中状态
     */
    clearSelection() {
        if (this._selectedFolderId !== null) {
            this._selectedFolderId = null;
            this._notifyChange();
        }
    },

    /**
     * 根据当前活动文件清理选中状态（不再自动选中父文件夹）
     * @private
     */
    _onTabSwitched() {
        // 文件切换时清除文件夹选中，让文件高亮显示
        this.clearSelection();
    },

    /**
     * 静默展开文件夹及其所有祖先（仅修改数据）
     * @param {number} folderId
     */
    expandAncestors(folderId) {
        let folder = FolderService.getById(folderId);
        while (folder) {
            if (!folder.expanded) {
                folder.expanded = true;
            }
            folder = folder.parentId !== null ? FolderService.getById(folder.parentId) : null;
        }
        FolderService._save();
    },

    /**
     * 通知状态变化
     * @private
     */
    _notifyChange() {
        if (this._onStateChange) {
            this._onStateChange(this.getState());
        }
    }
};
