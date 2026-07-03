/**
 * StorageBridge - 存储桥接层（技术层）
 *
 * 职责: 提供底层存储的原始读写接口，不包含任何业务语义
 * 架构: 三层存储架构的最底层 —— "怎么存"
 * 设计:
 *   - Web 端默认使用 localStorage 引擎
 *   - PC 端（pywebview）通过 setEngine() 注入 Python 引擎对象
 *   - 所有 key 自动添加 nestxt_ 前缀
 *   - 所有 value 自动 JSON 序列化/反序列化
 *
 * PC 端引擎接口（Python 端只需实现这 4 个方法）:
 *   - setItem(key: string, value: string): void
 *   - getItem(key: string): string|null
 *   - removeItem(key: string): void
 *   - clear(): void
 */

const StorageBridge = {
    /** @private 当前存储引擎（默认 localStorage） */
    _engine: null,

    /** @private key 前缀 */
    _prefix: 'nestxt_',

    /**
     * 初始化：检测运行环境，自动选择引擎
     * - Web 端：使用 localStorage
     * - PC 端（pywebview）：检测 pywebview 全局变量并注入 Python 引擎
     */
    init() {
        // 检测 PC 端 pywebview 环境
        if (typeof pywebview !== 'undefined' && pywebview.api) {
            // PC 端：使用 Python 后端提供的存储 API
            // 注意：pywebview API 返回 Promise，必须用 async/await
            this._engine = {
                setItem: async (key, value) => {
                    await pywebview.api.setItem(this._prefix + key, value);
                },
                getItem: async (key) => {
                    return await pywebview.api.getItem(this._prefix + key);
                },
                removeItem: async (key) => {
                    await pywebview.api.removeItem(this._prefix + key);
                },
                clear: async () => {
                    await pywebview.api.clear();
                }
            };
        } else {
            // Web 端：使用 localStorage（同步，包装为 async 以保持接口一致）
            this._engine = {
                setItem: async (key, value) => {
                    localStorage.setItem(this._prefix + key, value);
                },
                getItem: async (key) => {
                    return localStorage.getItem(this._prefix + key);
                },
                removeItem: async (key) => {
                    localStorage.removeItem(this._prefix + key);
                },
                clear: async () => {
                    // 只清除 nestxt_ 前缀的键，避免影响其他应用
                    const keysToRemove = [];
                    for (let i = 0; i < localStorage.length; i++) {
                        const k = localStorage.key(i);
                        if (k && k.startsWith(this._prefix)) {
                            keysToRemove.push(k);
                        }
                    }
                    keysToRemove.forEach(k => localStorage.removeItem(k));
                }
            };
        }
    },

    /**
     * 手动设置存储引擎（供 PC 端注入自定义引擎）
     * @param {Object} engine - 引擎对象，需实现 setItem/getItem/removeItem/clear 四个方法
     */
    setEngine(engine) {
        if (!engine || typeof engine.setItem !== 'function' ||
            typeof engine.getItem !== 'function' ||
            typeof engine.removeItem !== 'function' ||
            typeof engine.clear !== 'function') {
            console.error('[StorageBridge] 引擎对象必须实现 setItem/getItem/removeItem/clear 四个方法');
            return;
        }
        this._engine = engine;
    },

    /**
     * 存储数据（自动 JSON 序列化）
     * @param {string} key - 存储键（不含前缀）
     * @param {*} value - 要存储的值
     */
    async setItem(key, value) {
        if (!this._engine) {
            console.error('[StorageBridge] 引擎未初始化，请先调用 init()');
            return;
        }
        try {
            const jsonStr = JSON.stringify(value);
            await this._engine.setItem(key, jsonStr);
        } catch (err) {
            console.error(`[StorageBridge] setItem "${key}" 失败:`, err);
        }
    },

    /**
     * 读取数据（自动 JSON 反序列化）
     * @param {string} key - 存储键（不含前缀）
     * @returns {*|null} 解析后的值，不存在时返回 null
     */
    async getItem(key) {
        if (!this._engine) {
            console.error('[StorageBridge] 引擎未初始化，请先调用 init()');
            return null;
        }
        try {
            const jsonStr = await this._engine.getItem(key);
            if (jsonStr === null || jsonStr === undefined) return null;
            return JSON.parse(jsonStr);
        } catch (err) {
            console.error(`[StorageBridge] getItem "${key}" 失败:`, err);
            return null;
        }
    },

    /**
     * 删除数据
     * @param {string} key - 存储键（不含前缀）
     */
    async removeItem(key) {
        if (!this._engine) {
            console.error('[StorageBridge] 引擎未初始化，请先调用 init()');
            return;
        }
        try {
            await this._engine.removeItem(key);
        } catch (err) {
            console.error(`[StorageBridge] removeItem "${key}" 失败:`, err);
        }
    },

    /**
     * 清空所有 nestxt_ 前缀的数据
     */
    async clear() {
        if (!this._engine) {
            console.error('[StorageBridge] 引擎未初始化，请先调用 init()');
            return;
        }
        try {
            await this._engine.clear();
        } catch (err) {
            console.error('[StorageBridge] clear 失败:', err);
        }
    }
};