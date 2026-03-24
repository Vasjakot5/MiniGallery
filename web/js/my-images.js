document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    
    if (!token || !user) {
        window.location.href = '/web/pages/login.html';
        return;
    }
    
    loadCategories();
    loadMyImages();
});

let currentFilters = {
    category: '',
    search: ''
};

async function loadCategories() {
    try {
        const response = await fetch('/api/categories');
        const categories = await response.json();
        
        const select = document.getElementById('category-filter');
        select.innerHTML = '<option value="">Все категории</option>';
        
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id;
            option.textContent = cat.name;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Ошибка загрузки категорий:', error);
    }
}

async function loadMyImages() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    
    if (!token || !user) return;
    
    let url = `/api/images?author=${user.id}`;
    if (currentFilters.category) {
        url += `&category=${currentFilters.category}`;
    }
    if (currentFilters.search) {
        url += `&search=${encodeURIComponent(currentFilters.search)}`;
    }
    
    const galleryGrid = document.getElementById('gallery-grid');
    const loading = document.getElementById('loading');
    const empty = document.getElementById('empty');
    const error = document.getElementById('error');
    
    try {
        loading.style.display = 'block';
        galleryGrid.style.display = 'none';
        empty.style.display = 'none';
        error.style.display = 'none';
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const images = await response.json();
        
        loading.style.display = 'none';
        
        if (images.length === 0) {
            empty.style.display = 'block';
            return;
        }
        
        galleryGrid.style.display = 'grid';
        galleryGrid.innerHTML = '';
        
        for (const img of images) {
            const categoryName = await getCategoryName(img.category_id);
            const date = new Date(img.created_at).toLocaleDateString('ru-RU');
            
            const card = document.createElement('div');
            card.className = 'image-card';
            card.dataset.id = img.id;
            card.innerHTML = `
            <a href="/web/pages/view-image.html?id=${img.id}" style="text-decoration: none">
                <img src="${img.file_path}" alt="${img.title}" 
                     onerror="this.src='/web/images/placeholder.jpg'">
                <div class="image-info">
                    <h3>${img.title}</h3>
                    <p>${img.description || 'Нет описания'}</p>
                    <span class="category">${categoryName}</span>
                    <span class="author">${date}</span>
                </div>
                <div class="image-actions">
                    <button class="btn btn-edit" onclick="editImage(${img.id})">Изменить</button>
                    <button class="btn btn-delete" onclick="deleteImage(${img.id})">Удалить</button>
                </div>
            </a>
            `;
            galleryGrid.appendChild(card);
        }
        
    } catch (err) {
        console.error('Ошибка:', err);
        loading.style.display = 'none';
        error.style.display = 'block';
        error.textContent = 'Ошибка загрузки: ' + err.message;
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
        
        const card = document.querySelector(`.image-card[data-id="${id}"]`);
        if (card) {
            card.remove();
        }

        const galleryGrid = document.getElementById('gallery-grid');
        if (galleryGrid.children.length === 0) {
            document.getElementById('empty').style.display = 'block';
            galleryGrid.style.display = 'none';
        }
        
        showNotification('Изображение удалено', 'success');
        
    } catch (error) {
        console.error('Ошибка:', error);
        showNotification('Ошибка при удалении', 'error');
    }
}

function editImage(id) {
    window.location.href = `/web/pages/edit-image.html?id=${id}`;
}

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background-color: ${type === 'success' ? '#d4edda' : '#f8d7da'};
        color: ${type === 'success' ? '#155724' : '#721c24'};
        border-radius: 4px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        z-index: 1000;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

document.getElementById('category-filter').addEventListener('change', (e) => {
    currentFilters.category = e.target.value;
    loadMyImages();
});

let searchTimeout;
document.getElementById('search-filter').addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        currentFilters.search = e.target.value;
        loadMyImages();
    }, 500);
});