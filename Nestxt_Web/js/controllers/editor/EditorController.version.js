/**
 * editor/EditorController.version.js - 版本信息模块
 * 
 * 扩展 EditorController: 版本信息栏更新、预览版本信息
 */

Object.assign(EditorController, {

    /**
     * 更新版本信息栏显示（始终显示）
     * @private
     */
    _updateVersionInfo() {
        if (!this._versionInfoEl) return;
        const nameEl = this._versionInfoEl.querySelector('.version-info-name');
        const timeEl = this._versionInfoEl.querySelector('.version-info-time');
        const iconEl = this._versionInfoEl.querySelector('.version-info-icon');
        const textEl = this._versionInfoEl.querySelector('.version-info-text');

        if (this._currentFileId === null) {
            this._versionInfoEl.style.display = 'none';
            return;
        }

        if (this._currentEditingVersionId !== null) {
            // 正在编辑某个版本
            const versions = FileService.getVersions(this._currentFileId);
            const version = versions.find(v => v.id === this._currentEditingVersionId);
            if (!version) {
                this._versionInfoEl.style.display = 'none';
                return;
            }
            if (iconEl) iconEl.innerHTML = ICONS.VERSION_PIN;
            if (textEl) textEl.textContent = '当前版本：';
            if (nameEl) nameEl.textContent = version.label;
            if (timeEl) timeEl.textContent = new Date(version.createdAt).toLocaleString('zh-CN');
        } else {
            // 正在编辑文件主内容（默认版本）
            const file = FileService.getById(this._currentFileId);
            if (iconEl) iconEl.innerHTML = ICONS.NOTE_VERSION;
            if (textEl) textEl.textContent = '当前版本：';
            if (nameEl) nameEl.textContent = file ? file.name : '';
            if (timeEl) timeEl.textContent = file ? new Date(file.updatedAt).toLocaleString('zh-CN') : '';
        }
        this._versionInfoEl.style.display = 'flex';
    },

    /**
     * 更新版本信息栏（预览版本模式）
     * @private
     * @param {object} version
     */
    _updateVersionInfoForPreview(version) {
        if (!this._versionInfoEl) return;
        const nameEl = this._versionInfoEl.querySelector('.version-info-name');
        const timeEl = this._versionInfoEl.querySelector('.version-info-time');
        const iconEl = this._versionInfoEl.querySelector('.version-info-icon');
        const textEl = this._versionInfoEl.querySelector('.version-info-text');
        if (iconEl) iconEl.textContent = ICONS.MAGNIFY;
        if (textEl) textEl.textContent = '预览版本：';
        if (nameEl) nameEl.textContent = version.label;
        if (timeEl) timeEl.textContent = '保存于 ' + new Date(version.createdAt).toLocaleString('zh-CN');
        this._versionInfoEl.style.display = 'flex';
    }

});