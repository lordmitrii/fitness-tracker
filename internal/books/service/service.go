package service

import (
	"github.com/lordmitrii/golang-web-gin/internal/books"
	"github.com/lordmitrii/golang-web-gin/internal/books/repository"
)

type BookService interface {
	GetBooks() []books.Book
	AddBook(book books.Book) books.Book
}

type bookService struct {
	repo repository.BookRepository
}

func NewBookService(r repository.BookRepository) BookService {
	return &bookService{repo: r}
}

func (s *bookService) GetBooks() []books.Book {
	return s.repo.GetAll()
}

func (s *bookService) AddBook(book books.Book) books.Book {
	return s.repo.Create(book)
}
