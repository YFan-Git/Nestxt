// ============================================
// script.js - 在线文档交互逻辑
// ============================================

// DOM 引用
const sidebarNav = document.getElementById('sidebar-nav');
const contentEl = document.getElementById('content');
const searchInput = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');

// ============================================
// 构建导航树
// ============================================
function buildNav() {
    let html = '';
    let currentSection = '';

    DOCS.forEach((doc) => {
        if (!doc.h2) {
            if (currentSection) {
                html += '</div>';
            }
            currentSection = doc.id;
            html += `<div class="nav-section">
                <div class="nav-section-header" data-section="${doc.id}">
                    ${doc.title}
                    <span class="arrow">▼</span>
                </div>`;
        } else {
            const cls = doc.parent === currentSection ? 'nav-h2' : 'nav-h3';
            html += `<a class="nav-item ${cls}" href="#${doc.id}" data-id="${doc.id}">${doc.title}</a>`;
        }
    });

    if (currentSection) {
        html += '</div>';
    }

    sidebarNav.innerHTML = html;

    // 绑定导航折叠
    sidebarNav.querySelectorAll('.nav-section-header').forEach(header => {
        header.addEventListener('click', (e) => {
            const section = header.parentElement;
            const items = section.querySelectorAll('.nav-item');
            const arrow = header.querySelector('.arrow');
            const isCollapsed = arrow.classList.toggle('collapsed');
            items.forEach(item => {
                item.style.display = isCollapsed ? 'none' : 'block';
            });

            const sectionId = header.dataset.section;
            if (sectionId && CONTENT[sectionId]) {
                e.stopPropagation();
                renderContent(sectionId);
                closeSidebar();
            }
        });
        // 默认展开后折叠
        header.click();
        header.click();
    });
}

// ============================================
// 渲染内容
// ============================================
function renderContent(sectionId) {
    if (sectionId && CONTENT[sectionId]) {
        contentEl.innerHTML = CONTENT[sectionId];
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.id === sectionId);
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
        renderContent('intro');
        document.querySelector('.nav-item[data-id="intro"]')?.classList.add('active');
    }
}

// ============================================
// 导航点击
// ============================================
sidebarNav.addEventListener('click', (e) => {
    const navItem = e.target.closest('.nav-item');
    if (navItem) {
        e.preventDefault();
        const id = navItem.dataset.id;
        if (id) {
            renderContent(id);
            closeSidebar();
        }
    }
});

// ============================================
// 搜索
// ============================================
function performSearch(query) {
    query = query.trim().toLowerCase();
    if (!query) {
        searchResults.classList.remove('visible');
        searchResults.innerHTML = '';
        return;
    }

    const results = DOCS.filter(doc => {
        const content = CONTENT[doc.id] || '';
        const text = content.replace(/<[^>]+>/g, '');
        return text.toLowerCase().includes(query) || doc.title.toLowerCase().includes(query);
    });

    if (results.length === 0) {
        searchResults.innerHTML = '<div class="search-empty">未找到相关结果</div>';
    } else {
        let html = '';
        results.forEach(doc => {
            const content = (CONTENT[doc.id] || '').replace(/<[^>]+>/g, '');
            const idx = content.toLowerCase().indexOf(query);
            let snippet = '';
            if (idx >= 0) {
                const start = Math.max(0, idx - 20);
                const end = Math.min(content.length, idx + 40);
                snippet = (start > 0 ? '...' : '') +
                    content.slice(start, end) +
                    (end < content.length ? '...' : '');
            }
            html += `<div class="search-result-item" data-id="${doc.id}">
                <span class="highlight">${doc.title}</span>
                <div style="font-size:12px;color:var(--text-muted);margin-top:2px;">${snippet}</div>
            </div>`;
        });
        searchResults.innerHTML = html;

        searchResults.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', () => {
                renderContent(item.dataset.id);
                searchInput.value = '';
                searchResults.classList.remove('visible');
            });
        });
    }
    searchResults.classList.add('visible');
}

searchInput.addEventListener('input', () => performSearch(searchInput.value));
searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        searchInput.value = '';
        searchResults.classList.remove('visible');
        searchInput.blur();
    }
});

// ============================================
// 回到顶部
// ============================================
const backToTop = document.getElementById('back-to-top');
window.addEventListener('scroll', () => {
    backToTop.classList.toggle('visible', window.scrollY > 400);
});
backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ============================================
// 移动端侧边栏
// ============================================
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('sidebar-overlay');
const menuToggle = document.getElementById('menu-toggle');

function openSidebar() {
    sidebar.classList.add('open');
    overlay.classList.add('visible');
    menuToggle.textContent = '✕';
    menuToggle.classList.add('close-btn');
}
function closeSidebar() {
    sidebar.classList.remove('open');
    overlay.classList.remove('visible');
    menuToggle.textContent = '☰';
    menuToggle.classList.remove('close-btn');
}

menuToggle.addEventListener('click', () => {
    if (sidebar.classList.contains('open')) {
        closeSidebar();
    } else {
        openSidebar();
    }
});
overlay.addEventListener('click', closeSidebar);

// ============================================
// 初始化
// ============================================
buildNav();
renderContent('intro');
document.querySelector('.nav-item[data-id="intro"]')?.classList.add('active');

// 监听 URL hash 变化
window.addEventListener('hashchange', () => {
    const id = window.location.hash.slice(1);
    if (id && CONTENT[id]) {
        renderContent(id);
    }
});