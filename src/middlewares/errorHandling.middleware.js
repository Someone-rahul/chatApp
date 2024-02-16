import { ApiError } from "../utils/ApiError.js";

const handleError = (err, _, res, next) => {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      statusCode: 500,
      success: false,
      message: err.message,
      errors: err.errors,
    });
  } else {
    // Handle other types of errors
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
export { handleError };
