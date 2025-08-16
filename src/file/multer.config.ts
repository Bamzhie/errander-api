import { diskStorage } from 'multer';
import { extname } from 'path';

export const multerConfig = {
  storage: diskStorage({
    destination: './uploads',
    filename: (req, file, callback) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      callback(
        null,
        `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`,
      );
    },
  }),
  //allow pdf, jpg, jpeg, png, gif files
  fileFilter: (req, file, callback) => {
    if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|pdf)$/)) {
      return callback(new Error('Only image and Pdf files are allowed'), false);
    }
    callback(null, true);
  },
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB limit
};

