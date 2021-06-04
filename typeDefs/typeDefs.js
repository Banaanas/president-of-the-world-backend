import { gql } from "apollo-server";

//* ** TYPEDEFS ***//
const typeDefs = gql`
  type Candidate {
    lastName: String!
    firstName: String!
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
    allCandidates(candidateLastName: String): [Candidate!]!
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
      candidateLastName: String!
      candidateFirstName: String!
      country: String!
      politicalOrientation: String!
    ): Candidate

    updateCandidate(
      country: String
      politicalOrientation: String
      id: ID!
    ): Candidate

    voteCandidate(id: ID!): Candidate

    deleteCandidate(id: ID!): User
  }
`;

export default typeDefs;
