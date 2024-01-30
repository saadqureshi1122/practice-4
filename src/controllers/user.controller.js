import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Readable } from "stream";
import cloudinary from "../utils/cloudinary.js";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      "500",
      "Something went wrong while generating refresh and access token"
    );
  }
};

const handleCloudinaryUpload = (stream, field, user, res) => {
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
            user[field] = result.url;
            await user.save();
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
  let user; // Declare user in the outer scope

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

    user = await User.create({
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
      user,
      res
    )().catch((error) => {
      // Handle the error, and prevent user creation
      return next(error);
    });

    const coverImageUploadPromise = handleCloudinaryUpload(
      coverImageBufferStream,
      "coverImage",
      user,
      res
    )().catch((error) => {
      // Handle the error, and prevent user creation
      return next(error);
    });

    await Promise.all([avatarUploadPromise, coverImageUploadPromise]);
    // The rest of your code...

    const createdUser = await User.findById(user._id).select(
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

const loginUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;
  if (!username && !email) {
    throw new ApiError(404, "username or email is required");
  }
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (!user) {
    throw new ApiError(404, "user does not exist");
  }
  const isPasswordValidate = await user.isPasswordCorrect(password);
  if (!isPasswordValidate) {
    throw new ApiError(404, "password is not valid");
  }
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  res
    .status(201)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User Logged In Successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res, next) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"));
});

export { registerUser, loginUser, logoutUser };
