/**
 * Constants - 全局常量定义
 * 
 * 功能: 集中管理所有常量，便于统一修改
 */

const Constants = {
    // ========== 存储 Key ==========
    STORAGE_KEYS: {
        FOLDERS: 'nestxt_folders',
        FILES: 'nestxt_files',
        TABS: 'nestxt_tabs',
        TRASH: 'nestxt_trash',
        THEME: 'nestxt_theme',
        FONTSIZE: 'nestxt_fontsize',
        LINENUM: 'nestxt_linenum',
        WHITESPACE: 'nestxt_whitespace',
        SIDEBAR_WIDTH: 'nestxt_sidebar_width'
    },

    // ========== 尺寸常量 ==========
    SIZES: {
        TITLEBAR_HEIGHT: 42,
        TABBAR_HEIGHT: 36,
        LINE_NUMBER_WIDTH: 40,
        SIDEBAR_DEFAULT_WIDTH: 260,
        SIDEBAR_MIN_WIDTH: 200,
        SIDEBAR_MAX_WIDTH: 500,
        FONT_SIZE_MIN: 10,
        FONT_SIZE_MAX: 32,
        FONT_SIZE_DEFAULT: 14
    },

    // ========== 功能限制 ==========
    LIMITS: {
        MAX_TABS: 10,
        MAX_VERSIONS: 20,
        AUTO_SAVE_INTERVAL: 30000,  // 30秒自动保存
        TAB_SIZE: 4,                // Tab = 4空格（显示用）
        TAB_INSERT: 2               // 按Tab插入2个空格
    },

    // ========== 事件名称 ==========
    EVENTS: {
        // 文件事件
        FILE_CREATED: 'file:created',
        FILE_DELETED: 'file:deleted',
        FILE_RENAMED: 'file:renamed',
        FILE_SAVED: 'file:saved',
        FILE_OPENED: 'file:opened',
        FILE_MOVED: 'file:moved',
        FILE_CONTENT_CHANGED: 'file:contentChanged',

        // 文件夹事件
        FOLDER_CREATED: 'folder:created',
        FOLDER_DELETED: 'folder:deleted',
        FOLDER_RENAMED: 'folder:renamed',
        FOLDER_EXPANDED: 'folder:expanded',
        FOLDER_COLLAPSED: 'folder:collapsed',
        FOLDER_SELECTED: 'folder:selected',
        FOLDER_MOVED: 'folder:moved',

        // 标签页事件
        TAB_OPENED: 'tab:opened',
        TAB_CLOSED: 'tab:closed',
        TAB_SWITCHED: 'tab:switched',
        TAB_CLOSE_ALL: 'tab:closeAll',
        TAB_REORDERED: 'tab:reordered',

        // 编辑器事件
        EDITOR_SAVE: 'editor:save',
        EDITOR_AUTO_SAVE: 'editor:autoSave',
        EDITOR_UPDATE: 'editor:update',

        // 主题事件
        THEME_CHANGED: 'theme:changed',

        // 视图事件
        SIDEBAR_TOGGLE: 'sidebar:toggle',
        SIDEBAR_RESIZE: 'sidebar:resize',
        LINE_NUM_TOGGLE: 'lineNum:toggle',
        WORD_WRAP_TOGGLE: 'wordWrap:toggle',
        SYNTAX_HIGHLIGHT_TOGGLE: 'syntaxHighlight:toggle',
        TREE_VIEW_TOGGLE: 'treeView:toggle',
        FONT_SIZE_CHANGED: 'fontSize:changed',

        // 回收站事件
        TRASH_OPENED: 'trash:opened',
        ITEM_RESTORED: 'trash:itemRestored',
        TRASH_EMPTIED: 'trash:emptied',

        // 搜索事件
        SEARCH_OPENED: 'search:opened',
        SEARCH_CLOSED: 'search:closed',
        SEARCH_RESULTS: 'search:results',

        // 拖拽事件
        DRAG_START: 'drag:start',
        DRAG_OVER: 'drag:over',
        DRAG_DROP: 'drag:drop',

        // 版本管理事件
        VERSION_SAVED: 'version:saved',
        VERSION_DELETED: 'version:deleted',
        VERSION_RESTORED: 'version:restored',
        VERSION_PANEL_TOGGLE: 'version:panelToggle',

        // 编码事件
        ENCODING_CHANGED: 'encoding:changed',

        // 拖拽事件
        DRAG_END: 'drag:end'
    }
};
