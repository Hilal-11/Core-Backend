import Note from "../models/note.model.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { ApiError } from "../utils/ApiError.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary , deleteFromCloudinary } from "../utils/image-upload-cloudinary.js"

export const createNote = asyncHandler(async (req, res) => {
  const { title, content, noteType, color, checklistItems } = req.body;

  const noteData = {
    owner: req.user._id,
    title: title || "",
    content: content || "",
    noteType: noteType || "text",
    color: color || "default",
    checklistItems: noteType === "checklist" ? checklistItems || [] : [],
  };

  const note = await Note.create(noteData);

  if (!note) {
    throw new ApiError(500, "Something went wrong while creating the note");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, note, "Note created successfully"));
});

export const getAllNotes = asyncHandler(async (req, res) => {
  const notes = await Note.find({
    owner: req.user._id,
    isArchived: false,
    isTrashed: false,
  }).sort({ isPinned: -1, createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, notes, "Notes fetched successfully"));
});


export const getNoteById = asyncHandler(async (req, res) => {
  const { noteId } = req.params;

  const note = await Note.findOne({
    _id: noteId,
    owner: req.user._id,
    isTrashed: false,
  });

  if (!note) {
    throw new ApiError(404, "Note not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, note, "Note fetched successfully"));
});

export const updateNote = asyncHandler(async(req , res) => {
  const { noteId } = req.params
  const {title , content , noteType , color} = req.body;

   const updateFields = {
    ...(title !== undefined && { title }),
    ...(content !== undefined && { content }),
    ...(noteType !== undefined && { noteType }),
    ...(color !== undefined && { color }),
  };

  const note = await Note.findOneAndUpdate(
    { _id: noteId, owner: req.user._id, isTrashed: false },
    { $set: updateFields },
    { new: true, runValidators: true }
  );
  if(!note) {
    throw new ApiError(404, "Note not found, we can't update the note.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, note, "Note updated successfully."));
})

export const deleteNote = asyncHandler(async(req , res) => {
  const { noteId } = req.params

  const note = await Note.findOneAndUpdate(
    { _id: noteId, owner: req.user._id, isTrashed: false },
    { $set: { isTrashed: true, trashedAt: new Date() } },
    { new: true }
  );

  if(!note) {
    throw new ApiError(404, "Note not found, we can't delete the note.");
  }
  return res.status(200)
    .json(new ApiResponse(200, "Note deleted successfully."))
})

export const restoreNote = asyncHandler(async (req, res) => {
  const { noteId } = req.params;

  const note = await Note.findOneAndUpdate(
    { _id: noteId, owner: req.user._id, isTrashed: true },
    { $set: { isTrashed: false, trashedAt: null } },
    { new: true }
  );

  if (!note) {
    throw new ApiError(404, "Note not found in trash.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, note, "Note restored successfully."));
});

export const deleteNotePermanently = asyncHandler(async (req, res) => {
  const { noteId } = req.params;

  const note = await Note.findOneAndDelete({
    _id: noteId,
    owner: req.user._id,
    isTrashed: true, // must already be in trash to hard-delete
  });

  if (!note) {
    throw new ApiError(404, "Note not found in trash.");
  }

  // clean up any attached Cloudinary images so they don't become orphaned
  if (note.images?.length > 0) {
    await Promise.all(
      note.images.map((img) => deleteFromCloudinary(img.public_id))
    );
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Note permanently deleted."));
});

export const toggleArchive = asyncHandler(async (req, res) => {
  const { noteId } = req.params;

  const existingNote = await Note.findOne({
    _id: noteId,
    owner: req.user._id,
    isTrashed: false,
  });

  if (!existingNote) {
    throw new ApiError(404, "Note not found.");
  }

  existingNote.isArchived = !existingNote.isArchived;
  await existingNote.save();

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        existingNote,
        existingNote.isArchived ? "Note archived." : "Note unarchived."
      )
    );
});

export const togglePin = asyncHandler(async (req, res) => {
  const { noteId } = req.params;

  const existingNote = await Note.findOne({
    _id: noteId,
    owner: req.user._id,
    isTrashed: false,
  });

  if (!existingNote) {
    throw new ApiError(404, "Note not found.");
  }

  existingNote.isPinned = !existingNote.isPinned;
  await existingNote.save();

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        existingNote,
        existingNote.isPinned ? "Note pinned." : "Note unpinned."
      )
    );
});

export const updateNoteColor = asyncHandler(async (req, res) => {
  const { noteId } = req.params;
  const { color } = req.body;

  if (!color) {
    throw new ApiError(400, "Color is required.");
  }

  const note = await Note.findOneAndUpdate(
    { _id: noteId, owner: req.user._id, isTrashed: false },
    { $set: { color } },
    { new: true, runValidators: true }
  );

  if (!note) {
    throw new ApiError(404, "Note not found.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, note, "Note color updated."));
});


export const addChecklistItem = asyncHandler(async (req, res) => {
  const { noteId } = req.params;
  const { text } = req.body;

  if (!text || !text.trim()) {
    throw new ApiError(400, "Checklist item text is required.");
  }

  const note = await Note.findOneAndUpdate(
    { _id: noteId, owner: req.user._id, isTrashed: false },
    { $push: { checklistItems: { text: text.trim(), isChecked: false } } },
    { new: true, runValidators: true }
  );

  if (!note) {
    throw new ApiError(404, "Note not found.");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, note, "Checklist item added."));
});

export const toggleChecklistItem = asyncHandler(async (req, res) => {
  const { noteId, itemId } = req.params;

  // fetch first so we can flip the current boolean rather than blindly setting one value
  const note = await Note.findOne({
    _id: noteId,
    owner: req.user._id,
    isTrashed: false,
    "checklistItems._id": itemId,
  });

  if (!note) {
    throw new ApiError(404, "Note or checklist item not found.");
  }

  const item = note.checklistItems.id(itemId);
  item.isChecked = !item.isChecked;
  await note.save();

  return res
    .status(200)
    .json(new ApiResponse(200, note, "Checklist item updated."));
});

export const deleteChecklistItem = asyncHandler(async (req, res) => {
  const { noteId, itemId } = req.params;

  const note = await Note.findOneAndUpdate(
    { _id: noteId, owner: req.user._id, isTrashed: false },
    { $pull: { checklistItems: { _id: itemId } } },
    { new: true }
  );

  if (!note) {
    throw new ApiError(404, "Note not found.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, note, "Checklist item deleted."));
});

export const uploadNoteImage = asyncHandler(async (req, res) => {
  const { noteId } = req.params;
  const localFilePath = req.file?.path;

  if (!localFilePath) {
    throw new ApiError(400, "Image file is required.");
  }

  const existingNote = await Note.findOne({
    _id: noteId,
    owner: req.user._id,
    isTrashed: false,
  });

  if (!existingNote) {
    throw new ApiError(404, "Note not found.");
  }

  const uploadedImage = await uploadOnCloudinary(localFilePath);

  if (!uploadedImage?.url) {
    throw new ApiError(500, "Error uploading image.");
  }

  existingNote.images.push({
    url: uploadedImage.secure_url,
    public_id: uploadedImage.public_id,
  });
  await existingNote.save();

  return res
    .status(201)
    .json(new ApiResponse(201, existingNote, "Image uploaded successfully."));
});

export const deleteNoteImage = asyncHandler(async (req, res) => {
  const { noteId, imageId } = req.params;

  const note = await Note.findOne({
    _id: noteId,
    owner: req.user._id,
    isTrashed: false,
  });

  if (!note) {
    throw new ApiError(404, "Note not found.");
  }

  const image = note.images.id(imageId);

  if (!image) {
    throw new ApiError(404, "Image not found on this note.");
  }

  await deleteFromCloudinary(image.public_id);
  image.deleteOne(); // removes this subdocument from the images array
  await note.save();

  return res
    .status(200)
    .json(new ApiResponse(200, note, "Image deleted successfully."));
});

export const searchNotes = asyncHandler(async (req, res) => {
  const { q } = req.query;

  if (!q || !q.trim()) {
    throw new ApiError(400, "Search query is required.");
  }

  const notes = await Note.find(
    {
      owner: req.user._id,
      isTrashed: false,
      $text: { $search: q },
    },
    { score: { $meta: "textScore" } }
  ).sort({ score: { $meta: "textScore" } });

  return res
    .status(200)
    .json(new ApiResponse(200, notes, "Search results fetched."));
});

export const getArchivedNotes = asyncHandler(async (req, res) => {
  const notes = await Note.find({
    owner: req.user._id,
    isArchived: true,
    isTrashed: false,
  }).sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, notes, "Archived notes fetched."));
});

export const getTrashedNotes = asyncHandler(async (req, res) => {
  const notes = await Note.find({
    owner: req.user._id,
    isTrashed: true,
  }).sort({ trashedAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, notes, "Trashed notes fetched."));
});