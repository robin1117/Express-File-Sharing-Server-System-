import { Schema, model, Types } from "mongoose"

let fileModel = new Schema({
    fileName: {
        type: String
    },
    extension: {
        type: String
    },
    parentId: {
        type: Types.ObjectId
    }
},
    {
        strict: "throws",
        versionKey: false
    })

let fleModel = model("fileDB", fileModel, 'fileDB')

export default fleModel