/**
 * TrashService - 回收站服务
 * 
 * 功能: 管理已删除的文件和文件夹，支持恢复和清空
 * 数据结构: { id, type: 'file'|'folder', name, parentId, content, deletedAt }
 */

const TrashService = {
    /** @private 回收站数组 */
    _trash: [],

    /** @private 自增ID */
    _nextId: 1,

    /**
     * 初始化
     */
    init() {
        this._trash = StorageService.getTrash();
        if (this._trash.length > 0) {
            this._nextId = Math.max(...this._trash.map(t => t.id)) + 1;
        }
    },

    /**
     * 保存
     * @private
     */
    _save() {
        StorageService.saveTrash(this._trash);
    },

    /**
     * 生成ID
     * @private
     */
    _generateId() {
        return this._nextId++;
    },

    /**
     * 获取当前时间
     * @private
     */
    _now() {
        return new Date().toISOString();
    },

    /**
     * 获取所有回收站项目
     * @returns {Array}
     */
    getAll() {
        return [...this._trash];
    },

    /**
     * 将文件移入回收站
     * @param {Object} file - 文件对象
     */
    addFile(file) {
        const item = {
            id: this._generateId(),
            type: 'file',
            name: file.name,
            parentId: file.folderId,
            content: file.content,
            deletedAt: this._now()
        };
        this._trash.push(item);
        this._save();
    },

    /**
     * 将文件夹及其内容移入回收站
     * @param {Object} folder - 文件夹对象
     * @param {Array} files - 文件夹下所有文件
     */
    addFolder(folder, files) {
        const item = {
            id: this._generateId(),
            type: 'folder',
            name: folder.name,
            parentId: folder.parentId,
            content: null,
            deletedAt: this._now(),
            _files: files.map(f => ({
                name: f.name,
                parentId: f.folderId,
                content: f.content
            }))
        };
        this._trash.push(item);
        this._save();
    },

    /**
     * 恢复回收站项目
     * @param {number} trashId
     * @returns {boolean}
     */
    restore(trashId) {
        const index = this._trash.findIndex(t => t.id === trashId);
        if (index === -1) return false;

        const item = this._trash[index];

        if (item.type === 'file') {
            // 恢复文件
            const file = FileService.create(item.name, item.parentId, item.content || '');
            if (file) {
                this._trash.splice(index, 1);
                this._save();
                signal.emit(Constants.EVENTS.ITEM_RESTORED, { type: 'file', data: file });
                return true;
            }
        } else if (item.type === 'folder') {
            // 恢复文件夹
            const folder = FolderService.create(item.name, item.parentId);
            if (folder) {
                // 恢复文件夹内的文件
                if (item._files) {
                    item._files.forEach(f => {
                        FileService.create(f.name, folder.id, f.content || '');
                    });
                }
                this._trash.splice(index, 1);
                this._save();
                signal.emit(Constants.EVENTS.ITEM_RESTORED, { type: 'folder', data: folder });
                return true;
            }
        }
        return false;
    },

    /**
     * 永久删除回收站项目
     * @param {number} trashId
     */
    delete(trashId) {
        this._trash = this._trash.filter(t => t.id !== trashId);
        this._save();
    },

    /**
     * 清空回收站
     */
    empty() {
        this._trash = [];
        this._save();
        signal.emit(Constants.EVENTS.TRASH_EMPTIED, {});
    },

    /**
     * 获取回收站项目数量
     * @returns {number}
     */
    getCount() {
        return this._trash.length;
    }
};
