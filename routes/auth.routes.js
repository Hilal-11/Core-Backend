import express from "express";
const router = express.Router();

import {
  registerValidator,
  loginValidator,
  changePasswordValidator,
} from "../validators/user.validators.js";
import { validate } from "../middlewares/validate.middleware.js";
import { authLimiter } from "../middlewares/rateLimit.middleware.js";
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  changePassword,
} from "../controllers/auth.controllers.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

// ---------- Public routes ----------
router.post("/register", authLimiter , registerValidator, validate, registerUser);
router.post("/login", authLimiter, loginValidator , validate , loginUser);
router.post("/refresh-token", refreshAccessToken);

// ---------- Protected routes (need login) ----------
router.post("/logout", verifyJWT, logoutUser);
router.get("/me", verifyJWT, getCurrentUser);
router.patch("/update-account", verifyJWT, updateAccountDetails);
router.post("/change-password", changePasswordValidator, validate , verifyJWT, changePassword);
router.patch(
  "/update-avatar",
  verifyJWT,
  upload.single("avatar"),
  updateUserAvatar
);

export default router;