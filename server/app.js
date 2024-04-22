import express from "express";
import { Server } from "socket.io";
import { createServer } from 'http';
import cors from 'cors'
import { join } from "path";
import jwt from "jsonwebtoken";
import cookieParser from 'cookie-parser'
const PORT = 3000;
const secret = "meandme";

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});
// middlewares
app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST"],
  credentials: true,
}
));
//api creation
app.get("/", (req, res) => {
  res.send("HEllo");
});
app.get("/login", (req, res) => {
  const token = jwt.sign({ _id: "asdfj" }, secret);

  res.cookie("token", token, { httpOnly: true, secure: true, sameSite: "none" })
    .json({
      message: "Login succesfull",
    });
});

io.use((socket, next) => {
  cookieParser()(socket.request, socket.request.res, (err) => {
    if (err) return next(err);

    const token = socket.request.cookies.token;
    if (!token) return next(new Error("Authentication Error"));

    const decoded = jwt.verify(token, secret);
    next();
  });
});

io.on("connection", (socket) => {
  console.log("User Connected", socket.id);
  // console.log("Id",socket.id);
  // socket.emit("welcome",`welcome to server${socket.id}`);
  // socket.broadcast.emit("welcome",`${socket.id} is joined the server`);
  socket.on("message", ({ room, message }) => {
    io.to(room).emit("recieve-message", message);
    console.log({ room, message });
  });
  socket.on("join-room", (room) => {
    socket.join(room);
    console.log(`User join the room ${room}`);
  });
  socket.on("disconnect", () => {
    console.log(`user disconnected`, socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`server is running on ${PORT}`);
});