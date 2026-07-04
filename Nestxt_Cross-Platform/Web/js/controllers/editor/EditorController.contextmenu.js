/**
 * editor/EditorController.contextmenu.js - 右键菜单模块
 * 
 * 扩展 EditorController: 编辑器右键菜单、树图右键菜单、回退复制
 */

Object.assign(EditorController, {

    /**
     * 显示右键菜单
     * @private
     */
    _showContextMenu(x, y) {
        this._hideContextMenu();

        const menu = document.createElement('div');
        menu.className = 'editor-context-menu';
        menu.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            z-index: 9999;
        `;

        const items = [
            { label: '全选', action: () => { this._textarea.select(); } },
            { label: '复制', action: () => { document.execCommand('copy'); } },
            { label: '剪切', action: () => { document.execCommand('cut'); } },
            { label: '粘贴', action: async () => {
                const result = await SystemBridge.clipboardPaste();
                if (result.success && result.text) {
                    const text = result.text;
                    const start = this._textarea.selectionStart;
                    const end = this._textarea.selectionEnd;
                    this._textarea.value = this._textarea.value.substring(0, start) + text + this._textarea.value.substring(end);
                    this._textarea.selectionStart = this._textarea.selectionEnd = start + text.length;
                    this._textarea.dispatchEvent(new Event('input'));
                }
            } },
        ];

        items.forEach(item => {
            const btn = document.createElement('button');
            btn.className = 'editor-context-menu-item';
            btn.textContent = item.label;
            btn.addEventListener('mousedown', (e) => {
                e.preventDefault();
                item.action();
                this._hideContextMenu();
            });
            menu.appendChild(btn);
        });

        document.body.appendChild(menu);
        this._contextMenu = menu;
    },

    /**
     * 显示树图区域的右键菜单（只读，仅提供复制）
     * @private
     */
    _showTreeViewContextMenu(x, y) {
        this._hideContextMenu();

        const menu = document.createElement('div');
        menu.className = 'editor-context-menu';
        menu.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            z-index: 9999;
        `;

        const items = [
            { label: '复制', action: async () => {
                // 使用右键时保存的选中文本
                const text = this._treeViewSelectedText || '';
                if (text) {
                    // 使用 SystemBridge 统一调用（自动适配 PC/Web 端）
                    const result = await SystemBridge.clipboardCopy(text);
                    if (!result.success) {
                        // 失败时回退到 execCommand
                        this._fallbackCopy(text);
                    }
                }
            }},
        ];

        items.forEach(item => {
            const btn = document.createElement('button');
            btn.className = 'editor-context-menu-item';
            btn.textContent = item.label;
            btn.addEventListener('mousedown', (e) => {
                e.preventDefault();
                item.action();
                this._hideContextMenu();
            });
            menu.appendChild(btn);
        });

        document.body.appendChild(menu);
        this._contextMenu = menu;
    },

    /**
     * 隐藏右键菜单
     * @private
     */
    _hideContextMenu() {
        if (this._contextMenu) {
            this._contextMenu.remove();
            this._contextMenu = null;
        }
    },

    /**
     * 回退复制方法（用于 Clipboard API 不可用时）
     * @private
     */
    _fallbackCopy(text) {
        // 创建临时 textarea 来执行复制
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
        } catch (err) {
            console.error('复制失败:', err);
        }
        document.body.removeChild(textarea);
    }

});