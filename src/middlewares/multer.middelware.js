import multer from "multer";

const storage = multer.memoryStorage();

export const upload = multer({ storage });
// import multer from "multer";

// const storage = multer.diskStorage({
//   destination: async function (req, file, cb) {
//     cb(null, "./public/temp");
//   },
//   filename: function (req, file, cb) {
//     const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
//     cb(null, `${file.originalname}-${uniqueSuffix}`);
//   },
// });

// export const upload = multer({ storage: storage });
