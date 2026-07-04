/**
 * ThemeController - 主题切换控制器
 * 
 * 功能: 管理深色/浅色主题切换，持久化主题设置
 */

const ThemeController = {
    /** @private 当前主题 */
    _currentTheme: 'light',

    /** @private 主题样式链接元素ID */
    _styleId: 'nestxt-theme-style',

    /**
     * 初始化
     */
    init() {
        this._currentTheme = StorageService.load('theme', 'light');
        this._applyTheme();
        signal.on(Constants.EVENTS.THEME_CHANGED, (data) => {
            this._currentTheme = data.theme;
            this._applyTheme();
        });
    },

    /**
     * 应用主题
     * @private
     */
    _applyTheme() {
        document.documentElement.setAttribute('data-theme', this._currentTheme);
        StorageService.save('theme', this._currentTheme);
        this._updateToggleIcon();
    },

    /**
     * 更新开关图标和 badge 颜色
     * @private
     */
    _updateToggleIcon() {
        const iconEl = document.querySelector('.theme-toggle-icon');
        if (iconEl) {
            const iconHtml = this._currentTheme === 'dark' ? ICONS.MOON : ICONS.SUN;
            iconEl.innerHTML = iconHtml;
        }
    },

    /**
     * 切换主题
     */
    toggle() {
        const newTheme = this._currentTheme === 'dark' ? 'light' : 'dark';
        this._currentTheme = newTheme;
        signal.emit(Constants.EVENTS.THEME_CHANGED, { theme: newTheme });
    },

    /**
     * 设置主题
     * @param {'dark'|'light'} theme
     */
    setTheme(theme) {
        if (theme !== 'dark' && theme !== 'light') return;
        this._currentTheme = theme;
        signal.emit(Constants.EVENTS.THEME_CHANGED, { theme });
    },

    /**
     * 获取当前主题
     * @returns {'dark'|'light'}
     */
    getCurrentTheme() {
        return this._currentTheme;
    }
};
