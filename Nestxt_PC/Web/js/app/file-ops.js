/**
 * app/file-ops.js - 文件操作模块
 * 
 * 功能: 新建文件、新建文件夹、重命名、删除、导入、导出
 */

var App = window.App || {};

(function () {
    'use strict';

    /**
     * 新建文件（直接创建并进入重命名状态）
     * @param {number|null} folderId
     */
    function showNewFileDialog(folderId) {
        // 直接创建文件，不弹出对话框
        const file = FileService.create('新建笔记.txt', folderId);
        if (file) {
            // 打开文件标签页
            TabService.open(file.id);
            // 通知侧边栏进入重命名状态
            signal.emit('sidebar:startRename', { fileId: file.id });
        }
    }

    /**
     * 显示新建文件夹对话框
     * @param {number|null} parentId
     */
    function showNewFolderDialog(parentId) {
        App.showInputDialog('新建文件夹', '请输入文件夹名称：', '新建文件夹', (name) => {
            if (!name.trim()) return;
            const folder = FolderService.create(name, parentId);
            // 展开父文件夹
            if (parentId !== null) {
                FolderService.expand(parentId);
            }
            // 选中新建的文件夹
            FolderTreeStateManager.setSelectedFolder(folder.id);
        });
    }

    /**
     * 显示重命名对话框
     * @param {'file'|'folder'} type
     * @param {string} currentName
     * @param {number} id
     */
    function showRenameDialog(type, currentName, id) {
        const label = type === 'file' ? '文件名：' : '文件夹名称：';
        const inputValue = type === 'file' ? currentName.replace(/\.[^.]+$/, '') : currentName;
        App.showInputDialog('重命名', label, inputValue, (newName) => {
            if (!newName.trim()) return;
            if (type === 'file') {
                FileService.rename(id, newName);
            } else {
                FolderService.rename(id, newName);
            }
        });
    }

    /**
     * 显示删除文件确认对话框
     * @param {Object} file
     */
    function showDeleteFileDialog(file) {
        App.showConfirmDialog('删除文件', `确定要删除"${file.name}"吗？`, () => {
            // 先关闭标签页
            if (TabService.isOpen(file.id)) {
                TabService.close(file.id);
            }
            // 移入回收站
            TrashService.addFile(file);
            // 从文件列表移除
            FileService.remove(file.id);
        });
    }

    /**
     * 显示删除文件夹确认对话框
     * @param {Object} folder
     */
    function showDeleteFolderDialog(folder) {
        const allFiles = FileService.getAll();
        const fileCount = FolderService.countFiles(folder.id, allFiles);
        let message = `确定要删除文件夹"${folder.name}"吗？`;
        if (fileCount > 0) {
            message += `\n该文件夹包含 ${fileCount} 个文件，将一并移入回收站。`;
        }

        App.showConfirmDialog('删除文件夹', message, () => {
            // 收集所有子文件
            const allFiles = FileService.getAll();
            const folderIds = [];
            const collectFolderIds = (parentId) => {
                folderIds.push(parentId);
                FolderService.getChildren(parentId).forEach(child => collectFolderIds(child.id));
            };
            collectFolderIds(folder.id);

            const filesToTrash = allFiles.filter(f => folderIds.includes(f.folderId));

            // 移入回收站
            TrashService.addFolder(folder, filesToTrash);

            // 删除相关文件
            filesToTrash.forEach(f => {
                if (TabService.isOpen(f.id)) {
                    TabService.close(f.id);
                }
                FileService.remove(f.id);
            });

            // 删除文件夹
            FolderService.remove(folder.id);
        });
    }

    /**
     * 导出文件
     * @param {Object} file
     */
    async function exportFile(file) {
        // 读取编辑器当前显示的内容（而非 file.content，确保切换版本后导出的是当前版本内容）
        const textarea = document.querySelector('.editor-textarea');
        const content = textarea ? textarea.value : (file.content || '');
        const suggestedName = file.name;

        // PC 端（pywebview）：使用 Python 文件保存对话框
        if (typeof pywebview !== 'undefined' && pywebview.api) {
            try {
                const result = await pywebview.api.saveFile(content, suggestedName);
                if (result && result.success) {
                    // 导出成功
                } else {
                    console.error('[Export] 导出失败:', result?.error);
                }
            } catch (err) {
                console.error('[Export] 调用 pywebview.api.saveFile 异常:', err);
            }
            return;
        }

        // Web 端：Blob 下载
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });

        // 优先使用 File System Access API 弹出保存对话框
        if (window.showSaveFilePicker) {
            try {
                const ext = TextFileReader.getExtension(file.name);
                const handle = await window.showSaveFilePicker({
                    suggestedName: suggestedName,
                    types: [{
                        description: '文本文件',
                        accept: { 'text/plain': [ext || '.txt'] }
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
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = suggestedName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * 复制文件副本
     * @param {Object} file - 原文件
     */
    function copyFile(file) {
        // 生成副本名称：保留原后缀，如 foo.py -> foo_副本.py
        const ext = TextFileReader.getExtension(file.name);
        const baseName = ext ? file.name.slice(0, -ext.length) : file.name;
        let copyName = baseName + '_副本' + ext;

        // 如果已存在同名副本，自动加序号
        let counter = 1;
        while (FileService.exists(copyName, file.folderId)) {
            copyName = baseName + '_副本' + counter + ext;
            counter++;
        }

        const newFile = FileService.create(copyName, file.folderId, file.content);
        if (newFile) {
            // 展开父文件夹并选中新副本
            if (newFile.folderId !== null) {
                FolderTreeStateManager.expandAncestors(newFile.folderId);
                FolderTreeStateManager.setSelectedFolder(newFile.folderId);
            }
            // 打开副本文件标签页（自动在树中高亮）
            TabService.open(newFile.id);
        }
    }

    /**
     * 导入文件
     */
    async function importFile() {
        const input = document.createElement('input');
        input.type = 'file';
        // 支持所有纯文本格式 + 兜底选项（所有文件）
        input.accept = '.txt,.csv,.log,.ini,.json,.xml,.html,.css,.js,.py,.c,.cpp,.bat,.cmd,*';
        
        input.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            try {
                // 使用智能读取，自动检测编码
                const result = await TextFileReader.readFileSmart(file);
                const newFile = FileService.create(file.name, null, result.content, result.encoding);
                if (newFile) {
                    // 缓存原始字节，用于后续编码切换
                    FileService._rawBytesCache.set(newFile.id, result.rawBytes);
                    TabService.open(newFile.id);
                    // 更新状态栏编码显示
                    signal.emit(Constants.EVENTS.ENCODING_CHANGED, { encoding: result.encoding });
                }
            } catch (err) {
                // 如果是二进制文件检测失败，提示用户
                if (err.message.includes('可能不是纯文本')) {
                    App.showConfirmDialog(
                        '文件警告',
                        err.message + '，是否继续打开？',
                        async () => {
                            try {
                                // 用户确认继续，强制读取 UTF-8（跳过二进制检测）
                                const content = await TextFileReader.forceRead(file);
                                const newFile = FileService.create(file.name, null, content, 'UTF-8');
                                if (newFile) {
                                    TabService.open(newFile.id);
                                    signal.emit(Constants.EVENTS.ENCODING_CHANGED, { encoding: 'UTF-8' });
                                }
                            } catch (forceErr) {
                                App.showMessageDialog('错误', '文件读取失败');
                            }
                        },
                        false
                    );
                } else {
                    App.showMessageDialog('错误', '文件读取失败：' + err.message);
                }
            }
        });
        input.click();
    }

    /**
     * 调整字号
     * @param {number} delta - 变化量（-1 或 1）
     */
    function adjustFontSize(delta) {
        const current = StorageService.load('fontsize', Constants.SIZES.FONT_SIZE_DEFAULT);
        const step = 2;
        let newSize = current + (delta > 0 ? step : -step);
        newSize = Math.max(Constants.SIZES.FONT_SIZE_MIN, Math.min(newSize, Constants.SIZES.FONT_SIZE_MAX));
        StorageService.save('fontsize', newSize);
        signal.emit(Constants.EVENTS.FONT_SIZE_CHANGED, { size: newSize });
        document.getElementById('fontsize-label').textContent = newSize;
    }

    /**
     * 初始化字号显示
     */
    function initFontSize() {
        const size = StorageService.load('fontsize', Constants.SIZES.FONT_SIZE_DEFAULT);
        document.getElementById('fontsize-label').textContent = size;
    }

    // 导出到 App 命名空间
    Object.assign(App, {
        showNewFileDialog,
        showNewFolderDialog,
        showRenameDialog,
        showDeleteFileDialog,
        showDeleteFolderDialog,
        copyFile,
        exportFile,
        importFile,
        adjustFontSize,
        initFontSize
    });

})();

window.App = App;