/**
 * DragController - 拖拽控制器
 * 
 * 功能: 处理外部文件导入到编辑器
 * 注意: 侧边栏文件拖拽移动已由 FolderTreeEventHandler 统一管理
 */

const DragController = {
    /** @private 编辑器区域元素引用 */
    _editorEl: null,

    /**
     * 初始化
     */
    init() {
        this._editorEl = document.querySelector('.editor-panel');

        this._bindEvents();
    },

    /**
     * 绑定事件
     * @private
     */
    _bindEvents() {
        // 外部文件拖入编辑器（仅处理文件拖入，不影响文本拖拽移动）
        if (this._editorEl) {
            this._editorEl.addEventListener('dragover', (e) => {
                if (!e.dataTransfer.types.includes('Files')) return;
                e.preventDefault();
                e.stopPropagation();
                this._editorEl.classList.add('drag-over');
            });

            this._editorEl.addEventListener('dragleave', (e) => {
                this._editorEl.classList.remove('drag-over');
                this._resetCursorAfterDrag();
            });

            this._editorEl.addEventListener('drop', (e) => {
                if (!e.dataTransfer.types.includes('Files')) return;
                e.preventDefault();
                e.stopPropagation();
                this._editorEl.classList.remove('drag-over');
                this._resetCursorAfterDrag();
                this._handleExternalDrop(e);
            });
        }
    },

    /**
     * 拖拽结束后重置光标状态
     * @private
     */
    _resetCursorAfterDrag() {
        // 通过临时修改 body 的 cursor 强制浏览器刷新光标状态
        const textarea = this._editorEl ? this._editorEl.querySelector('.editor-textarea') : null;
        if (textarea) {
            const prev = document.body.style.cursor;
            document.body.style.cursor = 'default';
            // 强制重绘
            void textarea.offsetWidth;
            document.body.style.cursor = prev;
        }
    },

    /**
     * 处理外部文件拖入
     * @private
     */
    async _handleExternalDrop(e) {
        const files = e.dataTransfer.files;
        if (!files || files.length === 0) return;

        for (const file of Array.from(files)) {
            // 检查是否为支持的文本格式
            if (!TextFileReader.isSupported(file.name)) {
                continue;
            }

            try {
                // 使用智能读取，自动检测编码
                const result = await TextFileReader.readFileSmart(file);
                const newFile = FileService.create(file.name, null, result.content, result.encoding);
                if (newFile) {
                    // 缓存原始字节，用于后续编码切换
                    FileService._rawBytesCache.set(newFile.id, result.rawBytes);
                    TabService.open(newFile.id);
                    // 更新状态栏编码显示
                    signal.emit(Constants.EVENTS.ENCODING_CHANGED, { encoding: result.encoding });
                }
            } catch (err) {
                // 如果是二进制文件检测失败，提示用户
                if (err.message.includes('可能不是纯文本')) {
                    App.showConfirmDialog(
                        '文件警告',
                        err.message + '，是否继续打开？',
                        async () => {
                            try {
                                // 用户确认继续，强制读取 UTF-8（跳过二进制检测）
                                const content = await TextFileReader.forceRead(file);
                                const newFile = FileService.create(file.name, null, content, 'UTF-8');
                                if (newFile) {
                                    TabService.open(newFile.id);
                                    signal.emit(Constants.EVENTS.ENCODING_CHANGED, { encoding: 'UTF-8' });
                                }
                            } catch (forceErr) {
                                App.showMessageDialog('错误', '文件读取失败');
                            }
                        },
                        false
                    );
                } else {
                    App.showMessageDialog('错误', '文件读取失败：' + err.message);
                }
            }
        }
    }
};
