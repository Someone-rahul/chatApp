import dotenv from "dotenv";
import connectDB from "./db/db_connection.js";
import { app } from "./app.js";
import { createServer } from "http";
import { Server } from "socket.io";
dotenv.config({
  path: "./.env",
});

connectDB()
  .then(() => {
    app.on("error", (error) => {
      console.log("error: " + error);
      throw error;
    });

    const httpServer = createServer(app);
    const io = new Server(httpServer);

    io.on("connection", (socket) => {
      console.log("user is connected", socket.id);
    });

    httpServer.listen(process.env.PORT || 3000, () => {
      console.log(`server is running on port ${process.env.PORT}`);
    });
  })
  .catch((error) => {
    console.log("Mongodb connection failed(1) :" + error);
  });
