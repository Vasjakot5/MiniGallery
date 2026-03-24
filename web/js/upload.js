document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    
    if (!token || !user) {
        window.location.href = '/web/pages/login.html';
        return;
    }
    
    loadCategories();
});

async function loadCategories() {
    try {
        const response = await fetch('/api/categories');
        const categories = await response.json();
        
        const select = document.getElementById('category');
        select.innerHTML = '<option value="">Выберите категорию</option>';
        
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

document.getElementById('image').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        if (file.size > 5 * 1024 * 1024) {
            showMessage('Файл слишком большой. Максимальный размер 5 MB', 'error');
            this.value = '';
            document.getElementById('preview-container').style.display = 'none';
            return;
        }
        
        const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            showMessage('Неверный формат. Допустимы: JPG, PNG, WEBP', 'error');
            this.value = '';
            document.getElementById('preview-container').style.display = 'none';
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('image-preview').src = e.target.result;
            document.getElementById('preview-container').style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
});

document.getElementById('upload-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/web/pages/login.html';
        return;
    }
    
    const formData = new FormData();
    formData.append('title', document.getElementById('title').value);
    formData.append('description', document.getElementById('description').value);
    formData.append('category_id', document.getElementById('category').value);
    formData.append('image', document.getElementById('image').files[0]);
    
    const progressBar = document.getElementById('progress-bar');
    const progressFill = document.getElementById('progress-fill');
    const submitBtn = document.getElementById('submit-btn');
    
    progressBar.style.display = 'block';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Загрузка...';
    
    try {
        const response = await fetch('/api/images/upload', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        if (!response.ok) {
            throw new Error('Ошибка при загрузке');
        }
        
        const result = await response.json();
        
        showMessage('Изображение успешно загружено!', 'success');
        
        document.getElementById('upload-form').reset();
        document.getElementById('preview-container').style.display = 'none';
        
        setTimeout(() => {
            window.location.href = '/web/pages/index.html';
        }, 2000);
        
    } catch (error) {
        showMessage('Ошибка: ' + error.message, 'error');
    } finally {
        progressBar.style.display = 'none';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Загрузить';
    }
});

function showMessage(text, type) {
    const message = document.getElementById('upload-message');
    message.textContent = text;
    message.className = `message ${type}`;
    message.style.display = 'block';
    
    setTimeout(() => {
        message.style.display = 'none';
    }, 5000);
}