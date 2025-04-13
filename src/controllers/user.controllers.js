import { asyncHandler } from "../utils/asyncHandaler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudnary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";


const registerUser = asyncHandler(async (req, res) => {
  //get user details from frontend
  //validation -not empty
  //check if user already exists :username,email
  //check for images ,check for avatar
  //upload them to cloudinary,avatar
  //create user object - create entry in db
  //remove password and refresh token field from response
  //check for user creation
  //return res

  //get user details from frontend
  const { fullName, email, username, password } = req.body;
  // console.log(req.body)
  //validation -not empty
  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }
  //check if user already exists :username,email
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "user with email or username already exists");
  }
  // console.log(req.files)
  //check for images ,check for avatar
  const avtarLocalPath = req.files?.avatar[0]?.path;
  //  const coverImageLocalPath = req.files?.coverImage[0]?.path;

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avtarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }
  //upload them to cloudinary,avatar
  const avatar = await uploadOnCloudinary(avtarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }
  //create user object - create entry in db
  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });
  //remove password and refresh token field from response
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  //check for user creation
  if (!createdUser) {
    throw new ApiError(500, "something went wrong while registring the user");
  }

  //return res
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User register sucessfully"));
});


const generateAccessAndRefreshTokens = async (userId) => {
  try {
   const user = await User.findById(userId);
  const acessToken = user.generateAccessToken()
  const refreshToken = user.generateRefreshToken()
  user.refreshToken = refreshToken
  user.save({validateBeforeSave : false})

  return {acessToken,refreshToken}
  } catch {
    throw new ApiError(500, "Something went wrong while generating");
  }
};



//login user
const loginUser = asyncHandler(async (req, res) => {
  //req body  -> data
  //check username or email
  //find the user
  //password check
  //acess and refress token
  //send cookie

  //req body  -> data
  const { username, password, email } = req.body;
console.log(req.body)
  //check username or email
  if (!username && !email) {
  
    throw new ApiError(400, "username or email in required");
  }
  //find the user
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });
console.log(user)


  if (!user) {
    throw new ApiError(404, "User does not exist");
  }
 //password check
  const isPasswordValid = await user.isPasswordCorrect(password);
console.log(isPasswordValid)

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }
  //acess and refress token
 const {acessToken,refreshToken} = await generateAccessAndRefreshTokens(user._id)

const loggedinUser = await User.findById(user._id).select(
  "-password,-refreshToken"
)
  //send cookie
const options = {
  httpOnly: true,
  secure:true
}

return res
.status(200)
.cookie("accessToken",acessToken,options)
.cookie("refreshToken",acessToken,options)
.json(
  new ApiResponse(
    200,
    {
      user:loggedinUser,acessToken,refreshToken
    },
    "User logged In Sucessfully"
  )
)
});

//for logout user
const logoutUser  = asyncHandler(async(req,res)=>{
await User.findByIdAndUpdate(
  req.user._id,
    {
    $set:{
      refreshToken : undefined
    },
  },{
    new:true,
  }
)
const options = {
  httpOnly: true,
  secure:true
}

return res
.status(200)
.clearCookie("accessToken",options)
.clearCookie("refreshToken",options)
.json(
  new ApiResponse(200,{},"user logged out Sucessfully")
)
})

//generate new acess token& check if any error is occur
const refreshAcessToken = asyncHandler(async(req,res)=>{
  const  incommingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

  if(!incommingRefreshToken){
    throw new ApiError(401,"Unauthorized Request")
  }

   try {
    const decodedToken = jwt.verify(
     incommingRefreshToken,
     process.env.ACCESS_TOKEN_SECRET
   )
 
  const user = await User.findById(decodedToken?._id)
 
  if(!user){
   throw new ApiError(401,"Invalid request token")
 }
 
   if(incommingRefreshToken !== user?.refreshToken){
     throw new ApiError(401,"Refresh token is expired or used")
   }
 
   const option = {
     httpOnly:true,
     secure:true
   }
 
    const {acessToken,newrefreshToken} = await generateAccessAndRefreshTokens(user._id)
 
     return res
     .status(200)
     .cookie("accessToken",acessToken,option)
     .cookie("refreshToken",newrefreshToken,option)
     .json(
       new ApiResponse(
         200,{acessToken,newrefreshToken},
         "Acess token refreshed"
       )
     )
   } catch (error) {
    throw new ApiError(401,error?.message || "invalid refresh token" )
   }
})

export { registerUser, loginUser ,logoutUser,refreshAcessToken};
