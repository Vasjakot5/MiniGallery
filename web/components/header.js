async function loadHeader() {
    try {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || 'null');
        
        let headerHTML = `
            <header>
                <div class="container">
                    <div class="logo">
                    <h1>
                        <img src="/web/images/icon.png" alt="Gallery" style="width: 80px; height: 50px; vertical-align: middle; margin-right: 10px;">
                        Mini Gallery
                    </h1>
                    </div>
                    <nav>
                        <ul>
                            <li><a href="/web/pages/index.html" class="nav-link" data-page="home">Главная</a></li>
        `;
        
        if (token && user) {
            headerHTML += `
                            <li><a href="/web/pages/upload.html" class="nav-link" data-page="upload">Загрузка изображения</a></li>
                            <li><a href="/web/pages/my-images.html" class="nav-link" data-page="my-images">Мои изображения</a></li>
            `
            if (user.role === 'admin') {
                headerHTML += `
                            <li><a href="/web/pages/admin/categories.html" class="nav-link" data-page="categories">Управление категориями</a></li>
                `;
            }
            ;
        }
        
        headerHTML += `
                        </ul>
                    </nav>
                    <div class="user-menu">
        `;
        
        if (token && user) {
            headerHTML += `
                        <div class="user-dropdown">
                            <button class="user-dropdown-btn">${user.name}</button>
                            <div class="user-dropdown-content">
                                <a href="#" id="logout-link">Выйти</a>
                            </div>
                        </div>
            `;
        } else {
            headerHTML += `
                        <a href="/web/pages/login.html" class="btn-login">Войти</a>
            `;
        }
        
        headerHTML += `
                    </div>
                </div>
            </header>
        `;
        
        const oldHeader = document.querySelector('header');
        if (oldHeader) {
            oldHeader.remove();
        }
        
        document.body.insertAdjacentHTML('afterbegin', headerHTML);
        
        const logoutBtn = document.getElementById('logout-link');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/web/pages/login.html';
            });
        }
        
        highlightActiveLink();
        
    } catch (error) {
        console.error('Ошибка загрузки header:', error);
    }
}

function highlightActiveLink() {
    const currentPath = window.location.pathname;
    document.querySelectorAll('.nav-link').forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

document.addEventListener('DOMContentLoaded', loadHeader);