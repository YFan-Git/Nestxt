// ============================================
// 文档数据 - Nestxt 使用文档
// ============================================

const DOCS = [
    { id: 'intro',               title: '简介',               h2: false },
    { id: 'getting-started',     title: '快速开始',           h2: false },
    { id: 'start-server',        title: '启动方式',           h2: true, parent: 'getting-started' },
    { id: 'open-browser',        title: '在浏览器中访问',     h2: true, parent: 'getting-started' },
    { id: 'pc-desktop',          title: 'PC 桌面版',          h2: false },
    { id: 'pc-overview',         title: '概述',               h2: true, parent: 'pc-desktop' },
    { id: 'pc-launch',           title: '启动方式',           h2: true, parent: 'pc-desktop' },
    { id: 'pc-window',           title: '桌面窗口',           h2: true, parent: 'pc-desktop' },
    { id: 'pc-api',              title: 'Python API 桥接',    h2: true, parent: 'pc-desktop' },
    { id: 'pc-file-dialog',      title: '原生文件对话框',     h2: true, parent: 'pc-desktop' },
    { id: 'pc-clipboard',        title: '系统剪贴板',         h2: true, parent: 'pc-desktop' },
    { id: 'pc-storage',          title: '本地数据存储',       h2: true, parent: 'pc-desktop' },
    { id: 'pc-singleton',        title: '单实例保护',         h2: true, parent: 'pc-desktop' },
    { id: 'file-management',     title: '文件管理',           h2: false },
    { id: 'create-file',         title: '新建文件/文件夹',    h2: true, parent: 'file-management' },
    { id: 'rename',              title: '重命名',             h2: true, parent: 'file-management' },
    { id: 'delete-restore',      title: '删除与恢复',         h2: true, parent: 'file-management' },
    { id: 'import-export',       title: '导入与导出',         h2: true, parent: 'file-management' },
    { id: 'encoding',            title: '编码识别与转换',     h2: false },
    { id: 'encoding-auto',       title: '自动编码检测',       h2: true, parent: 'encoding' },
    { id: 'encoding-switch',     title: '手动切换编码',       h2: true, parent: 'encoding' },
    { id: 'multi-tab',           title: '多标签编辑',         h2: false },
    { id: 'editor',              title: '编辑器',             h2: false },
    { id: 'line-numbers',        title: '行号',               h2: true, parent: 'editor' },
    { id: 'word-wrap',           title: '自动换行',           h2: true, parent: 'editor' },
    { id: 'font-size',           title: '字号调节',           h2: true, parent: 'editor' },
    { id: 'syntax-highlight',    title: '语法高亮',           h2: true, parent: 'editor' },
    { id: 'version-management',  title: '版本管理',           h2: false },
    { id: 'save-version',        title: '保存版本',           h2: true, parent: 'version-management' },
    { id: 'switch-version',      title: '切换版本',           h2: true, parent: 'version-management' },
    { id: 'rename-version',      title: '重命名版本',         h2: true, parent: 'version-management' },
    { id: 'trash',               title: '回收站',             h2: false },
    { id: 'search',              title: '搜索',               h2: false },
    { id: 'theme',               title: '主题切换',           h2: false },
    { id: 'autosave',            title: '自动保存',           h2: false },
    { id: 'statusbar',           title: '状态栏',             h2: false },
    { id: 'settings',            title: '设置菜单',           h2: false },
    { id: 'data-backup',         title: '数据备份与恢复',     h2: true, parent: 'settings' },
    { id: 'tree-view',           title: '树图可视化',         h2: false },
    { id: 'drag-support',        title: '拖拽支持',           h2: false },
    { id: 'shortcuts',           title: '快捷键',             h2: false },
    { id: 'project-structure',   title: '项目结构',           h2: false },
    { id: 'tech-stack',          title: '技术栈',             h2: false },
    { id: 'requirements',        title: '系统要求',           h2: false },
    { id: 'about',               title: '关于作者',           h2: false },
];

