import express from "express";
const router = express.Router();

import {
  createLabel,
  getAllLabels,
  updateLabel,
  deleteLabel,
} from "../controllers/label.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { labelNameValidator } from "../validators/note.validators.js";
import { validate } from "../middlewares/validate.middleware.js";

router.use(verifyJWT);

router.post("/", labelNameValidator, validate, createLabel);
router.get("/", getAllLabels);
router.patch("/:labelId", labelNameValidator, validate, updateLabel);
router.delete("/:labelId", deleteLabel);

export default router;