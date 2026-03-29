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

async function loadImages() {
    const category = document.getElementById('category-filter')?.value || '';
    const author = document.getElementById('author-filter')?.value || '';
    const search = document.getElementById('search-filter')?.value || '';
    
    let url = '/api/images?';
    const params = [];
    if (category) params.push(`category=${category}`);
    if (author) params.push(`author=${author}`);
    if (search) params.push(`search=${encodeURIComponent(search)}`);
    url += params.join('&');
    
    const galleryGrid = document.getElementById('gallery-grid');
    const loading = document.getElementById('loading');
    const empty = document.getElementById('empty');
    const error = document.getElementById('error');
    
    loading.style.display = 'block';
    loading.innerHTML = '<div class="spinner"></div><p>Загрузка изображений...</p>';
    galleryGrid.style.display = 'none';
    empty.style.display = 'none';
    error.style.display = 'none';
    
    try {
        const response = await fetch(url);
        const images = await response.json();
        
        loading.style.display = 'none';
        
        // ПРОВЕРЯЕМ ЧТО images ЭТО МАССИВ
        if (!images || !Array.isArray(images)) {
            console.log('API вернул не массив:', images);
            empty.style.display = 'block';
            empty.innerHTML = '<p>Нет изображений</p>';
            return;
        }
        
        if (images.length === 0) {
            empty.style.display = 'block';
            empty.innerHTML = '<p>Нет изображений</p>';
            return;
        }
        
        galleryGrid.style.display = 'grid';
        galleryGrid.innerHTML = '';
        
        for (const img of images) {
            const authorName = await getAuthorName(img.uploaded_by);
            const categoryName = await getCategoryName(img.category_id);
            const date = new Date(img.created_at).toLocaleDateString('ru-RU');
            
            const div = document.createElement('div');
            div.className = 'image-card';
            div.innerHTML = `
                <a href="/web/pages/view-image.html?id=${img.id}">
                    <img src="${img.file_path}" alt="${img.title}" 
                         onerror="this.src='/web/images/placeholder.jpg'">
                </a>
                <div class="image-info">
                    <h3>${img.title}</h3>
                    <p>${img.description || 'Нет описания'}</p>
                    <span class="category">${categoryName}</span>
                    <span class="author">${authorName} • ${date}</span>
                </div>
            `;
            galleryGrid.appendChild(div);
        }
        
    } catch (err) {
        console.error('Ошибка:', err);
        loading.style.display = 'none';
        error.style.display = 'block';
        error.textContent = 'Ошибка загрузки: ' + err.message;
    }
}

function createFilters() {
    const filtersSection = document.querySelector('.filters');
    if (!filtersSection) return;
    
    let filterGrid = document.querySelector('.filter-grid');
    if (!filterGrid) {
        filterGrid = document.createElement('div');
        filterGrid.className = 'filter-grid';
        filtersSection.appendChild(filterGrid);
    }
    
    filterGrid.innerHTML = '';
    
    const categoryGroup = document.createElement('div');
    categoryGroup.className = 'filter-group';
    categoryGroup.innerHTML = `
        <label for="category-filter">Категория:</label>
        <select id="category-filter">
            <option value="">Загрузка...</option>
        </select>
    `;
    filterGrid.appendChild(categoryGroup);
    
    const searchGroup = document.createElement('div');
    searchGroup.className = 'filter-group';
    searchGroup.innerHTML = `
        <label for="search-filter">Поиск:</label>
        <input type="text" id="search-filter" placeholder="Поиск по названию...">
    `;
    filterGrid.appendChild(searchGroup);
    
    const authorGroup = document.createElement('div');
    authorGroup.className = 'filter-group';
    authorGroup.innerHTML = `
        <label for="author-filter">Автор:</label>
        <select id="author-filter">
            <option value="">Загрузка...</option>
        </select>
    `;
    filterGrid.appendChild(authorGroup);
}

async function loadCategories() {
    try {
        const response = await fetch('/api/categories');
        const categories = await response.json();
        
        const select = document.getElementById('category-filter');
        if (select) {
            select.innerHTML = '<option value="">Все категории</option>';
            categories.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.id;
                option.textContent = cat.name;
                select.appendChild(option);
            });
        }
    } catch {}
}

async function loadAuthors() {
    try {
        const response = await fetch('/api/users');
        const users = await response.json();
        
        const select = document.getElementById('author-filter');
        if (select) {
            select.innerHTML = '<option value="">Все авторы</option>';
            users.forEach(user => {
                const option = document.createElement('option');
                option.value = user.id;
                option.textContent = user.name;
                select.appendChild(option);
            });
        }
    } catch {}
}

document.addEventListener('DOMContentLoaded', () => {
    createFilters();
    
    setTimeout(() => {
        loadCategories();
        loadAuthors();
    }, 100);
    
    setTimeout(() => loadImages(), 300);
    
    setTimeout(() => {
        const categorySelect = document.getElementById('category-filter');
        const authorSelect = document.getElementById('author-filter');
        const searchInput = document.getElementById('search-filter');
        
        if (categorySelect) {
            categorySelect.addEventListener('change', loadImages);
        }
        
        if (authorSelect) {
            authorSelect.addEventListener('change', loadImages);
        }
        
        if (searchInput) {
            let timeout;
            searchInput.addEventListener('input', () => {
                clearTimeout(timeout);
                timeout = setTimeout(loadImages, 500);
            });
        }
    }, 500);
});