const { defineConfig } = require("cypress");
const { spawn } = require("child_process");

let server;
let baseUrl;

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // Enable Cypress code coverage
      require("@cypress/code-coverage/task")(on, config);

      on("task", {
        startServer() {
          return new Promise((resolve, reject) => {
            // Check if the server is already running
            if (server) {
              resolve(baseUrl); // Return the existing base URL
            }
            // Spawn the server process using the required file (index-test.js)
            server = spawn("node", ["-r", "nyc", "index-test.js"]);

            // Listen to server stdout
            server.stdout.on("data", (data) => {
              console.log(data.toString()); // Log server output for debugging

              // Check if the server is running successfully
              if (data.toString().includes("BookTrack app running at:")) {
                const baseUrlPrefix = "BookTrack app running at: ";
                const startIndex = data.toString().indexOf(baseUrlPrefix);
                if (startIndex !== -1) {
                  baseUrl = data
                    .toString()
                    .substring(startIndex + baseUrlPrefix.length)
                    .trim();
                  resolve(baseUrl); // Return the resolved base URL
                }
              }
            });

            // Handle server stderr for errors
            server.stderr.on("data", (data) => {
              console.error("Server error:", data.toString());
              reject(data); // Reject if server fails
            });
          });
        },
        stopServer() {
          if (server) {
            server.kill(); // Stop the server process
            console.log("Server stopped.");
          }
          return null;
        },
      });

      return config; // Return the Cypress configuration
    },
  },
});
