import mongoose from "mongoose";
import uniqueValidator from "mongoose-unique-validator"; // To require some Schema's field to be unique

const candidateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 4,
    unique: true, // uniqueValidator Library
    uniqueCaseInsensitive: true, // uniqueValidator works for ABC = abc = AbC = aBc
  },
  dateOfBirth: {
    type: Number,
    required: true,
  },
  country: {
    type: String,
    required: true,
  },
  politicalOrientation: {
    type: String,
    required: true,
  },
  votes: {
    type: Number,
    required: true,
  },
});

candidateSchema.plugin(uniqueValidator); // uniqueValidator Library

const Candidate = mongoose.model("Candidate", candidateSchema);
export default Candidate;
