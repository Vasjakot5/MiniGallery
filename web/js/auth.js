function switchTab(tab) {
    const tabs = document.querySelectorAll('.auth-tab');
    const forms = document.querySelectorAll('.auth-form');
    
    tabs.forEach(t => t.classList.remove('active'));
    forms.forEach(f => f.classList.remove('active'));
    
    if (tab === 'login') {
        tabs[0].classList.add('active');
        document.getElementById('login-form').classList.add('active');
        loadUsersToDropdown();
    } else {
        tabs[1].classList.add('active');
        document.getElementById('register-form').classList.add('active');
    }
}

let usersCache = null;
let usersLoading = false;

async function loadUsersToDropdown() {
    const select = document.getElementById('login-username');
    if (!select) {
        console.log('Элемент login-username не найден');
        return;
    }
    
    if (usersCache && usersCache.length > 0) {
        renderUserDropdown(usersCache);
        return;
    }
    
    if (usersLoading) return;
    
    usersLoading = true;
    select.innerHTML = '<option value="">Загрузка пользователей...</option>';
    
    try {
        const response = await fetch('/api/users');
        if (!response.ok) throw new Error('Ошибка загрузки');
        usersCache = await response.json();
        renderUserDropdown(usersCache);
    } catch (error) {
        console.error('Ошибка:', error);
        select.innerHTML = '<option value="">Ошибка загрузки</option>';
    } finally {
        usersLoading = false;
    }
}

function renderUserDropdown(users) {
    const select = document.getElementById('login-username');
    if (!select) return;
    
    select.innerHTML = '<option value="">Выберите пользователя</option>';
    
    if (!users || users.length === 0) {
        select.innerHTML = '<option value="">Нет пользователей</option>';
        return;
    }
    
    users.forEach(user => {
        const option = document.createElement('option');
        option.value = user.name;
        option.textContent = `${user.name} (${user.role === 'admin' ? 'Админ' : 'Пользователь'})`;
        select.appendChild(option);
    });
}

async function hashPassword(password) {
    const msgBuffer = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function handleLogin() {
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    const errorDiv = document.getElementById('login-error');
    
    if (!username || !password) {
        errorDiv.textContent = 'Выберите пользователя и введите пароль';
        errorDiv.style.display = 'block';
        return;
    }
    
    errorDiv.style.display = 'none';
    
    try {
        const hashedPassword = await hashPassword(password);
        
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: username, password: hashedPassword })
        });
        
        if (!response.ok) {
            throw new Error('Неверное имя или пароль');
        }
        
        const data = await response.json();
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        window.location.href = '/web/pages/index.html';
        
    } catch (error) {
        errorDiv.textContent = error.message;
        errorDiv.style.display = 'block';
    }
}

async function handleRegister() {
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;
    const errorDiv = document.getElementById('register-error');
    const successDiv = document.getElementById('register-success');
    
    if (!username || !password) {
        errorDiv.textContent = 'Заполните все поля';
        errorDiv.style.display = 'block';
        successDiv.style.display = 'none';
        return;
    }
    
    errorDiv.style.display = 'none';
    
    try {
        const hashedPassword = await hashPassword(password);
        
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                name: username, 
                password: hashedPassword,
                role: 'user' 
            })
        });
        
        if (!response.ok) {
            throw new Error('Ошибка при регистрации');
        }
        
        successDiv.textContent = 'Регистрация успешна! Теперь можете войти.';
        successDiv.style.display = 'block';
        
        document.getElementById('register-username').value = '';
        document.getElementById('register-password').value = '';
        
        usersCache = null;
        
        setTimeout(() => switchTab('login'), 2000);
        
    } catch (error) {
        errorDiv.textContent = error.message;
        errorDiv.style.display = 'block';
        successDiv.style.display = 'none';
    }
}

function updateHeaderAuth() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    
    const authSection = document.getElementById('auth-section');
    const userSection = document.getElementById('user-section');
    const userNameSpan = document.getElementById('user-dropdown-btn');
    const adminMenu = document.getElementById('admin-menu');
    
    if (authSection && userSection) {
        if (token && user) {
            authSection.style.display = 'none';
            userSection.style.display = 'block';
            if (userNameSpan) userNameSpan.textContent = user.name;
            if (adminMenu && user.role === 'admin') {
                adminMenu.style.display = 'block';
            }
        } else {
            authSection.style.display = 'block';
            userSection.style.display = 'none';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM загружен');
    
    updateHeaderAuth();
    
    if (window.location.pathname.includes('login.html')) {
        console.log('На странице входа, загружаем пользователей');
        setTimeout(() => {
            loadUsersToDropdown();
        }, 200);
    }
});

document.addEventListener('click', (e) => {
    if (e.target.id === 'logout-link') {
        e.preventDefault();
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/web/pages/login.html';
    }
});