CREATE TABLE IF NOT EXISTS images ( 
    id SERIAL PRIMARY KEY, 
    title VARCHAR(200) NOT NULL, 
    description TEXT, 
    file_path VARCHAR(500) NOT NULL, 
    category_id INTEGER REFERENCES categories(id) ON DELETE RESTRICT, 
    uploaded_by INTEGER REFERENCES users(id) ON DELETE CASCADE, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
); 
