package repository

import "github.com/lordmitrii/golang-web-gin/internal/books"

type memoryRepository struct {
	books []books.Book
	nextID int
}

func NewMemoryRepository() BookRepository {
	return &memoryRepository{
		books:  make([]books.Book, 0),
		nextID: 1,
	}
}

func (r *memoryRepository) GetAll() []books.Book {
	return r.books
}

func (r *memoryRepository) Create(book books.Book) books.Book {
	book.ID = r.nextID
	r.nextID++
	r.books = append(r.books, book)
	return book
}
