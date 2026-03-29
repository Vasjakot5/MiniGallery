CREATE INDEX IF NOT EXISTS idx_images_category ON images(category_id); 
CREATE INDEX IF NOT EXISTS idx_images_uploaded_by ON images(uploaded_by); 
CREATE INDEX IF NOT EXISTS idx_images_created_at ON images(created_at); 
CREATE INDEX IF NOT EXISTS idx_images_title ON images(title); 
CREATE INDEX IF NOT EXISTS idx_users_name ON users(name); 
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name); 
