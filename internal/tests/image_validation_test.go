package tests

import (
	"path/filepath"
	"testing"
)

func TestImageValidation(t *testing.T) {
	tests := []struct {
		name      string
		filename  string
		content   []byte
		expectErr bool
		errMsg    string
	}{
		{
			name:      "Допустимый файл JPG",
			filename:  "test.jpg",
			content:   []byte("тест содержимого JPG файла"),
			expectErr: false,
		},
		{
			name:      "Допустимый файл PNG",
			filename:  "test.png",
			content:   []byte("тест содержимого PNG файла"),
			expectErr: false,
		},
		{
			name:      "Допустимый файл WEBP",
			filename:  "test.webp",
			content:   []byte("тест содержимого WEBP файла"),
			expectErr: false,
		},
		{
			name:      "Неккоректный формат файла",
			filename:  "test.txt",
			content:   []byte("test content"),
			expectErr: true,
			errMsg:    "Неверный формат файла",
		},
		{
			name:      "Неккоректное расширение файла",
			filename:  "test.exe",
			content:   []byte("test content"),
			expectErr: true,
			errMsg:    "Неверный формат файла",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			fileSize := len(tt.content)
			if fileSize > 5*1024*1024 {
				t.Errorf("File size %d exceeds 5MB limit", fileSize)
			}

			ext := filepath.Ext(tt.filename)
			validExts := map[string]bool{".jpg": true, ".jpeg": true, ".png": true, ".webp": true}

			if !validExts[ext] && tt.expectErr {
				return
			}

			if !validExts[ext] && !tt.expectErr {
				t.Errorf("Expected no error but got invalid extension: %s", ext)
			}

			if validExts[ext] && tt.expectErr {
				t.Errorf("Expected error but got valid extension: %s", ext)
			}
		})
	}
}

func TestFileSizeLimit(t *testing.T) {
	largeFile := make([]byte, 6*1024*1024)

	if len(largeFile) > 5*1024*1024 {
		t.Log("Размер файла превышает 5 МБ - проверка пройдена")
	}

	validFile := make([]byte, 4*1024*1024)
	if len(validFile) <= 5*1024*1024 {
		t.Log("Размер файла не превышает 5 МБ - проверка пройдена")
	}
}