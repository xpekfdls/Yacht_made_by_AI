const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static("public"));

const rooms = {};

io.on("connection", (socket) => {
  console.log("✅ Connected:", socket.id);

  socket.on("createRoom", () => {
    const roomCode = Math.random().toString(36).substr(2, 6).toUpperCase();
    socket.join(roomCode);
    rooms[roomCode] = {
      players: [socket.id],
      scores: {},
      turnIndex: 0
    };
    socket.emit("roomCreated", roomCode);
  });

  socket.on("joinRoom", (roomCode) => {
    const room = rooms[roomCode];
    if (room && room.players.length === 1) {
      room.players.push(socket.id);
      socket.join(roomCode);
      io.to(roomCode).emit("roomJoined", roomCode);
      io.to(roomCode).emit("startGame", room.players);
    } else {
      socket.emit("joinFailed");
    }
  });

  socket.on("rollDice", ({ roomCode, dice }) => {
    socket.to(roomCode).emit("opponentRolled", dice);
    io.to(roomCode).emit("updateDice", { id: socket.id, dice });
  });

  socket.on("submitScore", ({ roomCode, playerId, category, score }) => {
    const room = rooms[roomCode];
    if (!room.scores[playerId]) room.scores[playerId] = {};
    room.scores[playerId][category] = score;

    // 턴 전환
    room.turnIndex = (room.turnIndex + 1) % room.players.length;
    const nextPlayer = room.players[room.turnIndex];

    io.to(roomCode).emit("scoreSubmitted", {
      scores: room.scores,
      nextPlayer
    });

    // 게임 종료 조건 체크
    const gameOver = room.players.every(p => Object.keys(room.scores[p] || {}).length === 12);
    if (gameOver) {
      io.to(roomCode).emit("gameOver", room.scores);
    }
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
});
