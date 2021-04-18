import { UserInputError, AuthenticationError } from "apollo-server";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import User from "../models/user.js";
import Candidate from "../models/candidate.js";

//*** RESOLVERS ***//
const resolvers = {
  //QUERIES
  Query: {
    // CANDIDATES COUNT
    allCandidatesCount: () => Candidate.collection.countDocuments(),

    // ALL CANDIDATES (ALL/NAME)
    allCandidates: (root, { candidateName }) => {
      if (!candidateName) {
        return Candidate.find({});
      }

      if (candidateName) {
        return Candidate.find({ name: candidateName });
      }
    },

    // LOGGED IN USER- Return Logged In User
    loggedInUser: async (root, args, context) => {
      return context.currentUser;
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
          }
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
        user.passwordHash
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
      const generatedToken = {
        value: jwt.sign(userForToken, process.env.ACCESS_TOKEN_SECRET),
      };

      return generatedToken;
    },

    // ADD CANDIDATE
    addCandidate: async (
      root,
      { candidateName, dateOfBirth, country, politicalOrientation },
      context
    ) => {
      // User Authorization
      let currentUser = context.currentUser;

      if (!currentUser) {
        throw new AuthenticationError("User not authenticated");
      }

      //* CANDIDATE *//
      // New Candidate
      const newCandidate = new Candidate({
        name: candidateName,
        dateOfBirth,
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
      { dateOfBirth, country, politicalOrientation, id },
      context
    ) => {
      // User Authorization
      const currentUser = context.currentUser;

      if (!currentUser) {
        throw new AuthenticationError("User not authenticated");
      }

      // If No Candidate is found
      const updatedCandidate = await Candidate.findById(id);
      console.log(updatedCandidate);
      if (!updatedCandidate) {
        return null;
      }

      try {
        // Update Candidate
        console.log("AHAHAHA");
        const candidateObject = {
          dateOfBirth,
          country,
          politicalOrientation,
        };

        return await Candidate.findByIdAndUpdate(id, candidateObject, {
          new: true,
        });
      } catch (error) {
        // Model Validation (unique, length, etc.)
        throw new Error("Candidate not found");
      }
    }, // DELETE CANDIDATE
    deleteCandidate: async (root, { id }, context) => {
      // User Authorization
      const currentUser = context.currentUser;

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
  },
};

export default resolvers;
