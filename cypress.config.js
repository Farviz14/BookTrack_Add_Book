const { defineConfig } = require("cypress");
const { spawn } = require("child_process");

let server;
let baseUrl;

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      require("@cypress/code-coverage/task")(on, config);

      on("task", {
        // Start server task
        startServer() {
          return new Promise((resolve, reject) => {
            if (server) {
              console.log("Server already running.");
              resolve(baseUrl);
              return;
            }

            server = spawn("node", ["-r", "nyc", "index-test.js"]);

            server.stdout.on("data", (data) => {
              const output = data.toString();
              console.log(output);

              if (output.includes("BookTrack app running at:")) {
                const baseUrlPrefix = "BookTrack app running at: ";
                const startIndex = output.indexOf(baseUrlPrefix);
                if (startIndex !== -1) {
                  baseUrl = output.substring(startIndex + baseUrlPrefix.length).trim();
                  resolve(baseUrl);
                }
              }
            });

            server.stderr.on("data", (data) => {
              console.error("Server error:", data.toString());
              reject(data);
            });

            server.on("close", (code) => {
              console.log(`Server process exited with code ${code}`);
              server = null;
            });

            server.on("error", (error) => {
              console.error("Error starting server:", error);
              reject(error);
            });
          });
        },
        // Stop server task
        stopServer() {
          if (server) {
            server.kill();
            console.log("Server stopped.");
          } else {
            console.log("No server to stop.");
          }
          return null;
        },
      });

      return config;
    },
  },
});
