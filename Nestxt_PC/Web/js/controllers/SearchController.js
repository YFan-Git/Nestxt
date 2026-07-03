/**
 * SearchController - 搜索控制器
 * 
 * 功能: 搜索文件名和文件内容，展示搜索结果
 * 交互: 输入关键词实时搜索，点击结果跳转到文件（搜索框常驻侧边栏）
 */

const SearchController = {
    /** @private 容器元素 */
    _el: null,

    /** @private 搜索输入框 */
    _input: null,

    /** @private 搜索结果容器 */
    _resultEl: null,

    /** @private 树容器（用于搜索时隐藏树） */
    _treeEl: null,

    /** @private 搜索面板元素 */
    _panelEl: null,

    /** @private 搜索定时器 */
    _debounceTimer: null,

    /**
     * 初始化
     * @param {string|HTMLElement} container
     */
    init(container) {
        this._el = typeof container === 'string'
            ? document.querySelector(container)
            : container;

        this._panelEl = this._el;
        this._input = this._el.querySelector('.search-input');
        this._resultEl = this._el.querySelector('.search-results');
        this._treeEl = document.querySelector('.sidebar-tree');

        this._bindEvents();
    },

    /**
     * 绑定事件
     * @private
     */
    _bindEvents() {
        // 移除 input 的 focus 监听，只保留用户交互时的 input 事件
        this._input.addEventListener('input', () => {
            clearTimeout(this._debounceTimer);
            this._debounceTimer = setTimeout(() => {
                this._doSearch();
            }, 300);
        });

        // 移除 focus 事件监听（这行删掉）
        // this._input.addEventListener('focus', () => { ... });

        this._input.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this._input.value = '';
                this._clearResults();
                this._input.blur();
            }
        });

        // 点击结果跳转
        this._resultEl.addEventListener('click', (e) => {
            const item = e.target.closest('.search-result-item');
            if (!item) return;
            const fileId = parseInt(item.dataset.fileId);
            const file = FileService.getById(fileId);
            if (file) {
                TabService.open(fileId);
                this._clearResults();
                this._input.value = '';
            }
        });
    },

    /**
     * 执行搜索
     * @private
     */
    _doSearch() {
        const query = this._input.value.trim();
        if (!query) {
            this._clearResults();
            return;
        }

        const results = FileService.search(query);
        signal.emit(Constants.EVENTS.SEARCH_RESULTS, { query, results });

        // 有搜索关键词时隐藏树，显示结果，扩展搜索面板
        if (this._treeEl) {
            this._treeEl.style.display = 'none';
        }
        if (this._panelEl) {
            this._panelEl.classList.add('search-active');
        }

        if (results.length === 0) {
            this._resultEl.innerHTML = '<div class="search-no-results">未找到结果</div>';
            return;
        }

        let html = '';
        results.forEach(file => {
            const folderName = file.folderId !== null
                ? (FolderService.getById(file.folderId)?.name || '根目录')
                : '根目录';
            html += `<div class="search-result-item" data-file-id="${file.id}">
                <div class="search-result-name">${file.name}</div>
                <div class="search-result-path">${ICONS.FOLDER_SEARCH} ${folderName}</div>
                <div class="search-result-match">${this._highlightMatch(file, query)}</div>
            </div>`;
        });
        this._resultEl.innerHTML = html;
    },

    /**
     * 清空搜索结果，恢复树显示
     * @private
     */
    _clearResults() {
        this._resultEl.innerHTML = '';
        if (this._treeEl) {
            this._treeEl.style.display = '';
        }
        if (this._panelEl) {
            this._panelEl.classList.remove('search-active');
        }
    },

    /**
     * 高亮匹配内容
     * @private
     */
    _highlightMatch(file, query) {
        const q = query.toLowerCase();
        if (file.matchType === 'name') return '文件名匹配';
        const content = file.content || '';
        const idx = content.toLowerCase().indexOf(q);
        if (idx === -1) return '内容匹配';
        const start = Math.max(0, idx - 20);
        const end = Math.min(content.length, idx + query.length + 20);
        let snippet = (start > 0 ? '...' : '') + content.substring(start, end) + (end < content.length ? '...' : '');
        return snippet;
    }
};