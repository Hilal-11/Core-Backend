import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    avatar: {
      url: { type: String, default: "https://placehold.co/600x400" },
      public_id: { type: String, default: "" },
    },
    refreshToken: {
      type: String,
      select: false,
    },
  },
  { timestamps: true }
);

// hash password before saving, only if it changed
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  const saltRounds = 10;
  this.password = await bcrypt.hash(this.password, saltRounds);
});

// compare plaintext login  against stopasswordred hash
userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      name: this.name,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );
};

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    { _id: this._id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
  );
};

export default mongoose.model("User", userSchema);