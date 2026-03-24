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
        showMessage('ID изображения не указан', 'error');
        setTimeout(() => {
            window.location.href = '/web/pages/my-images.html';
        }, 2000);
        return;
    }
    
    loadCategories();
    loadImageData();
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

async function loadImageData() {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`/api/images/${imageId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Ошибка загрузки данных');
        }
        
        const image = await response.json();
        
        document.getElementById('title').value = image.title;
        document.getElementById('description').value = image.description || '';
        document.getElementById('current-image').src = image.file_path;
        
        const categorySelect = document.getElementById('category');
        
        setTimeout(() => {
            for (let option of categorySelect.options) {
                if (option.value == image.category_id) {
                    option.selected = true;
                    break;
                }
            }
        }, 500);
        
    } catch (error) {
        console.error('Ошибка:', error);
        showMessage('Ошибка загрузки данных', 'error');
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

document.getElementById('edit-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const token = localStorage.getItem('token');
    
    const formData = new FormData();
    formData.append('title', document.getElementById('title').value);
    formData.append('description', document.getElementById('description').value);
    formData.append('category_id', document.getElementById('category').value);
    
    const imageFile = document.getElementById('image').files[0];
    if (imageFile) {
        formData.append('image', imageFile);
    }
    
    const progressBar = document.getElementById('progress-bar');
    const progressFill = document.getElementById('progress-fill');
    const submitBtn = document.getElementById('submit-btn');
    
    progressBar.style.display = 'block';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Сохранение...';
    
    try {
        const response = await fetch(`/api/images/${imageId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Ответ сервера:', errorText);
            throw new Error('Ошибка при сохранении');
        }
        
        const result = await response.json();
        console.log('Успех:', result);
        
        showMessage('Изменения сохранены!', 'success');
        
        setTimeout(() => {
            window.location.href = '/web/pages/my-images.html';
        }, 2000);
        
    } catch (error) {
        console.error('Ошибка:', error);
        showMessage('Ошибка: ' + error.message, 'error');
    } finally {
        progressBar.style.display = 'none';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Сохранить изменения';
    }
});

function showMessage(text, type) {
    const message = document.getElementById('edit-message');
    message.textContent = text;
    message.className = `message ${type}`;
    message.style.display = 'block';
    
    setTimeout(() => {
        message.style.display = 'none';
    }, 5000);
}