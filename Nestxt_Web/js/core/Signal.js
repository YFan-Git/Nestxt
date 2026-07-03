/**
 * Signal - 全局事件信号系统
 * 
 * 功能: 提供松耦合的事件驱动通信机制
 * 使用方式: 服务/控制器通过 emit 发送信号，通过 on 监听信号
 */

class Signal {
    constructor() {
        this._listeners = {};
    }

    /**
     * 监听事件
     * @param {string} event - 事件名称
     * @param {Function} callback - 回调函数
     * @returns {Function} 取消监听的函数
     */
    on(event, callback) {
        if (!this._listeners[event]) {
            this._listeners[event] = [];
        }
        this._listeners[event].push(callback);
        return () => this.off(event, callback);
    }

    /**
     * 取消监听
     * @param {string} event - 事件名称
     * @param {Function} callback - 回调函数
     */
    off(event, callback) {
        const listeners = this._listeners[event];
        if (listeners) {
            this._listeners[event] = listeners.filter(cb => cb !== callback);
        }
    }

    /**
     * 发送事件
     * @param {string} event - 事件名称
     * @param {*} data - 事件数据
     */
    emit(event, data) {
        const listeners = this._listeners[event];
        if (listeners && listeners.length > 0) {
            listeners.forEach(callback => {
                try {
                    callback(data);
                } catch (err) {
                    console.error(`[Signal] 事件 "${event}" 回调执行错误:`, err);
                }
            });
        }
    }

    /**
     * 一次性监听
     * @param {string} event - 事件名称
     * @param {Function} callback - 回调函数
     * @returns {Function} 取消监听的函数
     */
    once(event, callback) {
        const wrapper = (data) => {
            this.off(event, wrapper);
            callback(data);
        };
        return this.on(event, wrapper);
    }

    /**
     * 移除某事件的所有监听器
     * @param {string} event - 事件名称
     */
    removeAll(event) {
        if (event) {
            delete this._listeners[event];
        } else {
            this._listeners = {};
        }
    }
}

// 创建全局单例
const signal = new Signal();
