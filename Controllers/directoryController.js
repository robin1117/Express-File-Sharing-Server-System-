import { ObjectId } from "mongodb";
import directoryModel from "../models/directoryModel.js";
import fileModel from "../models/fileModel.js";
import usrModel from "../models/userModel.js";
import { rm } from "fs/promises";
import path from "node:path";
import {
  findingCrumb,
  recursiveDeletionDirectory,
} from "../util/directoryControllersUtils.js";

//creating folder
export const creatingFolder = async (req, res, next) => {
  try {
    let rootDirId =
      req.headers.parentdirid == undefined
        ? req.user.rootDirId
        : req.headers.parentdirid;

    let dirName = req.params.dirName || "NewFolder";
    let db = req.db;
    // let createdDir = await db.collection('directoryDB').insertOne({ _id: new ObjectId(), dirName, userId: new ObjectId(req.cookies.uid), parentDirId: new ObjectId(rootDirId) })
    await directoryModel.insertOne({
      _id: new ObjectId(),
      dirName,
      userId: new ObjectId(req.user._id),
      parentDirId: new ObjectId(rootDirId),
    });
    return res.status(201).json({ message: "Dir Has been created" });
  } catch (error) {
    next(error);
  }
};

//serving Directory
export const servingDirectory = async (req, res, next) => {
  try {
    let id = req.params.id || req.user.rootDirId;

    let currentDir = await directoryModel.findById(id).lean();

    if (!currentDir) {
      return res.status(404).json({ error: "Directory not found" });
    }
    let breadCrumb = await findingCrumb(id);

    let directories = await directoryModel
      .find({ parentDirId: new ObjectId(id) })
      .lean();

    let files = await fileModel.find({ parentId: new ObjectId(id) }).lean();

    // console.log(directories);
    return res.status(200).json({ currentDir, directories, files, breadCrumb });
  } catch (error) {
    next(error);
  }
};

//renaming Directory
export const renamingDirectory = async (req, res, next) => {
  let dirid = req.params.id;
  let newName = req.body.fileName;
  console.log(newName);
  // let db = req.db
  try {
    // let o = await db.collection('directoryDB').updateOne({ _id: new ObjectId(dirid) }, { $set: { dirName: newName } })
    await directoryModel.findOneAndUpdate(
      { _id: new ObjectId(dirid) },
      { $set: { dirName: newName } },
    );
    return res.status(200).json({ message: "{directory Has been updated}" });
  } catch (error) {
    next(error);
  }
};

//deleting Directory
export const deletingDirectoryRecursively = async (req, res, next) => {
  try {
    let dirId = req.params.id;
    await recursiveDeletionDirectory(dirId, req);
    res.status(200).json({ message: `We deleted directory Successfully !` });
  } catch (error) {
    next(error);
  }
};
