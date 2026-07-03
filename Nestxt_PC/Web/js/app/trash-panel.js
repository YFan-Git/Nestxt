/**
 * app/trash-panel.js - 回收站面板模块
 * 
 * 功能: 回收站初始化、渲染、切换显示/隐藏、恢复、删除
 */

var App = window.App || {};

(function () {
    'use strict';

    /**
     * 更新回收站徽章
     */
    function updateTrashBadge() {
        const badge = document.querySelector('.sidebar-footer-badge');
        if (badge) {
            const count = TrashService.getCount();
            badge.textContent = count;
            badge.style.display = count > 0 ? 'inline' : 'none';
        }
    }

    /**
     * 渲染回收站列表
     */
    function renderTrashList() {
        const list = document.querySelector('.trash-list');
        if (!list) return;

        const items = TrashService.getAll();
        if (items.length === 0) {
            list.innerHTML = '<div class="trash-empty">回收站为空</div>';
            return;
        }

        let html = '';
        items.forEach(item => {
            const icon = item.type === 'folder'
                ? ICONS.NOTE_TRASH
                : ICONS.FOLDER_TRASH;
            const time = new Date(item.deletedAt).toLocaleString('zh-CN', {
                month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
            });
            html += `<div class="trash-item" title="删除时间：${time}">
                <span class="trash-item-icon">${icon}</span>
                <span class="trash-item-name">${App.escapeHtml(item.name)}</span>
                <button class="trash-item-restore" data-id="${item.id}" title="恢复">${ICONS.RECOVER}</button>
                <button class="trash-item-delete" data-id="${item.id}" title="删除">✕</button>
            </div>`;
        });
        list.innerHTML = html;
    }

    /**
     * 显示回收站面板
     */
    function showTrashPanel() {
        const panel = document.querySelector('.trash-panel');
        const tree = document.querySelector('.sidebar-tree');
        const footer = document.querySelector('.sidebar-footer');
        if (panel && tree) {
            tree.style.display = 'none';
            if (footer) footer.style.display = 'none';
            panel.style.display = 'flex';
            renderTrashList();
        }
    }

    /**
     * 隐藏回收站面板
     */
    function hideTrashPanel() {
        const panel = document.querySelector('.trash-panel');
        const tree = document.querySelector('.sidebar-tree');
        const footer = document.querySelector('.sidebar-footer');
        if (panel && tree) {
            panel.style.display = 'none';
            tree.style.display = '';
            if (footer) footer.style.display = '';
        }
    }

    /**
     * 切换回收站面板
     */
    function toggleTrashPanel() {
        const panel = document.querySelector('.trash-panel');
        if (!panel) return;
        if (panel.style.display === 'flex') {
            hideTrashPanel();
        } else {
            showTrashPanel();
        }
    }

    /**
     * 初始化回收站面板
     */
    function initTrashPanel() {
        const panel = document.querySelector('.trash-panel');
        if (!panel) return;

        // 关闭按钮
        panel.querySelector('.trash-btn-close')?.addEventListener('click', () => {
            hideTrashPanel();
        });

        // 清空按钮
        panel.querySelector('.trash-btn-empty')?.addEventListener('click', () => {
            const count = TrashService.getCount();
            if (count === 0) return;
            App.showConfirmDialog('清空回收站', `确定要永久删除回收站中的 ${count} 个项目吗？此操作不可恢复。`, () => {
                TrashService.empty();
                renderTrashList();
                updateTrashBadge();
            });
        });

        // 使用事件委托处理列表中的恢复/删除按钮
        panel.querySelector('.trash-list')?.addEventListener('click', (e) => {
            const restoreBtn = e.target.closest('.trash-item-restore');
            const deleteBtn = e.target.closest('.trash-item-delete');

            if (restoreBtn) {
                const id = parseInt(restoreBtn.dataset.id);
                TrashService.restore(id);
                renderTrashList();
                updateTrashBadge();
            }

            if (deleteBtn) {
                const id = parseInt(deleteBtn.dataset.id);
                App.showConfirmDialog('永久删除', '确定要永久删除此项目吗？此操作不可恢复。', () => {
                    TrashService.delete(id);
                    renderTrashList();
                    updateTrashBadge();
                });
            }
        });

        // 初始更新徽章
        updateTrashBadge();

        // 监听回收站变化事件
        signal.on(Constants.EVENTS.ITEM_RESTORED, () => {
            updateTrashBadge();
        });
        signal.on(Constants.EVENTS.TRASH_EMPTIED, () => {
            updateTrashBadge();
            hideTrashPanel();
        });

        // 文件/文件夹被删除时更新徽章
        signal.on(Constants.EVENTS.FILE_DELETED, () => {
            updateTrashBadge();
        });
        signal.on(Constants.EVENTS.FOLDER_DELETED, () => {
            updateTrashBadge();
        });
    }

    // 导出到 App 命名空间
    Object.assign(App, {
        initTrashPanel,
        updateTrashBadge,
        renderTrashList,
        showTrashPanel,
        hideTrashPanel,
        toggleTrashPanel
    });

})();

window.App = App;