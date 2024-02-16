import { Router } from "express";
import { login, logout, register } from "../controllers/user.controller.js";
import { uploadLocally } from "../middlewares/multer.middleware.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { handleError } from "../middlewares/errorHandling.middleware.js";

const router = Router();

router
  .route("/register")
  .post(uploadLocally.single("image"), register, handleError);
router.route("/login").post(login, handleError);

//secured route
router.route("/logout").post(verifyJwt, logout);
export default router;
