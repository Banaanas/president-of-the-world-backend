import { ApolloServer } from "apollo-server";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import typeDefs from "./typeDefs/typeDefs.js";
import resolvers from "./resolvers/resolvers.js";
import User from "./models/user.js";
import logger from "./utils/logger.js";
import config from "./utils/config.js";

// Log Info
logger.logInfo("Connecting to", config.MONGODB_URI);

// Connection to DB - Function
const connectToDB = async () => {
  const databaseURL = config.MONGODB_URI;

  try {
    await mongoose.connect(databaseURL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB");
  } catch (e) {
    console.log("Error connecting to MongoDB:", e.message);
  }
};
connectToDB();

// Debug Mode
mongoose.set("debug", true);

// Apollo Server
const server = new ApolloServer({
  typeDefs,
  resolvers,
  // Object returned by Context is passed to all Resolvers
  // Extract token from the Authorization header
  // Create Token property from Request Object
  context: async ({ req }) => {
    const authorization = req ? req.headers.authorization : null;
    if (authorization && authorization.toLowerCase().startsWith("bearer")) {
      const decodedToken = jwt.verify(
        authorization.substring(7),
        process.env.ACCESS_TOKEN_SECRET,
      );

      // populate() method defines that the ids referencing User objects (= Friends)
      // in the Candidate field of the User documents will be replaced by the referenced
      // Contact documents.
      const currentUser = await User.findById(decodedToken.id).populate(
        "candidate",
      );

      return { currentUser };
    }
  },
  introspection: true,
  playground: true,
  persistedQueries: false,
});

server.listen({ port: config.PORT | 3002 }).then(({ url, port }) => {
  console.log(`Server ready at ${url} on PORT ${port}`);
});
