import express from 'express'
import { writeFile } from 'fs/promises'
import cors from "cors";
import auth from '../middlewares/auth.js';
import { Db, ObjectId } from 'mongodb';
// import { client } from '../config/db.js';
import { logoutAll, userGet, userLogin, userLogout, userRegister } from '../Controllers/userController.js';
let router = express.Router()

router.post('/register', userRegister)

router.post('/login', userLogin)

router.get('/', auth, userGet)

router.post('/logout', userLogout)

router.post('/logoutAll', logoutAll)

export default router