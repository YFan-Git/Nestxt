/**
 * SystemBridge - 系统能力桥接层
 *
 * 职责: 封装平台相关的系统能力（文件对话框、剪贴板等）
 * 架构: 双端统一架构的系统层 —— "怎么交互"
 * 设计:
 *   - Web 端使用 File System Access API + Clipboard API
 *   - PC 端通过 pywebview 调用 Python 后端
 *   - 业务层只调用 SystemBridge 接口，不关心底层实现
 *
 * 接口方法:
 *   - saveFile(content, suggestedName): 保存文件对话框
 *   - importFile(): 打开文件对话框
 *   - clipboardCopy(text): 复制到剪贴板
 *   - clipboardPaste(): 从剪贴板粘贴
 */

const SystemBridge = {
    /** @private 当前系统引擎 */
    _engine: null,

    /**
     * 初始化：检测运行环境，自动选择引擎
     * - Web 端：使用 File System Access API + Clipboard API
     * - PC 端（pywebview）：使用 Python 后端提供的系统 API
     */
    init() {
        // 检测 PC 端 pywebview 环境
        if (typeof pywebview !== 'undefined' && pywebview.api) {
            // PC 端：使用 Python 后端提供的系统 API
            this._engine = {
                saveFile: async (content, suggestedName) => {
                    return await pywebview.api.saveFile(content, suggestedName);
                },
                importFile: async () => {
                    return await pywebview.api.importFile();
                },
                clipboardCopy: async (text) => {
                    return await pywebview.api.clipboardCopy(text);
                },
                clipboardPaste: async () => {
                    return await pywebview.api.clipboardPaste();
                }
            };
        } else {
            // Web 端：使用浏览器原生 API
            this._engine = {
                saveFile: async (content, suggestedName) => {
                    try {
                        // 检查浏览器是否支持 File System Access API
                        if (!('showSaveFilePicker' in window)) {
                            // 降级方案：使用传统的下载方式
                            const blob = new Blob([content], { type: 'text/plain' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = suggestedName || 'export.txt';
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                            return { success: true, path: suggestedName || 'export.txt' };
                        }

                        // 使用 File System Access API
                        const handle = await window.showSaveFilePicker({
                            suggestedName: suggestedName || 'export.txt',
                            types: [
                                {
                                    description: '文本文件',
                                    accept: { 'text/plain': ['.txt'] }
                                },
                                {
                                    description: 'JSON 文件',
                                    accept: { 'application/json': ['.json'] }
                                }
                            ]
                        });

                        const writable = await handle.createWritable();
                        await writable.write(content);
                        await writable.close();

                        return { success: true, path: handle.name };
                    } catch (err) {
                        if (err.name === 'AbortError') {
                            return { success: false, error: '用户取消' };
                        }
                        console.error('[SystemBridge] saveFile 失败:', err);
                        return { success: false, error: err.message };
                    }
                },

                importFile: async () => {
                    try {
                        // 检查浏览器是否支持 File System Access API
                        if (!('showOpenFilePicker' in window)) {
                            // 降级方案：使用传统的 file input
                            return new Promise((resolve) => {
                                const input = document.createElement('input');
                                input.type = 'file';
                                input.accept = '.txt,.csv,.log,.ini,.json,.xml,.html,.css,.js,.py,.c,.cpp';
                                input.onchange = async (e) => {
                                    const file = e.target.files[0];
                                    if (!file) {
                                        resolve({ success: false, error: '用户取消' });
                                        return;
                                    }

                                    try {
                                        const content = await file.text();
                                        resolve({
                                            success: true,
                                            name: file.name,
                                            content: content
                                        });
                                    } catch (err) {
                                        resolve({ success: false, error: err.message });
                                    }
                                };
                                input.click();
                            });
                        }

                        // 使用 File System Access API
                        const [handle] = await window.showOpenFilePicker({
                            types: [
                                {
                                    description: '文本文件',
                                    accept: {
                                        'text/plain': ['.txt', '.csv', '.log', '.ini', '.json', '.xml', '.html', '.css', '.js', '.py', '.c', '.cpp']
                                    }
                                }
                            ],
                            multiple: false
                        });

                        const file = await handle.getFile();
                        const content = await file.text();

                        return {
                            success: true,
                            name: file.name,
                            content: content
                        };
                    } catch (err) {
                        if (err.name === 'AbortError') {
                            return { success: false, error: '用户取消' };
                        }
                        console.error('[SystemBridge] importFile 失败:', err);
                        return { success: false, error: err.message };
                    }
                },

                clipboardCopy: async (text) => {
                    try {
                        if (!navigator.clipboard) {
                            // 降级方案：使用 execCommand
                            const textarea = document.createElement('textarea');
                            textarea.value = text;
                            textarea.style.position = 'fixed';
                            textarea.style.opacity = '0';
                            document.body.appendChild(textarea);
                            textarea.select();
                            const success = document.execCommand('copy');
                            document.body.removeChild(textarea);
                            return success ? { success: true } : { success: false, error: '复制失败' };
                        }

                        await navigator.clipboard.writeText(text);
                        return { success: true };
                    } catch (err) {
                        console.error('[SystemBridge] clipboardCopy 失败:', err);
                        return { success: false, error: err.message };
                    }
                },

                clipboardPaste: async () => {
                    try {
                        if (!navigator.clipboard) {
                            return { success: false, error: '浏览器不支持剪贴板 API' };
                        }

                        const text = await navigator.clipboard.readText();
                        return { success: true, text: text };
                    } catch (err) {
                        console.error('[SystemBridge] clipboardPaste 失败:', err);
                        return { success: false, error: err.message };
                    }
                }
            };
        }
    },

    /**
     * 手动设置系统引擎（供特殊场景使用）
     * @param {Object} engine - 引擎对象，需实现 saveFile/importFile/clipboardCopy/clipboardPaste 四个方法
     */
    setEngine(engine) {
        if (!engine || typeof engine.saveFile !== 'function' ||
            typeof engine.importFile !== 'function' ||
            typeof engine.clipboardCopy !== 'function' ||
            typeof engine.clipboardPaste !== 'function') {
            console.error('[SystemBridge] 引擎对象必须实现 saveFile/importFile/clipboardCopy/clipboardPaste 四个方法');
            return;
        }
        this._engine = engine;
    },

    /**
     * 保存文件（弹出保存对话框）
     * @param {string} content - 文件内容
     * @param {string} suggestedName - 建议的文件名
     * @returns {Promise<Object>} { success: boolean, path?: string, error?: string }
     */
    async saveFile(content, suggestedName) {
        if (!this._engine) {
            console.error('[SystemBridge] 引擎未初始化，请先调用 init()');
            return { success: false, error: '引擎未初始化' };
        }
        try {
            return await this._engine.saveFile(content, suggestedName);
        } catch (err) {
            console.error('[SystemBridge] saveFile 异常:', err);
            return { success: false, error: err.message };
        }
    },

    /**
     * 打开文件（弹出打开对话框）
     * @returns {Promise<Object>} { success: boolean, name?: string, content?: string, error?: string }
     */
    async importFile() {
        if (!this._engine) {
            console.error('[SystemBridge] 引擎未初始化，请先调用 init()');
            return { success: false, error: '引擎未初始化' };
        }
        try {
            return await this._engine.importFile();
        } catch (err) {
            console.error('[SystemBridge] importFile 异常:', err);
            return { success: false, error: err.message };
        }
    },

    /**
     * 复制文本到剪贴板
     * @param {string} text - 要复制的文本
     * @returns {Promise<Object>} { success: boolean, error?: string }
     */
    async clipboardCopy(text) {
        if (!this._engine) {
            console.error('[SystemBridge] 引擎未初始化，请先调用 init()');
            return { success: false, error: '引擎未初始化' };
        }
        try {
            return await this._engine.clipboardCopy(text);
        } catch (err) {
            console.error('[SystemBridge] clipboardCopy 异常:', err);
            return { success: false, error: err.message };
        }
    },

    /**
     * 从剪贴板粘贴文本
     * @returns {Promise<Object>} { success: boolean, text?: string, error?: string }
     */
    async clipboardPaste() {
        if (!this._engine) {
            console.error('[SystemBridge] 引擎未初始化，请先调用 init()');
            return { success: false, error: '引擎未初始化' };
        }
        try {
            return await this._engine.clipboardPaste();
        } catch (err) {
            console.error('[SystemBridge] clipboardPaste 异常:', err);
            return { success: false, error: err.message };
        }
    }
};
