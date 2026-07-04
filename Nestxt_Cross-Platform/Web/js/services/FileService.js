/**
 * FileService - 文件数据服务
 * 
 * 功能: 提供文件的增删改查操作，内容管理，编码管理
 * 数据结构: { id, name, folderId, content, encoding, createdAt, updatedAt }
 */

const FileService = {
    /** @private 文件数组 */
    _files: [],

    /** @private 自增ID计数器 */
    _nextId: 1,

    /** @private 文件原始字节缓存（用于编码切换时重新解码） */
    _rawBytesCache: new Map(),

    /**
     * 初始化：从存储加载数据
     */
    init() {
        this._files = StorageService.getFiles();
        if (this._files.length > 0) {
            this._nextId = Math.max(...this._files.map(f => f.id)) + 1;
        }
    },

    /**
     * 保存到存储
     * @private
     */
    _save() {
        StorageService.saveFiles(this._files);
    },

    /**
     * 生成唯一ID
     * @private
     * @returns {number}
     */
    _generateId() {
        return this._nextId++;
    },

    /**
     * 获取当前时间戳
     * @private
     * @returns {string}
     */
    _now() {
        return new Date().toISOString();
    },

    /**
     * 获取所有文件
     * @returns {Array}
     */
    getAll() {
        return [...this._files];
    },

    /**
     * 根据ID获取文件
     * @param {number} id
     * @returns {Object|undefined}
     */
    getById(id) {
        return this._files.find(f => f.id === id);
    },

    /**
     * 获取指定文件夹下的文件
     * @param {number|null} folderId
     * @returns {Array}
     */
    getByFolder(folderId) {
        return this._files.filter(f => f.folderId === folderId);
    },

    /**
     * 创建文件
     * @param {string} name - 文件名（如 "笔记.txt"）
     * @param {number|null} folderId - 所属文件夹ID
     * @param {string} [content=''] - 初始内容
     * @param {string} [encoding='UTF-8'] - 文件编码
     * @returns {Object} 新创建的文件
     */
    create(name, folderId = null, content = '', encoding = 'UTF-8') {
        // 确保文件名有支持的后缀
        const fileName = this._ensureSupportedExtension(name.trim());
        const now = this._now();
        const file = {
            id: this._generateId(),
            name: fileName,
            folderId: folderId,
            content: content,
            encoding: encoding,
            createdAt: now,
            updatedAt: now
        };
        this._files.push(file);
        this._save();
        signal.emit(Constants.EVENTS.FILE_CREATED, file);
        return file;
    },

    /**
     * 重命名文件
     * @param {number} id
     * @param {string} newName
     * @returns {boolean}
     */
    rename(id, newName) {
        const file = this.getById(id);
        if (!file) return false;
        const fileName = this._ensureSupportedExtension(newName.trim());
        file.name = fileName;
        file.updatedAt = this._now();
        this._save();
        signal.emit(Constants.EVENTS.FILE_RENAMED, file);
        return true;
    },

    /**
     * 删除文件
     * @param {number} id
     * @returns {Object|null} 被删除的文件
     */
    remove(id) {
        const index = this._files.findIndex(f => f.id === id);
        if (index === -1) return null;
        const removed = this._files.splice(index, 1)[0];
        this._save();
        signal.emit(Constants.EVENTS.FILE_DELETED, removed);
        return removed;
    },

    /**
     * 批量删除指定文件夹下的所有文件
     * @param {number} folderId
     * @returns {Array} 被删除的文件列表
     */
    removeByFolder(folderId) {
        const toRemove = this._files.filter(f => f.folderId === folderId);
        toRemove.forEach(f => this.remove(f.id));
        return toRemove;
    },

    /**
     * 保存文件内容
     * @param {number} id
     * @param {string} content
     * @returns {boolean}
     */
    saveContent(id, content) {
        const file = this.getById(id);
        if (!file) return false;
        file.content = content;
        file.updatedAt = this._now();
        this._save();
        signal.emit(Constants.EVENTS.FILE_SAVED, file);
        return true;
    },

    /**
     * 移动文件到另一个文件夹
     * @param {number} fileId
     * @param {number|null} targetFolderId
     * @returns {boolean}
     */
    move(fileId, targetFolderId) {
        const file = this.getById(fileId);
        if (!file) return false;
        file.folderId = targetFolderId;
        file.updatedAt = this._now();
        this._save();
        signal.emit(Constants.EVENTS.FILE_MOVED, { file, targetFolderId });
        return true;
    },

    /**
     * 搜索文件（按名称和内容）
     * @param {string} query - 搜索关键词
     * @returns {Array} 匹配的文件列表
     */
    search(query) {
        if (!query || !query.trim()) return [];
        const q = query.toLowerCase().trim();
        return this._files.filter(f =>
            f.name.toLowerCase().includes(q) ||
            (f.content && f.content.toLowerCase().includes(q))
        ).map(f => ({
            ...f,
            matchType: f.name.toLowerCase().includes(q) ? 'name' : 'content'
        }));
    },

    /**
     * 检查文件名在文件夹中是否已存在
     * @param {string} name
     * @param {number|null} folderId
     * @param {number} [excludeId] - 排除的文件ID（重命名时使用）
     * @returns {boolean}
     */
    exists(name, folderId, excludeId = null) {
        const fileName = this._ensureSupportedExtension(name.trim());
        return this._files.some(f =>
            f.folderId === folderId &&
            f.name.toLowerCase() === fileName.toLowerCase() &&
            f.id !== excludeId
        );
    },

    /**
     * 确保文件名有支持的后缀
     * @param {string} fileName - 文件名
     * @returns {string} 带后缀的文件名
     * @private
     */
    _ensureSupportedExtension(fileName) {
        // 检查是否已有支持的后缀
        const hasSupportedExt = TextFileReader.SUPPORTED_EXTENSIONS.some(ext => 
            fileName.toLowerCase().endsWith(ext)
        );
        
        if (hasSupportedExt) {
            return fileName;
        }
        
        // 没有支持的后缀，添加 .txt
        return fileName + '.txt';
    },

    /* ========== 版本管理 ========== */

    /**
     * 保存当前文件内容为一个版本
     * @param {number} fileId
     * @param {string} [label] - 版本标签（可选）
     * @param {string} [content] - 版本内容（可选，默认使用文件内容）
     * @returns {Object|null} 保存的版本对象
     */
    saveVersion(fileId, label, content) {
        const file = this.getById(fileId);
        if (!file) return null;
        if (!file.versions) file.versions = [];
        const versionContent = content !== undefined ? content : file.content;
        const version = {
            id: Date.now(),
            content: versionContent,
            label: label || `版本 ${file.versions.length + 1}`,
            createdAt: new Date().toISOString()
        };
        file.versions.push(version);
        // 限制最多保存 20 个版本，超出则删除最旧的
        const maxV = Constants.LIMITS.MAX_VERSIONS;
        if (file.versions.length > maxV) {
            file.versions = file.versions.slice(file.versions.length - maxV);
        }
        this._save(); // 版本数据随 _files 一起持久化
        signal.emit(Constants.EVENTS.VERSION_SAVED, { fileId, version });
        return version;
    },

    /**
     * 获取文件的所有版本记录
     * @param {number} fileId
     * @returns {Array}
     */
    getVersions(fileId) {
        const file = this.getById(fileId);
        return file ? (file.versions || []) : [];
    },

    /**
     * 更新版本内容
     * @param {number} fileId
     * @param {number} versionId
     * @param {string} content
     * @returns {boolean}
     */
    updateVersionContent(fileId, versionId, content) {
        const file = this.getById(fileId);
        if (!file || !file.versions) return false;
        const version = file.versions.find(v => v.id === versionId);
        if (!version) return false;
        version.content = content;
        this._save();
        return true;
    },

    /**
     * 删除指定版本
     * @param {number} fileId
     * @param {number} versionId
     * @returns {boolean}
     */
    deleteVersion(fileId, versionId) {
        const file = this.getById(fileId);
        if (!file || !file.versions) return false;
        const idx = file.versions.findIndex(v => v.id === versionId);
        if (idx === -1) return false;
        file.versions.splice(idx, 1);
        this._save();
        signal.emit(Constants.EVENTS.VERSION_DELETED, { fileId, versionId });
        return true;
    },

    /**
     * 重命名指定版本
     * @param {number} fileId
     * @param {number} versionId
     * @param {string} newLabel
     * @returns {boolean}
     */
    renameVersion(fileId, versionId, newLabel) {
        const file = this.getById(fileId);
        if (!file || !file.versions) return false;
        const version = file.versions.find(v => v.id === versionId);
        if (!version) return false;
        version.label = newLabel;
        this._save();
        return true;
    },

    /**
     * 回退到指定版本（将版本内容恢复到文件）
     * @param {number} fileId
     * @param {number} versionId
     * @returns {boolean}
     */
    restoreVersion(fileId, versionId) {
        const file = this.getById(fileId);
        if (!file || !file.versions) return false;
        const version = file.versions.find(v => v.id === versionId);
        if (!version) return false;
        file.content = version.content;
        file.updatedAt = this._now();
        this._save();
        signal.emit(Constants.EVENTS.VERSION_RESTORED, { fileId, version });
        return true;
    }
};
