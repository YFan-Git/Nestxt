/**
 * StorageService - 数据持久化服务（业务层）
 *
 * 功能: 通过 StorageBridge 将 JSON 数据持久化，提供业务语义方法
 * 架构: 三层存储架构的中间层 —— "存什么"
 * 设计:
 *   - 所有持久化操作通过 StorageBridge 完成，不直接接触 localStorage
 *   - 提供业务语义方法（getFolders/saveFolders/...），每个方法包含读/写 + 事件触发 + 默认值
 *   - 保留 load()/save()/remove() 作为向后兼容的通用方法（供控制器层使用）
 *   - 内存缓存 + 异步防抖持久化，确保性能
 */

const StorageService = {
    /** @private 内存缓存 */
    _cache: {},

    /** @private 是否已完成初始化预加载 */
    _ready: false,

    /** @private 需要预加载的键列表（共 16 个） */
    _dataKeys: [
        'folders', 'files', 'tabs', 'activeTab', 'trash',
        'theme', 'fontsize', 'linenum', 'sidebar_width',
        'wordwrap', 'version_panel_width', 'autosave_interval',
        'syntax', 'syntax_highlight', 'editing_versions'
    ],

    /* ================================================================
     *  初始化
     *  ================================================================ */

    /**
     * 初始化：从 StorageBridge 加载所有数据到缓存
     * @returns {Promise}
     */
    async init() {
        // 先初始化 StorageBridge
        StorageBridge.init();

        for (const key of this._dataKeys) {
            const val = await StorageBridge.getItem(key);
            this._cache[key] = val !== null ? val : undefined;
        }

        this._ready = true;
    },

    /**
     * 等待初始化完成
     * @returns {Promise}
     */
    async waitReady() {
        if (this._ready) return;
        for (let i = 0; i < 30; i++) {
            if (this._ready) return;
            await new Promise(r => setTimeout(r, 100));
        }
    },

    /* ================================================================
     *  底层持久化（私有）
     *  ================================================================ */

    /**
     * 立即持久化到 StorageBridge（无防抖，fire-and-forget 不等待回调）
     * 数据变更时马上写磁盘，避免关闭时丢失。
     * @private
     * @param {string} key - 存储键
     * @param {*} data - 要持久化的数据
     */
    _persist(key, data) {
        StorageBridge.setItem(key, data);
    },

    /**
     * 立即执行所有待执行的持久化操作（已无需防抖清除，保留为空操作便于兼容）
     * @returns {Promise<void>}
     */
    async flushAll() {
        console.log('[AutoSave] 已无防抖任务，无需刷新');
    },

    /* ================================================================
     *  通用方法（向后兼容，供控制器层使用）
     *  ================================================================ */

    /**
     * 从缓存读取数据（通用方法，不触发事件）
     * @param {string} key - 存储键
     * @param {*} defaultValue - 默认值
     * @returns {*}
     */
    load(key, defaultValue = null) {
        const val = this._cache[key];
        return val !== undefined ? val : defaultValue;
    },

    /**
     * 保存数据（通用方法，写入缓存 + 异步持久化，不触发事件）
     * @param {string} key - 存储键
     * @param {*} data - 要保存的数据
     */
    save(key, data) {
        this._cache[key] = data;
        this._persist(key, data);
    },

    /**
     * 删除数据（通用方法）
     * @param {string} key - 存储键
     */
    remove(key) {
        delete this._cache[key];
        StorageBridge.removeItem(key);  // 不阻塞，fire-and-forget
    },

    /* ================================================================
     *  业务语义方法 —— 每个方法包含: 读/写 Bridge + 触发 Signal + 默认值
     *  ================================================================ */

    // ---- folders 文件夹 ----

    /**
     * 获取文件夹列表
     * @returns {Array} 文件夹数组，默认空数组
     */
    getFolders() {
        const val = this._cache['folders'];
        return val !== undefined ? val : [];
    },

    /**
     * 保存文件夹列表
     * @param {Array} data - 文件夹数组
     */
    saveFolders(data) {
        this._cache['folders'] = data;
        this._persist('folders', data);
        signal.emit('storage:folders-updated', data);
    },

    // ---- files 文件 ----

    /**
     * 获取文件列表
     * @returns {Array} 文件数组，默认空数组
     */
    getFiles() {
        const val = this._cache['files'];
        return val !== undefined ? val : [];
    },

    /**
     * 保存文件列表
     * @param {Array} data - 文件数组
     */
    saveFiles(data) {
        this._cache['files'] = data;
        this._persist('files', data);
        signal.emit('storage:files-updated', data);
    },

    // ---- tabs 标签页 ----

    /**
     * 获取标签页ID列表
     * @returns {Array} 标签页ID数组，默认空数组
     */
    getTabs() {
        const val = this._cache['tabs'];
        return val !== undefined ? val : [];
    },

    /**
     * 保存标签页ID列表
     * @param {Array} data - 标签页ID数组
     */
    saveTabs(data) {
        this._cache['tabs'] = data;
        this._persist('tabs', data);
        signal.emit('storage:tabs-updated', data);
    },

    // ---- activeTab 当前激活标签页 ----

    /**
     * 获取当前激活的标签页ID
     * @returns {number|null} 标签页ID，默认 null
     */
    getActiveTab() {
        const val = this._cache['activeTab'];
        return val !== undefined ? val : null;
    },

    /**
     * 保存当前激活的标签页ID
     * @param {number|null} data - 标签页ID
     */
    saveActiveTab(data) {
        this._cache['activeTab'] = data;
        this._persist('activeTab', data);
        signal.emit('storage:active-tab-updated', data);
    },

    // ---- trash 回收站 ----

    /**
     * 获取回收站列表
     * @returns {Array} 回收站项目数组，默认空数组
     */
    getTrash() {
        const val = this._cache['trash'];
        return val !== undefined ? val : [];
    },

    /**
     * 保存回收站列表
     * @param {Array} data - 回收站项目数组
     */
    saveTrash(data) {
        this._cache['trash'] = data;
        this._persist('trash', data);
        signal.emit('storage:trash-updated', data);
    },

    // ---- theme 主题 ----

    /**
     * 获取主题设置
     * @returns {string} 主题名称，默认 'light'
     */
    getTheme() {
        const val = this._cache['theme'];
        return val !== undefined ? val : 'light';
    },

    /**
     * 保存主题设置
     * @param {string} data - 主题名称（'light' | 'dark'）
     */
    saveTheme(data) {
        this._cache['theme'] = data;
        this._persist('theme', data);
        signal.emit('storage:theme-updated', data);
    },

    // ---- fontsize 字号 ----

    /**
     * 获取字号设置
     * @returns {number} 字号，默认 14
     */
    getFontsize() {
        const val = this._cache['fontsize'];
        return val !== undefined ? val : 14;
    },

    /**
     * 保存字号设置
     * @param {number} data - 字号
     */
    saveFontsize(data) {
        this._cache['fontsize'] = data;
        this._persist('fontsize', data);
        signal.emit('storage:fontsize-updated', data);
    },

    // ---- linenum 行号显示 ----

    /**
     * 获取行号显示状态
     * @returns {boolean} 是否显示行号，默认 true
     */
    getLinenum() {
        const val = this._cache['linenum'];
        return val !== undefined ? val : true;
    },

    /**
     * 保存行号显示状态
     * @param {boolean} data - 是否显示行号
     */
    saveLinenum(data) {
        this._cache['linenum'] = data;
        this._persist('linenum', data);
        signal.emit('storage:linenum-updated', data);
    },

    // ---- sidebar_width 侧边栏宽度 ----

    /**
     * 获取侧边栏宽度
     * @returns {number} 宽度像素值，默认 260
     */
    getSidebarWidth() {
        const val = this._cache['sidebar_width'];
        return val !== undefined ? val : 260;
    },

    /**
     * 保存侧边栏宽度
     * @param {number} data - 宽度像素值
     */
    saveSidebarWidth(data) {
        this._cache['sidebar_width'] = data;
        this._persist('sidebar_width', data);
        signal.emit('storage:sidebar-width-updated', data);
    },

    // ---- wordwrap 自动换行 ----

    /**
     * 获取自动换行状态
     * @returns {boolean} 是否自动换行，默认 false
     */
    getWordwrap() {
        const val = this._cache['wordwrap'];
        return val !== undefined ? val : false;
    },

    /**
     * 保存自动换行状态
     * @param {boolean} data - 是否自动换行
     */
    saveWordwrap(data) {
        this._cache['wordwrap'] = data;
        this._persist('wordwrap', data);
        signal.emit('storage:wordwrap-updated', data);
    },

    // ---- version_panel_width 版本面板宽度 ----

    /**
     * 获取版本面板宽度
     * @returns {number} 宽度像素值，默认 260
     */
    getVersionPanelWidth() {
        const val = this._cache['version_panel_width'];
        return val !== undefined ? val : 260;
    },

    /**
     * 保存版本面板宽度
     * @param {number} data - 宽度像素值
     */
    saveVersionPanelWidth(data) {
        this._cache['version_panel_width'] = data;
        this._persist('version_panel_width', data);
        signal.emit('storage:version-panel-width-updated', data);
    },

    // ---- autosave_interval 自动保存间隔 ----

    /**
     * 获取自动保存间隔
     * @returns {number} 间隔秒数，默认 30
     */
    getAutosaveInterval() {
        const val = this._cache['autosave_interval'];
        return val !== undefined ? val : 30;
    },

    /**
     * 保存自动保存间隔
     * @param {number} data - 间隔秒数
     */
    saveAutosaveInterval(data) {
        this._cache['autosave_interval'] = data;
        this._persist('autosave_interval', data);
        signal.emit('storage:autosave-interval-updated', data);
    },

    // ---- syntax 语法规则 ----

    /**
     * 获取语法高亮规则列表
     * @returns {Array} 规则数组，默认空数组
     */
    getSyntax() {
        const val = this._cache['syntax'];
        return val !== undefined ? val : [];
    },

    /**
     * 保存语法高亮规则列表
     * @param {Array} data - 规则数组
     */
    saveSyntax(data) {
        this._cache['syntax'] = data;
        this._persist('syntax', data);
        signal.emit('storage:syntax-updated', data);
    },

    // ---- syntax_highlight 语法高亮开关 ----

    /**
     * 获取语法高亮开关状态
     * @returns {boolean} 是否启用语法高亮，默认 true
     */
    getSyntaxHighlight() {
        const val = this._cache['syntax_highlight'];
        return val !== undefined ? val : true;
    },

    /**
     * 保存语法高亮开关状态
     * @param {boolean} data - 是否启用语法高亮
     */
    saveSyntaxHighlight(data) {
        this._cache['syntax_highlight'] = data;
        this._persist('syntax_highlight', data);
        signal.emit('storage:syntax-highlight-updated', data);
    },

    // ---- editing_versions 编辑中的版本映射 ----

    /**
     * 获取编辑版本映射表
     * @returns {Object} 版本映射对象，默认空对象
     */
    getEditingVersions() {
        const val = this._cache['editing_versions'];
        return val !== undefined ? val : {};
    },

    /**
     * 保存编辑版本映射表
     * @param {Object} data - 版本映射对象
     */
    saveEditingVersions(data) {
        this._cache['editing_versions'] = data;
        this._persist('editing_versions', data);
        signal.emit('storage:editing-versions-updated', data);
    },

    /* ================================================================
     *  批量导入导出（供 settings.js 使用）
     *  ================================================================ */

    /**
     * 导出全部 16 个数据键（用于备份）
     * @returns {Object} 包含所有数据键的对象
     */
    exportAll() {
        const data = {};
        for (const key of this._dataKeys) {
            const val = this._cache[key];
            data[key] = val !== undefined ? val : null;
        }
        return data;
    },

    /**
     * 批量导入数据（验证格式后写入所有键）
     * @param {Object} data - 包含数据键的对象
     */
    importAll(data) {
        if (!data || typeof data !== 'object') {
            console.error('[StorageService] importAll: 无效的数据格式');
            return;
        }
        for (const key of this._dataKeys) {
            if (data[key] !== undefined) {
                this._cache[key] = data[key];
                this._persist(key, data[key]);
            }
        }
        // 批量导入完成后触发一次全局更新事件
        signal.emit('storage:import-all', {});
    }
};