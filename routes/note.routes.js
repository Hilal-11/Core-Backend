import express from "express";
const router = express.Router();

import {
  createNoteValidator,
  updateNoteValidator,
  noteIdValidator,
  addChecklistItemValidator,
} from "../validators/note.validators.js";
import { validate } from "../middlewares/validate.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

import {
  createNote,
  getAllNotes,
  getNoteById,
  updateNote,
  deleteNote, // soft delete -> moves to trash
  restoreNote, // trash -> back to normal
  deleteNotePermanently, // hard delete from trash
  toggleArchive,
  togglePin,
  updateNoteColor,
  toggleChecklistItem,
  addChecklistItem,
  deleteChecklistItem,
  uploadNoteImage,
  deleteNoteImage,
  searchNotes,
  getArchivedNotes,
  getTrashedNotes,
} from "../controllers/notes.controllers.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { apiLimiter } from "../middlewares/rateLimit.middleware.js";


// every note route needs the user to be logged in
router.use(verifyJWT);
router.use(apiLimiter) // rete-limiter to appling on all the note routes

// ---------- Core CRUD ----------
router.post("/", createNoteValidator , validate,  createNote);
router.get("/", getAllNotes); // home screen: isArchived:false, isTrashed:false
router.get("/:noteId", getNoteById);
router.patch("/:noteId", updateNoteValidator, validate,  updateNote); // title/content/noteType edits
router.delete("/:noteId", noteIdValidator , validate ,  deleteNote); // soft delete -> isTrashed:true, trashedAt:now

// ---------- Archive ----------
router.get("/status/archived", getArchivedNotes);
router.patch("/:noteId/archive", toggleArchive);

// ---------- Trash / Recycle bin ----------
router.get("/status/trashed", getTrashedNotes);
router.patch("/:noteId/restore", restoreNote); // isTrashed:false, trashedAt:null
router.delete("/:noteId/permanent", deleteNotePermanently); // actual DB delete

// ---------- Pin ----------
router.patch("/:noteId/pin", togglePin);

// ---------- Color ----------
router.patch("/:noteId/color", updateNoteColor);

// ---------- Checklist items (embedded subdocs) ----------
router.post("/:noteId/checklist", addChecklistItemValidator , validate,  addChecklistItem);
router.patch("/:noteId/checklist/:itemId", toggleChecklistItem);
router.delete("/:noteId/checklist/:itemId", deleteChecklistItem);

// ---------- Images (Cloudinary) ----------
router.post("/:noteId/images", upload.single("image") , uploadNoteImage);
router.delete("/:noteId/images/:imageId", deleteNoteImage);

// ---------- Search ----------
router.get("/search/query", searchNotes);

export default router;