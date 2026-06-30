import express from "express";
import { writeFile } from "fs/promises";
import cors from "cors";
import { Db, ObjectId } from "mongodb";
// import { client } from '../config/db.js';
import {
  allUsersGet,
  deleteUser,
  logoutAll,
  logoutFromUserId,
  userGet,
  userLogin,
  userLogout,
  userRegister,
} from "../Controllers/userController.js";

import authMiddlewares, {
  ifUserNotNormal,
} from "../middlewares/authMiddlewares.js";

let router = express.Router();

router.post("/user/register", userRegister);

router.post("/user/login", userLogin);

router.post("/user/logout", userLogout);

router.post("/user/logout", userLogout);

router.post("/user/logoutAll", logoutAll);

router.post(
  "/users/:userId/logout",
  authMiddlewares,
  ifUserNotNormal,
  logoutFromUserId,
);

router.get("/user", authMiddlewares, userGet);

router.get("/users", authMiddlewares, ifUserNotNormal, allUsersGet);

router.delete("/users/:userId", authMiddlewares, ifUserNotNormal, deleteUser);

export default router;
