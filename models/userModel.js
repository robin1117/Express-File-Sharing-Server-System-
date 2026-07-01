import mongoose, { Schema, model, Types } from "mongoose";
import bcrypt from "bcrypt";

let usrSchema = new Schema(
  {
    name: {
      type: String,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      // match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please enter a valid email"],
    },
    profilePic: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    role: {
      type: String,
      enum: ["user", "admin", "manager"],
      default: "user",
    },

    password: {
      type: String,
    },

    rootDirId: {
      type: Types.ObjectId,
    },

    deleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    strict: "throws",
    // versionKey: false
  },
);

usrSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
});

usrSchema.methods.comparePass = async function (userProvidedPass) {
  return await bcrypt.compare(userProvidedPass, this.password);
};

let usrModel = model("userDB", usrSchema, "userDB");

export default usrModel;
