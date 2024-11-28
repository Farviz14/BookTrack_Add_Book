const sinon = require('sinon');

describe('BookTrack Add-Book Frontend Tests', () => {
  let baseUrl;

  before(() => {
    cy.task('startServer').then((url) => {
      baseUrl = url; // Store the base URL
      cy.visit(baseUrl);
    });
  });

  after(() => {
    return cy.task('stopServer'); // Stop the server after the report is done
  });

  // Test to open the Add Book form
  it('should open the Add Book form when clicking "Add Book" button', () => {
    cy.visit(baseUrl);

    cy.get('.add-book-btn').click(); // Click on the "Add Book" button
    cy.get('#formContainer').should('be.visible'); // Ensure the Add Book form is visible
  });

  // Test to ensure submission is blocked when required fields are missing
  it('should not allow submission if any required field is missing', () => {
    cy.visit(baseUrl);

    cy.get('.add-book-btn').click(); // Open the Add Book form
    cy.get('#submitbk').click(); // Try to submit without filling out the form
    cy.on('window:alert', (str) => {
      expect(str).to.equal('All fields are required. Please fill in the required fields.');
    });
  });

  // Test for character limit validation on the title field
  it('should not allow submission if the title exceeds 100 characters', () => {
    cy.visit(baseUrl);

    cy.get('.add-book-btn').click();
    cy.get('#title').type('A'.repeat(101)); // Enter a long title
    cy.get('#author').type('Valid Author');
    cy.get('#isbn').type('9781234567890');
    cy.get('#genre').select('Fiction');
    cy.get('#copies').type('5');
    cy.get('#image').attachFile('test-image.jpg');
    cy.get('#submitbk').click();
    cy.on('window:alert', (str) => {
      expect(str).to.equal('Title should not exceed 100 characters.');
    });
  });

  // Test for character limit validation on the author field
  it('should not allow submission if the author exceeds 150 characters', () => {
    cy.visit(baseUrl);

    cy.get('.add-book-btn').click();
    cy.get('#title').type('Valid Book Title');
    cy.get('#author').type('A'.repeat(151)); // Enter a long author name
    cy.get('#isbn').type('9781234567890');
    cy.get('#genre').select('Fiction');
    cy.get('#copies').type('5');
    cy.get('#image').attachFile('test-image.jpg');
    cy.get('#submitbk').click();
    cy.on('window:alert', (str) => {
      expect(str).to.equal("Author's name should not exceed 150 characters.");
    });
  });

  // Test for invalid ISBN validation
  it('should not allow submission if ISBN is invalid', () => {
    cy.visit(baseUrl);

    cy.get('.add-book-btn').click();
    cy.get('#title').type('Valid Book Title');
    cy.get('#author').type('Valid Author');
    cy.get('#isbn').type('1234567890'); // Invalid ISBN
    cy.get('#genre').select('Fiction');
    cy.get('#copies').type('5');
    cy.get('#image').attachFile('test-image.jpg');
    cy.get('#submitbk').click();
    cy.on('window:alert', (str) => {
      expect(str).to.equal('Please enter a valid ISBN number.');
    });
  });

  it('should reset the form when the user cancels the confirmation', () => {
    cy.visit(baseUrl); // Navigate to the base URL
  
    // Open the Add Book form by clicking the "Add Book" button
    cy.get('.add-book-btn').click();
  
    // Fill in the form fields
    cy.get('#title').type('Test Book Title');
    cy.get('#author').type('Test Author');
    cy.get('#isbn').type('9781234567890');
    cy.get('#genre').select('Fiction');
    cy.get('#copies').type('5');
    cy.get('#image').attachFile('test-image.jpg');
  
    // Stub the confirm dialog to simulate user cancellation
    cy.window().then((win) => {
      cy.stub(win, 'confirm').returns(false);
    });
  
    // Click the "Add Book" button to trigger confirmation
    cy.get('#submitbk').click();
  
    // Assert that all fields are reset after the user cancels
    cy.get('#title').should('have.value', ''); // Title should be empty
    cy.get('#author').should('have.value', ''); // Author should be empty
    cy.get('#isbn').should('have.value', ''); // ISBN should be empty
    cy.get('#genre').should('have.value', null); // Genre should be reset to default
    cy.get('#copies').should('have.value', ''); // Copies should be empty
    cy.get('#image').should('have.value', ''); // Image should be empty
  
    // Assert that the form is closed
    cy.get('#formContainer').should('not.be.visible');
  });
  

  it('should successfully add a book when all fields are valid', () => {
    cy.intercept('POST', '/addBook', {
      statusCode: 201,
      body: { message: 'Book added successfully!' },
    }).as('addBookRequest');
  
    cy.visit(baseUrl); // Navigate to the base URL
  
    // Open the Add Book form and fill in valid details
    cy.get('.add-book-btn').click();
    cy.get('#title').type('Valid Book Title');
    cy.get('#author').type('Valid Author');
    cy.get('#isbn').type('9781234567890');
    cy.get('#genre').select('Fiction');
    cy.get('#copies').type('5');
    cy.get('#image').attachFile('test-image.jpg');
    cy.get('#submitbk').click();
  
    // Wait for the intercepted request to ensure it was triggered
    cy.wait('@addBookRequest');
  
    // Check for the success alert
    cy.on('window:alert', (str) => {
      expect(str).to.equal('Book added successfully!');
    });
  
    // After alert, check that the form closes
    cy.get('#formContainer').should('not.be.visible');
  
    // Reopen the form to verify that fields are reset
    cy.get('.add-book-btn').click();
  
    // Assert that all fields are cleared
    cy.get('#title').should('have.value', ''); // Title should be empty
    cy.get('#author').should('have.value', ''); // Author should be empty
    cy.get('#isbn').should('have.value', ''); // ISBN should be empty
    cy.get('#genre').should('have.value', null); // Genre should be reset to default
    cy.get('#copies').should('have.value', ''); // Copies should be empty
    cy.get('#image').should('have.value', ''); // Image should be empty
  });
  
  

  it('should display "No Image Selected" in the image preview when no image is uploaded', () => {
    cy.visit(baseUrl); // Navigate to the base URL
  
    // Open the Add Book form by clicking the "Add Book" button
    cy.get('.add-book-btn').click();
  
    // Verify that the "No Image Selected" message is present in the image preview container
    cy.get('#imagePreview').should('contain.text', 'No Image Selected');
  });
  

  // Test for image size validation
  it('should not allow submission if the image file size exceeds 16 MB', () => {
    cy.visit(baseUrl);

    cy.get('.add-book-btn').click();
    cy.get('#title').type('Valid Book Title');
    cy.get('#author').type('Valid Author');
    cy.get('#isbn').type('9781234549890');
    cy.get('#genre').select('Fiction');
    cy.get('#copies').type('5');
    cy.get('#image').attachFile('large-image.jpg'); // Large file

    cy.on('window:alert', (str) => {
      expect(str).to.equal('The image file size should not exceed 16 MB.');
    });

  });


  it('should clear the form fields when clicking outside and reopening the form', () => {
    cy.visit(baseUrl); // Navigate to the base URL

    // Open the Add Book form by clicking the "Add Book" button
    cy.get('.add-book-btn').click();

    // Fill in the form fields
    cy.get('#title').type('Test Book Title');
    cy.get('#author').type('Test Author');
    cy.get('#isbn').type('9781234567890');
    cy.get('#genre').select('Fiction');
    cy.get('#copies').type('5');
    cy.get('#image').attachFile('test-image.jpg');

    // Click outside the form to close it
    cy.get('#overlay').click({ force: true }); // Use force to ensure overlay is clicked

    // Reopen the Add Book form by clicking the "Add Book" button
    cy.get('.add-book-btn').click();

    // Assert that all fields are cleared
    cy.get('#title').should('have.value', ''); // Title should be empty
    cy.get('#author').should('have.value', ''); // Author should be empty
    cy.get('#isbn').should('have.value', ''); // ISBN should be empty
    cy.get('#genre').should('have.value', null); // Genre should be reset to default
    cy.get('#copies').should('have.value', ''); // Copies should be empty
    cy.get('#image').should('have.value', ''); // Image should be empty
});

  // Test to ensure submission fails if the title already exists
  it('should not allow submission if the title already exists', () => {
    cy.visit(baseUrl);

    cy.get('.add-book-btn').click();
    cy.get('#title').type('The Alchemist'); // Duplicate title
    cy.get('#author').type('F. Scott Fitzgerald');
    cy.get('#isbn').type('9780807286005');
    cy.get('#genre').select('Fiction');
    cy.get('#copies').type('5');
    cy.get('#image').attachFile('test-image.jpg');
    cy.get('#submitbk').click();

    cy.on('window:alert', (str) => {
      expect(str).to.equal('The title already exists. Please use a unique title.');
    });
  });

  // Test to ensure submission fails if the ISBN already exists
  it('should not allow submission if the ISBN already exists', () => {
    cy.visit(baseUrl);

    cy.get('.add-book-btn').click();
    cy.get('#title').type('Unique Title');
    cy.get('#author').type('Author Name');
    cy.get('#isbn').type('9780316769488'); // Duplicate ISBN
    cy.get('#genre').select('Mystery');
    cy.get('#copies').type('3');
    cy.get('#image').attachFile('test-image.jpg');
    cy.get('#submitbk').click();

    cy.on('window:alert', (str) => {
      expect(str).to.equal('The ISBN already exists. Please use a unique ISBN.');
    });
  });

  it('should handle the invalid ISBN error from the backend', () => {
    cy.visit(baseUrl); // Navigate to the base URL
  
    // Open the Add Book form
    cy.get('.add-book-btn').click();
  
    // Fill out the form with valid data
    cy.get('#title').type('Unique Book Title');
    cy.get('#author').type('Test Author');
    cy.get('#isbn').type('9781234567890'); // Let's assume this ISBN is invalid
    cy.get('#genre').select('Fiction');
    cy.get('#copies').type('5');
    cy.get('#image').attachFile('test-image.jpg');
  
    // Use cy.intercept() to intercept the POST request to /addBook
    cy.intercept('POST', 'http://localhost:5500/addBook', {
      statusCode: 400, // Indicates a Bad Request
      body: {
        error: 'isbn_invalid', // Response body indicating invalid ISBN error
      },
    }).as('addBookRequest');
  
    // Submit the form
    cy.get('#submitbk').click();
  
    // Wait for the intercepted POST request and check the behavior
    cy.wait('@addBookRequest');
  
    // Assert that an alert is shown to the user
    cy.on('window:alert', (alertText) => {
      expect(alertText).to.equal('Please enter a valid ISBN number.');
    });
  });


  // Test case for simulating failed backend validation (Failed to add book)
  it('should display "Failed to add book" alert on backend validation failure', () => {
    // Stub the backend response with a failure status
    cy.intercept('POST', '/addBook', {
      statusCode: 400, // Simulate a backend failure response
      body: {
        error: 'unknown_error'
      }
    }).as('failedAddBook');

    // Visit the page and fill in the form
    cy.visit(baseUrl);
    cy.get('.add-book-btn').click();
    cy.get('#title').type('Valid Book Title');
    cy.get('#author').type('Valid Author');
    cy.get('#isbn').type('9781234567890');
    cy.get('#genre').select('Fiction');
    cy.get('#copies').type('5');
    cy.get('#image').attachFile('test-image.jpg');
    cy.get('#submitbk').click();

    // Verify the alert is triggered with 'Failed to add book'
    cy.on('window:alert', (str) => {
      expect(str).to.equal('Failed to add book.');
    });
  });

  // Test case for simulating error during fetch (Network or server error)
  it('should display "An error occurred while adding the book" alert on network error', () => {
    // Stub the backend response to simulate a network error
    cy.intercept('POST', '/addBook', {
      forceNetworkError: true // Simulate a network failure
    }).as('networkErrorAddBook');

    // Visit the page and fill in the form
    cy.visit(baseUrl);
    cy.get('.add-book-btn').click();
    cy.get('#title').type('Valid Book Title');
    cy.get('#author').type('Valid Author');
    cy.get('#isbn').type('9781234567890');
    cy.get('#genre').select('Fiction');
    cy.get('#copies').type('5');
    cy.get('#image').attachFile('test-image.jpg');
    cy.get('#submitbk').click();

    // Verify the alert is triggered with 'An error occurred while adding the book'
    cy.on('window:alert', (str) => {
      expect(str).to.equal('An error occurred while adding the book.');
    });
  });
  
});
