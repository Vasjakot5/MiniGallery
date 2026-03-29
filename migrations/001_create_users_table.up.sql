CREATE TABLE IF NOT EXISTS users ( 
    id SERIAL PRIMARY KEY, 
    name VARCHAR(100) NOT NULL UNIQUE, 
    password VARCHAR(256) NOT NULL, 
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'user')) 
); 
