import Label from "../models/label.model.js";
import Note from "../models/note.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createLabel = asyncHandler(async (req, res) => {
  const { name } = req.body;

  const existingLabel = await Label.findOne({
    owner: req.user._id,
    name: name.trim(),
  });

  if (existingLabel) {
    throw new ApiError(409, "Label already exists.");
  }

  const label = await Label.create({
    name: name.trim(),
    owner: req.user._id,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, label, "Label created successfully."));
});

export const getAllLabels = asyncHandler(async (req, res) => {
  const labels = await Label.find({ owner: req.user._id }).sort({ name: 1 });

  return res
    .status(200)
    .json(new ApiResponse(200, labels, "Labels fetched successfully."));
});

export const updateLabel = asyncHandler(async (req, res) => {
  const { labelId } = req.params;
  const { name } = req.body;

  const label = await Label.findOneAndUpdate(
    { _id: labelId, owner: req.user._id },
    { $set: { name: name.trim() } },
    { new: true, runValidators: true }
  );

  if (!label) {
    throw new ApiError(404, "Label not found.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, label, "Label updated successfully."));
});

export const deleteLabel = asyncHandler(async (req, res) => {
  const { labelId } = req.params;

  const label = await Label.findOneAndDelete({
    _id: labelId,
    owner: req.user._id,
  });

  if (!label) {
    throw new ApiError(404, "Label not found.");
  }

  // remove this label from every note that referenced it —
  // otherwise notes keep pointing at a labelId that no longer exists
  await Note.updateMany(
    { labels: labelId },
    { $pull: { labels: labelId } }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Label deleted successfully."));
});