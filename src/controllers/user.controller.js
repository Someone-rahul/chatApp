import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { upload } from "../utils/fileUpload.js";
import { ApiResponse } from "../utils/ApiResponse.js";

//for generating access and refresh token
const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;

    //saving the refresh token to database
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating refresh and access token"
    );
  }
};

//passenger register endpoint (http://localhost:8000/api/v1/users/register/passenger)
const register = asyncHandler(async (req, res) => {
  //getting user details from frontend
  const { name, password, email } = req.body;

  //validation check
  if ([name, email, password].some((item) => item?.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  //check if user already exist or not
  const existedUser = await User.findOne({ email });
  if (existedUser) {
    throw new ApiError(409, `user already exist with this email`);
  }
  const imageLocalpath = req.file?.path;
  if (!imageLocalpath) {
    throw new ApiError(400, "User image is required");
  }

  //image uploading in cloudinary
  const userImage = await upload(imageLocalpath);

  //checking that avatar is successfully uploaded or not if not throw a message
  if (!userImage) {
    throw new ApiError(400, "failed to upload image");
  }

  //creating user and add entry in db
  const user = await User.create({
    name,
    email,
    image: userImage.url,
    password,
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  //   checking if user is created successfully or not
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering new user");
  }
  //sending the resoponse
  return res
    .status(201)
    .json(
      new ApiResponse(200, createdUser._id, "User registered successfully")
    );
});

const login = asyncHandler(async (req, res) => {
  console.log(req);
  const { email, password } = req.body;
  console.log(email, password);
  if (!email && !password) {
    throw new ApiError("phone number or password is required");
  }
  // console.log("login credentieals: ", phone, password);

  //check if the phone number exist or not
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(
      400,
      `User with ${email} does not exist, please register first`
    );
  }
  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Password is incorrect");
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

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        201,
        { user: loggedInUser, accessToken, refreshToken },
        "user is logged in successfully"
      )
    );
});

//logout user
const logout = asyncHandler(async (req, res) => {
  // console.log(req.user._id);
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
    .json(new ApiResponse(200, {}, "User Logged out successfully"));
});
export { register, login, logout };
