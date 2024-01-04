import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
const videoWatchedSchema = new mongoose.Schema({
  video: { type: mongoose.Schema.Types.ObjectId, ref: "Video", required: true },
  timestamp: { type: Date, default: Date.now },
});

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowerCase: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowerCase: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    password: { type: String, required: [true, "Password is required"] },
    avatar: { type: String, required: true }, // URL Cloudinary
    coverImage: { type: String, required: true }, // URL Cloudinary
    watchHistory: [videoWatchedSchema],
    refreshToken: { type: String },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.password || !this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.isPasswordCorrect = async function (candidatePassword) {
  try {
    const match = await bcrypt.compare(candidatePassword, this.password);
    return match;
  } catch (error) {
    throw error;
  }
};

userSchema.methods.generateAccessToken = function () {
  const payload = {
    userId: this._id,
    email: this.email,
    username: this.username,
    fullName: this.fullName,
    // ... other user-related data you want to include in the token
  };

  const secretKey = process.env.ACCESS_TOKEN_SECRET; // Replace with your secret key
  const options = {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
  };
  // Generate and return the access token
  return jwt.sign(payload, secretKey, options);
};

userSchema.methods.generateRefreshToken = function () {
  const payload = {
    userId: this._id,
  };
  const secretKey = process.env.REFRESH_TOKEN_SECRET; 
  const options = {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRY, // Token expiration time
  };
  // Generate and return the access token
  return jwt.sign(payload, secretKey, options);
};

export const User = mongoose.model("User", userSchema);
