/**
 * EncodingController - 编码控制器
 * 
 * 功能: 管理文件编码显示和切换
 */

const EncodingController = {
    /** @private 当前文件ID */
    _currentFileId: null,

    /** @private 支持的编码列表 */
    SUPPORTED_ENCODINGS: ['UTF-8', 'GBK', 'GB2312', 'Big5'],

    /**
     * 初始化
     */
    init() {
        this._bindEvents();
        this._updateStatusBar('UTF-8');
    },

    /**
     * 绑定事件
     * @private
     */
    _bindEvents() {
        // 监听编码变化事件
        signal.on(Constants.EVENTS.ENCODING_CHANGED, (data) => {
            this._updateStatusBar(data.encoding);
        });

        // 监听文件切换事件
        signal.on(Constants.EVENTS.TAB_SWITCHED, (data) => {
            this._currentFileId = data.fileId;
            const file = FileService.getById(data.fileId);
            if (file) {
                this._updateStatusBar(file.encoding || 'UTF-8');
            } else {
                this._updateStatusBar('UTF-8');
            }
        });

        // 监听文件关闭事件
        signal.on(Constants.EVENTS.TAB_CLOSED, () => {
            const activeId = TabService.getActiveId();
            if (activeId !== null) {
                const file = FileService.getById(activeId);
                if (file) {
                    this._updateStatusBar(file.encoding || 'UTF-8');
                } else {
                    this._updateStatusBar('UTF-8');
                }
            } else {
                this._updateStatusBar('UTF-8');
            }
        });

        // 状态栏编码点击事件
        const statusEncoding = document.getElementById('status-encoding');
        if (statusEncoding) {
            statusEncoding.addEventListener('click', () => {
                this._showEncodingMenu();
            });
        }
    },

    /**
     * 更新状态栏编码显示
     * @param {string} encoding - 编码名称
     * @private
     */
    _updateStatusBar(encoding) {
        const statusEncoding = document.getElementById('status-encoding');
        if (statusEncoding) {
            statusEncoding.textContent = encoding;
        }
    },

    /**
     * 显示编码切换菜单
     * @private
     */
    _showEncodingMenu() {
        const file = this._currentFileId ? FileService.getById(this._currentFileId) : null;
        if (!file) {
            App.showMessageDialog('提示', '请先打开一个文件');
            return;
        }

        const currentEncoding = file.encoding || 'UTF-8';
        const options = this.SUPPORTED_ENCODINGS.map(enc => {
            const selected = enc === currentEncoding ? ' (当前)' : '';
            return { label: enc + selected, value: enc };
        });

        App.showSelectDialog('切换编码', '选择文件编码格式：', options, (selectedEncoding) => {
            if (selectedEncoding !== currentEncoding) {
                this._switchEncoding(file, selectedEncoding);
            }
        });
    },

    /**
     * 切换文件编码
     * @param {Object} file - 文件对象
     * @param {string} newEncoding - 新编码
     * @private
     */
    _switchEncoding(file, newEncoding) {
        // 获取原始字节
        const rawBytes = FileService._rawBytesCache.get(file.id);
        if (!rawBytes) {
            App.showMessageDialog('错误', '无法获取文件原始字节，无法切换编码');
            return;
        }

        try {
            // 使用新编码重新解码
            const newContent = TextFileReader.reDecode(rawBytes, newEncoding);
            
            // 更新文件内容
            FileService.saveContent(file.id, newContent);
            file.encoding = newEncoding;
            FileService._save();

            // 更新编辑器显示
            const textarea = document.querySelector('.editor-textarea');
            if (textarea) {
                textarea.value = newContent;
            }

            // 更新状态栏
            this._updateStatusBar(newEncoding);

            // 触发编码变化事件
            signal.emit(Constants.EVENTS.ENCODING_CHANGED, { encoding: newEncoding });

            App.showMessageDialog('成功', `编码已切换为 ${newEncoding}`);
        } catch (err) {
            App.showMessageDialog('错误', '编码切换失败：' + err.message);
        }
    },

    /**
     * 获取当前文件编码
     * @returns {string}
     */
    getCurrentEncoding() {
        const file = this._currentFileId ? FileService.getById(this._currentFileId) : null;
        return file ? (file.encoding || 'UTF-8') : 'UTF-8';
    }
};
