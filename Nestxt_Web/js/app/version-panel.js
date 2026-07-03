/**
 * app/version-panel.js - 版本管理面板模块
 * 
 * 功能: 版本面板显示/隐藏、版本列表渲染、版本保存、重命名、删除
 */

var App = window.App || {};

(function () {
    'use strict';

    const CHECK_SVG = ICONS.CHECKBOX_CHECKED + ICONS.CHECKBOX_CHECKED_LIGHT;
    const UNCHECK_SVG = ICONS.CHECKBOX_UNCHECKED;

    /**
     * 切换版本面板显示/隐藏
     */
    function toggleVersionPanel() {
        const panel = document.querySelector('.version-panel');
        if (!panel) return;
        const isOpen = panel.style.display !== 'none';
        panel.style.display = isOpen ? 'none' : 'flex';
        if (!isOpen) {
            renderVersionList();
        }
    }

    /**
     * 渲染版本列表
     */
    function renderVersionList() {
        const fileId = EditorController.getCurrentFileId();
        const listEl = document.querySelector('.version-list');
        if (!listEl) return;

        // 没有打开文件：显示空面板（保存按钮 + 暂无版本提示）
        if (fileId === null) {
            listEl.innerHTML = '<div class="version-save-bar"><button class="version-save-btn" disabled>保存当前版本</button></div>'
                + '<div class="version-empty">暂无保存的版本<br><span class="version-empty-hint">点击上方按钮保存当前内容为版本</span></div>';
            App.updateVersionCount(null);
            return;
        }

        const versions = FileService.getVersions(fileId);
        const file = FileService.getById(fileId);

        if (!file) {
            listEl.innerHTML = '<div class="version-save-bar"><button class="version-save-btn" disabled>保存当前版本</button></div>'
                + '<div class="version-empty">暂无保存的版本<br><span class="version-empty-hint">点击上方按钮保存当前内容为版本</span></div>';
            App.updateVersionCount(null);
            return;
        }

        App.updateVersionCount(versions.length);

        const currentEditingVersionId = EditorController.getCurrentVersionId();

        // 构建 HTML
        let html = '';

        // 保存当前版本按钮
        html += '<div class="version-save-bar"><button class="version-save-btn" id="version-save-btn">保存当前版本</button></div>';

        // 始终显示默认版本行（文件主内容）
        const fileTime = new Date(file.updatedAt).toLocaleString('zh-CN');
        const isEditingFile = (currentEditingVersionId === null);
        html += `<div class="version-item${isEditingFile ? ' version-item-active' : ''}" data-version-id="file">
            <span class="version-check">${isEditingFile ? CHECK_SVG : UNCHECK_SVG}</span>
            <div class="version-item-body">
                <span class="version-item-label">${App.escapeHtml(file.name)}</span>
                <span class="version-item-time">${fileTime}</span>
                <span class="version-item-hint">默认版本</span>
            </div>
        </div>`;

        // 所有已保存的版本（按初次保存时间升序排列）
        const sorted = [...versions].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
        for (const v of sorted) {
            const time = new Date(v.createdAt).toLocaleString('zh-CN');
            const isActive = (v.id === currentEditingVersionId);
            html += `<div class="version-item${isActive ? ' version-item-active' : ''}" data-version-id="${v.id}">
                <span class="version-check">${isActive ? CHECK_SVG : UNCHECK_SVG}</span>
                <div class="version-item-body">
                    <span class="version-item-label">${App.escapeHtml(v.label)}</span>
                    <span class="version-item-time">${time}</span>
                </div>
                <button class="version-del-btn" data-action="delete" data-id="${v.id}" title="删除">✕</button>
            </div>`;
        }

        if (versions.length === 0) {
            html += '<div class="version-empty">暂无保存的版本<br><span class="version-empty-hint">点击上方按钮保存当前内容为版本</span></div>';
        }

        listEl.innerHTML = html;

        // 绑定保存按钮：弹出模态框输入名称
        document.getElementById('version-save-btn')?.addEventListener('click', () => {
            App.showVersionSaveModal();
        });

        // 绑定勾选框点击：切换版本
        listEl.querySelectorAll('.version-check').forEach(check => {
            check.addEventListener('click', (e) => {
                e.stopPropagation();
                const item = check.closest('.version-item');
                const versionIdStr = item.dataset.versionId;
                const fId = EditorController.getCurrentFileId();
                if (fId === null) return;

                EditorController.save();
                if (versionIdStr === 'file') {
                    EditorController.switchToFile(fId);
                } else {
                    // 切换到该版本编辑（每个版本有独立内容，保存到版本而非文件）
                    EditorController.switchToVersion(fId, Number(versionIdStr));
                }
                renderVersionList();
            });
        });

        // 绑定删除按钮
        listEl.querySelectorAll('.version-del-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const idStr = btn.dataset.id;
                const fId = EditorController.getCurrentFileId();
                if (fId === null) return;

                const versionId = Number(idStr);
                const versions = FileService.getVersions(fId);
                const version = versions.find(v => v.id === versionId);
                const label = version ? version.label : '未知版本';
                App.showConfirmDialog('删除版本', `删除版本：${label} ！！！`, () => {
                    try {
                        FileService.deleteVersion(fId, versionId);
                    } catch (err) {
                        console.error('删除版本失败:', err);
                    }
                    renderVersionList();
                });
            });
        });

        // 双击版本项：重命名版本
        listEl.querySelectorAll('.version-item[data-version-id]').forEach(item => {
            item.addEventListener('dblclick', (e) => {
                // 如果点击的是删除按钮或勾选框，不触发重命名
                if (e.target.closest('.version-del-btn') || e.target.closest('.version-check')) return;

                const versionIdStr = item.dataset.versionId;
                const fId = EditorController.getCurrentFileId();
                if (fId === null) return;

                // 默认版本不能重命名
                if (versionIdStr === 'file') return;

                const versionId = Number(versionIdStr);
                const versions = FileService.getVersions(fId);
                const version = versions.find(v => v.id === versionId);
                if (!version) return;

                // 创建输入框进行重命名
                const labelEl = item.querySelector('.version-item-label');
                if (!labelEl) return;

                const oldName = version.label;
                const input = document.createElement('input');
                input.type = 'text';
                input.value = oldName;
                input.className = 'version-rename-input';
                labelEl.replaceWith(input);
                input.focus();
                input.select();

                const finishRename = () => {
                    const newName = input.value.trim();
                    if (newName && newName !== oldName) {
                        try {
                            FileService.renameVersion(fId, versionId, newName);
                        } catch (err) {
                            console.error('重命名版本失败:', err);
                        }
                    }
                    renderVersionList();
                };

                input.addEventListener('blur', finishRename);
                input.addEventListener('keydown', (ev) => {
                    if (ev.key === 'Enter') {
                        ev.preventDefault();
                        input.blur();
                    } else if (ev.key === 'Escape') {
                        input.value = oldName;
                        input.blur();
                    }
                });
            });
        });
    }

    /**
     * 更新版本计数显示
     * @param {number|null} count
     */
    function updateVersionCount(count) {
        const el = document.getElementById('version-count');
        if (el) {
            el.textContent = (count !== null ? count : 0) + '/' + Constants.LIMITS.MAX_VERSIONS;
        }
    }

    /**
     * 显示版本保存模态框
     */
    function showVersionSaveModal() {
        const modal = document.getElementById('version-modal');
        const input = document.getElementById('version-name-input');
        if (!modal || !input) return;

        // 如果没有打开的标签页，尝试从侧边栏获取当前选中的文件
        let fId = EditorController.getCurrentFileId();
        if (fId === null) {
            // 从侧边栏树中查找高亮的文件
            const activeFileEl = document.querySelector('.sidebar-tree .tree-file.active');
            if (activeFileEl) {
                fId = parseInt(activeFileEl.dataset.fileId);
            }
        }
        if (fId === null) return;

        // 如果该文件没有标签页，先打开它
        if (!TabService.isOpen(fId)) {
            TabService.open(fId);
        } else {
            TabService.switchTo(fId);
        }

        // 预设名称
        const now = new Date();
        const defaultName = now.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
        input.value = defaultName;
        modal.style.display = 'flex';

        // 聚焦并选中
        setTimeout(() => {
            input.focus();
            input.select();
        }, 100);
    }

    /**
     * 确认保存版本
     */
    function confirmVersionSave() {
        // 先保存当前编辑内容（如果是版本编辑模式，保存到版本；如果是默认文件，保存到文件）
        EditorController.save();

        const modal = document.getElementById('version-modal');
        const input = document.getElementById('version-name-input');
        if (!modal || !input) return;

        const label = input.value.trim();
        if (!label) {
            input.focus();
            return;
        }

        const fId = EditorController.getCurrentFileId();
        if (fId === null) return;

        // 直接读取 textarea 内容创建版本，避免覆盖当前编辑的版本
        const currentContent = EditorController.getContent();
        const version = FileService.saveVersion(fId, label, currentContent);
        modal.style.display = 'none';
        if (version) {
            // 切换到新保存的版本继续编辑
            EditorController.switchToVersion(fId, version.id);
        }
        renderVersionList();
    }

    /**
     * 关闭版本保存模态框
     */
    function closeVersionSaveModal() {
        const modal = document.getElementById('version-modal');
        if (modal) modal.style.display = 'none';
    }

    /**
     * 初始化版本保存模态框事件
     */
    function initVersionModal() {
        document.getElementById('modal-confirm')?.addEventListener('click', confirmVersionSave);
        document.getElementById('modal-cancel')?.addEventListener('click', closeVersionSaveModal);
        document.getElementById('modal-close')?.addEventListener('click', closeVersionSaveModal);

        // 点击遮罩关闭
        document.getElementById('version-modal')?.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) closeVersionSaveModal();
        });

        // Enter 确认
        document.getElementById('version-name-input')?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') confirmVersionSave();
            if (e.key === 'Escape') closeVersionSaveModal();
        });
    }

    /**
     * 注册版本面板关闭按钮
     */
    function initVersionPanelClose() {
        document.querySelector('.version-btn-close')?.addEventListener('click', () => {
            document.querySelector('.version-panel').style.display = 'none';
        });

        // 标签页关闭/全部关闭时，同步刷新版本面板
        signal.on(Constants.EVENTS.TAB_CLOSED, () => {
            // 延迟一帧，等 EditorController 先完成 _clearEditor
            requestAnimationFrame(() => renderVersionList());
        });
        signal.on(Constants.EVENTS.TAB_CLOSE_ALL, () => {
            requestAnimationFrame(() => renderVersionList());
        });
    }

    /**
     * 初始化版本面板宽度调整
     */
    function initVersionPanelResize() {
        const resizer = document.querySelector('.version-resizer');
        const panel = document.querySelector('.version-panel');
        if (!resizer || !panel) return;

        let isResizing = false;

        resizer.addEventListener('mousedown', (e) => {
            isResizing = true;
            resizer.classList.add('active');
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            const editorMain = document.querySelector('.editor-main');
            if (!editorMain) return;
            const mainRect = editorMain.getBoundingClientRect();
            let width = mainRect.right - e.clientX;
            width = Math.max(180, Math.min(width, 500));
            panel.style.width = width + 'px';
            panel.style.minWidth = width + 'px';
        });

        document.addEventListener('mouseup', () => {
            if (!isResizing) return;
            isResizing = false;
            resizer.classList.remove('active');
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            const currentWidth = parseInt(panel.style.width) || 260;
            StorageService.save('version_panel_width', currentWidth);
        });

        // 恢复保存的宽度
        const savedWidth = StorageService.load('version_panel_width', 260);
        panel.style.width = savedWidth + 'px';
        panel.style.minWidth = savedWidth + 'px';
    }

    // 导出到 App 命名空间
    Object.assign(App, {
        toggleVersionPanel,
        renderVersionList,
        updateVersionCount,
        showVersionSaveModal,
        confirmVersionSave,
        closeVersionSaveModal,
        initVersionModal,
        initVersionPanelClose,
        initVersionPanelResize
    });

})();

window.App = App;