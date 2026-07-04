/**
 * TextFileReader - 纯文本文件读取工具
 * 
 * 功能: 支持多格式纯文本文件读取，智能编码识别，二进制文件检测
 * 支持格式: .txt, .csv, .log, .ini, .json, .xml, .html, .css, .js, .py, .c, .cpp, .bat, .cmd
 * 支持编码: UTF-8 (with/without BOM), GBK, GB2312, Big5
 */

const TextFileReader = {
    /** @private 支持的纯文本文件后缀列表 */
    SUPPORTED_EXTENSIONS: [
        '.txt', '.csv', '.log', '.ini', '.json', '.xml', 
        '.html', '.css', '.js', '.py', '.c', '.cpp', '.bat', '.cmd'
    ],

    /** @private 二进制检测阈值：非可打印字符占比超过此值则认为是二进制文件 */
    BINARY_THRESHOLD: 0.3,

    /** @private 编码标识常量 */
    ENCODING: {
        UTF8: 'UTF-8',
        UTF8_BOM: 'UTF-8-BOM',
        GBK: 'GBK',
        BIG5: 'Big5'
    },

    /**
     * 检查文件是否为支持的纯文本格式
     * @param {string} fileName - 文件名
     * @returns {boolean}
     */
    isSupported(fileName) {
        const lowerName = fileName.toLowerCase();
        return this.SUPPORTED_EXTENSIONS.some(ext => lowerName.endsWith(ext));
    },

    /**
     * 获取文件后缀名（小写）
     * @param {string} fileName - 文件名
     * @returns {string} 后缀名（如 '.txt'）
     */
    getExtension(fileName) {
        const lastDot = fileName.lastIndexOf('.');
        if (lastDot === -1) return '';
        return fileName.substring(lastDot).toLowerCase();
    },

    /**
     * 读取文件内容（带编码回退）
     * @param {File} file - File 对象
     * @returns {Promise<string>} 文件内容
     */
    async readFile(file) {
        return new Promise((resolve, reject) => {
            const readerUtf8 = new FileReader();
            
            readerUtf8.onload = (e) => {
                const content = e.target.result;
                
                if (this._isBinaryContent(content)) {
                    reject(new Error('该文件可能不是纯文本，继续可能显示乱码'));
                    return;
                }
                
                resolve(content);
            };
            
            readerUtf8.onerror = () => {
                reject(new Error('文件读取失败'));
            };
            
            readerUtf8.readAsText(file, 'UTF-8');
        });
    },

    /**
     * 强制读取文件内容（跳过二进制检测，用于用户确认后）
     * @param {File} file - File 对象
     * @returns {Promise<string>} 文件内容
     */
    async forceRead(file) {
        return new Promise((resolve, reject) => {
            const readerUtf8 = new FileReader();
            
            readerUtf8.onload = (e) => {
                resolve(e.target.result);
            };
            
            readerUtf8.onerror = () => {
                reject(new Error('文件读取失败'));
            };
            
            readerUtf8.readAsText(file, 'UTF-8');
        });
    },

    /**
     * 读取文件内容（带编码回退，如果 UTF-8 失败则尝试 GBK）
     * @param {File} file - File 对象
     * @returns {Promise<string>} 文件内容
     */
    async readFileWithFallback(file) {
        return new Promise((resolve, reject) => {
            const readerUtf8 = new FileReader();
            
            readerUtf8.onload = async (e) => {
                const content = e.target.result;
                
                if (this._isBinaryContent(content)) {
                    reject(new Error('该文件可能不是纯文本，继续可能显示乱码'));
                    return;
                }
                
                if (this._hasGarbledText(content)) {
                    try {
                        const gbkContent = await this._readAsGBK(file);
                        resolve(gbkContent);
                    } catch (err) {
                        resolve(content);
                    }
                } else {
                    resolve(content);
                }
            };
            
            readerUtf8.onerror = () => {
                reject(new Error('文件读取失败'));
            };
            
            readerUtf8.readAsText(file, 'UTF-8');
        });
    },

    /**
     * 智能读取文件：自动检测编码并返回内容和编码信息
     * 检测顺序：BOM -> UTF-8 字节验证 -> 回退 GBK
     * @param {File} file - File 对象
     * @returns {Promise<{content: string, encoding: string, rawBytes: ArrayBuffer}>}
     */
    async readFileSmart(file) {
        // 第一步：读取原始字节
        const arrayBuffer = await this._readAsArrayBuffer(file);
        const uint8 = new Uint8Array(arrayBuffer);

        // 第二步：检测 BOM
        const bomInfo = this._detectBOM(uint8);
        if (bomInfo) {
            const content = this._decodeBytes(uint8, bomInfo.encoding, bomInfo.bomLength);
            return { content, encoding: bomInfo.encoding, rawBytes: arrayBuffer };
        }

        // 第三步：尝试 UTF-8 字节级验证
        if (this._isValidUTF8(uint8)) {
            const content = this._decodeBytes(uint8, 'UTF-8', 0);
            return { content, encoding: 'UTF-8', rawBytes: arrayBuffer };
        }

        // 第四步：UTF-8 验证失败，回退 GBK
        try {
            const content = this._decodeBytes(uint8, 'GBK', 0);
            return { content, encoding: 'GBK', rawBytes: arrayBuffer };
        } catch (err) {
            // GBK 也失败，用 UTF-8 强制解码
            const content = this._decodeBytes(uint8, 'UTF-8', 0);
            return { content, encoding: 'UTF-8', rawBytes: arrayBuffer };
        }
    },

    /**
     * 用指定编码重新解码已缓存的原始字节
     * @param {ArrayBuffer} rawBytes - 原始字节
     * @param {string} encoding - 目标编码（UTF-8, GBK, Big5）
     * @returns {string} 解码后的文本
     */
    reDecode(rawBytes, encoding) {
        const uint8 = new Uint8Array(rawBytes);
        return this._decodeBytes(uint8, encoding, 0);
    },

    /**
     * 以 GBK 编码读取文件
     * @param {File} file - File 对象
     * @returns {Promise<string>}
     * @private
     */
    _readAsGBK(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                resolve(e.target.result);
            };
            reader.onerror = () => {
                reject(new Error('GBK 编码读取失败'));
            };
            reader.readAsText(file, 'GBK');
        });
    },

    /**
     * 读取文件为 ArrayBuffer
     * @param {File} file
     * @returns {Promise<ArrayBuffer>}
     * @private
     */
    _readAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error('文件读取失败'));
            reader.readAsArrayBuffer(file);
        });
    },

    /**
     * 检测 BOM（字节顺序标记）
     * @param {Uint8Array} uint8
     * @returns {{encoding: string, bomLength: number}|null}
     * @private
     */
    _detectBOM(uint8) {
        if (uint8.length < 2) return null;

        // UTF-8 BOM: EF BB BF
        if (uint8.length >= 3 && uint8[0] === 0xEF && uint8[1] === 0xBB && uint8[2] === 0xBF) {
            return { encoding: 'UTF-8', bomLength: 3 };
        }

        // UTF-16 LE BOM: FF FE
        if (uint8[0] === 0xFF && uint8[1] === 0xFE) {
            return { encoding: 'UTF-16LE', bomLength: 2 };
        }

        // UTF-16 BE BOM: FE FF
        if (uint8[0] === 0xFE && uint8[1] === 0xFF) {
            return { encoding: 'UTF-16BE', bomLength: 2 };
        }

        return null;
    },

    /**
     * 验证字节数组是否为合法的 UTF-8 编码
     * @param {Uint8Array} uint8
     * @returns {boolean}
     * @private
     */
    _isValidUTF8(uint8) {
        let i = 0;
        let hasMultiByte = false;

        while (i < uint8.length) {
            const byte = uint8[i];

            if (byte <= 0x7F) {
                // ASCII
                i++;
                continue;
            }

            hasMultiByte = true;
            let expectedLen;

            if ((byte & 0xE0) === 0xC0) {
                expectedLen = 2;
                if ((byte & 0x1E) === 0) return false; // 过度编码
            } else if ((byte & 0xF0) === 0xE0) {
                expectedLen = 3;
            } else if ((byte & 0xF8) === 0xF0) {
                expectedLen = 4;
                if (byte > 0xF4) return false; // 超出 Unicode 范围
            } else {
                return false; // 非法起始字节
            }

            if (i + expectedLen > uint8.length) return false;

            // 验证后续字节必须是 10xxxxxx
            for (let j = 1; j < expectedLen; j++) {
                if ((uint8[i + j] & 0xC0) !== 0x80) return false;
            }

            i += expectedLen;
        }

        return true;
    },

    /**
     * 用指定编码解码字节数组
     * @param {Uint8Array} uint8
     * @param {string} encoding - 编码名称
     * @param {number} bomLength - BOM 长度（跳过）
     * @returns {string}
     * @private
     */
    _decodeBytes(uint8, encoding, bomLength) {
        const bytes = bomLength > 0 ? uint8.slice(bomLength) : uint8;

        // UTF-16 需要特殊处理
        if (encoding === 'UTF-16LE' || encoding === 'UTF-16BE') {
            return this._decodeUTF16(bytes, encoding === 'UTF-16LE' ? 'little' : 'big');
        }

        // 使用 TextDecoder 解码（支持 UTF-8, GBK, Big5）
        try {
            const decoder = new TextDecoder(encoding);
            return decoder.decode(bytes);
        } catch (err) {
            // 编码不支持，回退 UTF-8
            const decoder = new TextDecoder('UTF-8');
            return decoder.decode(bytes);
        }
    },

    /**
     * 解码 UTF-16 字节
     * @param {Uint8Array} bytes
     * @param {'little'|'big'} endian
     * @returns {string}
     * @private
     */
    _decodeUTF16(bytes, endian) {
        const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
        let result = '';

        for (let i = 0; i < bytes.length - 1; i += 2) {
            const code = endian === 'little'
                ? view.getUint16(i, true)
                : view.getUint16(i, false);
            result += String.fromCodePoint(code);
        }

        return result;
    },

    /**
     * 检测内容是否为二进制文件
     * @param {string} content - 文件内容
     * @returns {boolean}
     * @private
     */
    _isBinaryContent(content) {
        if (!content || content.length === 0) return false;
        
        const sampleLength = Math.min(content.length, 1000);
        const sample = content.substring(0, sampleLength);
        
        let nonPrintableCount = 0;
        
        for (let i = 0; i < sample.length; i++) {
            const charCode = sample.charCodeAt(i);
            
            if (charCode < 32 && charCode !== 9 && charCode !== 10 && charCode !== 13) {
                nonPrintableCount++;
            }
        }
        
        const ratio = nonPrintableCount / sampleLength;
        return ratio > this.BINARY_THRESHOLD;
    },

    /**
     * 检测文本是否有乱码（通过检查 Unicode 替换字符）
     * @param {string} content - 文件内容
     * @returns {boolean}
     * @private
     */
    _hasGarbledText(content) {
        if (!content) return false;
        
        const sampleLength = Math.min(content.length, 500);
        const sample = content.substring(0, sampleLength);
        
        // 检查是否包含 Unicode 替换字符 (U+FFFD)
        if (sample.includes('')) {
            return true;
        }
        
        // 检查是否有大量非 ASCII 非中文字符（可能是乱码）
        let suspiciousCount = 0;
        for (let i = 0; i < sample.length; i++) {
            const charCode = sample.charCodeAt(i);
            // 非 ASCII 且不在常见中文范围
            if (charCode > 127 && charCode < 0x4E00) {
                suspiciousCount++;
            }
        }
        
        // 如果可疑字符占比过高，认为有乱码
        return suspiciousCount > sampleLength * 0.1;
    }
};
