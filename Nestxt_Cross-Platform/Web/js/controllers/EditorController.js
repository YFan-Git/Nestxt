/**
 * EditorController - 文本编辑器控制器（核心）
 * 
 * 功能: 文本编辑、行号显示、Tab缩进、Enter自动缩进、保存
 * 交互: Ctrl+S保存，Tab插入2空格，Enter保持缩进
 * 
 * 子模块:
 *   editor/EditorController.linenum.js    - 行号计算与渲染
 *   editor/EditorController.syntax.js     - 语法高亮
 *   editor/EditorController.treeview.js   - 树图可视化
 *   editor/EditorController.contextmenu.js- 右键菜单
 *   editor/EditorController.version.js    - 版本信息栏
 */

const EditorController = {
    /** @private 编辑器容器 */
    _el: null,

    /** @private 文本区域 */
    _textarea: null,

    /** @private 行号区域 */
    _lineNumEl: null,

    /** @private 当前编辑的文件ID */
    _currentFileId: null,

    /** @private 当前正在编辑的版本ID（null表示编辑文件原始内容） */
    _currentEditingVersionId: null,

    /** @private 按文件ID跟踪每个文件正在编辑的版本ID */
    _editingVersionMap: {},

    /** @private 内容是否已修改 */
    _dirty: false,

    /** @private 版本信息元素 */
    _versionInfoEl: null,

    /** @private 是否显示行号 */
    _showLineNum: true,

    /** @private 是否自动换行 */
    _wordWrap: false,

    /** @private 树图面板元素 */
    _treeviewPanel: null,

    /** @private 树图内容元素 */
    _treeviewContent: null,

    /** @private 树图是否开启 */
    _treeViewOn: false,

    /** @private 语法高亮覆盖层 */
    _syntaxOverlay: null,

    /** @private 自定义语法规则 */
    _syntaxRules: [],

    /** @private 行高测量元素（用于自动换行时计算视觉行数） */
    _measurePre: null,

    /** @private input 事件 rAF 批处理标志 */
    _inputRafPending: false,

    /**
     * 初始化
     * @param {string|HTMLElement} container - 容器元素或选择器
     */
    init(container) {
        this._el = typeof container === 'string'
            ? document.querySelector(container)
            : container;

        // 读取设置
        this._showLineNum = StorageService.load('linenum', true);
        this._wordWrap = StorageService.load('wordwrap', false);
        this._editingVersionMap = StorageService.load('editing_versions', {});

        // 应用已保存的字号
        const savedFontSize = StorageService.load('fontsize', Constants.SIZES.FONT_SIZE_DEFAULT);
        this._fontSize = savedFontSize;

        // 创建编辑器结构
        this._el.innerHTML = `
            <div class="editor-wrapper">
                <div class="line-numbers"></div>
                <pre class="syntax-overlay" aria-hidden="true"></pre>
                <textarea class="editor-textarea" spellcheck="false"></textarea>
                <div class="editor-empty">
                    <div class="editor-empty-icon">${ICONS.NOTE_EMPTY}${ICONS.NOTE_EMPTY_DARK}</div>
                    <div class="editor-empty-text">点击 + 文件或拖入一个文本文件</div>
                </div>
            </div>
            <!-- 树图可视化面板 -->
            <div class="treeview-panel" style="display:none">
                <div class="treeview-resize-handle"></div>
                <div class="treeview-toolbar">
                    <button class="toolbar-btn" disabled>${ICONS.TREEVIEW} 树图</button>
                    <div class="treeview-toolbar-actions">
                        <button class="treeview-btn-copy" title="复制">
                            <svg class="treeview-btn-icon-copy" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                            <svg class="treeview-btn-icon-check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                            <span class="treeview-btn-label">复制</span>
                        </button>
                        <button class="treeview-btn-download" title="下载">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                            下载
                        </button>
                        <button class="treeview-btn-close" title="关闭树图">×</button>
                    </div>
                </div>
                <div class="treeview-content"></div>
            </div>
            <div class="version-info">
                <span class="version-info-icon">${ICONS.NOTE_VERSION}</span>
                <span class="version-info-text">当前版本：</span>
                <span class="version-info-name"></span>
                <span class="version-info-time"></span>
            </div>
        `;
        this._lineNumEl = this._el.querySelector('.line-numbers');
        this._textarea = this._el.querySelector('.editor-textarea');
        this._syntaxOverlay = this._el.querySelector('.syntax-overlay');
        this._emptyEl = this._el.querySelector('.editor-empty');
        // 点击空状态图标快捷新建文件
        const emptyIcon = this._emptyEl?.querySelector('.editor-empty-icon');
        if (emptyIcon) {
            emptyIcon.addEventListener('click', (e) => {
                e.stopPropagation();
                // 触发新建文件（在选中文件夹或根目录下创建）
                const folderId = typeof SidebarController !== 'undefined'
                    ? SidebarController.getSelectedFolderId() : null;
                signal.emit('ui:newFile', { folderId });
            });
        }
        this._versionInfoEl = this._el.querySelector('.version-info');

        // 加载自定义语法规则（如果没有则使用默认规则）
        const savedRules = StorageService.load('syntax', null);
        if (savedRules === null) {
            // 首次使用，添加默认规则
            this._syntaxRules = [
                { name: '数字', type: 'number', color: '#ff6b6b', pattern: '' },
                { name: '" "', type: 'custom', color: '#399ddb', pattern: '".*?"' },
                { name: "' '", type: 'custom', color: '#e20887', pattern: "'.*?'" },
                { name: '【】', type: 'custom', color: '#1fbec1', pattern: '\\【.*?\\】' },
                { name: '[]', type: 'custom', color: '#8cc71f', pattern: '\\[.*?\\]' },
                { name: '# 注释', type: 'custom', color: '#9e9e9e', pattern: '#.*' },
                { name: 'Word 单词', type: 'custom', color: '#268c85', pattern: '\\b\\w+\\b' }
            ];
            StorageService.save('syntax', this._syntaxRules);
        } else {
            this._syntaxRules = savedRules;
        }

        // 应用初始字号和换行状态
        this._applyFontSize(this._fontSize);
        this._applyWordWrap();

        // 绑定事件
        this._bindEvents();
        this._listenSignals();

        // 初始化树图面板引用
        this._treeviewPanel = document.querySelector('.treeview-panel');
        this._treeviewContent = document.querySelector('.treeview-content');

        // 绑定树图区域右键菜单（需在 _treeviewContent 初始化之后）
        // 用 selectionchange 持续跟踪选区，只在选区非空时保存
        this._treeViewSelectedText = '';
        document.addEventListener('selectionchange', () => {
            if (!this._treeviewContent) return;
            const sel = window.getSelection();
            if (sel && this._treeviewContent.contains(sel.anchorNode)) {
                const text = sel.toString();
                // 只在选区非空时保存，避免右键清除选区后覆盖
                if (text) {
                    this._treeViewSelectedText = text;
                }
            }
        });
        this._treeviewContent.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this._showTreeViewContextMenu(e.clientX, e.clientY);
        });

        // 树图工具栏按钮
        const btnCopy = this._treeviewPanel.querySelector('.treeview-btn-copy');
        const btnDownload = this._treeviewPanel.querySelector('.treeview-btn-download');
        btnCopy.addEventListener('click', () => this._copyTreeViewText());
        btnDownload.addEventListener('click', () => this._downloadTreeViewText());

        // 树图关闭按钮
        const btnClose = this._treeviewPanel.querySelector('.treeview-btn-close');
        btnClose.addEventListener('click', () => this._toggleTreeView());

        // 树图区域拖拽调整高度
        this._bindTreeviewResize();

        // 初始渲染行号
        this._updateLineNumbers();

        // 应用语法高亮初始状态
        const syntaxHighlightOn = StorageService.load('syntax_highlight', true);
        if (this._syntaxOverlay) {
            this._syntaxOverlay.style.display = syntaxHighlightOn ? 'block' : 'none';
        }
        if (this._textarea) {
            this._textarea.style.color = syntaxHighlightOn ? 'transparent' : 'var(--text-primary)';
        }

        // 初始显示空状态
        this._showEmptyState(true);
    },

    /**
     * 监听信号
     * @private
     */
    _listenSignals() {
        signal.on(Constants.EVENTS.TAB_SWITCHED, (data) => {
            this._loadFile(data.fileId);
        });

        signal.on(Constants.EVENTS.TAB_CLOSED, (data) => {
            if (data.fileId === this._currentFileId) {
                this._clearEditor();
            }
        });

        signal.on(Constants.EVENTS.TAB_CLOSE_ALL, () => {
            this._clearEditor();
        });

        signal.on(Constants.EVENTS.EDITOR_AUTO_SAVE, (data) => {
            if (data.fileId === this._currentFileId) {
                this._doSave();
            }
        });

        signal.on(Constants.EVENTS.LINE_NUM_TOGGLE, (data) => {
            this._showLineNum = data.show;
            StorageService.save('linenum', this._showLineNum);
            this._updateLineNumbers();
        });

        signal.on(Constants.EVENTS.WORD_WRAP_TOGGLE, (data) => {
            this._wordWrap = data.wrap;
            this._applyWordWrap();
        });

        signal.on(Constants.EVENTS.SYNTAX_HIGHLIGHT_TOGGLE, (data) => {
            if (this._syntaxOverlay) {
                this._syntaxOverlay.style.display = data.show ? 'block' : 'none';
            }
            if (this._textarea) {
                this._textarea.style.color = data.show ? 'transparent' : 'var(--text-primary)';
            }
        });

        signal.on(Constants.EVENTS.FONT_SIZE_CHANGED, (data) => {
            this._applyFontSize(data.size);
        });

        // 树图开关事件
        signal.on(Constants.EVENTS.TREE_VIEW_TOGGLE, () => {
            this._toggleTreeView();
        });

        signal.on(Constants.EVENTS.VERSION_DELETED, (data) => {
            // 如果当前正在编辑的版本被删除，回退到文件原始内容
            if (this._currentEditingVersionId === data.versionId) {
                this._currentEditingVersionId = null;
                // 更新映射表
                if (this._currentFileId !== null) {
                    this._editingVersionMap[this._currentFileId] = null;
                    this._persistEditingVersions();
                }
                const file = FileService.getById(this._currentFileId);
                if (file) {
                    this._textarea.value = file.content || '';
                    this._dirty = false;
                    this._updateLineNumbers();
                }
                this._updateVersionInfo();
            }
        });

        // 文件重命名后更新版本信息栏
        signal.on(Constants.EVENTS.FILE_RENAMED, () => {
            this._updateVersionInfo();
        });

        // 语法规则更新后重新高亮
        signal.on('syntax:rulesChanged', () => {
            this._syntaxRules = StorageService.load('syntax', []);
            this._updateSyntaxHighlighting();
        });
    },

    /**
     * 绑定DOM事件
     * @private
     */
    _bindEvents() {
        // 输入事件 - 使用 rAF 批处理，合并多次 DOM 更新到同一帧
        this._textarea.addEventListener('input', () => {
            this._dirty = true;
            if (this._inputRafPending) return;
            this._inputRafPending = true;
            requestAnimationFrame(() => {
                this._inputRafPending = false;
                this._updateLineNumbers();
                this._updateWordCount();
                this._updateSyntaxHighlighting();
                if (this._treeViewOn) {
                    this._renderTreeView();
                }
                this._lineNumEl.scrollTop = this._textarea.scrollTop;
                this._syncOverlayScroll();
                
                // 实时保存到 FileService 缓存（配合无防抖的 StorageService，立即写入 data.json）
                if (this._currentFileId !== null) {
                    const content = this._textarea.value;
                    if (this._currentEditingVersionId !== null) {
                        FileService.updateVersionContent(this._currentFileId, this._currentEditingVersionId, content);
                    } else {
                        FileService.saveContent(this._currentFileId, content);
                    }
                }
            });
        });

        // 键盘事件
        this._textarea.addEventListener('keydown', (e) => {
            // Tab - 插入2个空格
            if (e.key === 'Tab') {
                e.preventDefault();
                const start = this._textarea.selectionStart;
                const end = this._textarea.selectionEnd;
                const spaces = ' '.repeat(Constants.LIMITS.TAB_INSERT);
                this._textarea.value = this._textarea.value.substring(0, start)
                    + spaces
                    + this._textarea.value.substring(end);
                this._textarea.selectionStart = this._textarea.selectionEnd = start + Constants.LIMITS.TAB_INSERT;
                this._textarea.dispatchEvent(new Event('input'));
            }

            // Enter - 自动缩进
            if (e.key === 'Enter') {
                e.preventDefault();
                const start = this._textarea.selectionStart;
                const value = this._textarea.value;
                // 获取当前行的缩进
                const lineStart = value.lastIndexOf('\n', start - 1) + 1;
                const currentLine = value.substring(lineStart, start);
                const indent = currentLine.match(/^(\s*)/)[1];

                const insert = '\n' + indent;
                this._textarea.value = value.substring(0, start)
                    + insert
                    + value.substring(this._textarea.selectionEnd);
                this._textarea.selectionStart = this._textarea.selectionEnd = start + insert.length;
                this._textarea.dispatchEvent(new Event('input'));
            }

            // Shift+Backspace - 快速删除2个空格（反向Tab）
            if (e.key === 'Backspace' && e.shiftKey) {
                e.preventDefault();
                const start = this._textarea.selectionStart;
                const value = this._textarea.value;
                // 检查光标前是否有2个空格
                const before = value.substring(Math.max(0, start - Constants.LIMITS.TAB_INSERT), start);
                if (before === ' '.repeat(Constants.LIMITS.TAB_INSERT)) {
                    const deleteStart = start - Constants.LIMITS.TAB_INSERT;
                    this._textarea.value = value.substring(0, deleteStart)
                        + value.substring(start);
                    this._textarea.selectionStart = this._textarea.selectionEnd = deleteStart;
                    this._textarea.dispatchEvent(new Event('input'));
                }
            }

            // Ctrl+S - 保存
            if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                this._doSave();
            }

            // Ctrl+W - 关闭标签页
            if (e.key === 'w' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                if (this._currentFileId !== null) {
                    TabService.close(this._currentFileId);
                }
            }
        });

        // 滚动同步
        this._textarea.addEventListener('scroll', () => {
            this._lineNumEl.scrollTop = this._textarea.scrollTop;
            this._syncOverlayScroll();
        });

        // 容器尺寸变化时同步 overlay 宽度补偿（滚动条宽度可能变化）
        if (window.ResizeObserver) {
            const resizeObserver = new ResizeObserver(() => {
                this._syncOverlayScroll();
            });
            resizeObserver.observe(this._textarea);
        }

        // 右键菜单 - 文本编辑区
        this._textarea.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this._showContextMenu(e.clientX, e.clientY);
        });

        // 右键菜单 - 树图区域（只读，仅提供全选和复制）
        if (this._treeviewContent) {
            this._treeviewContent.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this._showTreeViewContextMenu(e.clientX, e.clientY);
            });
        }

        // 点击其他区域关闭右键菜单
        document.addEventListener('click', () => {
            this._hideContextMenu();
        });
    },

    /**
     * 加载文件到编辑器
     * @private
     * @param {number} fileId
     */
    _loadFile(fileId) {
        // 保存当前文件的版本编辑状态到映射表
        if (this._currentFileId !== null) {
            this._editingVersionMap[this._currentFileId] = this._currentEditingVersionId;
            this._persistEditingVersions();
        }

        if (fileId === this._currentFileId) return;

        const file = FileService.getById(fileId);
        if (!file) {
            this._clearEditor();
            return;
        }

        this._currentFileId = fileId;

        // 从映射表恢复该文件的版本编辑状态
        const savedVersionId = this._editingVersionMap[fileId] || null;
        if (savedVersionId !== null) {
            // 有保存的版本编辑状态，加载该版本内容
            const versions = FileService.getVersions(fileId);
            const version = versions.find(v => v.id === savedVersionId);
            if (version) {
                this._currentEditingVersionId = savedVersionId;
                this._textarea.value = version.content;
            } else {
                // 版本已被删除，回退到默认文件内容
                this._currentEditingVersionId = null;
                delete this._editingVersionMap[fileId];
                this._persistEditingVersions();
                this._textarea.value = file.content || '';
            }
        } else {
            this._currentEditingVersionId = null;
            this._textarea.value = file.content || '';
        }
        this._dirty = false;
        this._showEmptyState(false);
        this._updateLineNumbers();
        this._updateWordCount();
        this._updateVersionInfo();
        this._updateSyntaxHighlighting();
        // 切换文件时同步刷新树图
        if (this._treeViewOn) {
            this._renderTreeView();
        }
        this._textarea.focus();
    },

    /**
     * 清空编辑器
     * @private
     */
    _clearEditor() {
        // 清除当前文件的版本编辑状态映射
        if (this._currentFileId !== null) {
            delete this._editingVersionMap[this._currentFileId];
            this._persistEditingVersions();
        }
        this._currentFileId = null;
        this._currentEditingVersionId = null;
        this._textarea.value = '';
        this._dirty = false;
        this._lineNumEl.innerHTML = '';
        this._updateWordCount();
        this._updateVersionInfo();
        if (this._syntaxOverlay) {
            this._syntaxOverlay.innerHTML = '';
        }
        this._showEmptyState(true);
    },

    /**
     * 显示/隐藏空状态提示
     * @private
     * @param {boolean} show
     */
    _showEmptyState(show) {
        if (this._emptyEl) {
            this._emptyEl.style.display = show ? 'flex' : 'none';
        }
        if (this._textarea) {
            this._textarea.style.display = show ? 'none' : 'block';
        }
        if (this._syntaxOverlay) {
            this._syntaxOverlay.style.display = show ? 'none' : 'block';
        }
        if (this._lineNumEl) {
            this._lineNumEl.style.display = (show || !this._showLineNum) ? 'none' : 'block';
        }
    },

    /**
     * 应用字号
     * @private
     * @param {number} size
     */
    _applyFontSize(size) {
        this._fontSize = size;
        if (this._textarea) {
            this._textarea.style.fontSize = size + 'px';
        }
        if (this._lineNumEl) {
            this._lineNumEl.style.fontSize = size + 'px';
        }
        if (this._syntaxOverlay) {
            this._syntaxOverlay.style.fontSize = size + 'px';
        }
        this._updateLineNumbers();
    },

    /**
     * 应用自动换行状态
     * @private
     */
    _applyWordWrap() {
        if (this._textarea) {
            this._textarea.style.whiteSpace = this._wordWrap ? 'pre-wrap' : 'pre';
            this._textarea.style.overflowX = this._wordWrap ? 'hidden' : 'auto';
            this._textarea.style.overflowWrap = this._wordWrap ? 'break-word' : 'normal';
        }
        // 同步语法高亮覆盖层
        if (this._syntaxOverlay) {
            this._syntaxOverlay.style.whiteSpace = this._wordWrap ? 'pre-wrap' : 'pre';
            this._syntaxOverlay.style.overflowWrap = this._wordWrap ? 'break-word' : 'normal';
        }
        // 同步树图区域
        const treePre = this._treeviewContent ? this._treeviewContent.querySelector('.treeview-text-content') : null;
        if (treePre) {
            treePre.classList.toggle('word-wrap', this._wordWrap);
        }
        const statusEl = document.getElementById('status-wordwrap');
        if (statusEl) {
            statusEl.textContent = '自动换行: ' + (this._wordWrap ? '开' : '关');
        }

        this._updateLineNumbers();
    },

    /**
     * 切换自动换行
     * @private
     */
    _toggleWordWrap() {
        this._wordWrap = !this._wordWrap;
        StorageService.save('wordwrap', this._wordWrap);
        this._applyWordWrap();
    },

    /**
     * 执行保存：保存到当前编辑版本或文件
     * @private
     */
    _doSave() {
        if (this._currentFileId === null) return;
        const content = this._textarea.value;

        if (this._currentEditingVersionId !== null) {
            FileService.updateVersionContent(this._currentFileId, this._currentEditingVersionId, content);
        } else {
            FileService.saveContent(this._currentFileId, content);
        }

        this._dirty = false;
        // 发射保存完成信号，触发状态栏提示
        signal.emit(Constants.EVENTS.FILE_SAVED);
    },

    /**
     * 页面关闭前保存当前编辑内容
     * 用于 beforeunload 事件，确保数据不丢失
     */
    saveBeforeUnload() {
        // 无修改或无打开的文件，跳过
        if (!this._dirty || this._currentFileId === null) return;

        const content = this._textarea.value;

        // 保存到当前编辑版本或文件
        if (this._currentEditingVersionId !== null) {
            FileService.updateVersionContent(this._currentFileId, this._currentEditingVersionId, content);
        } else {
            FileService.saveContent(this._currentFileId, content);
        }

        this._dirty = false;
    },

    /**
     * 更新字数统计
     * @private
     */
    _updateWordCount() {
        const statusEl = document.getElementById('status-word-count');
        if (!statusEl) return;
        const text = this._textarea ? this._textarea.value : '';
        const charCount = text.replace(/\s/g, '').length;
        statusEl.textContent = `字数: ${charCount}`;
    },

    /**
     * HTML转义辅助（纯字符串转义，避免每次创建 DOM 元素）
     * @private
     */
    _escapeHtml(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    },

    /**
     * 获取当前编辑的文件ID
     * @returns {number|null}
     */
    getCurrentFileId() {
        return this._currentFileId;
    },

    /**
     * 获取当前正在编辑的版本ID
     * @returns {number|null}
     */
    getCurrentVersionId() {
        return this._currentEditingVersionId;
    },

    /**
     * 手动保存（外部调用）
     */
    save() {
        this._doSave();
        // 保存后将焦点归还给编辑器，确保用户可继续输入并触发自动保存
        if (this._textarea) {
            this._textarea.focus();
        }
    },

    /**
     * 获取编辑器文本内容
     * @returns {string}
     */
    getContent() {
        return this._textarea ? this._textarea.value : '';
    },

    /**
     * 设置编辑器内容（用于导入文件/切换版本等）
     * @param {string} content
     */
    setContent(content) {
        this._textarea.value = content;
        this._dirty = true;
        this._updateLineNumbers();
        this._updateSyntaxHighlighting();
    },

    /**
     * 切换版本：先保存当前编辑内容，再加载目标版本
     * @param {number} fileId
     * @param {number} versionId
     */
    switchToVersion(fileId, versionId) {
        const versions = FileService.getVersions(fileId);
        const version = versions.find(v => v.id === versionId);
        if (!version) return;
        this._currentFileId = fileId;
        this._currentEditingVersionId = versionId;
        this._editingVersionMap[fileId] = versionId;
        this._persistEditingVersions();
        this._textarea.value = version.content;
        this._dirty = false;
        this._updateLineNumbers();
        this._updateSyntaxHighlighting();
        this._updateVersionInfo();
        this._textarea.focus();
    },

    /**
     * 预览版本内容（不进入版本编辑模式，编辑后保存到文件）
     * @param {number} fileId
     * @param {number} versionId
     */
    previewVersion(fileId, versionId) {
        const versions = FileService.getVersions(fileId);
        const version = versions.find(v => v.id === versionId);
        if (!version) return;
        this._currentFileId = fileId;
        this._currentEditingVersionId = null;
        this._editingVersionMap[fileId] = null;
        this._persistEditingVersions();
        this._textarea.value = version.content;
        this._dirty = false;
        this._updateLineNumbers();
        this._updateSyntaxHighlighting();
        this._updateVersionInfoForPreview(version);
        this._textarea.focus();
    },

    /**
     * 切换回文件主内容（默认版本）
     * @param {number} fileId
     */
    switchToFile(fileId) {
        const file = FileService.getById(fileId);
        if (!file) return;
        this._currentFileId = fileId;
        this._currentEditingVersionId = null;
        this._editingVersionMap[fileId] = null;
        this._persistEditingVersions();
        this._textarea.value = file.content || '';
        this._dirty = false;
        this._updateLineNumbers();
        this._updateSyntaxHighlighting();
        this._updateVersionInfo();
        this._textarea.focus();
    },

    /**
     * 持久化版本编辑状态，防止刷新丢失
     * @private
     */
    _persistEditingVersions() {
        StorageService.save('editing_versions', this._editingVersionMap);
    }
};