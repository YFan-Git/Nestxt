/**
 * FolderService - 文件夹数据服务
 * 
 * 功能: 提供文件夹的增删改查操作，管理无限层级嵌套
 * 数据结构: { id, name, parentId, expanded }
 */

const FolderService = {
    /** @private 文件夹数组 */
    _folders: [],

    /** @private 自增ID计数器 */
    _nextId: 1,

    /**
     * 初始化：从存储加载数据
     */
    init() {
        const STORAGE_KEY = Constants.STORAGE_KEYS.FOLDERS.split('_')[1]; // 'folders'
        this._folders = StorageService.getFolders();
        // 计算下一个可用ID
        if (this._folders.length > 0) {
            this._nextId = Math.max(...this._folders.map(f => f.id)) + 1;
        }
    },

    /**
     * 保存到存储
     * @private
     */
    _save() {
        StorageService.saveFolders(this._folders);
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
     * 获取所有文件夹
     * @returns {Array}
     */
    getAll() {
        return [...this._folders];
    },

    /**
     * 根据ID获取文件夹
     * @param {number} id
     * @returns {Object|undefined}
     */
    getById(id) {
        return this._folders.find(f => f.id === id);
    },

    /**
     * 获取指定父级下的子文件夹
     * @param {number|null} parentId - 父文件夹ID（null表示根级）
     * @returns {Array}
     */
    getChildren(parentId) {
        return this._folders.filter(f => f.parentId === parentId);
    },

    /**
     * 创建文件夹
     * @param {string} name - 文件夹名称
     * @param {number|null} parentId - 父文件夹ID
     * @returns {Object} 新创建的文件夹
     */
    create(name, parentId = null) {
        const folder = {
            id: this._generateId(),
            name: name.trim(),
            parentId: parentId,
            expanded: false
        };
        this._folders.push(folder);
        this._save();
        signal.emit(Constants.EVENTS.FOLDER_CREATED, folder);
        return folder;
    },

    /**
     * 重命名文件夹
     * @param {number} id - 文件夹ID
     * @param {string} newName - 新名称
     * @returns {boolean} 是否成功
     */
    rename(id, newName) {
        const folder = this.getById(id);
        if (!folder) return false;
        folder.name = newName.trim();
        this._save();
        signal.emit(Constants.EVENTS.FOLDER_RENAMED, folder);
        return true;
    },

    /**
     * 删除文件夹（递归获取所有子文件夹ID）
     * @param {number} id - 文件夹ID
     * @returns {number[]} 被删除的所有文件夹ID列表（包含自身）
     */
    remove(id) {
        const idsToRemove = [];
        const collectIds = (parentId) => {
            idsToRemove.push(parentId);
            this.getChildren(parentId).forEach(child => collectIds(child.id));
        };
        collectIds(id);

        const removedFolders = idsToRemove.map(fid => this.getById(fid)).filter(Boolean);
        this._folders = this._folders.filter(f => !idsToRemove.includes(f.id));
        this._save();
        signal.emit(Constants.EVENTS.FOLDER_DELETED, { folderId: id, ids: idsToRemove, folders: removedFolders });
        return idsToRemove;
    },

    /**
     * 切换展开/折叠状态
     * @param {number} id - 文件夹ID
     */
    toggleExpand(id) {
        const folder = this.getById(id);
        if (!folder) return;
        folder.expanded = !folder.expanded;
        this._save();
        const eventName = folder.expanded ? Constants.EVENTS.FOLDER_EXPANDED : Constants.EVENTS.FOLDER_COLLAPSED;
        signal.emit(eventName, folder);
    },

    /**
     * 展开文件夹
     * @param {number} id
     */
    expand(id) {
        const folder = this.getById(id);
        if (folder && !folder.expanded) {
            this.toggleExpand(id);
        }
    },

    /**
     * 检查文件夹是否存在
     * @param {number} id
     * @returns {boolean}
     */
    exists(id) {
        return this._folders.some(f => f.id === id);
    },

    /**
     * 统计文件夹中的直接文件数（不含子文件夹内的文件）
     * @param {number} folderId
     * @param {Array} files - 文件列表（由外部传入）
     * @returns {number}
     */
    countFiles(folderId, files) {
        return files.filter(f => f.folderId === folderId).length;
    },

    /**
     * 获取文件夹的层级深度
     * @param {number} id
     * @returns {number}
     */
    getDepth(id) {
        let depth = 0;
        let current = this.getById(id);
        while (current && current.parentId !== null) {
            depth++;
            current = this.getById(current.parentId);
        }
        return depth;
    },

    /**
     * 移动文件夹到目标文件夹（targetFolderId 为 null 则移动到根目录）
     * @param {number} folderId - 要移动的文件夹ID
     * @param {number|null} targetFolderId - 目标文件夹ID（null = 根目录）
     * @returns {boolean} 是否成功
     */
    move(folderId, targetFolderId) {
        const folder = this.getById(folderId);
        if (!folder) return false;

        // 移动到根目录
        if (targetFolderId === null) {
            if (folder.parentId === null) return false; // 已在根目录
            folder.parentId = null;
            this._save();
            signal.emit(Constants.EVENTS.FOLDER_MOVED, { folderId, targetFolderId: null });
            return true;
        }

        const target = this.getById(targetFolderId);
        if (!target) return false;

        // 不能移动到自身或自己的子文件夹中
        if (folderId === targetFolderId) return false;
        let parent = target;
        while (parent) {
            if (parent.id === folderId) return false;
            parent = parent.parentId !== null ? this.getById(parent.parentId) : null;
        }

        folder.parentId = targetFolderId;
        this._save();
        signal.emit(Constants.EVENTS.FOLDER_MOVED, { folderId, targetFolderId });
        return true;
    }
};
