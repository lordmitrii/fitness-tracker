package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/lordmitrii/golang-web-gin/internal/books"
	"github.com/lordmitrii/golang-web-gin/internal/books/repository"
	"github.com/lordmitrii/golang-web-gin/internal/books/service"
)

func RegisterRoutes(r *gin.Engine) {
	repo := repository.NewMemoryRepository()
	svc := service.NewBookService(repo)

	h := &handler{
		service: svc,
	}

	group := r.Group("/books")
	group.GET("", h.GetBooks)
	group.POST("", h.CreateBook)
}

type handler struct {
	service service.BookService
}

func (h *handler) GetBooks(c *gin.Context) {
	books := h.service.GetBooks()
	c.JSON(http.StatusOK, books)
}

func (h *handler) CreateBook(c *gin.Context) {
	var book books.Book
	if err := c.ShouldBindJSON(&book); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	created := h.service.AddBook(book)
	c.JSON(http.StatusCreated, created)
}
