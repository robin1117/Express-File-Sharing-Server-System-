import { Schema, model, Types } from "mongoose"

let directorySchema = new Schema({
    name: {
        type: String
    },

    dirName: {
        type: String,
    },

    userId: {
        type: Types.ObjectId
    },

    parentDirId: {
        type: Types.ObjectId,
        default: null
    }
}, {
    strict: "throws",
    versionKey: false
});

let directoryModel = model("directoryDB", directorySchema, 'directoryDB')

export default directoryModel