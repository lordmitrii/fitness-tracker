package handler

import (
	"net/http"
	"github.com/gin-gonic/gin"
	"github.com/lordmitrii/golang-web-gin/internal/service"
	"github.com/lordmitrii/golang-web-gin/internal/model"
	"github.com/lordmitrii/golang-web-gin/internal/dto"

)

func GetUsers(c *gin.Context) {
	users := service.GetAllUsers()
	
	var userResponses []dto.UserResponse
	for _, u := range users {
		userResponses = append(userResponses, dto.UserResponse{
			ID:    u.ID,
			Name:  u.Name,
			Email: u.Email,
		})
	}
	
	c.JSON(http.StatusOK, userResponses)
}

func CreateUsers(c *gin.Context) {
	var userReq dto.UserRequest
	
	if err := c.ShouldBindJSON(&userReq); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	user := model.User{
		Name:  userReq.Name,
		Email: userReq.Email,
	}

	createdUser, err := service.CreateUser(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	userResp := dto.UserResponse{
		ID:    createdUser.ID,
		Name:  createdUser.Name,
		Email: createdUser.Email,
	}

	c.JSON(http.StatusCreated, userResp)
}
