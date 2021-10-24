const { instrument } = require("@socket.io/admin-ui");
const express = require("express");
const _debounce = require("./utils/debounce");
const {
  createRoom,
  joinRoom,
  leaveRoom,
  privateRoom,
  publicRoom,
} = require("./utils/msg");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server, {
  cors: {
    origin: ["https://admin.socket.io"],
    credentials: true,
  },
});

let PUBLIC_ROOMS = {};
const port = 3001;

app.get("/", (req, res) => {
  res.send("Hello World!");
});

// const userIo = io.of("/user");
// userIo.on("connect", (socket) => {
//   console.log("connect to user socket");
// });

// userIo.use((socket, next) => {
//   if (socket.handshake.auth.token) {
//     console.log(socket.handshake.auth.token);
//     socket.uid = socket.handshake.auth.token;
//     next();
//   } else {
//     next(new Error("user validation failed!"));
//   }
// });

io.on("connect", (socket) => {
  console.log(`${socket.id} connected`);

  socket.on("send-message", (message, roomId) => {
    if (roomId === null) {
      socket.broadcast.emit("receive-message", message);
    } else {
      socket.to(roomId).emit("receive-message", message);
    }
  });

  const fn1 = _debounce(() => {
    socket.broadcast.emit("receive-typing", false);
  }, 1000);

  const fn2 = _debounce((roomId) => {
    socket.to(roomId).emit("receive-typing", false);
  }, 1000);

  socket.on("send-typing", (roomId) => {
    if (roomId === null) {
      socket.broadcast.emit("receive-typing", true);
      fn1();
    } else {
      socket.to(roomId).emit("receive-typing", true);
      fn2(roomId);
    }
  });

  socket.on("join-room", ({ roomId, roomName }, user, cb) => {
    socket.join(roomId);
    let roomSize = io.sockets.adapter.rooms.get(roomId).size;
    if (roomId === socket.id) {
      socket.to(roomId).emit("receive-message", privateRoom(user));
      cb(privateRoom(), `${user.displayName}'s Room`, roomSize);
    } else if (typeof PUBLIC_ROOMS[roomId] === "undefined") {
      PUBLIC_ROOMS[roomId] = roomName;
      cb(createRoom(user), roomName, roomSize);
      socket.to(roomId).emit("receive-message", createRoom(user));
    } else {
      cb(joinRoom(user), PUBLIC_ROOMS[roomId], roomSize);
      socket.to(roomId).emit("receive-message", joinRoom(user));
    }
    socket.to(roomId).emit("room-size", roomSize);
    // console.log(PUBLIC_ROOMS);
  });

  socket.on("join-public-room", (cb) => {
    let roomSize = Array.from(io.sockets.sockets.keys()).length;
    cb(publicRoom(), "Public Room", roomSize);
  });

  socket.on("leave-room", (roomId, user, cb) => {
    console.log(`${socket.id} left room: ${roomId}`);
    let roomSize = io.sockets.adapter.rooms.get(roomId).size;
    socket.to(roomId).emit("receive-message", leaveRoom(user));
    socket.to(roomId).emit("room-size", roomSize - 1);
    cb();
    socket.leave(roomId);
  });

  socket.on("check-room", (roomId, cb) => {
    cb(typeof PUBLIC_ROOMS[roomId] === "undefined");
  });

  socket.on("user-active-room", (cb) => {
    let user_rooms = Array.from(socket.rooms);
    let all_rooms = socket.adapter.rooms;
    let rooms = user_rooms.map((room) => {
      return {
        id: room,
        name: PUBLIC_ROOMS[room],
        users: Array.from(all_rooms.get(room)),
        _private: room === socket.id,
      };
    });
    rooms.unshift({
      id: null,
      _public: true,
    });
    cb(rooms);
  });

  // socket.on("all-active-room", (cb) => {
  //   console.log("user", socket.adapter.rooms);
  // });
});

server.listen(port, () => {
  console.log(`Chat API listening on port ${port}`);
});

instrument(io, { auth: false });
