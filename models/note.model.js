import mongoose from "mongoose";

const checklistItemSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true },
    isChecked: { type: Boolean, default: false },
  },
  { _id: true } // keep _id so frontend can target individual items for toggle/delete
);

const noteSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      trim: true,
      default: "",
    },
    content: {
      type: String,
      trim: true,
      default: "",
    },
    noteType: {
      type: String,
      enum: ["text", "checklist"],
      default: "text",
    },
    checklistItems: [checklistItemSchema],
    images: [
      {
        url: { type: String, required: true },
        public_id: { type: String, required: true },
      },
    ],
    color: {
      type: String,
      default: "default",
    },
    labels: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Label",
      },
    ],

    isPinned: {
      type: Boolean,
      default: false,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    isTrashed: {
      type: Boolean,
      default: false,
    },
    trashedAt: {
      type: Date,
      default: null,
    },
    reminder: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// main compound index — almost every list query filters on all three
noteSchema.index({ owner: 1, isArchived: 1, isTrashed: 1 });

// text search across title + content
noteSchema.index({ title: "text", content: "text" });

export default mongoose.model("Note", noteSchema);