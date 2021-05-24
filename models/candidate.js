import mongoose from "mongoose";
import uniqueValidator from "mongoose-unique-validator"; // To require some Schema's field to be unique

const candidateSchema = new mongoose.Schema({
  lastName: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 15,
    unique: true, // uniqueValidator Library
    uniqueCaseInsensitive: true, // uniqueValidator works for ABC = abc = AbC = aBc
  },
  firstName: {
    type: String,
    minlength: 3,
    maxlength: 15,
    required: true,
  },
  country: {
    type: String,
    minlength: 4,
    maxlength: 15,
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
