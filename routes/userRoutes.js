import express from "express";
import { writeFile } from "fs/promises";
import cors from "cors";
import { Db, ObjectId } from "mongodb";
// import { client } from '../config/db.js';
import {
  allUsersGet,
  logoutAll,
  userGet,
  userLogin,
  userLogout,
  userRegister,
} from "../Controllers/userController.js";

import authMiddlewares from "../middlewares/authMiddlewares.js";

let router = express.Router();

router.post("user/register", userRegister);

router.post("user/login", userLogin);

router.post("user/logout", userLogout);

router.post("user/logoutAll", logoutAll);

router.get("/user", authMiddlewares, userGet);

router.get("/users", authMiddlewares, allUsersGet);

export default router;
