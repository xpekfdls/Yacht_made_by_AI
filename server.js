// server.js
const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const path = require("path");

// 정적 파일 경로 설정 (public 폴더)
app.use(express.static("public"));

// Socket.io 연결
io.on("connection", (socket) => {
  console.log("✅ New client connected:", socket.id);

  // 방 생성
  socket.on("createRoom", () => {
    const roomCode = Math.random().toString(36).substr(2, 6).toUpperCase();
    socket.join(roomCode);
    socket.emit("roomCreated", roomCode);
    console.log(`Room created: ${roomCode}`);
  });

  // 방 참가
  socket.on("joinRoom", (roomCode) => {
    const room = io.sockets.adapter.rooms.get(roomCode);
    if (room && room.size === 1) {
      socket.join(roomCode);
      socket.emit("roomJoined", roomCode);
      socket.to(roomCode).emit("opponentJoined");
      console.log(`User ${socket.id} joined room: ${roomCode}`);
    } else {
      socket.emit("joinFailed");
    }
  });

  // 주사위 굴림 정보 공유
  socket.on("rollDice", ({ roomCode, dice }) => {
    socket.to(roomCode).emit("opponentRolled", dice);
  });
});

// 서버 실행
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log("🚀 Server listening on port", PORT);
});
