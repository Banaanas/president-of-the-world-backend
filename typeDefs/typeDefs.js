import { gql } from "apollo-server";

//*** TYPEDEFS ***//
const typeDefs = gql`
  type Candidate {
    name: String!
    dateOfBirth: String!
    country: String!
    politicalOrientation: String!
    votes: Int!
    id: ID!
  }

  type User {
    username: String!
    candidate: Candidate
    id: ID!
  }

  type Token {
    value: String!
  }

  type Query {
    allCandidatesCount: Int!
    allCandidates(candidateName: String): [Candidate!]!
    loggedInUser: User
  }

  type Mutation {
    createUser(
      username: String!
      password: String!
      passwordConfirmation: String!
    ): User

    login(username: String!, password: String!): Token

    addCandidate(
      candidateName: String!
      dateOfBirth: String!
      country: String!
      politicalOrientation: String!
    ): Candidate

    voteCandidate(name: String!, id: ID!): Candidate

    updateCandidate(
      dateOfBirth: String
      country: String
      politicalOrientation: String
      id: ID!
    ): Candidate

    deleteCandidate(id: ID!): User
  }
`;

export default typeDefs;
