import express from "express";
import { writeFile } from "fs/promises";
import cors from "cors";
import { Db, ObjectId } from "mongodb";
// import { client } from '../config/db.js';
import {
  logoutAll,
  userGet,
  userLogin,
  userLogout,
  userRegister,
} from "../Controllers/userController.js";
import authMiddlewares from "../middlewares/authMiddlewares.js";
let router = express.Router();

router.post("/register", userRegister);

router.post("/login", userLogin);

router.get("/", authMiddlewares, userGet);

router.post("/logout", userLogout);

router.post("/logoutAll", logoutAll);

export default router;
