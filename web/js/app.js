async function loadPage() {
    const path = window.location.pathname;
    let pagePath = '/web/pages/index.html';
    if (path.includes('login.html')) {
        pagePath = '/web/pages/login.html';
    } else if (path.includes('upload.html')) {
        pagePath = '/web/pages/upload.html';
    } else if (path.includes('my-images.html')) {
        pagePath = '/web/pages/my-images.html';
    } else if (path.includes('categories.html')) {
        pagePath = '/web/pages/admin/categories.html';
    }
    try {
        const response = await fetch(pagePath);
        let html = await response.text();
        const titleMatch = html.match(/<!-- title: (.*?) -->/);
        if (titleMatch) {
            document.title = 'Mini Gallery - ' + titleMatch[1];
            html = html.replace(/<!-- title: .*? -->\n?/, '');
        }
        document.querySelector('main').innerHTML = html;
        updateActiveLink();
    } catch (error) {
        console.error('Ошибка загрузки страницы:', error);
    }
}
function updateActiveLink() {
    const currentPath = window.location.pathname;
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
        }
    });
}
document.addEventListener('DOMContentLoaded', loadPage);