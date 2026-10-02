import multer from "multer";
import { createError } from "../utils/createError.js";

// Keep files in memory; they are sent straight to Cloudinary
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { files: 4, fileSize: 5 * 1024 * 1024 }, // max 4 images, 5 MB each
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(createError(400, "Only image files are allowed"));
    }
  },
});

export default upload;