const CONTENT = {
    intro: `
        <h1>Nestxt 文本编辑器</h1>
        <p>一款简洁、高效的文本编辑器，支持<strong>文件夹管理</strong>、<strong>多标签编辑</strong>、<strong>版本控制</strong>、<strong>语法高亮</strong>、<strong>智能编码识别</strong>等功能。</p>
        <p>提供两种使用方式：</p>
        <ul>
            <li><strong>PC 桌面版</strong> — 运行 <code>Nestxt.exe</code> 即可使用，支持原生文件对话框、系统剪贴板、本地数据存储</li>
            <li><strong>网页版</strong> — 访问 <a href="https://nestxt-web-yfan.netlify.app/" target="_blank">nestxt-web-yfan.netlify.app</a>，无需安装，数据存储在浏览器 localStorage</li>
        </ul>
    `,

    'getting-started': `
        <h2>快速开始</h2>
        <p>Nestxt 提供两种使用方式，无需安装任何依赖：</p>
        <ul>
            <li><strong>PC 桌面版</strong> — 直接运行 <code>Nestxt_PC\\Nestxt.exe</code> 即可启动</li>
            <li><strong>网页版</strong> — 访问 <a href="https://nestxt-web-yfan.netlify.app/" target="_blank">https://nestxt-web-yfan.netlify.app/</a></li>
        </ul>
    `,

    'start-server': `
        <h3>启动方式</h3>
        <h4>PC 桌面版（推荐）</h4>
        <p>直接运行 <code>Nestxt_PC\\Nestxt.exe</code> 即可启动桌面应用。</p>
        <ul>
            <li>支持原生文件对话框（保存/导入）</li>
            <li>支持系统剪贴板集成</li>
            <li>数据存储在本地文件，不会丢失</li>
        </ul>
        <h4>网页版</h4>
        <p>访问在线地址：<a href="https://nestxt-web-yfan.netlify.app/" target="_blank">https://nestxt-web-yfan.netlify.app/</a></p>
        <p>或使用本地服务器：</p>
        <pre><code>python -m http.server 8080</code></pre>
        <p>然后访问 <code>http://localhost:8080</code></p>
        <blockquote><strong>注意：</strong>网页版数据存储在浏览器 <code>localStorage</code> 中，清除浏览器数据会导致内容丢失。建议使用 PC 桌面版或定期导出备份。</blockquote>
    `,

    'open-browser': `
        <h3>在浏览器中访问</h3>
        <p>打开现代浏览器（Chrome / Firefox / Edge / Safari 等），访问：</p>
        <pre><code>https://nestxt-web-yfan.netlify.app/</code></pre>
        <p>即可进入 Nestxt 编辑器主界面。</p>
        <p>如需本地运行，直接打开 <code>index.html</code> 文件，或启动本地服务器后访问 <code>http://localhost:8080</code>。</p>
    `,

    'pc-desktop': `
        <h2>PC 桌面版</h2>
        <p>除了浏览器版本，Nestxt 还提供基于 <strong>pywebview</strong> 的 PC 桌面版，将前端界面嵌入原生桌面窗口中，提供更接近本地应用的体验。</p>
    `,

    'pc-overview': `
        <h3>概述</h3>
        <p>PC 桌面版通过 <strong>Python + pywebview</strong> 技术栈，将 Nestxt 前端界面包装为独立的桌面应用程序。与浏览器版本相比，PC 桌面版具有以下优势：</p>
        <ul>
            <li><strong>原生桌面窗口</strong> — 独立的应用窗口，支持自定义图标、最小尺寸限制</li>
            <li><strong>原生文件对话框</strong> — 导入/导出文件时使用系统原生对话框，体验更自然</li>
            <li><strong>系统剪贴板集成</strong> — 支持通过 Python API 读写系统剪贴板</li>
            <li><strong>本地数据存储</strong> — 数据通过 Python 存储引擎持久化到本地文件</li>
            <li><strong>单实例保护</strong> — 防止重复启动，同一时间只运行一个实例</li>
        </ul>
        <p>PC 桌面版与浏览器版共享同一套前端代码（HTML / CSS / JS），功能完全一致，仅在文件操作和存储方式上有所增强。</p>
    `,

    'pc-launch': `
        <h3>启动方式</h3>
        <p>PC 桌面版通过项目根目录下的 <code>Auto.bat</code> 一键启动，或手动执行：</p>
        <pre><code>cd py
python app.py</code></pre>
        <p>启动流程如下：</p>
        <ol>
            <li><strong>单实例检查</strong> — 通过系统互斥量（Mutex）检测是否已有实例运行，防止重复启动</li>
            <li><strong>验证前端文件</strong> — 检查 <code>Web/index.html</code> 是否存在</li>
            <li><strong>创建 API 实例</strong> — 初始化 Python API 桥接对象</li>
            <li><strong>创建桌面窗口</strong> — 通过 pywebview 创建窗口并加载前端页面</li>
            <li><strong>启动事件循环</strong> — 进入 pywebview 事件循环，窗口开始响应交互</li>
        </ol>
        <blockquote><strong>环境要求：</strong>需要安装 Python 3.x 以及 <code>pywebview</code>、<code>pywin32</code> 依赖包。</blockquote>
    `,

    'pc-window': `
        <h3>桌面窗口</h3>
        <p>PC 桌面版通过 pywebview 创建原生桌面窗口，具备以下特性：</p>
        <ul>
            <li><strong>窗口标题</strong> — 显示为「Nestxt」</li>
            <li><strong>窗口尺寸</strong> — 默认宽度和高度可配置，支持自由缩放</li>
            <li><strong>最小尺寸限制</strong> — 防止窗口缩得过小影响使用</li>
            <li><strong>窗口图标</strong> — 加载完成后自动设置应用图标（通过 Win32 API）</li>
            <li><strong>背景色</strong> — 窗口加载前显示预设背景色，避免白屏闪烁</li>
        </ul>
        <p>窗口关闭时会自动释放单实例互斥量，确保下次可以正常启动。</p>
    `,

    'pc-api': `
        <h3>Python API 桥接</h3>
        <p>PC 桌面版通过 pywebview 的 <code>js_api</code> 机制，将 Python 方法暴露给前端 JavaScript 调用。前端通过 <code>pywebview.api.方法名()</code> 即可调用 Python 功能。</p>

        <h4>存储 API</h4>
        <table>
            <thead>
                <tr><th>方法</th><th>说明</th></tr>
            </thead>
            <tbody>
                <tr><td><code>setItem(key, value)</code></td><td>存储数据到本地</td></tr>
                <tr><td><code>getItem(key)</code></td><td>读取本地数据</td></tr>
                <tr><td><code>removeItem(key)</code></td><td>删除指定数据</td></tr>
                <tr><td><code>clear()</code></td><td>清空所有数据</td></tr>
            </tbody>
        </table>

        <h4>文件操作 API</h4>
        <table>
            <thead>
                <tr><th>方法</th><th>说明</th></tr>
            </thead>
            <tbody>
                <tr><td><code>saveFile(content, name)</code></td><td>弹出保存对话框，将内容写入文件</td></tr>
                <tr><td><code>importFile()</code></td><td>弹出打开对话框，读取文件内容</td></tr>
            </tbody>
        </table>

        <h4>工具 API</h4>
        <table>
            <thead>
                <tr><th>方法</th><th>说明</th></tr>
            </thead>
            <tbody>
                <tr><td><code>ping()</code></td><td>测试 API 桥接是否正常（返回 "pong"）</td></tr>
                <tr><td><code>debugLog(msg)</code></td><td>将前端日志输出到 Python 终端</td></tr>
                <tr><td><code>clipboardCopy(text)</code></td><td>复制文本到系统剪贴板</td></tr>
                <tr><td><code>clipboardPaste()</code></td><td>从系统剪贴板获取文本</td></tr>
            </tbody>
        </table>

        <p>前端在启动时会监听 <code>pywebviewready</code> 事件，确认 pywebview 环境就绪后才初始化桌面相关功能。</p>
    `,

    'pc-file-dialog': `
        <h3>原生文件对话框</h3>
        <p>PC 桌面版的文件导入和导出使用<strong>系统原生文件对话框</strong>，而非浏览器内置的对话框：</p>

        <h4>导出文件</h4>
        <ul>
            <li>点击工具栏「导出」按钮或设置菜单中的「导出用户数据」</li>
            <li>弹出系统「另存为」对话框，可自由选择保存路径和文件名</li>
            <li>支持 <code>.txt</code> 和 <code>.json</code> 两种文件类型筛选</li>
            <li>文件以 UTF-8 编码写入磁盘</li>
        </ul>

        <h4>导入文件</h4>
        <ul>
            <li>点击工具栏「导入」按钮</li>
            <li>弹出系统「打开文件」对话框，浏览并选择文件</li>
            <li>支持多种文本格式：<code>.txt</code>、<code>.csv</code>、<code>.log</code>、<code>.json</code>、<code>.xml</code>、<code>.html</code>、<code>.css</code>、<code>.js</code>、<code>.py</code>、<code>.c</code>、<code>.cpp</code>、<code>.bat</code>、<code>.cmd</code> 等</li>
            <li>自动尝试多种编码（UTF-8 → GBK → GB2312 → Latin-1）读取文件内容</li>
        </ul>

        <blockquote><strong>与浏览器版的区别：</strong>浏览器版使用 File System Access API 或传统下载方式，PC 桌面版直接使用系统原生对话框，体验更流畅、更可靠。</blockquote>
    `,

    'pc-clipboard': `
        <h3>系统剪贴板</h3>
        <p>PC 桌面版通过 Python API 与系统剪贴板集成，支持：</p>
        <ul>
            <li><strong>复制到剪贴板</strong> — 将文本内容写入系统剪贴板，可在其他应用中粘贴</li>
            <li><strong>从剪贴板粘贴</strong> — 读取系统剪贴板中的文本内容</li>
        </ul>
        <p>剪贴板操作通过 <code>clipboardCopy()</code> 和 <code>clipboardPaste()</code> API 实现，前端在检测到 pywebview 环境时会自动优先使用系统剪贴板能力。</p>
    `,

    'pc-storage': `
        <h3>本地数据存储</h3>
        <p>PC 桌面版使用 Python 存储引擎（<code>StorageEngine</code>）将数据持久化到本地文件系统，替代浏览器版的 <code>localStorage</code>。</p>
        <ul>
            <li>数据以键值对形式存储在本地文件中</li>
            <li>前端通过 <code>pywebview.api.setItem()</code> / <code>getItem()</code> 读写数据</li>
            <li>所有业务数据（文件夹、文件、标签页、设置等）均通过此机制持久化</li>
            <li>数据不会因浏览器缓存清理而丢失</li>
        </ul>
        <blockquote><strong>提示：</strong>PC 桌面版的数据独立于浏览器版，两者互不影响。如需在浏览器版和 PC 版之间迁移数据，可使用「导出/导入用户数据」功能。</blockquote>
    `,

    'pc-singleton': `
        <h3>单实例保护</h3>
        <p>PC 桌面版内置单实例检测机制，防止用户重复启动应用导致数据冲突：</p>
        <ul>
            <li>启动时通过 Windows <strong>互斥量（Mutex）</strong>检测是否已有实例运行</li>
            <li>如果检测到已有实例，新进程自动退出，不会打开第二个窗口</li>
            <li>窗口关闭时自动释放互斥量，确保下次可以正常启动</li>
        </ul>
        <p>该机制通过 <code>py/core/singleton.py</code> 模块实现，使用 Win32 API 创建系统级互斥量。</p>
    `,

    'file-management': `
        <h2>文件管理</h2>
        <p>Nestxt 的侧边栏提供了完整的文件管理功能，支持以<strong>树形结构</strong>浏览和管理文件与文件夹。</p>
        <p>侧边栏支持<strong>拖拽调整宽度</strong>，拖拽侧边栏右侧的分隔线即可调整（最小 200px，最大 500px）。</p>
        <ul>
            <li><strong>文件选中</strong> — 点击文件时高亮显示蓝色选中框</li>
            <li><strong>文件夹选中</strong> — 点击文件夹同样高亮显示，与文件选中样式一致</li>
            <li><strong>互斥逻辑</strong> — 文件和文件夹只能有一个高亮，选中文件时文件夹不高亮，反之亦然</li>
            <li><strong>标签联动</strong> — 点击顶部标签页时，文件树自动定位并高亮对应的文件</li>
        </ul>
    `,

    'create-file': `
        <h3>新建文件 / 文件夹</h3>
        <p>在侧边栏顶部有两个快捷按钮：</p>
        <ul>
            <li><strong>新建文件</strong> — 创建空白文本文件，自动进入重命名状态（默认后缀 <code>.txt</code>）</li>
            <li><strong>新建文件夹</strong> — 创建新文件夹，用于组织文件</li>
        </ul>
        <p>也可以在当前选中的文件夹下创建：先点击选中一个文件夹，再点击新建按钮，文件会自动创建在该文件夹内。</p>
    `,

    rename: `
        <h3>重命名</h3>
        <p>在侧边栏中<strong>右键点击</strong>文件或文件夹，在弹出的菜单中选择「重命名」，输入新名称后确认即可。</p>
        <p>文件重命名时，扩展名（如 <code>.txt</code>、<code>.json</code> 等）会自动保留，无需手动输入。</p>
        <p>也可以使用快捷键 <code>F2</code> 快速重命名当前选中的文件或文件夹。</p>
    `,

    'delete-restore': `
        <h3>删除与恢复</h3>
        <p>右键点击文件或文件夹，选择「删除」：</p>
        <ul>
            <li>文件被移入<strong>回收站</strong>，可在回收站中恢复或永久删除</li>
            <li>删除文件夹时，其包含的所有子文件也会一并移入回收站</li>
            <li>回收站中支持<strong>恢复</strong>、<strong>永久删除</strong>、<strong>清空回收站</strong>三种操作</li>
        </ul>
        <p>侧边栏底部的回收站图标会显示当前回收站中的项目数量徽章。</p>
    `,

    'import-export': `
        <h3>导入与导出</h3>
        <p><strong>导入文件：</strong></p>
        <ul>
            <li>点击编辑工具栏的 <strong>导入</strong> 按钮（或快捷键 <code>Ctrl+O</code>）</li>
            <li>或将文件直接<strong>拖拽</strong>到编辑区域</li>
            <li>支持多种纯文本格式：<code>.txt</code>、<code>.csv</code>、<code>.log</code>、<code>.ini</code>、<code>.json</code>、<code>.xml</code>、<code>.html</code>、<code>.css</code>、<code>.js</code>、<code>.py</code>、<code>.c</code>、<code>.cpp</code>、<code>.bat</code>、<code>.cmd</code></li>
            <li>支持 <strong>智能编码检测</strong>：自动识别 UTF-8、GBK、GB2312、Big5 编码，中文内容不会乱码</li>
            <li>导入对话框支持"所有文件"选项，可强制打开无后缀或非常见后缀的文本文件</li>
        </ul>
        <p><strong>导出文件：</strong></p>
        <ul>
            <li>先打开要导出的文件，点击工具栏 <strong>导出</strong> 按钮</li>
            <li>支持 <strong>File System Access API</strong> 的浏览器会弹出保存对话框，可自定义保存路径</li>
            <li>不支持的浏览器（如 Firefox）会回退到传统下载方式</li>
            <li>导出内容反映编辑器当前显示的内容（包括切换版本后的内容）</li>
        </ul>
        <p><strong>复制副本：</strong></p>
        <ul>
            <li>右键点击文件，在菜单中选择「复制副本」</li>
            <li>副本文件会自动创建在同一文件夹下，名称格式为「原文件名_副本.后缀」</li>
            <li>如果已存在同名副本，系统会自动添加序号（如「原文件名_副本1.后缀」）</li>
            <li>副本创建完成后自动在标签页中打开</li>
        </ul>
    `,

    encoding: `
        <h2>编码识别与转换</h2>
        <p>Nestxt 内置智能编码识别功能，支持多种文本编码格式的自动检测与手动切换，确保打开任何编码的文本文件都不会出现乱码。</p>
    `,

    'encoding-auto': `
        <h3>自动编码检测</h3>
        <p>导入或拖拽文件时，系统会自动检测文件编码，检测顺序如下：</p>
        <ol>
            <li><strong>BOM 检测</strong> — 如果文件包含 UTF-8 BOM（<code>EF BB BF</code>）或 UTF-16 BOM，自动识别对应编码</li>
            <li><strong>UTF-8 字节验证</strong> — 逐字节验证是否符合 UTF-8 编码规则（包括多字节序列的合法性检查）</li>
            <li><strong>GBK 回退</strong> — UTF-8 验证失败时，自动尝试 GBK 解码</li>
        </ol>
        <p>检测到的编码会显示在<strong>底部状态栏</strong>右侧，方便确认。如果是二进制文件（非可打印字符占比超过 30%），系统会弹出警告提示，由用户决定是否继续打开。</p>
        <p>文件的原始字节会被缓存，用于后续手动切换编码时重新解码，不会丢失内容。</p>
    `,

    'encoding-switch': `
        <h3>手动切换编码</h3>
        <p>如果自动检测的编码不正确，您可以手动切换：</p>
        <ul>
            <li><strong>方式一</strong> — 点击底部状态栏的编码标识（如 <code>UTF-8</code>），弹出编码选择菜单</li>
            <li><strong>方式二</strong> — 进入「设置 → 编码设置」，选择目标编码</li>
        </ul>
        <p>切换编码时，系统会使用文件的<strong>原始字节</strong>重新解码，不会丢失内容。支持的编码包括：</p>
        <ul>
            <li><code>UTF-8</code> — 国际通用编码，默认选项</li>
            <li><code>GBK</code> — 简体中文编码</li>
            <li><code>GB2312</code> — 简体中文编码（GBK 子集）</li>
            <li><code>Big5</code> — 繁体中文编码</li>
        </ul>
        <blockquote><strong>提示：</strong>切换编码后，编辑器内容会实时更新。如果切换后仍然乱码，说明文件可能使用了其他编码。</blockquote>
    `,

    'multi-tab': `
        <h2>多标签编辑</h2>
        <p>Nestxt 支持同时打开多个文件，以标签页形式管理（最多 <strong>10 个</strong>）：</p>
        <ul>
            <li>点击侧边栏中的文件名即可在标签页中打开</li>
            <li>标签页支持 <strong>切换</strong>、<strong>关闭</strong>（点击 <code>✕</code>）</li>
            <li>当标签过多时，标签栏支持<strong>水平滚动</strong>，左右滑动即可查看所有标签</li>
            <li>标签页支持<strong>拖拽排序</strong>，可自由调整标签顺序</li>
            <li>标签数量实时显示在底部状态栏</li>
            <li>快捷键 <code>Ctrl+W</code> 可快速关闭当前标签页</li>
            <li>关闭所有标签页后，编辑器显示空状态提示</li>
        </ul>
    `,

    editor: `
        <h2>编辑器</h2>
        <p>Nestxt 的核心编辑器基于原生 <code>&lt;textarea&gt;</code> 构建，配合 <code>&lt;pre&gt;</code> 语法高亮叠加层，提供了多项实用的编辑功能。</p>
        <p>编辑器底部有<strong>版本信息栏</strong>，显示当前编辑的文件名/版本名和最后编辑时间。</p>
        <p>编辑器支持以下交互：</p>
        <ul>
            <li><strong>Tab 缩进</strong> — 按 <code>Tab</code> 键插入 2 个空格，<code>Shift+Backspace</code> 删除 2 个空格</li>
            <li><strong>Enter 自动缩进</strong> — 回车自动继承上一行的缩进级别</li>
            <li><strong>右键菜单</strong> — 在编辑区域右键点击，提供全选、复制、剪切、粘贴等快捷操作</li>
            <li><strong>空状态快捷新建</strong> — 点击空状态提示区域的图标可快速新建文件</li>
        </ul>
    `,

    'line-numbers': `
        <h3>行号</h3>
        <p>编辑器左侧默认显示行号。点击底部状态栏的 <code>行号: 开/关</code> 可以随时切换行号的显示状态。</p>
        <p>行号与文本内容通过 CSS <code>translate</code> 同步滚动，确保始终对齐。行号高度计算使用精确的视觉行数 × 行高（浮点值），避免累积对齐误差。</p>
    `,

    'word-wrap': `
        <h3>自动换行</h3>
        <p>点击底部状态栏的 <code>自动换行: 开/关</code> 切换换行模式。开启后，长文本会自动换行显示，无需水平滚动。</p>
        <p>自动换行状态会同时应用到编辑器、语法高亮覆盖层和树图区域，保持一致的显示效果。</p>
    `,

    'font-size': `
        <h3>字号调节</h3>
        <p>通过工具栏的 <code>A−</code> 和 <code>A+</code> 按钮调节编辑器字号（范围 <strong>10px ~ 32px</strong>），当前字号会实时显示在两个按钮中间。</p>
    `,

    'syntax-highlight': `
        <h3>语法高亮</h3>
        <p>Nestxt 支持<strong>自定义语法高亮规则</strong>。通过设置菜单中的「语法高亮设置」可进行管理：</p>
        <ul>
            <li><strong>添加规则</strong> — 设置名称、匹配类型（数字/自定义正则）、高亮颜色（支持色板选择和手动输入 HEX 色值）</li>
            <li><strong>编辑规则</strong> — 修改已有规则的名称、类型或颜色</li>
            <li><strong>删除规则</strong> — 移除不需要的规则</li>
            <li><strong>恢复默认</strong> — 一键恢复内置的默认规则</li>
        </ul>
        <p>语法高亮设置窗口支持<strong>拖拽移动</strong>，方便在编辑时对照查看。</p>
        <p>点击底部状态栏的 <code>语法高亮: 开/关</code> 可快速开启或关闭语法高亮功能。</p>
        <p>内置默认规则包括：数字、双引号字符串、单引号字符串、【】内容、[]内容、#注释、Word单词等。</p>
        <blockquote><strong>性能提示：</strong>当高亮匹配总数超过 3000 个时，系统会自动降级为纯文本显示，避免浏览器 DOM 渲染失败。</blockquote>
    `,

    'version-management': `
        <h2>版本管理</h2>
        <p>Nestxt 的版本管理功能允许您为每个文件保存多个<strong>历史版本快照</strong>，方便回溯和比较。（最多 <strong>20 个版本</strong>）</p>
        <p>点击工具栏「版本」按钮，右侧会滑出版本管理面板。版本面板支持<strong>拖拽调整宽度</strong>，拖拽编辑器与版本面板之间的分隔线即可调整。</p>
    `,

    'save-version': `
        <h3>保存版本</h3>
        <p>在版本面板中：</p>
        <ol>
            <li>点击「保存当前版本」按钮</li>
            <li>在弹出的对话框中输入版本名称（如"初稿"、"修改后"）</li>
            <li>按 <code>Enter</code> 或点击「保存」确认</li>
        </ol>
        <p>保存的版本会作为<strong>不可变的快照</strong>存储在文件中，之后可以随时切换回任意版本。</p>
        <p>版本名称支持自定义，方便区分不同阶段的修改。</p>
    `,

    'switch-version': `
        <h3>切换版本</h3>
        <p>在版本面板中，点击版本条目左侧的<strong>勾选框</strong>即可切换到该版本：</p>
        <ul>
            <li><strong>默认版本</strong>（文件名）— 切换到文件的当前内容</li>
            <li><strong>已保存的版本</strong> — 切换到该历史版本的快照内容</li>
        </ul>
        <p>切换版本时会自动保存当前编辑内容，不会丢失未保存的修改。</p>
        <p>切换版本后，版本信息栏会显示当前正在编辑的版本名称，方便确认。</p>
    `,

    'rename-version': `
        <h3>重命名版本</h3>
        <p>在版本面板中，<strong>双击</strong>版本名称即可进入编辑状态。输入新名称后按 <code>Enter</code> 确认，或按 <code>Esc</code> 取消。</p>
        <p>默认版本（文件本身）不支持重命名。</p>
    `,

    trash: `
        <h2>回收站</h2>
        <p>回收站是删除操作的<strong>安全缓冲区</strong>，防止误删。删除的文件和文件夹不会立即从存储中抹除，而是移入回收站，您可以随时恢复或永久删除。</p>

        <h3>打开回收站</h3>
        <p>点击侧边栏底部的回收站按钮，打开回收站面板。侧边栏底部的徽章数字表示回收站中当前的项目数量。</p>

        <h3>回收站中的操作</h3>
        <ul>
            <li><strong>恢复文件</strong> — 点击文件条目旁的「恢复」按钮，文件将还原到<strong>原文件夹</strong>中的原始位置</li>
            <li><strong>恢复文件夹</strong> — 恢复文件夹时，其下的所有子文件也会一并还原到对应的新文件夹中</li>
            <li><strong>永久删除</strong> — 点击「永久删除」，该项目将从回收站中彻底移除，不可恢复</li>
            <li><strong>清空回收站</strong> — 点击「清空」按钮一键删除回收站中所有项目</li>
        </ul>

        <h3>数据结构</h3>
        <p>回收站中的每条记录包含以下信息：</p>
        <ul>
            <li><strong>类型</strong> — <code>file</code>（文件）或 <code>folder</code>（文件夹）</li>
            <li><strong>名称</strong> — 文件或文件夹的原始名称</li>
            <li><strong>原位置</strong> — 所属父文件夹 ID（恢复时回到原位）</li>
            <li><strong>删除时间</strong> — 精确到秒的时间戳</li>
            <li><strong>文件内容</strong> — 文件的内容文本（文件夹项目也包含其下所有子文件的内容）</li>
        </ul>
        <blockquote><strong>提示：</strong>删除文件夹时，其包含的所有子文件也会一并移入回收站并记录在文件夹条目中，恢复时自动还原所有子文件。</blockquote>
    `,

    search: `
        <h2>搜索</h2>
        <p>侧边栏内置搜索功能，支持按<strong>文件名</strong>和<strong>文件内容</strong>快速查找。</p>

        <h3>使用方式</h3>
        <ul>
            <li>快捷键 <code>Ctrl+F</code> 快速聚焦到搜索框</li>
            <li>直接点击搜索框输入关键词</li>
            <li>搜索采用<strong>防抖机制</strong>（300ms 延迟），输入完成后自动触发搜索</li>
            <li>按 <code>Esc</code> 键清空搜索内容并退出搜索</li>
        </ul>

        <h3>搜索结果</h3>
        <ul>
            <li>匹配结果会<strong>实时显示</strong>在搜索框下方，同时隐藏文件夹树并扩展搜索面板</li>
            <li>每个结果条目显示<strong>文件名</strong>、所在<strong>文件夹路径</strong>和<strong>匹配片段预览</strong></li>
            <li>文件名匹配标注为「文件名匹配」，内容匹配显示前后各 20 个字符的上下文片段</li>
            <li>点击结果条目<strong>直接打开</strong>对应文件到标签页</li>
            <li>清空搜索框后，搜索面板收缩，文件夹树自动恢复显示</li>
        </ul>
    `,

    theme: `
        <h2>主题切换</h2>
        <p>Nestxt 支持<strong>深色主题</strong>和<strong>浅色主题</strong>两种界面风格，默认使用<strong>浅色主题</strong>，满足不同环境下的使用需求。</p>

        <h3>切换方式</h3>
        <p>点击侧边栏底部的<strong>主题切换开关</strong>：</p>
        <ul>
            <li>太阳图标 — 当前为浅色主题，点击切换为深色主题</li>
            <li>月亮图标 — 当前为深色主题，点击切换为浅色主题</li>
        </ul>

        <h3>持久化记忆</h3>
        <ul>
            <li>当前选择的主题会<strong>自动保存</strong>到 localStorage</li>
            <li>下次打开页面时自动恢复上次使用的主题</li>
            <li>深色主题下所有图标自动切换为亮灰色</li>
        </ul>
    `,

    autosave: `
        <h2>自动保存</h2>
        <p>Nestxt 内置自动保存功能，无需手动频繁保存，避免意外丢失编辑内容。</p>

        <h3>工作方式</h3>
        <ul>
            <li>使用定时器按固定间隔自动保存当前编辑的文件</li>
            <li>仅在有<strong>激活的标签页</strong>时执行自动保存</li>
            <li>自动保存通过事件总线触发，完成时底部状态栏显示保存完成提示</li>
        </ul>

        <h3>保存间隔</h3>
        <p>默认每 <strong>30 秒</strong>自动保存一次。您可以通过设置菜单中的「自动保存设置」调整间隔：</p>
        <ul>
            <li>30 秒（默认）</li>
            <li>2 分钟（120 秒）</li>
            <li>5 分钟（300 秒）</li>
            <li>10 分钟（600 秒）</li>
        </ul>
        <p>修改间隔后自动保存服务会<strong>自动重启</strong>以应用新设置。</p>

        <h3>手动保存</h3>
        <p>除了自动保存，您也可以随时通过快捷键 <code>Ctrl+S</code> 或点击工具栏保存按钮手动保存当前文件。</p>
        <p>保存成功后，底部状态栏会短暂显示「√ 保存完成」提示，随后显示最后保存的时间。</p>
    `,

    statusbar: `
        <h2>状态栏</h2>
        <p>编辑器底部有一行状态栏，实时显示编辑器的各项状态信息：</p>

        <h3>状态栏信息项</h3>
        <table>
            <thead>
                <tr><th>信息项</th><th>说明</th></tr>
            </thead>
            <tbody>
                <tr><td>标签计数</td><td>显示当前打开的标签页数量（如「标签: 3」）</td></tr>
                <tr><td>字数统计</td><td>显示当前编辑器内容的字数（不含空白字符）</td></tr>
                <tr><td>编码显示</td><td>显示当前文件的编码格式（如「UTF-8」），点击可切换编码</td></tr>
                <tr><td>自动换行</td><td>显示自动换行开关状态，点击可切换</td></tr>
                <tr><td>行号</td><td>显示行号开关状态，点击可切换</td></tr>
                <tr><td>语法高亮</td><td>显示语法高亮开关状态，点击可切换</td></tr>
                <tr><td>保存状态</td><td>显示「已保存 HH:MM:SS」时间，保存成功时短暂显示「√ 保存完成」</td></tr>
            </tbody>
        </table>

        <h3>快捷切换</h3>
        <p>状态栏中的「自动换行」、「行号」、「语法高亮」、「编码」均可直接点击切换，无需进入设置菜单。</p>
    `,

    settings: `
        <h2>设置菜单</h2>
        <p>点击标题栏右侧的设置按钮，弹出设置菜单。菜单以下拉面板形式出现在按钮下方，点击其他区域不会关闭，需通过按钮或 <code>Esc</code> 键关闭。</p>
        <p>Nestxt 提供了以下设置选项：</p>

        <h3>菜单项列表</h3>
        <table>
            <thead>
                <tr><th>菜单项</th><th>功能说明</th></tr>
            </thead>
            <tbody>
                <tr><td>导出用户数据</td><td>将所有数据备份为 JSON 文件</td></tr>
                <tr><td>导入用户数据</td><td>从备份文件恢复数据</td></tr>
                <tr><td>自动保存设置</td><td>调整自动保存间隔</td></tr>
                <tr><td>语法高亮设置</td><td>自定义高亮规则（添加/编辑/删除/恢复默认）</td></tr>
                <tr><td>编码设置</td><td>切换当前文件的编码格式（UTF-8/GBK/GB2312/Big5）</td></tr>
                <tr><td>在线文档</td><td>打开使用说明书</td></tr>
                <tr><td>关于</td><td>查看版本和作者信息</td></tr>
            </tbody>
        </table>
    `,

    'data-backup': `
        <h3>数据备份与恢复</h3>

        <p><strong>导出用户数据：</strong></p>
        <p>导出功能会将以下数据打包为一个 JSON 文件：</p>
        <ul>
            <li><strong>文件夹结构</strong> — 所有文件夹及其层级关系</li>
            <li><strong>文件数据</strong> — 所有文件内容、名称、所属文件夹</li>
            <li><strong>回收站数据</strong> — 回收站中的所有项目</li>
            <li><strong>标签页状态</strong> — 当前打开的标签页列表</li>
            <li><strong>用户设置</strong> — 主题、字号、行号、自动换行、侧边栏宽度、版本面板宽度、自动保存间隔、语法高亮规则、版本编辑状态等</li>
            <li><strong>导出时间</strong> — 数据导出的时间戳</li>
        </ul>
        <p>导出文件名格式为 <code>nestxt_backup_YYYY-MM-DD.json</code>。支持 <strong>File System Access API</strong> 的浏览器会弹出保存对话框，可自定义保存路径；不支持的浏览器会回退到传统下载方式。</p>

        <p><strong>导入用户数据：</strong></p>
        <ul>
            <li>点击「导入用户数据」后，系统弹出文件选择对话框，仅接受 <code>.json</code> 文件</li>
            <li>导入时会<strong>验证数据格式</strong>，缺少 <code>folders</code> 或 <code>files</code> 字段会提示「无效的数据文件格式」</li>
            <li>有效数据会写入 localStorage，然后<strong>自动刷新</strong>所有服务和界面</li>
            <li>导入成功后侧边栏和标签页自动更新，无需手动刷新</li>
        </ul>
        <blockquote><strong>注意：</strong>导入操作会<strong>覆盖</strong>当前所有数据，建议在导入前先导出备份以防数据丢失。</blockquote>
    `,

    'tree-view': `
        <h2>树图可视化</h2>
        <p>点击工具栏「树图」按钮，可以在编辑区域下方以图形化方式展示文件夹结构。</p>
        <ul>
            <li>树图面板显示在编辑区域下方，支持<strong>拖拽调整高度</strong></li>
            <li>以<strong>树形缩进结构</strong>可视化呈现所有文件和文件夹的层级关系</li>
            <li>方便直观地了解项目的整体组织架构</li>
            <li>支持<strong>复制</strong>和<strong>下载</strong>树图结构文本</li>
            <li>支持<strong>自动换行</strong>切换，长文件名可换行显示</li>
            <li>树图内容随编辑器内容<strong>实时更新</strong>，编辑时自动刷新</li>
            <li>树图区域支持右键菜单，提供全选和复制功能</li>
        </ul>
    `,

    'drag-support': `
        <h2>拖拽支持</h2>
        <p>Nestxt 提供了丰富的拖拽交互，提升操作效率：</p>

        <h3>在文件夹间拖拽移动文件/文件夹</h3>
        <ul>
            <li><strong>拖拽文件</strong> — 将文件拖拽到目标文件夹上即可移动，支持拖拽到侧边栏空白区域移回<strong>根目录</strong></li>
            <li><strong>拖拽文件夹</strong> — 文件夹同样支持拖拽移动，可拖入其他文件夹成为子级，或拖到侧边栏空白区域移回<strong>根目录</strong></li>
            <li>拖拽到文件夹上时，目标文件夹会显示<strong>高亮虚线边框 + 背景色</strong>；拖到侧边栏空白区域（根目录）同样有视觉反馈</li>
            <li>文件夹图标区域、文件图标区域均可拖拽</li>
            <li>释放后自动移动，侧边栏实时刷新，目标文件夹自动展开</li>
        </ul>

        <h3>标签页与文件树联动</h3>
        <ul>
            <li>点击顶部标签栏的 txt 文本标签时，侧边栏文件树<strong>自动同步选中</strong>对应的文件</li>
            <li>文件所在的所有祖先文件夹<strong>自动展开</strong>，确保文件在树中可见</li>
        </ul>

        <h3>从外部导入文本文件</h3>
        <ul>
            <li>将支持的文本文件从系统<strong>直接拖入</strong>编辑区域</li>
            <li>支持格式：<code>.txt</code>、<code>.csv</code>、<code>.log</code>、<code>.ini</code>、<code>.json</code>、<code>.xml</code>、<code>.html</code>、<code>.css</code>、<code>.js</code>、<code>.py</code>、<code>.c</code>、<code>.cpp</code>、<code>.bat</code>、<code>.cmd</code></li>
            <li>拖入时编辑区域显示<strong>拖拽悬停效果</strong></li>
            <li>释放后自动读取文件内容并创建为新文件</li>
            <li>创建完成后自动在新标签页中打开</li>
            <li>支持同时拖入多个文件</li>
            <li>自动检测文件编码（UTF-8 / GBK / Big5），中文不会乱码</li>
        </ul>

        <h3>调整面板宽度</h3>
        <ul>
            <li><strong>侧边栏宽度</strong> — 拖拽侧边栏右侧的分隔线调整</li>
            <li><strong>版本面板宽度</strong> — 拖拽编辑器与版本面板之间的分隔线调整</li>
            <li><strong>树图面板高度</strong> — 拖拽树图面板上方的分隔线调整</li>
        </ul>
    `,

    shortcuts: `
        <h2>快捷键</h2>
        <p>Nestxt 提供以下键盘快捷键，帮助您快速完成常用操作：</p>
        <table>
            <thead>
                <tr><th>快捷键</th><th>功能</th></tr>
            </thead>
            <tbody>
                <tr><td><code>Ctrl+N</code></td><td>新建文件</td></tr>
                <tr><td><code>Ctrl+O</code></td><td>导入文件（支持多格式）</td></tr>
                <tr><td><code>Ctrl+S</code></td><td>保存当前文件（手动保存）</td></tr>
                <tr><td><code>Ctrl+W</code></td><td>关闭当前标签页</td></tr>
                <tr><td><code>Ctrl+F</code></td><td>聚焦到侧边栏搜索框</td></tr>
                <tr><td><code>F2</code></td><td>重命名当前选中的文件或文件夹</td></tr>
                <tr><td><code>Esc</code></td><td>关闭右键菜单 / 弹窗 / 清除搜索框</td></tr>
                <tr><td><code>Tab</code></td><td>在编辑器中插入 2 个空格（缩进）</td></tr>
                <tr><td><code>Shift+Backspace</code></td><td>删除光标前的 2 个空格（反向缩进）</td></tr>
            </tbody>
        </table>
    `,

    'project-structure': `
        <h2>项目结构</h2>
        <pre><code>Nestxt_PC/
├── Auto.bat                # 一键启动脚本（PC 桌面版）
├── py/                     # PC 桌面版 Python 后端
│   ├── app.py              # 主入口（创建窗口、注入 API、启动事件循环）
│   ├── config.py           # 窗口配置（标题、尺寸、图标等）
│   ├── core/
│   │   ├── api.py          # Python API 接口（存储/文件/剪贴板）
│   │   ├── window.py       # 窗口管理（创建窗口、设置图标）
│   │   └── singleton.py    # 单实例保护（Mutex 互斥量）
│   └── utils/
│       ├── file_utils.py       # 文件操作（保存/导入对话框）
│       ├── clipboard_utils.py  # 系统剪贴板读写
│       └── resource_utils.py   # 资源路径解析
├── Web/                    # 前端（浏览器版和 PC 版共用）
│   ├── index.html          # 前端主页面
│   ├── docs.html           # 在线文档入口
│   ├── icon/               # 图标资源
│   │   ├── UI/             # 界面图标（PNG）
│   │   ├── Title/          # 标题栏 Logo
│   │   └── check/          # 勾选框图标
│   ├── font/               # 字体文件
│   │   └── vivoSans-Regular.ttf
│   ├── css/
│   │   ├── base.css        # CSS 变量 + 全局重置 + 字体
│   │   ├── layout.css      # 标题栏 + 侧边栏 + 回收站
│   │   ├── tree.css        # 文件树
│   │   ├── tabs.css        # 标签页栏
│   │   ├── editor.css      # 编辑器 + 工具栏
│   │   ├── syntax-ui.css   # 语法高亮设置 UI
│   │   ├── version.css     # 版本管理面板
│   │   ├── search.css      # 搜索面板
│   │   ├── dialogs.css     # 右键菜单 + 弹窗
│   │   └── treeview.css    # 树图可视化
│   ├── docs/
│   │   ├── index.html      # 在线文档
│   │   ├── style.css       # 文档样式
│   │   ├── content.js      # 文档内容
│   │   └── script.js       # 文档交互逻辑
│   └── js/
│       ├── app.js          # 应用入口
│       ├── app/
│       │   ├── dialogs.js  # 对话框
│       │   ├── version-panel.js # 版本面板
│       │   ├── trash-panel.js   # 回收站面板
│       │   ├── file-ops.js      # 文件操作
│       │   └── settings.js      # 设置菜单
│       ├── core/
│       │   ├── Constants.js     # 全局常量
│       │   ├── Signal.js        # 事件总线
│       │   ├── Icons.js         # 图标常量管理
│       │   └── Autoload.js      # 服务注册表
│       ├── services/
│       │   ├── StorageService.js    # 数据持久化 (localStorage / pywebview API)
│       │   ├── FolderService.js     # 文件夹管理
│       │   ├── FileService.js       # 文件 & 版本管理
│       │   ├── TextFileReader.js    # 多格式文本读取 & 编码检测
│       │   ├── TabService.js        # 标签页管理
│       │   ├── TrashService.js      # 回收站管理
│       │   ├── AutoSaveService.js   # 自动保存
│       │   └── TimeService.js       # 时间服务
│       └── controllers/
│           ├── ThemeController.js        # 主题控制
│           ├── SidebarController.js      # 侧边栏渲染
│           ├── TabController.js          # 标签栏渲染
│           ├── EditorController.js       # 编辑器核心
│           ├── EncodingController.js     # 编码显示与切换
│           ├── SearchController.js       # 搜索功能
│           ├── DragController.js         # 拖拽功能
│           ├── ContextMenuController.js  # 文件树右键菜单
│           ├── editor/
│           │   ├── EditorController.linenum.js      # 行号
│           │   ├── EditorController.syntax.js       # 语法高亮
│           │   ├── EditorController.treeview.js     # 树图可视化
│           │   ├── EditorController.contextmenu.js  # 编辑器右键菜单
│           │   └── EditorController.version.js      # 版本信息
│           └── Sidebar/
│               ├── FolderTreeStateManager.js   # 树状态管理
│               ├── FolderTreeRenderer.js       # 树渲染器
│               ├── FolderTreeEventHandler.js   # 树事件处理
│               └── InlineRenameHelper.js       # 内联重命名</code></pre>
    `,

    'tech-stack': `
        <h2>技术栈</h2>
        <h3>浏览器版</h3>
        <table>
            <thead>
                <tr><th>层级</th><th>技术</th></tr>
            </thead>
            <tbody>
                <tr><td>前端</td><td>原生 JavaScript (ES6)、CSS3、HTML5</td></tr>
                <tr><td>数据存储</td><td>浏览器 <code>localStorage</code></td></tr>
                <tr><td>架构模式</td><td>事件驱动（Signal 事件总线）+ 服务层 MVC</td></tr>
                <tr><td>部署</td><td>纯静态文件，可部署到 Netlify / Vercel 等</td></tr>
            </tbody>
        </table>
        <p>浏览器版是纯前端应用，无需安装任何后端依赖或数据库。所有代码为原生 JavaScript，无框架依赖。</p>

        <h3>PC 桌面版</h3>
        <table>
            <thead>
                <tr><th>层级</th><th>技术</th></tr>
            </thead>
            <tbody>
                <tr><td>前端</td><td>与浏览器版相同（原生 JavaScript、CSS3、HTML5）</td></tr>
                <tr><td>桌面框架</td><td>Python pywebview（轻量级桌面窗口框架）</td></tr>
                <tr><td>后端桥接</td><td>Python 3.x（提供 API 接口、文件操作、剪贴板）</td></tr>
                <tr><td>数据存储</td><td>Python StorageEngine（本地文件存储）</td></tr>
                <tr><td>系统交互</td><td>pywin32（Windows API 调用、窗口图标、单实例保护）</td></tr>
            </tbody>
        </table>
        <p>PC 桌面版通过 pywebview 将前端界面嵌入原生桌面窗口，通过 Python API 桥接实现系统级功能（文件对话框、剪贴板、本地存储）。前端代码与浏览器版完全复用。</p>
    `,

    requirements: `
        <h2>系统要求</h2>
        <h3>浏览器版</h3>
        <ul>
            <li><strong>现代浏览器</strong> — Chrome / Firefox / Edge / Safari 等支持 ES6 的浏览器均可</li>
            <li>无需安装 Python、Node.js 或任何第三方库</li>
            <li>无需数据库，数据存储在浏览器 localStorage</li>
        </ul>
        <p>浏览器版纯前端架构，零依赖，开箱即用。</p>

        <h3>PC 桌面版</h3>
        <ul>
            <li><strong>操作系统</strong> — Windows 10 / 11（64 位）</li>
            <li><strong>Python 环境</strong> — Python 3.8 或更高版本</li>
            <li><strong>依赖包</strong> — pywebview、pywin32</li>
        </ul>
        <p>安装依赖：</p>
        <pre><code>pip install pywebview pywin32</code></pre>
        <p>启动应用：</p>
        <pre><code>python py/app.py</code></pre>
        <p>或通过 <code>Auto.bat</code> 一键启动。</p>
    `,

    about: `
        <h2>关于 Nestxt</h2>
        <p><strong>Nestxt 文本编辑器</strong> — 一款简洁、高效的文本编辑器，支持文件夹管理、多标签编辑、版本控制、自动保存、语法高亮、智能编码识别等功能。</p>
        <p>提供两种使用方式：</p>
        <ul>
            <li><strong>浏览器版</strong> — 纯前端架构，数据存储在浏览器 localStorage，零依赖，开箱即用</li>
            <li><strong>PC 桌面版</strong> — 基于 pywebview 的桌面应用，支持原生文件对话框、系统剪贴板、本地数据存储</li>
        </ul>
        <p>版本：<strong>1.0</strong></p>
        <div style="display: flex; align-items: center; gap: 16px; margin: 20px 0;">
            <img src="../icon/YFan.png" alt="YFan" style="width: 64px; height: 64px; border-radius: 50%; object-fit: cover;">
            <div>
                <p style="margin: 0; font-size: 18px; font-weight: 700;">YFan</p>
                <p style="margin: 4px 0 0 0; color: var(--text-muted);">开发者</p>
            </div>
        </div>
        <table>
            <thead>
                <tr><th>信息</th><th></th></tr>
            </thead>
            <tbody>
                <tr><td>邮箱</td><td>603349580@qq.com</td></tr>
                <tr><td>微信</td><td>a603349580</td></tr>
                <tr><td>电话</td><td>18677102043</td></tr>
            </tbody>
        </table>
        <hr>
        <p style="color: var(--text-muted); font-size: 13px;">&copy; 2026 Nestxt. All rights reserved.</p>
    `,
};