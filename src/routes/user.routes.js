import { upload } from "../middlewares/multer.middelware.js";
import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middelware.js";
import {
  loginUser,
  logoutUser,
  registerUser,
} from "../controllers/user.controller.js";
const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);
router.route("/login").post(loginUser);

// secured routes
router.route("/logout").post(verifyJWT, logoutUser);

export default router;

// import { Router } from "express"; 
// import { registerUser } from "../controllers/user.controller.js";
// import { upload } from "../middlewares/multer.middelware.js";

// const router = Router();

// router.route("/register").post(
//   upload.fields([
//     {
//       name: "avatar",
//       maxCount: "1",
//     },
//     {
//       name: "coverImage",
//       maxCount: "1",
//     },
//   ]),
//   registerUser
// );

// export default router;
