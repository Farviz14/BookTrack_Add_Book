describe('BookTrack Frontend Tests', () => {
  let baseUrl;

  // Start the server before running the tests
  before(() => {
    cy.task('startServer').then((url) => {
      baseUrl = url; // Store the base URL for use in tests
    });
  });

  // Stop the server after all tests are completed
  after(() => {
    return new Promise((resolve) => {
      setTimeout(() => {
        cy.task('stopServer').then(() => resolve());
      }, 30000); // Add a 10-second delay
    });
  });

  // Test to open the Add Book form
  it('should open the Add Book form when clicking "Add Book" button', () => {
    cy.visit(baseUrl); // Navigate to the base URL

    cy.get('.add-book-btn').click(); // Click on the "Add Book" button
    cy.get('#formContainer').should('be.visible'); // Ensure the Add Book form is visible
  });

  // Test to ensure submission is blocked when required fields are missing
  it('should not allow submission if any required field is missing', () => {
    cy.visit(baseUrl); // Navigate to the base URL

    cy.get('.add-book-btn').click(); // Open the Add Book form
    cy.get('#submitbk').click(); // Try to submit without filling out the form
    cy.on('window:alert', (str) => {
      expect(str).to.equal('All fields are required. Please fill in the required fields.');
    });
  });

  // Test for character limit validation on the title field
  it('should not allow submission if the title exceeds 100 characters', () => {
    cy.visit(baseUrl); // Navigate to the base URL

    cy.get('.add-book-btn').click(); // Open the Add Book form
    cy.get('#title').type('A'.repeat(101)); // Enter a long title
    cy.get('#author').type('Valid Author'); // Enter a valid author
    cy.get('#isbn').type('9781234567890'); // Enter a valid ISBN
    cy.get('#genre').select('Fiction'); // Select a genre
    cy.get('#copies').type('5'); // Enter valid copies
    cy.get('#image').attachFile('test-image.jpg'); // Attach a valid image
    cy.get('#submitbk').click(); // Try to submit the form
    cy.on('window:alert', (str) => {
      expect(str).to.equal('Title should not exceed 100 characters.');
    });
  });

  // Test for character limit validation on the author field
  it('should not allow submission if the author exceeds 150 characters', () => {
    cy.visit(baseUrl); // Navigate to the base URL

    cy.get('.add-book-btn').click(); // Open the Add Book form
    cy.get('#title').type('Valid Book Title'); // Enter a valid title
    cy.get('#author').type('A'.repeat(151)); // Enter a long author name
    cy.get('#isbn').type('9781234567890'); // Enter a valid ISBN
    cy.get('#genre').select('Fiction'); // Select a genre
    cy.get('#copies').type('5'); // Enter valid copies
    cy.get('#image').attachFile('test-image.jpg'); // Attach a valid image
    cy.get('#submitbk').click(); // Try to submit the form
    cy.on('window:alert', (str) => {
      expect(str).to.equal("Author's name should not exceed 150 characters.");
    });
  });

  // Test for invalid ISBN validation
  it('should not allow submission if ISBN is invalid', () => {
    cy.visit(baseUrl); // Navigate to the base URL

    cy.get('.add-book-btn').click(); // Open the Add Book form
    cy.get('#title').type('Valid Book Title'); // Enter a valid title
    cy.get('#author').type('Valid Author'); // Enter a valid author
    cy.get('#isbn').type('1234567890'); // Enter an invalid ISBN
    cy.get('#genre').select('Fiction'); // Select a genre
    cy.get('#copies').type('5'); // Enter valid copies
    cy.get('#image').attachFile('test-image.jpg'); // Attach a valid image
    cy.get('#submitbk').click(); // Try to submit the form
    cy.on('window:alert', (str) => {
      expect(str).to.equal('Please enter a valid ISBN number.');
    });
  });

  // Test for successful book addition
  it('should successfully add a book when all fields are valid', () => {
    // Intercept the POST request to /addBook
    cy.intercept('POST', '/addBook').as('apiResponse');

    cy.visit(baseUrl);

    cy.get('.add-book-btn').click(); // Open the Add Book form
    cy.get('#title').type('Valid Book Title'); // Enter a valid title
    cy.get('#author').type('Valid Author'); // Enter a valid author
    cy.get('#isbn').type('9781234567890'); // Enter a valid ISBN
    cy.get('#genre').select('Fiction'); // Select a genre
    cy.get('#copies').type('5'); // Enter valid copies
    cy.get('#image').attachFile('test-image.jpg'); // Attach a valid image
    cy.get('#submitbk').click(); // Submit the form

    // Wait for the API response
    cy.wait('@apiResponse').then(({ request, response }) => {
      cy.log('Intercepted Request:', request);
      cy.log('Intercepted Response:', response);

      // Assert the response
      expect(response).to.have.property('statusCode', 201);
      expect(response.body).to.have.property('message', 'Book added successfully!');
      expect(response.body).to.have.property('bookId').and.not.be.null;
    });
  });

  // Test to ensure form is reset when the user cancels the confirmation
  it('should reset the form if the user cancels the confirmation', () => {
    cy.visit(baseUrl); // Navigate to the base URL

    cy.get('.add-book-btn').click(); // Open the Add Book form
    cy.get('#title').type('Book to Cancel'); // Enter a valid title
    cy.get('#author').type('Author to Cancel'); // Enter a valid author
    cy.get('#isbn').type('9789876543210'); // Enter a valid ISBN
    cy.get('#genre').select('Non-Fiction'); // Select a genre
    cy.get('#copies').type('3'); // Enter valid copies
    cy.get('#image').attachFile('test-image.jpg'); // Attach a valid image
    cy.window().then((win) => {
      cy.stub(win, 'confirm').returns(false); // Stub the confirm dialog to simulate cancellation
    });
    cy.get('#submitbk').click(); // Try to submit the form
    cy.get('.add-book-btn').click(); // Open the Add Book form again
    cy.get('#title').should('have.value', ''); // Ensure the title field is reset
    cy.get('#author').should('have.value', ''); // Ensure the author field is reset
    cy.get('#isbn').should('have.value', ''); // Ensure the ISBN field is reset
    cy.get('#genre').should('have.value', null); // Ensure the genre field is reset to default
    cy.get('#copies').should('have.value', ''); // Ensure the copies field is reset
    cy.get('#image').should('have.value', ''); // Ensure the image field is reset
  });

  // Test for image size validation
  it('should not allow submission if the image file size exceeds 16 MB', () => {
    cy.visit(baseUrl); // Navigate to the base URL

    cy.get('.add-book-btn').click(); // Open the Add Book form
    cy.get('#title').type('Valid Book Title'); // Enter a valid title
    cy.get('#author').type('Valid Author'); // Enter a valid author
    cy.get('#isbn').type('9781234567890'); // Enter a valid ISBN
    cy.get('#genre').select('Fiction'); // Select a genre
    cy.get('#copies').type('5'); // Enter valid copies
    cy.get('#image').attachFile('large-image.jpg'); // Attach a large image file

    cy.on('window:alert', (str) => {
      expect(str).to.equal('The image file size should not exceed 16 MB.');
    });

    // Verify that the image preview is reset to "No Image Selected"
    cy.get('#imagePreview').should('contain', 'No Image Selected');
  });

  // Test to ensure submission fails if the title already exists
  it('should not allow submission if the title already exists', () => {
    cy.visit(baseUrl); // Navigate to the base URL

    cy.get('.add-book-btn').click(); // Open the Add Book form
    cy.get('#title').type('The Great Gatsby'); // Enter a title that already exists
    cy.get('#author').type('F. Scott Fitzgerald'); // Enter a valid author
    cy.get('#isbn').type('9781234567890'); // Enter a valid ISBN
    cy.get('#genre').select('Fiction'); // Select a genre
    cy.get('#copies').type('5'); // Enter valid copies
    cy.get('#image').attachFile('test-image.jpg'); // Attach a valid image
    cy.get('#submitbk').click(); // Submit the form

    // Verify the alert for title already exists
    cy.on('window:alert', (str) => {
      expect(str).to.equal('The title already exists. Please use a unique title.');
    });
  });

  // Test to ensure submission fails if the ISBN already exists
  it('should not allow submission if the ISBN already exists', () => {
    cy.visit(baseUrl); // Navigate to the base URL

    cy.get('.add-book-btn').click(); // Open the Add Book form
    cy.get('#title').type('Unique Title'); // Enter a unique title
    cy.get('#author').type('Author Name'); // Enter a valid author
    cy.get('#isbn').type('9780807286005'); // Enter an ISBN that already exists
    cy.get('#genre').select('Mystery'); // Select a genre
    cy.get('#copies').type('3'); // Enter valid copies
    cy.get('#image').attachFile('test-image.jpg'); // Attach a valid image
    cy.get('#submitbk').click(); // Submit the form

    // Verify the alert for ISBN already exists
    cy.on('window:alert', (str) => {
      expect(str).to.equal('The ISBN already exists. Please use a unique ISBN.');
    });
  });
});
