import { body, param, query } from "express-validator";
import mongoose from "mongoose";

// reusable check for any :xId param in your routes (noteId, labelId, itemId, imageId)
const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

export const createNoteValidator = [
  body("title")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Title cannot exceed 200 characters"),

  body("content")
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage("Content cannot exceed 5000 characters"),

  body("noteType")
    .optional()
    .isIn(["text", "checklist"])
    .withMessage("noteType must be either 'text' or 'checklist'"),

  body("color").optional().trim().isString(),

  // if noteType is checklist, items should be an array (empty allowed at creation)
  body("checklistItems")
    .optional()
    .isArray()
    .withMessage("checklistItems must be an array"),

  body("checklistItems.*.text")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Checklist item text cannot be empty"),
];

export const updateNoteValidator = [
  param("noteId").custom(isValidObjectId).withMessage("Invalid note ID"),

  body("title")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Title cannot exceed 200 characters"),

  body("content")
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage("Content cannot exceed 5000 characters"),

  body("noteType")
    .optional()
    .isIn(["text", "checklist"])
    .withMessage("noteType must be either 'text' or 'checklist'"),
];

export const noteIdValidator = [
  param("noteId").custom(isValidObjectId).withMessage("Invalid note ID"),
];

export const noteColorValidator = [
  param("noteId").custom(isValidObjectId).withMessage("Invalid note ID"),
  body("color").trim().notEmpty().withMessage("Color is required"),
];

export const noteLabelValidator = [
  param("noteId").custom(isValidObjectId).withMessage("Invalid note ID"),
  param("labelId").custom(isValidObjectId).withMessage("Invalid label ID"),
];

export const addChecklistItemValidator = [
  param("noteId").custom(isValidObjectId).withMessage("Invalid note ID"),
  body("text")
    .trim()
    .notEmpty()
    .withMessage("Checklist item text is required")
    .isLength({ max: 300 })
    .withMessage("Checklist item cannot exceed 300 characters"),
];

export const checklistItemParamValidator = [
  param("noteId").custom(isValidObjectId).withMessage("Invalid note ID"),
  param("itemId").custom(isValidObjectId).withMessage("Invalid item ID"),
];

export const checklistItemToggleValidator = [
  param("noteId").custom(isValidObjectId).withMessage("Invalid note ID"),
  param("itemId").custom(isValidObjectId).withMessage("Invalid item ID"),
  body("isChecked")
    .optional()
    .isBoolean()
    .withMessage("isChecked must be true or false"),
];

export const noteImageParamValidator = [
  param("noteId").custom(isValidObjectId).withMessage("Invalid note ID"),
  param("imageId").custom(isValidObjectId).withMessage("Invalid image ID"),
];

export const searchNotesValidator = [
  query("q")
    .trim()
    .notEmpty()
    .withMessage("Search query 'q' is required")
    .isLength({ min: 1 })
    .withMessage("Search query cannot be empty"),
];

export const labelNameValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Label name is required")
    .isLength({ min: 1, max: 30 })
    .withMessage("Label name must be between 1 and 30 characters"),
];