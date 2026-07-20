
import User from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new ApiError(409, "User already exists with this email");
  }

  const user = await User.create({
    name,
    email,
    password,
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User registered successfully"));
});

export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // password has select:false in schema, so explicitly ask for it here
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid credentials");
  }

  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  // persist refreshToken on the user so refresh-token/logout can verify or clear it
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "Logged in successfully"
      )
    );
});

export const logoutUser = asyncHandler(async (req, res) => {
  // req.user is available because verifyJWT ran before this controller
  await User.findByIdAndUpdate(
    req.user._id,
    { $unset: { refreshToken: 1 } }, // remove the field entirely rather than set to null
    { new: true }
  );

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  };

  return res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(new ApiResponse(200, {}, "Logged out successfully"));
});

export const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body?.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request - no refresh token");
  }

  let decodedToken;
  try {
    decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
  } catch (error) {
    throw new ApiError(401, "Refresh token expired or invalid");
  }

  const user = await User.findById(decodedToken?._id).select("+refreshToken");

  if (!user) {
    throw new ApiError(401, "Invalid refresh token");
  }

  // this is the critical check: the token must match what's stored in DB,
  // not just be a validly-signed JWT. This is what makes logout actually work.
  if (incomingRefreshToken !== user.refreshToken) {
    throw new ApiError(401, "Refresh token is expired or has been used");
  }

  const newAccessToken = user.generateAccessToken();
  const newRefreshToken = user.generateRefreshToken();

  user.refreshToken = newRefreshToken;
  await user.save({ validateBeforeSave: false });

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  };

  return res
    .status(200)
    .cookie("accessToken", newAccessToken, cookieOptions)
    .cookie("refreshToken", newRefreshToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        { accessToken: newAccessToken, refreshToken: newRefreshToken },
        "Access token refreshed"
      )
    );
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  // req.user was already fetched and attached by verifyJWT, no DB call needed here
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user fetched successfully"));
});

export const updateAccountDetails = asyncHandler(async (req, res) => {
  const { name, email } = req.body;

  if (!name && !email) {
    throw new ApiError(400, "At least one field is required to update");
  }

  if (email) {
    const existingUser = await User.findOne({ email, _id: { $ne: req.user._id } });
    if (existingUser) {
      throw new ApiError(409, "Email already in use by another account");
    }
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { ...(name && { name }), ...(email && { email }) } },
    { new: true, runValidators: true }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "Account details updated"));
});

export const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  const user = await User.findById(req.user._id);

  const uploadedAvatar = await uploadOnCloudinary(avatarLocalPath);

  if (!uploadedAvatar?.url) {
    throw new ApiError(500, "Error uploading avatar");
  }

  // delete the old avatar from Cloudinary before saving the new one,
  // but only if one actually exists (skip on first-ever upload)
  if (user.avatar?.public_id) {
    await deleteFromCloudinary(user.avatar.public_id);
  }

  user.avatar = {
    url: uploadedAvatar.secure_url,
    public_id: uploadedAvatar.public_id,
  };
  await user.save({ validateBeforeSave: false });

  const updatedUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "Avatar updated successfully"));
});

export const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select("+password");

  const isOldPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isOldPasswordCorrect) {
    throw new ApiError(401, "Old password is incorrect");
  }

  user.password = newPassword; // pre("save") hook will hash this automatically
  await user.save(); // NOT validateBeforeSave:false — we want the hook to run

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});