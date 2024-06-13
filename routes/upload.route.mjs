import express from "express";
import uploadController from "../controllers/upload.controller.mjs";
import { isAuth } from "../services/auth.mjs";
import uploadImage from "../services/imageFilter.mjs";

const router = express.Router();

router.post("/", isAuth, uploadImage, uploadController.upload);

export default router;
