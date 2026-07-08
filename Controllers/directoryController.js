import { ObjectId } from "mongodb";
import directoryModel from "../models/directoryModel.js";
import fileModel from "../models/fileModel.js";
import usrModel from "../models/userModel.js";
import { rm } from "fs/promises";
import path from "node:path";

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
export const servingDirectory = async (req, res) => {
  let db = req.db;
  let id = req.params.id || req.user.rootDirId;

  // let rootDir = await db.collection('directoryDB').findOne({ _id: new ObjectId(id) })
  let rootDir = await directoryModel.findById(id).lean();

  // const directories = await db.collection('directoryDB').find({ parentDirId: new ObjectId(id) }).toArray();
  let directories = await directoryModel
    .find({ parentDirId: new ObjectId(id) })
    .lean();

  // const files = await db.collection('fileDB').find({parentId: new ObjectId(id)}).toArray()
  let files = await fileModel.find({ parentId: new ObjectId(id) }).lean();

  if (!rootDir) {
    return res.status(404).json({ error: "Directory not found" });
  }

  let directoryDB = [rootDir];
  // console.log(directories);
  // let files = []
  return res.status(200).json({ ...directoryDB[0], directories, files });
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
    return res
      .status(200)
      .json({ message: "{what:dir Had updated directory Name}" });
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

//This function recursively delete file and filers from directory
async function recursiveDeletionDirectory(id, req) {
  let dirId = id;
  let db = req.db;
  // let directCollection = await db.collection('directoryDB').find({ parentDirId: new ObjectId(dirId) }).toArray()
  let directCollection = await directoryModel
    .find({ parentDirId: new ObjectId(dirId) })
    .lean();
  // let fileCollection = await db.collection('fileDB').find({ parentId: new ObjectId(dirId) }).toArray()
  let fileCollection = await fileModel
    .find({ parentId: new ObjectId(dirId) })
    .lean();
  if (fileCollection.length) {
    for await (let fileObject of fileCollection) {
      let fileid = fileObject._id;
      console.log(fileid);
      let fullName = `${fileid}${fileObject.extension}`;
      try {
        await rm(path.join(import.meta.dirname, "/../storage", fullName));
        // await db.collection('fileDB').deleteOne({ _id: new ObjectId(fileid) })
        await fileModel.deleteOne({ _id: new ObjectId(fileid) });
      } catch (error) {
        console.log("file Not found or deletd already", error);
      }
    }
  }
  if (directCollection.length) {
    for (let dirObject of directCollection) {
      console.log(dirObject._id);
      await recursiveDeletionDirectory(dirObject._id, req);
    }
  }
  await directoryModel.deleteOne({ _id: new ObjectId(dirId) });
}
