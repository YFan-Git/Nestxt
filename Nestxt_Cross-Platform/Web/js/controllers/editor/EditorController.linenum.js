/**
 * editor/EditorController.linenum.js - 行号模块
 * 
 * 扩展 EditorController: 行号计算、渲染、测量元素
 */

Object.assign(EditorController, {

    /**
     * 更新行号
     * @private
     */
    _updateLineNumbers() {
        if (!this._showLineNum) {
            this._lineNumEl.innerHTML = '';
            this._lineNumEl.style.display = 'none';
            this._textarea.style.marginLeft = '0';
            if (this._syntaxOverlay) {
                this._syntaxOverlay.style.marginLeft = '0';
            }
            return;
        }

        this._lineNumEl.style.display = 'block';
        this._textarea.style.marginLeft = Constants.SIZES.LINE_NUMBER_WIDTH + 'px';
        if (this._syntaxOverlay) {
            this._syntaxOverlay.style.marginLeft = Constants.SIZES.LINE_NUMBER_WIDTH + 'px';
        }

        const lines = this._textarea.value.split('\n');
        const currentLine = this._getCurrentLine();
        let html = '';

        if (this._wordWrap) {
            // 自动换行开启时，计算每个逻辑行占用的视觉行数
            const lineHeightPx = this._fontSize * 1.6;
            const contentWidth = this._textarea.clientWidth - 24; // 减去 padding(12+12)
            const measureEl = this._getMeasureElement(contentWidth);

            for (let i = 0; i < lines.length; i++) {
                // 空行用空格确保非零高度
                measureEl.textContent = lines[i] || ' ';
                const visualLines = Math.max(1, Math.round(measureEl.scrollHeight / lineHeightPx));
                const height = visualLines * lineHeightPx;
                html += `<div class="line-num ${i === currentLine - 1 ? 'line-num-active' : ''}" style="height:${height}px">${i + 1}</div>`;
            }
        } else {
            lines.forEach((_, i) => {
                html += `<div class="line-num ${i === currentLine - 1 ? 'line-num-active' : ''}">${i + 1}</div>`;
            });
        }

        this._lineNumEl.innerHTML = html;
        // 强制重排后再恢复滚动位置，避免浏览器 clamp
        if (this._textarea) {
            void this._lineNumEl.scrollHeight;
            this._lineNumEl.scrollTop = this._textarea.scrollTop;
        }
    },

    /**
     * 获取/创建行高测量元素
     * 用于在自动换行时计算每个逻辑行占用的视觉行数
     * @private
     * @param {number} contentWidth - 文本区域内容宽度（px）
     * @returns {HTMLElement} 测量用 pre 元素
     */
    _getMeasureElement(contentWidth) {
        if (!this._measurePre) {
            this._measurePre = document.createElement('pre');
            this._measurePre.style.cssText = `
                position: fixed;
                left: -9999px;
                top: 0;
                visibility: hidden;
                pointer-events: none;
                padding: 0;
                margin: 0;
                border: none;
                box-sizing: border-box;
            `;
            document.body.appendChild(this._measurePre);
        }
        // 同步文本区域的字体和换行样式
        this._measurePre.style.fontFamily = getComputedStyle(this._textarea).fontFamily;
        this._measurePre.style.fontSize = this._fontSize + 'px';
        this._measurePre.style.lineHeight = '1.6';
        this._measurePre.style.whiteSpace = 'pre-wrap';
        this._measurePre.style.overflowWrap = 'break-word';
        this._measurePre.style.width = contentWidth + 'px';
        return this._measurePre;
    },

    /**
     * 获取当前光标行号
     * @private
     * @returns {number}
     */
    _getCurrentLine() {
        const value = this._textarea.value;
        const pos = this._textarea.selectionStart;
        return value.substring(0, pos).split('\n').length;
    }

});