const API = {
    baseUrl: '/api',
    
    async get(endpoint) {
        try {
            console.log(`Запрос к API: ${this.baseUrl}${endpoint}`);
            const response = await fetch(this.baseUrl + endpoint);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            console.log(`Получены данные от ${endpoint}:`, data);
            return data;
        } catch (error) {
            console.error(`Ошибка API (${endpoint}):`, error);
            throw error;
        }
    },
    
    async getImages(filters = {}) {
        let url = '/images?';
        const params = [];
        
        if (filters.category) params.push(`category=${filters.category}`);
        if (filters.author) params.push(`author=${filters.author}`);
        if (filters.search) params.push(`search=${encodeURIComponent(filters.search)}`);
        
        url += params.join('&');
        console.log('Запрос изображений:', url);
        return this.get(url);
    },
    
    async getCategories() {
        return this.get('/categories');
    },
    
    async getUsers() {
        return this.get('/users');
    }

};

console.log('gallery.js загружен');

document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM загружен');
    
    try {
        const categories = await fetch('/api/categories').then(r => r.json());
        console.log('Категории:', categories);
        
        const select = document.getElementById('category-filter');
        if (select) {
            console.log('Найден select');
            
            select.innerHTML = '';
            
            const allOption = document.createElement('option');
            allOption.value = '';
            allOption.textContent = 'Все категории';
            select.appendChild(allOption);
            
            categories.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.id;
                option.textContent = cat.name;
                select.appendChild(option);
                console.log(`➕ Добавлена категория: ${cat.name} (${cat.id})`);
            });
            
            console.log('Готово! Опций в select:', select.options.length);
        } else {
            console.error('select не найден!');
        }
        
    } catch (error) {
        console.error('Ошибка:', error);
    }
});