/**
 * Autoload - 全局服务注册与获取
 * 
 * 功能: 维护全局服务实例的注册表，各模块通过 Autoload 获取依赖服务
 * 设计: 实现依赖注入，降低模块间耦合度
 */

const Autoload = {
    /** @private 服务存储对象 */
    _services: {},

    /**
     * 注册服务
     * @param {string} name - 服务名称（建议用驼峰命名）
     * @param {Object} instance - 服务实例
     */
    register(name, instance) {
        if (this._services[name]) {
            console.warn(`[Autoload] 服务 "${name}" 已被覆盖注册`);
        }
        this._services[name] = instance;
    },

    /**
     * 获取服务
     * @param {string} name - 服务名称
     * @returns {Object|undefined} 服务实例
     */
    get(name) {
        const service = this._services[name];
        if (!service) {
            console.warn(`[Autoload] 服务 "${name}" 未注册`);
        }
        return service;
    },

    /**
     * 检查服务是否已注册
     * @param {string} name - 服务名称
     * @returns {boolean}
     */
    has(name) {
        return !!this._services[name];
    },

    /**
     * 移除服务
     * @param {string} name - 服务名称
     */
    remove(name) {
        delete this._services[name];
    },

    /**
     * 获取所有已注册的服务名称
     * @returns {string[]}
     */
    list() {
        return Object.keys(this._services);
    },

    /**
     * 清空所有服务（用于重启/重置）
     */
    clear() {
        this._services = {};
    }
};
