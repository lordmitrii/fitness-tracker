package service

import (
	"github.com/lordmitrii/golang-web-gin/internal/model"
	"github.com/lordmitrii/golang-web-gin/internal/repository"
)

func GetAllUsers() []model.User {
	return repository.FindAllUsers()
}

func CreateUser(user model.User) (model.User,error) {
	return repository.InsertUser(user)
}