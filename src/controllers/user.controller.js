import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Readable } from "stream";
import cloudinary from "../utils/cloudinary.js";

const handleCloudinaryUpload = (stream, field, newUser, res) => {
  return async () => {
    const chunks = [];

    stream.on("data", (chunk) => {
      chunks.push(chunk);
    });

    stream.on("end", async () => {
      try {
        // Check if there is no data in the stream
        if (chunks.length === 0) {
          throw new ApiError(400, `No ${field} provided. Image is required.`);
        }
        const buffer = Buffer.concat(chunks);
        cloudinary.uploader
          .upload_stream(async (error, result) => {
            if (error) {
              console.error("Cloudinary Upload Error:", error.message);
              throw new ApiError(
                500,
                `Error uploading ${field} to Cloudinary: ${error.message}`
              );
            }

            // Save the Cloudinary URL to the user
            newUser[field] = result.url;
            await newUser.save();
          })
          .end(buffer);
      } catch (error) {
        console.error("Cloudinary Upload Error:", error.message);
        throw new ApiError(
          500,
          `Error uploading ${field} to Cloudinary: ${error.message}`
        );
      }
    });

    stream.on("error", (error) => {
      console.error(`Error reading ${field} stream:`, error.message);
      throw new ApiError(
        500,
        `Error reading ${field} stream: ${error.message}`
      );
    });
  };
};

const registerUser = asyncHandler(async (req, res, next) => {
  let newUser; // Declare newUser in the outer scope

  try {
    const { fullName, email, username, password } = req.body;

    if (
      [fullName, email, username, password].some(
        (field) => field?.trim() === ""
      )
    ) {
      return next(new ApiError(400, "All fields are required"));
    }

    const existedUser = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (existedUser) {
      return next(
        new ApiError(409, "User with email or username already exists")
      );
    }
    // Check if avatar field exists in req.files and is not empty

    if (!req.files.avatar || !req.files.avatar[0]) {
      return next(new ApiError(400, "Avatar field is required"));
    }

    // Check if coverImage field exists in req.files and is not empty
    if (!req.files.coverImage || !req.files.coverImage[0]) {
      return next(new ApiError(400, "CoverImage field is required"));
    }

    newUser = await User.create({
      fullName,
      email,
      password,
      avatar: "Pending",
      coverImage: "Pending",
      username: username.toLowerCase(),
    });

    const avatarBufferStream = new Readable();
    avatarBufferStream.push(req.files.avatar[0].buffer);
    avatarBufferStream.push(null);

    const coverImageBufferStream = new Readable();
    coverImageBufferStream.push(req.files.coverImage[0].buffer);
    coverImageBufferStream.push(null);

    // Use the handleCloudinaryUpload function
    const avatarUploadPromise = handleCloudinaryUpload(
      avatarBufferStream,
      "avatar",
      newUser,
      res
    )().catch((error) => {
      // Handle the error, and prevent user creation
      return next(error);
    });

    const coverImageUploadPromise = handleCloudinaryUpload(
      coverImageBufferStream,
      "coverImage",
      newUser,
      res
    )().catch((error) => {
      // Handle the error, and prevent user creation
      return next(error);
    });

    await Promise.all([avatarUploadPromise, coverImageUploadPromise]);
    // The rest of your code...

    const createdUser = await User.findById(newUser._id).select(
      "-password -refreshToken"
    );

    if (!createdUser) {
      return next(
        new ApiError(500, "Something went wrong while registering the user")
      );
    }

    return res
      .status(201)
      .json(new ApiResponse(200, createdUser, "User registered successfully"));
  } catch (error) {
    // Handle errors...
    return next(error);
  }
});

export { registerUser };
