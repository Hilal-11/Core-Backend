import mongoose from "mongoose";

const labelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// same user can't create "Work" label twice, but two different users can
labelSchema.index({ owner: 1, name: 1 }, { unique: true });

export default mongoose.model("Label", labelSchema);