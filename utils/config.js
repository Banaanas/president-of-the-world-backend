import dotenv from "dotenv";

// Loads environment variables from .env file
dotenv.config();

// Check if Environment Variables are available
// Especially for Production
console.log(dotenv.config());

// Set PORT
const PORT = process.env.PORT || 3001;

// SET DATABASE
let { MONGODB_URI } = process.env;

// PRODUCTION MODE - PRODUCTION DATABASE - Special Database for Production
if (process.env.NODE_ENV === "production") {
  MONGODB_URI = process.env.PRODUCTION_MONGODB_URI;
  console.log("Production Mode");
}

// DEVELOPMENT MODE - DEVELOPMENT DATABASE - Special Database for Development
if (process.env.NODE_ENV === "development") {
  MONGODB_URI = process.env.DEVELOPMENT_MONGODB_URI;
  console.log("Development Mode");
}

// TEST MODE - TESTING DATABASE - Special Database for Testing
if (process.env.NODE_ENV === "test") {
  MONGODB_URI = process.env.TESTING_MONGODB_URI;
  console.log("Testing Mode");
}

console.log(MONGODB_URI);

export default {
  PORT,
  MONGODB_URI,
};
