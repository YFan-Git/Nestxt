/**
 * InlineRenameHelper - 内联重命名辅助
 * 
 * 职责:
 * - 独立处理重命名输入框的创建、交互、保存/取消
 * - 通过回调通知外部重命名开始/结束
 * - 使用 MutationObserver 替代 blur，避免点击外部时冲突
 */

const InlineRenameHelper = {
    /** @private 当前正在重命名的元素 */
    _currentInput: null,

    /** @private 回调函数 */
    _callbacks: {},

    /**
     * 启动内联重命名
     * @param {HTMLElement} nameEl - 名称 span 元素
     * @param {'folder'|'file'} type - 类型
     * @param {number} id - 文件夹或文件ID
     * @param {Object} callbacks - 回调函数
     * @param {Function} callbacks.onRenameStart - () => void 通知重命名开始
     * @param {Function} callbacks.onRenameEnd - () => void 通知重命名结束
     * @param {Function} callbacks.onSave - (id, newName) => void 保存重命名
     * @param {Function} callbacks.onRestoreDOM - () => void 恢复原始DOM
     */
    start(nameEl, type, id, callbacks) {
        const parentEl = nameEl.closest(type === 'folder' ? '.tree-folder' : '.tree-file');
        if (!parentEl) return;

        const currentName = type === 'folder'
            ? FolderService.getById(id)?.name
            : FileService.getById(id)?.name;

        if (!currentName) return;

        this._callbacks = callbacks;

        // 通知外部重命名开始
        this._callbacks.onRenameStart?.();

        // 临时禁用父元素拖拽，防止拖拽事件干扰文本选择
        const wasDraggable = parentEl.draggable;
        parentEl.draggable = false;

        // 创建输入框
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'tree-rename-input';
        input.value = currentName;
        input.style.cssText = `
            flex: 1;
            min-width: 0;
            background: var(--bg-input);
            color: var(--text);
            border: 1px solid var(--accent);
            border-radius: 3px;
            padding: 2px 6px;
            font-size: inherit;
            font-family: inherit;
            outline: none;
            box-sizing: border-box;
            user-select: text;
            -webkit-user-select: text;
        `;

        this._currentInput = input;

        // 替换名称 span
        nameEl.replaceWith(input);
        input.focus();
        input.select();

        // 保存/取消处理
        const finishRename = (save) => {
            if (!this._currentInput) return;
            this._currentInput = null;

            // 恢复父元素拖拽
            parentEl.draggable = wasDraggable;

            if (save) {
                const newName = input.value.trim();
                if (newName && newName !== currentName) {
                    this._callbacks.onSave?.(id, newName);
                }
            }

            // 通知外部重命名结束，恢复DOM
            this._callbacks.onRestoreDOM?.();
            this._callbacks.onRenameEnd?.();
        };

        // 键盘事件
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                finishRename(true);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                finishRename(false);
            }
        });

        // 使用 focusout 替代 blur，避免点击外部时冲突
        input.addEventListener('focusout', () => {
            // 使用 setTimeout 确保不会因为点击保存按钮而提前触发
            setTimeout(() => {
                if (this._currentInput === input) {
                    finishRename(true);
                }
            }, 100);
        });
    },

    /**
     * 检查是否正在重命名
     * @returns {boolean}
     */
    isRenaming() {
        return this._currentInput !== null;
    },

    /**
     * 取消当前重命名
     */
    cancel() {
        if (this._currentInput) {
            const input = this._currentInput;
            this._currentInput = null;
            input.value = ''; // 清空值触发 focusout 完成
        }
    }
};
