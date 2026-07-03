/**
 * app/settings.js - 设置菜单模块
 * 
 * 功能: 设置菜单显示、数据导出/导入、自动保存设置、语法高亮设置、关于
 */

var App = window.App || {};

(function () {
    'use strict';

    /**
     * 导出用户数据
     */
    async function handleExportData() {
        // 导出所有数据：业务数据从服务获取 + 设置数据从 StorageService 导出
        const data = {
            folders: FolderService.getAll(),
            files: FileService.getAll(),
            trash: TrashService.getAll(),
            tabs: TabService.getAll(),
            activeTab: StorageService.getActiveTab(),
            theme: StorageService.getTheme(),
            fontsize: StorageService.getFontsize(),
            linenum: StorageService.getLinenum(),
            sidebar_width: StorageService.getSidebarWidth(),
            wordwrap: StorageService.getWordwrap(),
            version_panel_width: StorageService.getVersionPanelWidth(),
            autosave_interval: StorageService.getAutosaveInterval(),
            syntax: StorageService.getSyntax(),
            syntax_highlight: StorageService.getSyntaxHighlight(),
            editing_versions: StorageService.getEditingVersions(),
            exportedAt: new Date().toISOString()
        };

        const json = JSON.stringify(data, null, 2);
        const fileName = `nestxt_backup_${new Date().toISOString().slice(0, 10)}.json`;

        // PC 端（pywebview）：使用 Python 文件保存对话框
        if (typeof pywebview !== 'undefined' && pywebview.api) {
            const result = await pywebview.api.saveFile(json, fileName);
            if (result && result.success) {
                // 导出成功
            }
            return;
        }

        // Web 端：优先使用 File System Access API 弹出保存对话框
        if (window.showSaveFilePicker) {
            try {
                const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
                const handle = await window.showSaveFilePicker({
                    suggestedName: fileName,
                    types: [{
                        description: 'JSON 文件',
                        accept: { 'application/json': ['.json'] }
                    }]
                });
                const writable = await handle.createWritable();
                await writable.write(blob);
                await writable.close();
                return;
            } catch (err) {
                if (err.name === 'AbortError') return;
            }
        }

        // 回退：传统下载方式
        const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * 导入用户数据
     */
    async function handleImportData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async (ev) => {
                try {
                    const data = JSON.parse(ev.target.result);

                    // 验证数据格式
                    if (!data.folders || !data.files) {
                        App.showMessageDialog('导入失败', '无效的数据文件格式，缺少 folders 或 files 数据');
                        return;
                    }

                    // 通过 StorageService 批量导入所有数据键
                    StorageService.importAll(data);

                    // 重新初始化所有服务（从缓存加载数据，重置 _nextId 等）
                    FolderService.init();
                    FileService.init();
                    TrashService.init();
                    TabService.init();

                    // 重新渲染界面（控制器是静态类，直接调用）
                    SidebarController.render();
                    TabController.render();

                    // 重新加载编辑器内容（导入数据后需要强制刷新）
                    const activeTabId = TabService.getActiveId();
                    if (activeTabId !== null) {
                        // 更新编辑器的版本映射表
                        EditorController._editingVersionMap = StorageService.getEditingVersions();
                        // 重新加载语法规则（导入的数据可能包含新的语法配置）
                        EditorController.refreshSyntaxRules();
                        // 强制重新加载当前文件（先重置 currentFileId 绕过相同文件检查）
                        EditorController._currentFileId = null;
                        signal.emit(Constants.EVENTS.TAB_SWITCHED, { fileId: activeTabId });
                    } else {
                        // 没有活动标签页，清空编辑器
                        EditorController._clearEditor();
                    }

                    // 应用导入的主题设置（通过 ThemeController 确保图标同步更新）
                    const theme = StorageService.getTheme();
                    ThemeController.setTheme(theme);

                    App.showMessageDialog('导入成功', '数据已成功导入！');
                } catch (err) {
                    App.showMessageDialog('导入失败', '导入失败：' + err.message);
                }
            };
            reader.onerror = () => {
                App.showMessageDialog('导入失败', '文件读取失败');
            };
            reader.readAsText(file);
        });
        input.click();
    }

    /**
     * 自动保存设置
     */
    function handleAutosaveSetting() {
        const currentInterval = StorageService.getAutosaveInterval();

        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `
            <div class="modal">
                <div class="modal-title">自动保存设置</div>
                <div class="modal-body">
                    <p style="margin-bottom:12px">编辑器将按以下间隔自动保存文件内容：</p>
                    <select class="modal-select">
                        <option value="30" ${currentInterval === 30 ? 'selected' : ''}>30 秒</option>
                        <option value="120" ${currentInterval === 120 ? 'selected' : ''}>2 分钟</option>
                        <option value="300" ${currentInterval === 300 ? 'selected' : ''}>5 分钟</option>
                        <option value="600" ${currentInterval === 600 ? 'selected' : ''}>10 分钟</option>
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
            const seconds = parseInt(select.value);
            StorageService.saveAutosaveInterval(seconds);
            // 重启自动保存服务
            AutoSaveService.stop();
            AutoSaveService.start();
            close();
        });

        select.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const seconds = parseInt(select.value);
                StorageService.saveAutosaveInterval(seconds);
                AutoSaveService.stop();
                AutoSaveService.start();
                close();
            }
            if (e.key === 'Escape') close();
        });
    }

    /**
     * 获取规则类型标签
     * @param {string} type
     * @returns {string}
     */
    function getRuleTypeLabel(type) {
        const labels = {
            'number': '数字',
            'double_quote': '双引号字符串',
            'single_quote': '单引号字符串',
            'custom': '自定义正则'
        };
        return labels[type] || type;
    }

    /**
     * 使模态框可拖动（限制在视口内）
     */
    function makeDraggable(modalEl, handleEl) {
        let isDragging = false;
        let startX, startY, origX, origY;

        handleEl.style.cursor = 'move';

        handleEl.addEventListener('mousedown', (e) => {
            // 只在标题栏空白处拖动，不干扰按钮
            if (e.target.closest('button')) return;
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            const rect = modalEl.getBoundingClientRect();
            origX = rect.left;
            origY = rect.top;
            // 取消居中定位，改为绝对定位
            modalEl.style.position = 'fixed';
            modalEl.style.left = origX + 'px';
            modalEl.style.top = origY + 'px';
            modalEl.style.margin = '0';
            modalEl.style.transform = 'none';
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            let newX = origX + dx;
            let newY = origY + dy;

            // 限制在视口内
            const rect = modalEl.getBoundingClientRect();
            const maxW = window.innerWidth - rect.width;
            const maxH = window.innerHeight - rect.height;
            newX = Math.max(0, Math.min(newX, maxW));
            newY = Math.max(0, Math.min(newY, maxH));

            modalEl.style.left = newX + 'px';
            modalEl.style.top = newY + 'px';
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
        });
    }

    /**
     * 语法高亮设置
     */
    function handleSyntaxSetting() {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';

        const rules = StorageService.getSyntax();

        /**
         * 渲染规则列表
         */
        const renderRuleList = () => {
            const currentRules = StorageService.getSyntax();
            const listEl = overlay.querySelector('.syntax-rule-list');
            const counterEl = overlay.querySelector('.syntax-counter');
            if (!listEl) return;

            // 更新计数器
            if (counterEl) {
                counterEl.textContent = `${currentRules.length}/50`;
            }

            if (currentRules.length === 0) {
                listEl.innerHTML = '<div class="syntax-empty">暂无语法规则，点击下方按钮添加</div>';
                return;
            }

            listEl.innerHTML = currentRules.map((rule, index) => `
                <div class="syntax-rule-item">
                    <div class="syntax-rule-color" style="background-color: ${rule.color}"></div>
                    <div class="syntax-rule-info">
                        <div class="syntax-rule-name">${App.escapeHtml(rule.name)}</div>
                        <div class="syntax-rule-type">${getRuleTypeLabel(rule.type)}${rule.type === 'custom' ? ': ' + App.escapeHtml(rule.pattern || '') : ''}</div>
                    </div>
                    <div class="syntax-rule-actions">
                        <button class="syntax-btn-edit" data-index="${index}" title="编辑">${ICONS.WRITE}</button>
                        <button class="syntax-btn-delete" data-index="${index}" title="删除">${ICONS.CLOSE}</button>
                    </div>
                </div>
            `).join('');

            // 绑定编辑按钮
            listEl.querySelectorAll('.syntax-btn-edit').forEach(btn => {
                btn.addEventListener('click', () => {
                    const idx = parseInt(btn.dataset.index);
                    showEditRuleDialog(idx);
                });
            });

            // 绑定删除按钮
            listEl.querySelectorAll('.syntax-btn-delete').forEach(btn => {
                btn.addEventListener('click', () => {
                    const idx = parseInt(btn.dataset.index);
                    const currentRules = StorageService.getSyntax();
                    currentRules.splice(idx, 1);
                    StorageService.saveSyntax(currentRules);
                    signal.emit('syntax:rulesChanged');
                    renderRuleList();
                });
            });
        };

        /**
         * 显示编辑规则对话框
         */
        const showEditRuleDialog = (editIndex = -1) => {
            const currentRules = StorageService.getSyntax();
            const isEdit = editIndex >= 0;
            const rule = isEdit ? currentRules[editIndex] : { name: '', type: 'number', color: '#ff6b6b', pattern: '' };

            const editOverlay = document.createElement('div');
            editOverlay.className = 'modal-overlay';
            editOverlay.innerHTML = `
                <div class="modal syntax-draggable">
                    <div class="modal-title syntax-drag-handle">${isEdit ? '编辑语法规则' : '添加语法规则'}</div>
                    <div class="modal-body">
                        <div class="syntax-form-group">
                            <label>规则名称：</label>
                            <input type="text" class="syntax-input-name" value="${App.escapeAttr(rule.name)}" placeholder="例如：数字、字符串">
                        </div>
                        <div class="syntax-form-group">
                            <label>匹配类型：</label>
                            <select class="syntax-select-type">
                                <option value="number" ${rule.type === 'number' ? 'selected' : ''}>数字</option>
                                <option value="custom" ${rule.type === 'custom' ? 'selected' : ''}>自定义正则</option>
                            </select>
                        </div>
                        <div class="syntax-form-group syntax-custom-pattern" style="display: ${rule.type === 'custom' ? 'block' : 'none'}">
                            <label>正则表达式：</label>
                            <input type="text" class="syntax-input-pattern" value="${App.escapeAttr(rule.pattern || '')}" placeholder="例如：\\[.*?\\]">
                        </div>
                        <div class="syntax-help-box syntax-custom-pattern" style="display: ${rule.type === 'custom' ? 'block' : 'none'}">
                            <div class="syntax-help-title">💡 正则表达式示例</div>
                            <div class="syntax-help-item">
                                <code>\\d+\\.?\\d*</code>
                                <span>匹配数字（整数/小数）</span>
                            </div>
                            <div class="syntax-help-item">
                                <code>".*?"</code>
                                <span>匹配双引号字符串</span>
                            </div>
                            <div class="syntax-help-item">
                                <code>'.*?'</code>
                                <span>匹配单引号字符串</span>
                            </div>
                            <div class="syntax-help-item">
                                <code>\\【.*?\\】</code>
                                <span>匹配【】内容</span>
                            </div>
                            <div class="syntax-help-item">
                                <code>\\(.*?\\)</code>
                                <span>匹配（）内容</span>
                            </div>
                            <div class="syntax-help-item">
                                <code>\\{.*?\\}</code>
                                <span>匹配{}内容</span>
                            </div>
                            <div class="syntax-help-item">
                                <code>&lt;.*?&gt;</code>
                                <span>匹配&lt;&gt;内容</span>
                            </div>
                            <div class="syntax-help-item">
                                <code>\\b\\w+\\b</code>
                                <span>匹配单词</span>
                            </div>
                            <div class="syntax-help-item">
                                <code>#.*</code>
                                <span>匹配#开头到行尾</span>
                            </div>
                        </div>
                        <div class="syntax-form-group">
                            <label>高亮颜色：</label>
                            <span class="syntax-color-picker-btn" style="background-color: ${rule.color}" title="点击选择颜色"></span>
                            <input type="color" class="syntax-color-input-hidden" value="${rule.color}" style="position:absolute;width:0;height:0;opacity:0;pointer-events:none">
                            <input type="text" class="syntax-color-hex-input" value="${rule.color}" placeholder="#RRGGBB" maxlength="7" style="width:90px">
                        </div>
                    </div>
                    <div class="modal-actions">
                        <button class="modal-btn" data-action="cancel">取消</button>
                        <button class="modal-btn modal-btn-primary" data-action="confirm">${isEdit ? '保存' : '添加'}</button>
                    </div>
                </div>
            `;

            document.body.appendChild(editOverlay);

            // 使对话框可拖动
            makeDraggable(editOverlay.querySelector('.syntax-draggable'), editOverlay.querySelector('.syntax-drag-handle'));

            const close = () => {
                document.body.removeChild(editOverlay);
            };

            // 类型切换时显示/隐藏自定义正则输入和帮助框
            const typeSelect = editOverlay.querySelector('.syntax-select-type');
            const customPatternGroups = editOverlay.querySelectorAll('.syntax-custom-pattern');
            typeSelect.addEventListener('change', () => {
                const show = typeSelect.value === 'custom';
                customPatternGroups.forEach(el => { el.style.display = show ? 'block' : 'none'; });
            });

            // 颜色选择：点击色块打开取色器
            const colorBtn = editOverlay.querySelector('.syntax-color-picker-btn');
            const colorInput = editOverlay.querySelector('.syntax-color-input-hidden');
            const colorHexInput = editOverlay.querySelector('.syntax-color-hex-input');

            colorBtn.addEventListener('click', () => {
                colorInput.click();
            });

            // 取色器变化时同步更新色块和文本框
            colorInput.addEventListener('input', () => {
                colorBtn.style.backgroundColor = colorInput.value;
                colorHexInput.value = colorInput.value;
            });

            // 文本框输入时同步更新色块和取色器
            colorHexInput.addEventListener('input', () => {
                let val = colorHexInput.value.trim();
                if (!val.startsWith('#')) val = '#' + val;
                if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                    colorBtn.style.backgroundColor = val;
                    colorInput.value = val;
                }
            });

            editOverlay.querySelector('[data-action="cancel"]').addEventListener('click', close);
            editOverlay.querySelector('[data-action="confirm"]').addEventListener('click', () => {
                const name = editOverlay.querySelector('.syntax-input-name').value.trim();
                const type = editOverlay.querySelector('.syntax-select-type').value;
                const color = colorInput.value;
                const pattern = editOverlay.querySelector('.syntax-input-pattern')?.value.trim() || '';

                if (!name) {
                    App.showMessageDialog('提示', '请输入规则名称');
                    return;
                }

                if (type === 'custom' && !pattern) {
                    App.showMessageDialog('提示', '请输入正则表达式');
                    return;
                }

                const currentRules = StorageService.getSyntax();

                if (isEdit) {
                    currentRules[editIndex] = { name, type, color, pattern };
                } else {
                    if (currentRules.length >= 50) {
                        App.showMessageDialog('提示', '最多只能添加 50 个语法规则');
                        return;
                    }
                    currentRules.push({ name, type, color, pattern });
                }

                StorageService.saveSyntax(currentRules);
                signal.emit('syntax:rulesChanged');
                close();
                renderRuleList();
            });

            editOverlay.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') close();
            });
        };

        overlay.innerHTML = `
            <div class="modal syntax-modal syntax-draggable">
                <div class="modal-title syntax-drag-handle">
                    <span>语法高亮设置</span>
                    <span class="syntax-counter">0/50</span>
                    <button class="syntax-modal-close" data-action="close" title="关闭">✕</button>
                </div>
                <div class="modal-body">
                    <div class="syntax-rule-list"></div>
                </div>
                <div class="modal-actions">
                    <button class="modal-btn modal-btn-danger" data-action="reset">恢复默认</button>
                    <button class="modal-btn modal-btn-primary" data-action="add">添加规则</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        // 使主面板可拖动
        makeDraggable(overlay.querySelector('.syntax-draggable'), overlay.querySelector('.syntax-drag-handle'));

        const close = () => {
            document.body.removeChild(overlay);
        };

        overlay.querySelector('[data-action="close"]').addEventListener('click', close);
        overlay.querySelector('[data-action="add"]').addEventListener('click', () => {
            showEditRuleDialog(-1);
        });
        overlay.querySelector('[data-action="reset"]').addEventListener('click', () => {
            App.showConfirmDialog('恢复默认', '确定要恢复默认语法规则吗？当前自定义规则将被清除。', () => {
                const defaultRules = [
                        { name: '数字', type: 'number', color: '#ef4556ff', pattern: '' },
                        { name: '" "', type: 'custom', color: '#399ddb', pattern: '".*?"' },
                        { name: "' '", type: 'custom', color: '#b645a1ff', pattern: "'.*?'" },
                        { name: '【】', type: 'custom', color: '#1fbec1', pattern: '\\【.*?\\】' },
                        { name: '[]', type: 'custom', color: '#8cc71f', pattern: '\\[.*?\\]' },
                        { name: '# 注释', type: 'custom', color: '#8a95a0ff', pattern: '#.*' },
                        { name: 'Word 单词', type: 'custom', color: '#119489ff', pattern: '\\b\\w+\\b' }
                    ];
                StorageService.saveSyntax(defaultRules);
                signal.emit('syntax:rulesChanged');
                renderRuleList();
            });
        });

        overlay.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') close();
        });

        // 初始渲染规则列表
        renderRuleList();
    }

    /**
     * 处理编码设置
     */
    function handleEncodingSetting() {
        const fileId = EditorController.getCurrentFileId();
        if (fileId === null) {
            App.showMessageDialog('提示', '请先打开一个文件');
            return;
        }

        const file = FileService.getById(fileId);
        if (!file) {
            App.showMessageDialog('提示', '文件不存在');
            return;
        }

        const currentEncoding = file.encoding || 'UTF-8';
        const options = [
            { label: 'UTF-8', value: 'UTF-8' },
            { label: 'GBK', value: 'GBK' },
            { label: 'GB2312', value: 'GB2312' },
            { label: 'Big5', value: 'Big5' }
        ].map(opt => {
            const selected = opt.value === currentEncoding ? ' (当前)' : '';
            return { label: opt.label + selected, value: opt.value };
        });

        App.showSelectDialog('编码设置', '选择文件编码格式：', options, (selectedEncoding) => {
            if (selectedEncoding !== currentEncoding) {
                // 获取原始字节
                const rawBytes = FileService._rawBytesCache.get(file.id);
                if (!rawBytes) {
                    App.showMessageDialog('错误', '无法获取文件原始字节，无法切换编码');
                    return;
                }

                try {
                    // 使用新编码重新解码
                    const newContent = TextFileReader.reDecode(rawBytes, selectedEncoding);
                    
                    // 更新文件内容
                    FileService.saveContent(file.id, newContent);
                    file.encoding = selectedEncoding;
                    FileService._save();

                    // 更新编辑器显示
                    const textarea = document.querySelector('.editor-textarea');
                    if (textarea) {
                        textarea.value = newContent;
                    }

                    // 触发编码变化事件
                    signal.emit(Constants.EVENTS.ENCODING_CHANGED, { encoding: selectedEncoding });

                    App.showMessageDialog('成功', `编码已切换为 ${selectedEncoding}`);
                } catch (err) {
                    App.showMessageDialog('错误', '编码切换失败：' + err.message);
                }
            }
        });
    }

    /**
     * 处理在线文档
     */
    function handleOnlineDocs() {
        window.open('docs/index.html', '_blank');
    }

    /**
     * 关于
     */
    function handleAbout() {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `
            <div class="modal">
                <div class="modal-title">关于 Nestxt</div>
                <div class="modal-body" style="text-align:center">
                    <p style="font-size:15px;font-weight:600;margin-bottom:4px">Nestxt 文本编辑器</p>
                    <p style="font-size:12px;color:var(--text-muted);margin-bottom:16px">版本 1.0</p>
                    <p style="font-size:13px;margin-bottom:20px;line-height:1.6">一款简洁的在线文本编辑器，支持文件夹管理、版本控制、自动保存等功能。</p>
                    <div style="border-top:1px solid var(--border);padding-top:16px;margin-bottom:12px">
                        <p style="font-size:13px;font-weight:600;margin-bottom:12px">作者信息</p>
                        <div style="display: flex; align-items: center; justify-content: center; gap: 12px;">
                            <img src="icon/YFan.png" alt="YFan" style="width: 56px; height: 56px; border-radius: 50%; object-fit: cover;">
                            <div style="text-align:left">
                                <p style="margin: 0; font-weight: 600; font-size:14px">YFan</p>
                                <p style="margin: 2px 0 0 0; font-size: 12px; color: var(--text-muted);">开发者</p>
                            </div>
                        </div>
                    </div>
                    <div style="border-top:1px solid var(--border);padding-top:12px">
                        <p style="font-size:12px;margin:4px 0">邮箱：603349580@qq.com</p>
                        <p style="font-size:12px;margin:4px 0">微信：a603349580</p>
                        <p style="font-size:12px;margin:4px 0">电话：18677102043</p>
                    </div>
                    <p style="margin-top: 16px; color: var(--text-muted); font-size: 11px;">© 2026 Nestxt. All rights reserved.</p>
                </div>
                <div class="modal-actions" style="justify-content:center">
                    <button class="modal-btn modal-btn-primary" data-action="close">关闭</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        const close = () => {
            document.body.removeChild(overlay);
        };

        overlay.querySelector('[data-action="close"]').addEventListener('click', close);
        overlay.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') close();
        });
    }

    /**
     * 初始化设置菜单
     */
    function initSettingsMenu() {
        const btn = document.getElementById('btn-settings');
        const menu = document.getElementById('settings-menu');
        if (!btn || !menu) return;

        // 切换菜单显示 - 使用 mousedown 避免 click 事件冒泡问题
        btn.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();

            if (menu.style.display === 'none' || !menu.style.display) {
                // 计算菜单位置：按钮右下方
                const rect = btn.getBoundingClientRect();
                menu.style.top = (rect.bottom + 4) + 'px';
                menu.style.right = (window.innerWidth - rect.right) + 'px';
                menu.style.display = 'block';
            } else {
                menu.style.display = 'none';
            }
        });

        // 点击其他区域关闭菜单
        document.addEventListener('mousedown', (e) => {
            if (!menu.contains(e.target) && !btn.contains(e.target)) {
                menu.style.display = 'none';
            }
        });

        // 菜单项点击
        menu.querySelectorAll('.settings-menu-item').forEach(item => {
            item.addEventListener('click', () => {
                const action = item.dataset.action;
                menu.style.display = 'none';

                if (action === 'export-data') {
                    handleExportData();
                } else if (action === 'import-data') {
                    handleImportData();
                } else if (action === 'autosave-setting') {
                    handleAutosaveSetting();
                } else if (action === 'syntax-setting') {
                    handleSyntaxSetting();
                } else if (action === 'encoding-setting') {
                    handleEncodingSetting();
                } else if (action === 'online-docs') {
                    handleOnlineDocs();
                } else if (action === 'about') {
                    handleAbout();
                }
            });
        });
    }

    // 导出到 App 命名空间
    Object.assign(App, {
        initSettingsMenu,
        handleExportData,
        handleImportData,
        handleAutosaveSetting,
        handleSyntaxSetting,
        handleOnlineDocs,
        handleAbout
    });

})();

window.App = App;