document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    
    if (!token || !user) {
        window.location.href = '/web/pages/login.html';
        return;
    }
    
    loadCategories();
    
    const form = document.getElementById('upload-form');
    if (form) {
        form.addEventListener('submit', handleSubmit);
    }
});

async function loadCategories() {
    try {
        const response = await fetch('/api/categories');
        const categories = await response.json();
        
        const select = document.getElementById('category');
        if (select) {
            select.innerHTML = '<option value="">Выберите категорию</option>';
            categories.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.id;
                option.textContent = cat.name;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Ошибка загрузки категорий:', error);
    }
}

document.getElementById('image')?.addEventListener('change', function(e) {
    const file = e.target.files[0];
    const previewContainer = document.getElementById('preview-container');
    const imagePreview = document.getElementById('image-preview');
    
    if (file) {
        if (file.size > 5 * 1024 * 1024) {
            showMessage('Файл слишком большой. Максимальный размер 5 MB', 'error');
            this.value = '';
            previewContainer.style.display = 'none';
            return;
        }
        
        const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            showMessage('Неверный формат. Допустимы: JPG, PNG, WEBP', 'error');
            this.value = '';
            previewContainer.style.display = 'none';
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            imagePreview.src = e.target.result;
            previewContainer.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
});

async function handleSubmit(e) {
    e.preventDefault();
    
    const token = localStorage.getItem('token');
    const submitBtn = document.getElementById('submit-btn');
    const progressBar = document.getElementById('progress-bar');
    const progressFill = document.getElementById('progress-fill');
    
    const title = document.getElementById('title').value;
    const description = document.getElementById('description').value;
    const categoryId = document.getElementById('category').value;
    const imageFile = document.getElementById('image').files[0];
    
    if (!title) {
        showMessage('Введите название', 'error');
        return;
    }
    
    if (!categoryId) {
        showMessage('Выберите категорию', 'error');
        return;
    }
    
    if (!imageFile) {
        showMessage('Выберите файл изображения', 'error');
        return;
    }
    
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description || '');
    formData.append('category_id', categoryId);
    formData.append('image', imageFile);
    
    progressBar.style.display = 'block';
    progressFill.style.width = '0%';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Загрузка...';
    
    let progress = 0;
    const interval = setInterval(() => {
        progress += 10;
        if (progress <= 90) {
            progressFill.style.width = progress + '%';
        }
    }, 200);
    
    try {
        const response = await fetch('/api/images/upload', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        clearInterval(interval);
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Ошибка загрузки');
        }
        
        const result = await response.json();
        
        progressFill.style.width = '100%';
        showMessage('Изображение успешно загружено!', 'success');
        
        document.getElementById('upload-form').reset();
        document.getElementById('preview-container').style.display = 'none';
        
        setTimeout(() => {
            window.location.href = '/web/pages/index.html';
        }, 1500);
        
    } catch (error) {
        clearInterval(interval);
        progressBar.style.display = 'none';
        showMessage('Ошибка: ' + error.message, 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Загрузить';
    }
}

function showMessage(text, type) {
    const messageDiv = document.getElementById('upload-message');
    if (!messageDiv) return;
    
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.style.display = 'block';
    
    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 5000);
}