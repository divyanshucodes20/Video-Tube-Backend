import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const healthcheck = asyncHandler(async (req, res) => {
    //TODO: build a healthcheck response that simply returns the OK status as json with a message
    const response={
        status:"OK",
        message:"Service is up and running"
    };
    if(!response){
        throw new ApiError(400,"Not responding");
    }
    res.status(200).json(response);
})

export {
    healthcheck
    }
    