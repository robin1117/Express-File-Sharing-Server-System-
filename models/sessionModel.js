import mongoose, { Schema, model, Types } from "mongoose"

let sessionModel = new Schema({
    userId: {
        type: Types.ObjectId,
        default: null
    },

    createdAt: {
        type: Date,
        default: Date.now,
        expires: 3600
    },

}, {

});

let Session = model("sessionDB", sessionModel, "sessionDB");



export default Session