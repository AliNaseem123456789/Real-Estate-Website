import multer from "multer";
import path from "path";
import PropertyModel from "../models/property.js";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(
      null,
      path.join(process.cwd(), "client", "src", "assets", "properties")
    );
  },

  filename: async (req, file, cb) => {
    if (!req.image_prefix) {
      const lastProperty = await PropertyModel
        .findOne()
        .sort({ image_prefix: -1 });

      const nextPrefix = lastProperty
        ? parseInt(lastProperty.image_prefix) + 1
        : 1;

      req.image_prefix = nextPrefix.toString();
      req.imageIndex = 1;
    }

    const ext = path.extname(file.originalname);
    const filename = `${req.image_prefix}-${req.imageIndex}${ext}`;
    req.imageIndex++;

    cb(null, filename);
  },
});

const upload = multer({
  storage,
  limits: { files: 4 },
});

export default upload;
