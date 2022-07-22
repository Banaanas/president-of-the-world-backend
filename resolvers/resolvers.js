import {
  AuthenticationError,
  ForbiddenError,
  UserInputError,
} from "apollo-server";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import User from "../models/user.js";
import Candidate from "../models/candidate.js";

//* ** RESOLVERS ***//
const resolvers = {
  // QUERIES
  Query: {
    // LOGGED IN USER- Return Logged In User
    loggedInUser: async (root, args, context) => {
      return context.currentUser;
    },

    // CANDIDATES COUNT
    allCandidatesCount: () => Candidate.collection.countDocuments(),

    // ALL CANDIDATES (ALL/NAME)
    allCandidates: async (root, { candidateLastName }) => {
      // Return Candidate if lastName is found
      if (candidateLastName) {
        return Candidate.find({ lastName: candidateLastName });
      }

      // Return all Candidates
      if (!candidateLastName) {
        return Candidate.find({});
      }
    },
  },

  // MUTATIONS
  Mutation: {
    // CREATE USER
    createUser: async (root, args) => {
      // Because password.length !== passwordHash.length, password.length should be validated
      // in the Controller (and not the Model)
      if (args.password.length < 5) {
        throw new UserInputError("Password is too short", {
          invalidArgs: args.name,
        });
      }

      // Because password.length !== passwordHash.length, password.length should be validated
      // in the Controller (and not the Model)
      if (args.password.length > 15) {
        throw new UserInputError("Password is too long", {
          invalidArgs: args.name,
        });
      }

      // Because password.length !== passwordHash.length, password.length should be validated
      // in the Controller (and not the Model)
      if (args.password.localeCompare(args.passwordConfirmation) !== 0) {
        throw new UserInputError(
          "Password and Password Confirmation don't match",
          {
            invalidArgs: args.name,
          },
        );
      }

      // Hash Password
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(args.password, saltRounds);

      const newUser = new User({ username: args.username, passwordHash });

      // Save into DB
      try {
        await newUser.save();
      } catch (error) {
        throw new UserInputError(error.message, {
          invalidArgs: args.name,
        });
      }

      return newUser;
    },

    // LOGIN
    login: async (root, args) => {
      const user = await User.findOne({ username: args.username });
      if (!user) {
        throw new UserInputError("Wrong Username");
      }

      // Check Password
      // Return a Promise --> use of Await
      const isPasswordCorrect = await bcrypt.compare(
        args.password,
        user.passwordHash,
      );

      if (!isPasswordCorrect) {
        throw new UserInputError("Wrong Password");
      }

      // User Object for Token
      const userForToken = {
        username: user.username,
        id: user._id,
      };

      // Generate Token
      const generatedToken = jwt.sign(
        userForToken,
        process.env.ACCESS_TOKEN_SECRET,
      );
      const loggedInUser = await User.findById(user.id).populate("candidate");

      return { token: generatedToken, user: loggedInUser };
    },

    // ADD CANDIDATE
    addCandidate: async (
      root,
      { candidateLastName, candidateFirstName, country, politicalOrientation },
      context,
    ) => {
      // User Authorization
      const { currentUser } = context;

      if (!currentUser) {
        throw new AuthenticationError("User not authenticated");
      }

      // If User already have 1 candidate, Return Error
      if (currentUser?.candidate) {
        throw new Error("User can not add more than 1 Candidate");
      }

      //* CANDIDATE *//
      // New Candidate
      const newCandidate = new Candidate({
        lastName: candidateLastName,
        firstName: candidateFirstName,
        country,
        politicalOrientation,
        votes: 0,
      });

      // Define Author's ID
      let candidateID;

      // Save new Candidate into DB
      try {
        const savedCandidate = await newCandidate.save();
        candidateID = savedCandidate._id;
      } catch (error) {
        // Model Validation (unique, length, etc.)
        throw new UserInputError(error.message);
      }

      // Add Candidate (ID) to Current User
      currentUser.candidate = candidateID;

      // Save updated currentUser (with new Candidate)
      try {
        await currentUser.save();
      } catch (error) {
        // Model Validation (unique, length, etc.)
        throw new UserInputError(error.message);
      }

      // Return newCandidate
      return newCandidate;
    },

    // UPDATE CANDIDATE
    updateCandidate: async (
      root,
      { country, politicalOrientation, id },
      context,
    ) => {
      // User Authorization
      const { currentUser } = context;

      if (!currentUser) {
        throw new AuthenticationError("User not authenticated");
      }

      // If No Candidate is found
      const updatedCandidate = await Candidate.findById(id);
      if (!updatedCandidate) {
        return null;
      }

      try {
        // Update Candidate
        const candidateObject = {
          country,
          politicalOrientation,
        };

        return await Candidate.findByIdAndUpdate(id, candidateObject, {
          new: true,
          // findByIdAndUpdate needs runValidators: true to apply Mongoose candidateSchema
          runValidators: true,
        });
      } catch (error) {
        // Model Validation (unique, length, etc.)
        throw new Error(error.message);
      }
    },

    // VOTE FOR CANDIDATE
    voteCandidate: async (root, { id }) => {
      try {
        return await Candidate.findByIdAndUpdate(
          id,
          {
            $inc: { votes: 1 }, // Increment Vote (+1)
          },
          {
            new: true, // Return Updated Document
            // findByIdAndUpdate needs runValidators: true to apply Mongoose candidateSchema
            runValidators: true,
          },
        );
      } catch (error) {
        // Model Validation (unique, length, etc.)
        throw new Error(error.message);
      }
    },

    // DELETE CANDIDATE
    deleteCandidate: async (root, { id }, context) => {
      // User Authorization
      const { currentUser } = context;

      if (!currentUser) {
        throw new AuthenticationError("User not authenticated");
      }

      // Delete Candidate
      try {
        await Candidate.findByIdAndDelete(id);
      } catch (e) {
        throw new Error("Candidate not found");
      }

      // Remove Candidate ID's reference from User Document

      // Add Candidate (ID) to Current User
      currentUser.candidate = null;

      // Save updated currentUser (with new Candidate)
      try {
        await currentUser.save();
      } catch (error) {
        // Model Validation (unique, length, etc.)
        throw new UserInputError(error.message);
      }

      // Return currentUser
      return currentUser;
    },

    // TEST MODE - FRONT END TEST - E2E
    // RESET - DELETE ALL DOCUMENTS IN ALL COLLECTIONS BUT KEEPS COLLECTIONS STRUCTURE
    resetAllDocuments: async () => {
      if (process.env.NODE_ENV !== "test") {
        throw new ForbiddenError(
          "Reset All Documents is only available in TEST Mode",
        );
      }

      // Delete all Collections
      try {
        await Candidate.deleteMany({});
        await User.deleteMany({});
      } catch (e) {
        throw new Error("Test Mode - Reset Collection - Error");
      }
    },
  },
};

export default resolvers;
