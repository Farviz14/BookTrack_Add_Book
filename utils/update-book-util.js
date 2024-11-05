// Import the Book model to interact with the database
const Book = require('../models/Books');
// Import mongoose to validate object IDs
const mongoose = require('mongoose'); 

// Define an asynchronous function to handle updating a book by ID
async function updateBook(req, res) {
    try {
        // Extract the book ID from the URL parameters
        const { id } = req.params;

        // Destructure the updated book details from the request body
        const { title, author, isbn, genre, availableCopies } = req.body;

        // Handle image update if a new image is provided
        let imageBase64;
        if (req.file) {
            imageBase64 = req.file.buffer.toString('base64');
        }

        // Find the book by ID and update it with new details
        const updatedBook = await Book.findByIdAndUpdate(id, {
            title,
            author,
            isbn,
            genre,
            availableCopies,
            ...(req.file && { image: imageBase64 }), // Update image if a new one is uploaded
        }, { new: true }); // Return the updated book document

        if (updatedBook) {
            res.status(200).json({ message: 'Book updated successfully!', book: updatedBook });
        } else {
            res.status(404).json({ error: 'Book not found' });
        }
    } catch (error) {
        console.error('Error updating book:', error);
        res.status(500).json({ error: 'An error occurred while updating the book.' });
    }
}

// Define an asynchronous function to fetch a book by ID
async function fetchBookById(req, res) {
    const { id } = req.params; // Get the ID from the route parameters
    const sanitizedId = id.trim(); // Trim any whitespace from the ID

    // Check if the provided ID is a valid MongoDB ObjectId
    if (!mongoose.isValidObjectId(sanitizedId)) {
        return res.status(400).send('Invalid book ID format');
    }

    try {
        const book = await Book.findById(sanitizedId); // Fetch the book by ID
        if (!book) {
            return res.status(404).send('Book not found'); // If no book is found, return a 404 status
        }
        res.json(book); // Send the book as a JSON response
    } catch (error) {
        console.error('Error fetching book by ID:', error);
        res.status(500).send('Server error'); // Handle any server errors
    }
}

module.exports = { updateBook,fetchBookById  }; // Export the updateBook function to be used in index.js
