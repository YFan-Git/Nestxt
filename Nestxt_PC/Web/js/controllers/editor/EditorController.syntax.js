/**
 * editor/EditorController.syntax.js - 语法高亮模块
 * 
 * 扩展 EditorController: 语法高亮覆盖层、滚动同步、偏移测量、HTML 构建
 */

Object.assign(EditorController, {

    /**
     * 更新语法高亮覆盖层
     * @private
     */
    _updateSyntaxHighlighting() {
        if (!this._syntaxOverlay) return;
        const text = this._textarea ? this._textarea.value : '';
        if (!text || !this._syntaxRules || this._syntaxRules.length === 0) {
            this._syntaxOverlay.innerHTML = this._escapeHtml(text) || '';
        } else {
            this._syntaxOverlay.innerHTML = this._buildHighlightedHtml(text, this._syntaxRules);
        }
        // innerHTML 更新后立即同步滚动位置与内容宽度
        this._syncOverlayScroll();
    },

    /**
     * 同步语法高亮叠加层的滚动位置与内容宽度
     * 使用 transform: translate 完全绕过 scrollTop/scrollLeft，消除 textarea/pre 渲染差异
     * @private
     */
    _syncOverlayScroll() {
        if (!this._syntaxOverlay || !this._textarea) return;

        // 动态补偿滚动条宽度：textarea 有可见滚动条占用内容区宽度，
        // overlay 滚动条被隐藏不占空间，通过 padding-right 补偿使两者内容区宽度一致
        const scrollbarWidth = this._textarea.offsetWidth - this._textarea.clientWidth;
        const basePadding = 12; // CSS 中定义的 padding 值
        this._syntaxOverlay.style.paddingRight = (basePadding + scrollbarWidth) + 'px';

        // 强制重排确保 padding-right 生效
        void this._syntaxOverlay.scrollHeight;

        // 垂直同步：使用 transform: translateY(-scrollTop) 完全绕过 scrollTop
        // 在不同元素类型（textarea=OS原生 vs pre=浏览器渲染）之间的渲染差异
        // 同时补偿初始偏移（第一行位置差异）
        const initialOffset = this._measureInitialOffset();
        const translateY = -this._textarea.scrollTop + initialOffset;
        const translateX = -this._textarea.scrollLeft;

        // 水平同步也使用 translateX，与 translateY 保持一致
        // 统一由父容器 .editor-wrapper 的 overflow:hidden 裁剪
        this._syntaxOverlay.style.transform = `translateY(${translateY}px) translateX(${translateX}px)`;
    },

    /**
     * 测量 overlay 相对于 textarea 的初始偏移量
     * 通过比较两个元素第一行文本的实际渲染位置
     * @private
     * @returns {number} 偏移量（正数表示 overlay 需要向上移动）
     */
    _measureInitialOffset() {
        if (!this._textarea || !this._syntaxOverlay) return 0;

        // 使用缓存，只在首次调用或内容变化时重新测量
        if (this._cachedInitialOffset !== undefined) return this._cachedInitialOffset;

        // 保存当前滚动位置
        const savedScrollTop = this._textarea.scrollTop;
        const savedScrollLeft = this._textarea.scrollLeft;

        // 滚动到顶部以测量初始偏移
        this._textarea.scrollTop = 0;
        this._textarea.scrollLeft = 0;
        void this._textarea.offsetHeight;

        // 创建测量元素，复制 textarea 的样式
        const measureTextarea = document.createElement('div');
        const textareaCS = getComputedStyle(this._textarea);
        measureTextarea.style.cssText = `
            position: fixed;
            left: -9999px;
            top: 0;
            visibility: hidden;
            pointer-events: none;
            padding: ${textareaCS.paddingTop} ${textareaCS.paddingRight} ${textareaCS.paddingBottom} ${textareaCS.paddingLeft};
            margin: 0;
            border: none;
            box-sizing: border-box;
            width: ${this._textarea.clientWidth}px;
            font-family: ${textareaCS.fontFamily};
            font-size: ${textareaCS.fontSize};
            line-height: ${textareaCS.lineHeight};
            white-space: pre;
            overflow-wrap: normal;
            letter-spacing: normal;
            word-spacing: 0;
            font-kerning: none;
            font-variant-ligatures: none;
            text-rendering: auto;
        `;
        measureTextarea.textContent = 'X';
        document.body.appendChild(measureTextarea);

        // 创建测量元素，复制 overlay 的样式
        const measureOverlay = document.createElement('pre');
        const overlayCS = getComputedStyle(this._syntaxOverlay);
        measureOverlay.style.cssText = `
            position: fixed;
            left: -9999px;
            top: 0;
            visibility: hidden;
            pointer-events: none;
            padding: ${overlayCS.paddingTop} ${overlayCS.paddingRight} ${overlayCS.paddingBottom} ${overlayCS.paddingLeft};
            margin: 0;
            border: none;
            box-sizing: border-box;
            width: ${this._syntaxOverlay.clientWidth}px;
            font-family: ${overlayCS.fontFamily};
            font-size: ${overlayCS.fontSize};
            line-height: ${overlayCS.lineHeight};
            white-space: pre;
            overflow-wrap: normal;
            letter-spacing: normal;
            word-spacing: 0;
            font-kerning: none;
            font-variant-ligatures: none;
            text-rendering: auto;
        `;
        measureOverlay.textContent = 'X';
        document.body.appendChild(measureOverlay);

        // 强制重排后测量第一行位置
        void measureTextarea.offsetHeight;
        void measureOverlay.offsetHeight;

        const textareaFirstLineTop = measureTextarea.getBoundingClientRect().top;
        const overlayFirstLineTop = measureOverlay.getBoundingClientRect().top;

        // 清理测量元素
        document.body.removeChild(measureTextarea);
        document.body.removeChild(measureOverlay);

        // 恢复滚动位置
        this._textarea.scrollTop = savedScrollTop;
        this._textarea.scrollLeft = savedScrollLeft;

        // 计算偏移量：overlay 需要移动的距离
        const offset = textareaFirstLineTop - overlayFirstLineTop;
        this._cachedInitialOffset = offset;
        return offset;
    },

    /**
     * 构建高亮HTML
     * 收集所有规则的匹配，按位置排序，解决重叠，生成带颜色的HTML
     * @private
     * @param {string} text - 原始文本
     * @param {Array} rules - 语法规则数组
     * @returns {string} 高亮后的HTML
     */
    _buildHighlightedHtml(text, rules) {
        // 收集所有匹配
        const allMatches = [];
        for (const rule of rules) {
            if (!rule.color || !rule.type) continue;
            const pattern = this._getRulePattern(rule);
            if (!pattern) continue;
            try {
                const regex = new RegExp(pattern, 'g');
                let match;
                while ((match = regex.exec(text)) !== null) {
                    if (match[0].length === 0) { regex.lastIndex++; continue; }
                    allMatches.push({
                        start: match.index,
                        end: match.index + match[0].length,
                        color: rule.color
                    });
                    if (regex.lastIndex === match.index) { regex.lastIndex++; }
                }
            } catch (e) { /* 跳过无效正则 */ }
        }

        // 按起始位置排序，起始相同则按长度降序（长匹配优先）
        allMatches.sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));

        // 解决重叠：先出现的规则优先
        const resolved = [];
        let lastEnd = 0;
        for (const m of allMatches) {
            if (m.start >= lastEnd) {
                resolved.push(m);
                lastEnd = m.end;
            }
        }

        // 构建HTML
        let html = '';
        let pos = 0;
        for (const m of resolved) {
            if (m.start > pos) {
                html += this._escapeHtml(text.substring(pos, m.start));
            }
            html += `<span style="color:${this._escapeHtml(m.color)}">${this._escapeHtml(text.substring(m.start, m.end))}</span>`;
            pos = m.end;
        }
        if (pos < text.length) {
            html += this._escapeHtml(text.substring(pos));
        }
        return html;
    },

    /**
     * 根据规则类型获取正则表达式字符串
     * @private
     * @param {Object} rule - 语法规则
     * @returns {string|null} 正则表达式字符串
     */
    _getRulePattern(rule) {
        switch (rule.type) {
            case 'number':
                return '\\d+\\.?\\d*';
            case 'double_quote':
                return '"[^"]*"';
            case 'single_quote':
                return "'[^']*'";
            case 'custom':
                return rule.pattern || null;
            default:
                return null;
        }
    },

    /**
     * 外部调用：刷新语法规则并重新高亮
     */
    refreshSyntaxRules() {
        this._syntaxRules = StorageService.load('syntax', []);
        this._updateSyntaxHighlighting();
    }

});