document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    
    if (!token || !user) {
        window.location.href = '/web/pages/login.html';
        return;
    }
    
    if (user.role !== 'admin') {
        window.location.href = '/web/pages/index.html';
        return;
    }
    
    loadCategories();
});

async function loadCategories() {
    const tbody = document.getElementById('categories-list-body');
    const loading = document.getElementById('loading');
    const error = document.getElementById('error');
    
    try {
        loading.style.display = 'block';
        error.style.display = 'none';
        
        const response = await fetch('/api/categories');
        const categories = await response.json();
        
        const categoriesWithCount = await Promise.all(
            categories.map(async (cat) => {
                const count = await getImageCountByCategory(cat.id);
                return { ...cat, count };
            })
        );
        
        loading.style.display = 'none';
        
        if (categoriesWithCount.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="empty">Нет категорий</td></tr>';
            return;
        }
        
        tbody.innerHTML = categoriesWithCount.map(cat => `
            <tr data-id="${cat.id}">
                <td>${cat.id}</td>
                <td>
                    <span class="category-name">${escapeHtml(cat.name)}</span>
                    <input type="text" class="edit-input" value="${escapeHtml(cat.name)}" style="display: none;">
                </td>
                <td>${cat.count}</td>
                <td>
                    <button class="btn-edit-category" onclick="editCategory(${cat.id})">Изменить</button>
                    <button class="btn-save-category" onclick="saveCategory(${cat.id})" style="display: none;">Сохранить</button>
                    <button class="btn-cancel-category" onclick="cancelEdit(${cat.id})" style="display: none;">Отмена</button>
                    <button class="btn-delete-category" onclick="deleteCategory(${cat.id}, ${cat.count})" ${cat.count > 0 ? 'disabled title="Нельзя удалить категорию с изображениями"' : ''}>Удалить</button>
                </td>
            </tr>
        `).join('');
        
    } catch (err) {
        console.error('Ошибка:', err);
        loading.style.display = 'none';
        error.style.display = 'block';
        error.textContent = 'Ошибка загрузки категорий: ' + err.message;
    }
}

async function getImageCountByCategory(categoryId) {
    try {
        const response = await fetch(`/api/images?category=${categoryId}`);
        const images = await response.json();
        return images.length;
    } catch {
        return 0;
    }
}

document.getElementById('add-category-btn').addEventListener('click', async () => {
    const nameInput = document.getElementById('new-category-name');
    const name = nameInput.value.trim();
    
    if (!name) {
        showMessage('Введите название категории', 'error');
        return;
    }
    
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch('/api/categories', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`  
            },
            body: JSON.stringify({ name })
        });
        
        if (!response.ok) {
            throw new Error('Ошибка при создании категории');
        }
        
        nameInput.value = '';
        showMessage('Категория создана', 'success');
        loadCategories();
        
    } catch (error) {
        console.error('Ошибка:', error);
        showMessage('Ошибка: ' + error.message, 'error');
    }
});

function editCategory(id) {
    const row = document.querySelector(`tr[data-id="${id}"]`);
    const nameSpan = row.querySelector('.category-name');
    const editInput = row.querySelector('.edit-input');
    const editBtn = row.querySelector('.btn-edit-category');
    const saveBtn = row.querySelector('.btn-save-category');
    const cancelBtn = row.querySelector('.btn-cancel-category');
    const deleteBtn = row.querySelector('.btn-delete-category');
    
    nameSpan.style.display = 'none';
    editInput.style.display = 'inline-block';
    editInput.value = nameSpan.textContent;
    editBtn.style.display = 'none';
    saveBtn.style.display = 'inline-block';
    cancelBtn.style.display = 'inline-block';
    deleteBtn.style.display = 'none';
}

async function saveCategory(id) {
    const row = document.querySelector(`tr[data-id="${id}"]`);
    const nameSpan = row.querySelector('.category-name');
    const editInput = row.querySelector('.edit-input');
    const newName = editInput.value.trim();
    
    if (!newName) {
        showMessage('Название не может быть пустым', 'error');
        return;
    }
    
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`/api/categories/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ name: newName })
        });
        
        if (!response.ok) {
            throw new Error('Ошибка при обновлении');
        }
        
        showMessage('Категория обновлена', 'success');
        loadCategories();
        
    } catch (error) {
        console.error('Ошибка:', error);
        showMessage('Ошибка: ' + error.message, 'error');
        cancelEdit(id);
    }
}

function cancelEdit(id) {
    loadCategories();
}

async function deleteCategory(id, imageCount) {
    if (imageCount > 0) {
        showMessage('Нельзя удалить категорию с изображениями', 'error');
        return;
    }
    
    if (!confirm('Вы уверены, что хотите удалить эту категорию?')) {
        return;
    }
    
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`/api/categories/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Ошибка при удалении');
        }
        
        showMessage('Категория удалена', 'success');
        loadCategories();
        
    } catch (error) {
        console.error('Ошибка:', error);
        showMessage('Ошибка: ' + error.message, 'error');
    }
}

function showMessage(text, type) {
    const message = document.createElement('div');
    message.className = `notification ${type}`;
    message.textContent = text;
    message.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        background-color: ${type === 'success' ? '#d4edda' : '#f8d7da'};
        color: ${type === 'success' ? '#155724' : '#721c24'};
        border-radius: 4px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(message);
    
    setTimeout(() => {
        message.remove();
    }, 3000);
}

function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}