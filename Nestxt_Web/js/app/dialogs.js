/**
 * app/dialogs.js - 通用对话框模块
 * 
 * 功能: 输入对话框、确认对话框、消息对话框、HTML转义工具
 */

var App = window.App || {};

(function () {
    'use strict';

    /**
     * HTML 转义
     * @param {string} str
     * @returns {string}
     */
    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    /**
     * 转义 HTML 属性值中的引号
     * @param {string} str
     * @returns {string}
     */
    function escapeAttr(str) {
        return escapeHtml(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    /**
     * 输入对话框
     * @param {string} title
     * @param {string} label
     * @param {string} defaultValue
     * @param {Function} onConfirm
     */
    function showInputDialog(title, label, defaultValue, onConfirm) {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `
            <div class="modal">
                <div class="modal-title">${title}</div>
                <div class="modal-body">
                    <p>${label}</p>
                    <input type="text" class="modal-input" value="${escapeHtml(defaultValue)}" autofocus>
                </div>
                <div class="modal-actions">
                    <button class="modal-btn" data-action="cancel">取消</button>
                    <button class="modal-btn modal-btn-primary" data-action="confirm">确定</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        const input = overlay.querySelector('.modal-input');
        input.focus();
        input.select();

        const close = () => {
            document.body.removeChild(overlay);
        };

        overlay.querySelector('[data-action="cancel"]').addEventListener('click', close);
        overlay.querySelector('[data-action="confirm"]').addEventListener('click', () => {
            onConfirm(input.value);
            close();
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                onConfirm(input.value);
                close();
            }
            if (e.key === 'Escape') close();
        });

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) close();
        });
    }

    /**
     * 确认对话框
     * @param {string} title
     * @param {string} message
     * @param {Function} onConfirm
     * @param {boolean} danger
     */
    function showConfirmDialog(title, message, onConfirm, danger = true) {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `
            <div class="modal">
                <div class="modal-title">${title}</div>
                <div class="modal-body">
                    <p>${escapeHtml(message)}</p>
                </div>
                <div class="modal-actions">
                    <button class="modal-btn" data-action="cancel">取消</button>
                    <button class="modal-btn ${danger ? 'modal-btn-danger' : 'modal-btn-primary'}" data-action="confirm">确定</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        const close = () => {
            document.body.removeChild(overlay);
        };

        overlay.querySelector('[data-action="cancel"]').addEventListener('click', close);
        overlay.querySelector('[data-action="confirm"]').addEventListener('click', () => {
            onConfirm();
            close();
        });

        overlay.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') close();
        });

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) close();
        });
    }

    /**
     * 显示消息提示框（只有确定按钮）
     * @param {string} title
     * @param {string} message
     */
    function showMessageDialog(title, message) {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `
            <div class="modal">
                <div class="modal-title">${title}</div>
                <div class="modal-body">
                    <p>${escapeHtml(message)}</p>
                </div>
                <div class="modal-actions">
                    <button class="modal-btn modal-btn-primary" data-action="ok">确定</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        const close = () => {
            document.body.removeChild(overlay);
        };

        overlay.querySelector('[data-action="ok"]').addEventListener('click', close);
        overlay.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') close();
        });
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) close();
        });
    }

    /**
     * 选择对话框（下拉选择）
     * @param {string} title
     * @param {string} label
     * @param {Array<{label: string, value: string}>} options
     * @param {Function} onConfirm
     */
    function showSelectDialog(title, label, options, onConfirm) {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        
        const optionsHtml = options.map(opt => 
            `<option value="${escapeAttr(opt.value)}">${escapeHtml(opt.label)}</option>`
        ).join('');
        
        overlay.innerHTML = `
            <div class="modal">
                <div class="modal-title">${title}</div>
                <div class="modal-body">
                    <p>${label}</p>
                    <select class="modal-select" autofocus>
                        ${optionsHtml}
                    </select>
                </div>
                <div class="modal-actions">
                    <button class="modal-btn" data-action="cancel">取消</button>
                    <button class="modal-btn modal-btn-primary" data-action="confirm">确定</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        const select = overlay.querySelector('.modal-select');
        select.focus();

        const close = () => {
            document.body.removeChild(overlay);
        };

        overlay.querySelector('[data-action="cancel"]').addEventListener('click', close);
        overlay.querySelector('[data-action="confirm"]').addEventListener('click', () => {
            onConfirm(select.value);
            close();
        });

        select.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                onConfirm(select.value);
                close();
            }
            if (e.key === 'Escape') close();
        });

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) close();
        });
    }

    // 导出到 App 命名空间
    Object.assign(App, {
        escapeHtml,
        escapeAttr,
        showInputDialog,
        showConfirmDialog,
        showMessageDialog,
        showSelectDialog
    });

})();

window.App = App;