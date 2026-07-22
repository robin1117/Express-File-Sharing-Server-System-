import express from "express";
import directoryRoutes from "./routes/directoryRoute.js";
import fileRoutes from "./routes/fileRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import authRouter from "./routes/authRouter.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import { connectDB } from "./config/db.js";
import authMiddlewares, {
  ifUserDeleted,
} from "./middlewares/authMiddlewares.js";
await connectDB();

try {
  let app = express();
  app.use(
    cors({
      origin: "http://localhost:5500",
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(cookieParser(process.env.SECRET_KEY_COOKI_PARSER));

  app.use("/directory", authMiddlewares, ifUserDeleted, directoryRoutes);
  app.use("/file", authMiddlewares, ifUserDeleted, fileRoutes);
  app.use("/", userRoutes);
  app.use("/auth", authRouter);

  // app.use((error, req, res, next) => {
  //   res
  //     .status(error.status || 500)
  //     .json({ message: "something went wrong !", error: error.message });
  // });

  let ser = app.listen(process.env.PORT || 5000, "0.0.0.0", () => {
    console.log(ser.address());
  });
} catch (error) {
  console.log(error);
}
