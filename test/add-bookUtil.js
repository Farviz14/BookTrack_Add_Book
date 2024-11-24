const { describe, it, before, after } = require('mocha');
const chai = require('chai');
const chaiHttp = require('chai-http');
const sinon = require('sinon'); // Import Sinon for stubbing
const { app, server } = require('../index'); // Import the app and server
const Book = require('../models/book.js'); // Import the Book model
const expect = chai.expect;

chai.use(chaiHttp);

let baseUrl;
let createdBookIds = []; // Array to track created documents
let consoleErrorStub; // Stub for console.error

describe('Add Book API Tests', () => {
    // Setup before running tests
    before(async () => {
        const { address, port } = server.address();
        baseUrl = `http://${address === '::' ? 'localhost' : address}:${port}`;

        consoleErrorStub = sinon.stub(console, 'error');
    });

    // Cleanup after all tests
    after(async () => {
        consoleErrorStub.restore();

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
    it('should add a new book successfully', function (done) {
        this.timeout(15000); // Set timeout to 15000ms (15 seconds)

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

    // Test for simulating an error during the book save operation
    it('should return a 500 error when saving a book fails', (done) => {
        // Stub the save function to throw an error
        const saveStub = sinon.stub(Book.prototype, 'save').throws(new Error('Database save failed'));

        chai.request(baseUrl)
            .post('/addBook')
            .set('Content-Type', 'multipart/form-data')
            .attach('image', Buffer.from('fake-image-content'), 'test-image.jpg') // Mock image upload
            .field('title', 'Error Test Book')
            .field('author', 'Jane Doe')
            .field('isbn', '9876543210123')
            .field('genre', 'Science Fiction')
            .field('availableCopies', 5)
            .end((err, res) => {
                expect(res).to.have.status(500);
                expect(res.body).to.have.property('error', 'An error occurred while adding the book.');

                // Restore the original save function
                saveStub.restore();
                done();
            });
    });
});
