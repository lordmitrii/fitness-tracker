package repository

import (
	"github.com/lordmitrii/golang-web-gin/internal/model"
	"github.com/lordmitrii/golang-web-gin/internal/config"

)

func FindAllUsers() []model.User {
	var users []model.User
	config.DB.Find(&users)
	return users
}

func InsertUser(user model.User) (model.User, error) {
	result := config.DB.Create(&user)
	return user, result.Error
}
