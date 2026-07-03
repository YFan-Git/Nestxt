/**
 * TimeService - 统一定时器管理服务
 * 
 * 职责: 提供心跳帧循环、一次性定时器和重复定时器管理
 * 信号: heartbeat(delta), timer_completed(timer_id), timer_tick(timer_id)
 */

const TimeService = {
    /** @private 定时器ID计数器 */
    _nextId: 1,

    /** @private 一次性定时器映射 { id: timeoutId } */
    _oneShotTimers: {},

    /** @private 重复定时器映射 { id: intervalId } */
    _repeatingTimers: {},

    /** @private 心跳帧ID */
    _heartbeatId: null,

    /** @private 上一帧时间戳 */
    _lastTime: 0,

    /** @private 心跳是否运行中 */
    _heartbeatRunning: false,

    /**
     * 初始化服务，启动心跳
     */
    init() {
        if (!this._heartbeatRunning) {
            this._startHeartbeat();
        }
    },

    /**
     * 启动心跳帧循环
     * @private
     */
    _startHeartbeat() {
        this._heartbeatRunning = true;
        this._lastTime = performance.now();

        const tick = (now) => {
            if (!this._heartbeatRunning) return;
            const delta = (now - this._lastTime) / 1000; // 秒
            this._lastTime = now;
            signal.emit('heartbeat', delta);
            this._heartbeatId = requestAnimationFrame(tick);
        };

        this._heartbeatId = requestAnimationFrame(tick);
    },

    /**
     * 停止心跳帧循环
     * @private
     */
    _stopHeartbeat() {
        this._heartbeatRunning = false;
        if (this._heartbeatId !== null) {
            cancelAnimationFrame(this._heartbeatId);
            this._heartbeatId = null;
        }
    },

    /**
     * 创建一次性定时器
     * @param {number} delay - 延迟时间（秒）
     * @param {Function} callback - 回调函数
     * @returns {number} timer_id
     */
    create_one_shot(delay, callback) {
        const id = this._nextId++;
        const timeoutId = setTimeout(() => {
            callback();
            delete this._oneShotTimers[id];
            signal.emit('timer_completed', id);
        }, delay * 1000);
        this._oneShotTimers[id] = timeoutId;
        return id;
    },

    /**
     * 创建重复定时器
     * @param {number} interval - 间隔时间（秒）
     * @param {Function} callback - 回调函数
     * @returns {number} timer_id
     */
    create_repeating(interval, callback) {
        const id = this._nextId++;
        const intervalId = setInterval(() => {
            callback();
            signal.emit('timer_tick', id);
        }, interval * 1000);
        this._repeatingTimers[id] = intervalId;
        return id;
    },

    /**
     * 停止指定定时器
     * @param {number} timer_id - 定时器ID
     */
    stop_timer(timer_id) {
        if (this._oneShotTimers[timer_id] !== undefined) {
            clearTimeout(this._oneShotTimers[timer_id]);
            delete this._oneShotTimers[timer_id];
        }
        if (this._repeatingTimers[timer_id] !== undefined) {
            clearInterval(this._repeatingTimers[timer_id]);
            delete this._repeatingTimers[timer_id];
        }
    },

    /**
     * 停止所有一次性定时器
     */
    stop_all_one_shot() {
        for (const id in this._oneShotTimers) {
            clearTimeout(this._oneShotTimers[id]);
        }
        this._oneShotTimers = {};
    },

    /**
     * 停止所有重复定时器
     */
    stop_all_repeating() {
        for (const id in this._repeatingTimers) {
            clearInterval(this._repeatingTimers[id]);
        }
        this._repeatingTimers = {};
    },

    /**
     * 停止所有定时器（一次性 + 重复）
     */
    stop_all() {
        this.stop_all_one_shot();
        this.stop_all_repeating();
    },

    /**
     * 获取活跃的一次性定时器数量
     * @returns {number}
     */
    get_one_shot_count() {
        return Object.keys(this._oneShotTimers).length;
    },

    /**
     * 获取活跃的重复定时器数量
     * @returns {number}
     */
    get_repeating_count() {
        return Object.keys(this._repeatingTimers).length;
    }
};