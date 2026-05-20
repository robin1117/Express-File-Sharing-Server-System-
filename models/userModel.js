import { Schema, model, Types } from "mongoose"

let usrSchema = new Schema({
    name: {
        type: String
    },

    email: {
        type: String,
        required: true,
        unique: true,
        // match: [
        //     /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        //     "Please enter a valid email"
        // ]
    },

    password: {
        type: String
    },

    rootDirId: {
        type: Types.ObjectId
    }
}, {
    strict: "throws",
    versionKey: false
});

let usrModel = model("userDB", usrSchema, "userDB");

export default usrModel