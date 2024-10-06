import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.models.js";
import {ApiError} from "../utils/ApiError.js";
export const verifyJWT = asyncHandler(async (req, _, next) => {//underscore because we are not using response( means res)
    // We are able to write req.cookie here because of app.use(cookieParser()) in app.js
    // and we are able to access token from it because we have added token in cookies in user controller
    // and in some cases when user is sending custom header (because of mobile app)
    // so here we are using authorization in header and in this we can access token from it
    // as full header is Authorization Bearer <token> so we detect when Bearer with space comes
    // waha tak empty string rakhdo tab bachega only token
  try {
      const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
      if (!token) {
          throw new ApiError(401, "Unauthorized request");
      }
      const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      const user = await User.findById(decodedToken?._id).select("-password -refreshToken");
      if (!user) {
          throw new ApiError(401, "Invalid Access Token");
      }
      req.user = user; // Adding new object in req that is user means user ka access de diya
      next();
  } catch (error) {
    throw new ApiError(401,error?.message||"Invalid Access Token"); 
  }
});