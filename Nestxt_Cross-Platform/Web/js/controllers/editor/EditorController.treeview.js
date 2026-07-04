/**
 * editor/EditorController.treeview.js - 树图可视化模块
 * 
 * 扩展 EditorController: 树图切换、渲染、构建树、复制/下载、拖拽调整
 */

Object.assign(EditorController, {

    /**
     * 切换树图面板显示/隐藏
     * @private
     */
    _toggleTreeView() {
        this._treeViewOn = !this._treeViewOn;
        if (this._treeviewPanel) {
            this._treeviewPanel.style.display = this._treeViewOn ? 'block' : 'none';
        }
        if (this._treeViewOn) {
            this._renderTreeView();
        }
    },

    /**
     * 渲染树图内容（先构建树结构，再递归渲染）
     * @private
     */
    _renderTreeView() {
        if (!this._treeviewContent) return;

        const text = this._textarea ? this._textarea.value : '';
        if (!text.trim()) {
            this._treeviewContent.innerHTML = '<div class="treeview-empty">暂无内容</div>';
            return;
        }

        const lines = text.split('\n').filter(line => line.trim());
        if (lines.length === 0) {
            this._treeviewContent.innerHTML = '<div class="treeview-empty">暂无内容</div>';
            return;
        }

        // 计算每行的层级
        const nodes = lines.map((line) => {
            const indent = line.match(/^(\s*)/)[1];
            let level = 0;
            for (const ch of indent) {
                if (ch === '\t') level++;
                else if (ch === ' ') level += 0.5;
            }
            level = Math.floor(level);
            return { text: line.trim(), level };
        });

        // 构建树结构
        const tree = this._buildTree(nodes);

        // 递归渲染树
        const treeText = this._renderTreeNodes(tree, '', true);
        this._treeviewContent.innerHTML = `<pre class="treeview-text-content">${this._escapeHtml(treeText)}</pre>`;

        // 重新应用自动换行状态（因为 innerHTML 会丢失 class）
        this._applyWordWrap();
    },

    /**
     * 构建树结构
     * @private
     * @param {Array} nodes - 扁平节点数组
     * @returns {Array} 树结构
     */
    _buildTree(nodes) {
        const root = { children: [], level: -1 };
        const stack = [root];

        for (const node of nodes) {
            // 找到合适的父节点
            while (stack.length > 1 && stack[stack.length - 1].level >= node.level) {
                stack.pop();
            }

            const treeNode = {
                text: node.text,
                level: node.level,
                children: []
            };

            stack[stack.length - 1].children.push(treeNode);
            stack.push(treeNode);
        }

        return root.children;
    },

    /**
     * 递归渲染树节点
     * @private
     * @param {Array} nodes - 节点数组
     * @param {string} prefix - 前缀
     * @param {boolean} isRoot - 是否是根节点
     * @returns {string} 渲染后的文本
     */
    _renderTreeNodes(nodes, prefix, isRoot = false) {
        let result = '';

        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            const isLast = i === nodes.length - 1;

            if (isRoot) {
                // 根节点无前缀
                result += node.text + '\n';
            } else {
                // 非根节点添加连接线
                const connector = isLast ? '└── ' : '├── ';
                result += prefix + connector + node.text + '\n';
            }

            // 递归渲染子节点
            if (node.children.length > 0) {
                const childPrefix = isRoot ? '' : prefix + (isLast ? '    ' : '│   ');
                result += this._renderTreeNodes(node.children, childPrefix, false);
            }
        }

        return result;
    },

    /**
     * 复制树图内容
     * @private
     */
    async _copyTreeViewText() {
        const preEl = this._treeviewContent.querySelector('.treeview-text-content');
        if (!preEl) return;

        const text = preEl.textContent;
        if (!text) return;

        const btn = this._treeviewPanel.querySelector('.treeview-btn-copy');

        // 使用 SystemBridge 统一调用（自动适配 PC/Web 端）
        const result = await SystemBridge.clipboardCopy(text);
        if (!result.success) {
            // 失败时回退到 execCommand
            this._fallbackCopy(text);
        }

        // 显示成功状态 1s
        btn.classList.add('treeview-btn-copied');
        setTimeout(() => btn.classList.remove('treeview-btn-copied'), 500);
    },

    /**
     * 下载树图内容
     * @private
     */
    async _downloadTreeViewText() {
        const preEl = this._treeviewContent.querySelector('.treeview-text-content');
        if (!preEl) return;

        const text = preEl.textContent;
        if (!text) return;

        // 获取当前文件名
        const file = this._currentFileId ? FileService.getById(this._currentFileId) : null;
        const ext = file ? TextFileReader.getExtension(file.name) : '';
        const fileName = file ? (ext ? file.name.slice(0, -ext.length) : file.name) : 'treeview';
        const suggestedName = `${fileName}_树图.txt`;

        // 使用 SystemBridge 统一调用（自动适配 PC/Web 端）
        const result = await SystemBridge.saveFile(text, suggestedName);
        if (result && result.success) {
            // 下载成功
        } else if (result && result.error !== '用户取消') {
            console.error('[TreeView] 下载失败:', result.error);
        }
    },

    /**
     * 绑定树图区域拖拽调整高度
     * @private
     */
    _bindTreeviewResize() {
        const handle = this._treeviewPanel.querySelector('.treeview-resize-handle');
        if (!handle) return;

        let startY = 0;
        let startHeight = 0;
        let isDragging = false;

        handle.addEventListener('mousedown', (e) => {
            e.preventDefault();
            isDragging = true;
            startY = e.clientY;
            startHeight = this._treeviewPanel.offsetHeight;
            handle.classList.add('dragging');
            document.body.style.cursor = 'ns-resize';
            document.body.style.userSelect = 'none';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const delta = startY - e.clientY;
            let newHeight = startHeight + delta;

            // 限制高度：最小为工具栏高度36px（只显示工具栏），最大不超过编辑器面板高度
            const editorPanel = this._el.closest('.editor-panel') || this._el.parentElement;
            const panelH = editorPanel ? editorPanel.offsetHeight : window.innerHeight;
            newHeight = Math.max(36, Math.min(newHeight, panelH));

            this._treeviewPanel.style.height = newHeight + 'px';
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                handle.classList.remove('dragging');
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
            }
        });
    }

});