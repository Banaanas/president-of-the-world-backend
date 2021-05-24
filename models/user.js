import mongoose from "mongoose";
import uniqueValidator from "mongoose-unique-validator"; // To require some Schema's field to be unique

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    minlength: 5,
    maxlength: 15,
    required: true,
    unique: true, // uniqueValidator Library
    uniqueCaseInsensitive: true, // uniqueValidator works for ABC = abc = AbC = aBc
  },
  passwordHash: {
    type: String,
    required: true,
    // Because password.length !== passwordHash.length, password.length should be validated
    // in the Controller (and not the Model - here)
  },
  candidate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Candidate",
  },
});

userSchema.plugin(uniqueValidator); // uniqueValidator Library

const User = mongoose.model("User", userSchema);
export default User;
