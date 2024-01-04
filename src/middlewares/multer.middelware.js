import multer from "multer";
import path from "path";
import fs from "fs/promises";

const allowedFileTypes = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "video/mp4",
  "video/mpeg",
  "video/quicktime",
];
const fileSizeLimit = 50 * 1024 * 1024; // 50 MB

/*
[File Filter Function: fileFilter naam ka function define karna jo check karta hai ke uploaded file ka MIME type allowed types mein hai ya nahi. Agar haan, to cb(null, true) ko call karke file ko accept kiya jata hai. Agar nahi, to cb(new Error(...), false) ko call karke error ko indicate kiya jata hai.]*/
const fileFilter = (req, file, cb) => {
  if (allowedFileTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Allowed types: JPEG, PNG, GIF, MP4, MPEG, QuickTime"
      ),
      false
    );
  }
};

/*
[Multer Disk Storage Configuration: Multer ko disk storage use karne ke liye configure karna.
destination: Ek function jo uploaded files ke liye destination directory decide karta hai. Yeh ensure karta hai ke directory mojood hai fs.promises.mkdir ka istemal karke.
filename: Ek function jo uploaded file ke liye filename decide karta hai. Yeh original filename ke sath ek timestamp add karta hai.]*/
const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    const destinationPath = path.join(__dirname, "../public/temp");

    // Create the destination directory if it doesn't exist
    await fs.mkdir(destinationPath, { recursive: true });

    cb(null, destinationPath);
  },
  filename: function (req, file, cb) {
    // Append a timestamp to the filename to make it unique
    const timestamp = Date.now();
    const filename = `${timestamp}_${file.originalname}`;
    cb(null, filename);
  },
});

/* 
{
  Multer Upload Configuration: Multer instance banane ka tarika jo diye gaye configurations ke sath: storage, fileFilter, aur file size limit. Yeh instance (upload) Express mein middleware ke roop mein istemal ho sakta hai file uploads ke liye.
Yeh configurations yeh ensure karte hain ke uploaded files type ke hisab se filter ho, unko ek specific directory mein save kiya jaye unique filenames ke sath, aur ek specified size limit ko follow kiya jaye.
} */
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: fileSizeLimit,
  },
});
