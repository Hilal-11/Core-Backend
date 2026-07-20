import cron from "node-cron";
import Note from "../models/note.model.js";
import { deleteFromCloudinary } from "./image-upload-cloudinary.js";

const startTrashPurgeCron = () => {
  // runs every day at midnight server time
  cron.schedule("0 0 * * *", async () => {
    console.log("Running trash purge job...");

    const THIRTY_DAYS_AGO = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const notesToPurge = await Note.find({
      isTrashed: true,
      trashedAt: { $lte: THIRTY_DAYS_AGO },
    });

    for (const note of notesToPurge) {
      if (note.images?.length > 0) {
        await Promise.all(
          note.images.map((img) => deleteFromCloudinary(img.public_id))
        );
      }
      await Note.findByIdAndDelete(note._id);
    }

    console.log(`Purged ${notesToPurge.length} note(s) from trash.`);
  });
};

export default startTrashPurgeCron;