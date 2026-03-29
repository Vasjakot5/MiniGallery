package tests

import (
	"testing"
)

type TestUser struct {
	ID   int
	Role string
}

type TestImage struct {
	ID         int
	UploadedBy int
}

func TestImageDeletePermission(t *testing.T) {
	tests := []struct {
		name        string
		currentUser TestUser
		imageOwner  int
		canDelete   bool
	}{
		{
			name:        "Владелец может удалить свое изображение",
			currentUser: TestUser{ID: 1, Role: "user"},
			imageOwner:  1,
			canDelete:   true,
		},
		{
			name:        "Администратор может удалить любое изображение",
			currentUser: TestUser{ID: 2, Role: "admin"},
			imageOwner:  1,
			canDelete:   true,
		},
		{
			name:        "Другой пользователь не может удалить чужое изображение",
			currentUser: TestUser{ID: 3, Role: "user"},
			imageOwner:  1,
			canDelete:   false,
		},
		{
			name:        "Администратор может удалить свое изображение",
			currentUser: TestUser{ID: 1, Role: "admin"},
			imageOwner:  1,
			canDelete:   true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			canDelete := tt.currentUser.ID == tt.imageOwner || tt.currentUser.Role == "admin"

			if canDelete != tt.canDelete {
				t.Errorf("Не удалось выполнить проверку прав доступа. Ожидаемый результат: %v, Получаемый: %v", tt.canDelete, canDelete)
			} else {
				t.Logf("%s - проверка доступа пройдена", tt.name)
			}
		})
	}
}

func TestImageDeleteOwnership(t *testing.T) {
	images := []TestImage{
		{ID: 1, UploadedBy: 1},
		{ID: 2, UploadedBy: 2},
		{ID: 3, UploadedBy: 1},
	}

	tests := []struct {
		userID      int
		userRole    string
		canDeleteID []int
	}{
		{
			userID:      1,
			userRole:    "user",
			canDeleteID: []int{1, 3},
		},
		{
			userID:      2,
			userRole:    "user",
			canDeleteID: []int{2},
		},
		{
			userID:      3,
			userRole:    "admin",
			canDeleteID: []int{1, 2, 3},
		},
	}

	for _, tt := range tests {
		t.Run("UserID_"+string(rune(tt.userID)), func(t *testing.T) {
			for _, img := range images {
				canDelete := tt.userID == img.UploadedBy || tt.userRole == "admin"

				expected := false
				for _, id := range tt.canDeleteID {
					if id == img.ID {
						expected = true
						break
					}
				}

				if canDelete != expected {
					t.Errorf("Image %d: expected %v, got %v", img.ID, expected, canDelete)
				}
			}
		})
	}
}