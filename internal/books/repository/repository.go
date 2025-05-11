package repository

import "github.com/lordmitrii/golang-web-gin/internal/books"

type BookRepository interface {
	GetAll() []books.Book
	Create(book books.Book) books.Book
}
