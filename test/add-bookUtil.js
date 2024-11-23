const { describe, it, before, after } = require('mocha');
const chai = require('chai');
const chaiHttp = require('chai-http');
const { app, server } = require('../index'); // Import the app and server
const Book = require('../models/book.js'); // Import the Book model
const expect = chai.expect;

chai.use(chaiHttp);

let baseUrl;
let createdBookIds = []; // Array to track created documents

describe('Add Book API Tests', () => {
    // Setup before running tests
    before(async () => {
        const { address, port } = server.address();
        baseUrl = `http://${address === '::' ? 'localhost' : address}:${port}`;
    });

    // Cleanup after all tests
    after(async () => {
        if (createdBookIds.length > 0) {
            await Book.deleteMany({ _id: { $in: createdBookIds } }); // Remove all tracked test-created documents
        }

        return new Promise((resolve) => {
            server.close(() => {
                resolve();
            });
        });
    });

    // Test for adding a new book successfully
    it('should add a new book successfully', (done) => {
        chai.request(baseUrl)
            .post('/addBook')
            .set('Content-Type', 'multipart/form-data')
            .attach('image', Buffer.from('fake-image-content'), 'test-image.jpg') // Mock image upload
            .field('title', 'Testbook')
            .field('author', 'John Doe')
            .field('isbn', '1234567890098')
            .field('genre', 'Fiction')
            .field('availableCopies', 10)
            .end((err, res) => {
                expect(res).to.have.status(201);
                expect(res.body).to.have.property('message', 'Book added successfully!');
                
                // Track the book ID for cleanup
                if (res.body.bookId) {
                    createdBookIds.push(res.body.bookId);
                }

                done();
            });
    });

    // Test for duplicate book title
    it('should return an error for duplicate title', (done) => {
        chai.request(baseUrl)
            .post('/addBook')
            .set('Content-Type', 'multipart/form-data')
            .attach('image', Buffer.from('fake-image-content'), 'test-image.jpg') // Mock image upload
            .field('title', 'The Great Gatsby') // Same title as before
            .field('author', 'Jane Doe')
            .field('isbn', '9876547210123')
            .field('genre', 'Non-Fiction')
            .field('availableCopies', 5)
            .end((err, res) => {
                expect(res).to.have.status(400);
                expect(res.body).to.have.property('error', 'title_exists');
                done();
            });
    });

    // Test for duplicate ISBN
    it('should return an error for duplicate ISBN', (done) => {
        chai.request(baseUrl)
            .post('/addBook')
            .set('Content-Type', 'multipart/form-data')
            .attach('image', Buffer.from('fake-image-content'), 'test-image.jpg') // Mock image upload
            .field('title', 'test2')
            .field('author', 'Alice Doe')
            .field('isbn', '9786584956261') // Same ISBN as in the first test
            .field('genre', 'Biography')
            .field('availableCopies', 3)
            .end((err, res) => {
                expect(res).to.have.status(400);
                expect(res.body).to.have.property('error', 'isbn_exists');
                done();
            });
    });

    // Test for invalid ISBN
    it('should return an error for invalid ISBN', (done) => {
        chai.request(baseUrl)
            .post('/addBook')
            .set('Content-Type', 'multipart/form-data')
            .attach('image', Buffer.from('fake-image-content'), 'test-image.jpg') // Mock image upload
            .field('title', 'Invalid ISBN Book')
            .field('author', 'Alice Doe')
            .field('isbn', '123') // Invalid ISBN (not 13 digits)
            .field('genre', 'Drama')
            .field('availableCopies', 7)
            .end((err, res) => {
                expect(res).to.have.status(400);
                expect(res.body).to.have.property('error', 'isbn_invalid');
                done();
            });
    });
});
