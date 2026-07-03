/**
 * AutoSaveService - 自动保存服务
 * 
 * 功能: 定时自动保存当前编辑的文件，间隔30秒
 */

const AutoSaveService = {
    /** @private 定时器句柄 */
    _timer: null,

    /** @private 是否已启用 */
    _enabled: false,

    /** @private 最后保存的文件ID */
    _lastSavedFileId: null,

    /** @private 当前间隔（秒） */
    _currentInterval: 30,

    /**
     * 启动自动保存
     */
    start() {
        if (this._enabled) return;
        this._enabled = true;
        // 从 StorageService 读取用户设置的间隔（秒），默认30秒
        this._currentInterval = StorageService.getAutosaveInterval();
        this._timer = setInterval(() => {
            this._autoSave();
        }, this._currentInterval * 1000);

        // 监听间隔变更信号，动态响应
        signal.on('storage:autosave-interval-updated', (data) => {
            this._onIntervalChanged(data);
        });
    },

    /**
     * 停止自动保存
     */
    stop() {
        if (this._timer) {
            clearInterval(this._timer);
            this._timer = null;
        }
        this._enabled = false;
    },

    /**
     * 处理间隔变更
     * @private
     */
    _onIntervalChanged(data) {
        if (!this._enabled) return;

        const newInterval = data.interval || 30;
        if (newInterval === this._currentInterval) return;

        // 重启定时器
        if (this._timer) {
            clearInterval(this._timer);
        }
        this._currentInterval = newInterval;
        this._timer = setInterval(() => {
            this._autoSave();
        }, this._currentInterval * 1000);
    },

    /**
     * 执行自动保存
     * @private
     */
    _autoSave() {
        const tabService = Autoload.get('tabService');
        const fileService = Autoload.get('fileService');
        if (!tabService || !fileService) return;

        const activeId = tabService.getActiveId();
        if (activeId === null || activeId === undefined) return;

        // 通过信号触发保存
        signal.emit(Constants.EVENTS.EDITOR_AUTO_SAVE, { fileId: activeId });
    },

    /**
     * 获取是否已启用
     * @returns {boolean}
     */
    isEnabled() {
        return this._enabled;
    }
};
