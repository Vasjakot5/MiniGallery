const urlParams = new URLSearchParams(window.location.search);
const imageId = urlParams.get('id');

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    
    if (!token || !user) {
        window.location.href = '/web/pages/login.html';
        return;
    }
    
    if (!imageId) {
        window.location.href = '/web/pages/index.html';
        return;
    }
    
    loadImageDetails();
});

async function loadImageDetails() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    
    try {
        const response = await fetch(`/api/images/${imageId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Ошибка загрузки');
        }
        
        const image = await response.json();
        
        const [authorName, categoryName] = await Promise.all([
            getAuthorName(image.uploaded_by),
            getCategoryName(image.category_id)
        ]);
        
        displayImage(image, authorName, categoryName, user);
        
    } catch (error) {
        console.error('Ошибка:', error);
        document.getElementById('error').style.display = 'block';
        document.getElementById('error').textContent = 'Ошибка загрузки изображения';
    }
}

async function getAuthorName(userId) {
    try {
        const response = await fetch('/api/users');
        const users = await response.json();
        const user = users.find(u => u.id === userId);
        return user ? user.name : 'Неизвестный автор';
    } catch {
        return 'Неизвестный автор';
    }
}

async function getCategoryName(categoryId) {
    try {
        const response = await fetch('/api/categories');
        const categories = await response.json();
        const category = categories.find(c => c.id === categoryId);
        return category ? category.name : 'Без категории';
    } catch {
        return 'Без категории';
    }
}

function displayImage(image, authorName, categoryName, currentUser) {
    document.title = `Mini Gallery - ${image.title}`;
    
    const date = new Date(image.created_at).toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    let actionsHtml = '';
    if (currentUser.id === image.uploaded_by || currentUser.role === 'admin') {
        actionsHtml = `
            <a href="/web/pages/edit-image.html?id=${image.id}" class="btn-edit">Редактировать</a>
            <button class="btn-delete" onclick="deleteImage(${image.id})">Удалить</button>
        `;
    }
    
    const html = `
        <div class="view-container">
            <div class="image-section">
                <img src="${image.file_path}" alt="${image.title}" class="full-image">
            </div>
            <div class="details-section">
                <h1 class="image-title">${image.title}</h1>
                
                <div class="image-meta">
                    <div class="meta-item">
                        <span class="label">Автор:</span>
                        <span>${authorName}</span>
                    </div>
                    <div class="meta-item">
                        <span class="label">Категория:</span>
                        <span>${categoryName}</span>
                    </div>
                    <div class="meta-item">
                        <span class="label">Загружено:</span>
                        <span>${date}</span>
                    </div>
                </div>
                
                ${image.description ? `
                    <div class="image-description">
                        <h3>Описание</h3>
                        <p>${image.description}</p>
                    </div>
                ` : ''}
                
                <div class="image-actions">
                    <a href="javascript:history.back()" class="btn-back">Назад</a>
                    ${actionsHtml}
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('image-container').innerHTML = html;
}

async function deleteImage(id) {
    if (!confirm('Вы уверены, что хотите удалить это изображение?')) {
        return;
    }
    
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`/api/images/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Ошибка при удалении');
        }
        
        window.location.href = '/web/pages/index.html';
        
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Ошибка при удалении изображения');
    }
}