const socket = io();
let currentRoom = null;
let myId = null;
let players = [];
let myTurn = false;
let myDice = [];
let usedCategories = {};

function startSolo() { ... }
function showPVPMenu() { ... }
function createRoom() { ... }

socket.on("connect", () => { myId = socket.id; });

socket.on("roomCreated", (roomCode) => { ... });
function joinRoom() { ... }
socket.on("roomJoined", (roomCode) => { ... });

socket.on("startGame", (ids) => {
  players = ids;
  myTurn = (players[0] === myId);
  updateTurnUI();
  renderScoreBoard();
  updateScoreTable({});
});

function updateTurnUI() {
  document.getElementById("turnIndicator").innerText = myTurn ? "Your Turn" : "Opponent's Turn";
  document.getElementById("rollButton").disabled = !myTurn;
}

function rollDice() {
  if (!myTurn) return;
  myDice = Array.from({ length: 5 }, () => Math.floor(Math.random() * 6) + 1);
  renderDice("dice", myDice);
  socket.emit("rollDice", { roomCode: currentRoom, dice: myDice });
}

socket.on("updateDice", ({ id, dice }) => {
  if (id !== myId) renderDice("opponentDice", dice);
});

function renderDice(containerId, dice) {
  const container = document.getElementById(containerId);
  container.innerHTML = dice.map(d => `<span>${d}</span>`).join("");
}

function calculateScore(category, dice) {
  const counts = [0, 0, 0, 0, 0, 0];
  dice.forEach(d => counts[d - 1]++);
  const sum = dice.reduce((a, b) => a + b, 0);

  switch (category) {
    case "Ones": return counts[0] * 1;
    case "Twos": return counts[1] * 2;
    case "Threes": return counts[2] * 3;
    case "Fours": return counts[3] * 4;
    case "Fives": return counts[4] * 5;
    case "Sixes": return counts[5] * 6;
    case "Full House": {
      const hasThree = counts.includes(3);
      const hasTwo = counts.includes(2);
      return (hasThree && hasTwo) ? sum : 0;
    }
    case "Four of a Kind": {
      const i = counts.findIndex(c => c >= 4);
      return i >= 0 ? (i + 1) * 4 : 0;
    }
    case "Little Straight": {
      return [1, 1, 1, 1, 1].every((_, i) => counts[i] >= 1) ? 30 : 0;
    }
    case "Big Straight": {
      return [1, 1, 1, 1, 1].every((_, i) => counts[i + 1] >= 1) ? 30 : 0;
    }
    case "Choice": return sum;
    case "Yacht": return counts.includes(5) ? 50 : 0;
    default: return 0;
  }
}

function renderScoreBoard() {
  const categories = ["Ones","Twos","Threes","Fours","Fives","Sixes",
    "Full House","Four of a Kind","Little Straight","Big Straight","Choice","Yacht"];
  const board = document.getElementById("scoreBoard");
  board.innerHTML = "<h3>Select Score</h3>";
  categories.forEach(cat => {
    const btn = document.createElement("button");
    btn.innerText = cat;
    btn.disabled = usedCategories[cat];
    btn.onclick = () => {
      const score = calculateScore(cat, myDice);
      usedCategories[cat] = true;
      renderScoreBoard();
      submitScore(cat, score);
    };
    board.appendChild(btn);
  });
}

function submitScore(category, score) {
  socket.emit("submitScore", {
    roomCode: currentRoom,
    playerId: myId,
    category,
    score
  });
}

socket.on("scoreSubmitted", ({ scores, nextPlayer }) => {
  myTurn = (nextPlayer === myId);
  updateTurnUI();
  updateScoreTable(scores);
});

function updateScoreTable(scores) {
  const categories = ["Ones","Twos","Threes","Fours","Fives","Sixes",
    "Full House","Four of a Kind","Little Straight","Big Straight","Choice","Yacht"];
  const table = document.getElementById("scoreTable") || document.createElement("table");
  table.id = "scoreTable";
  table.innerHTML = "";

  const thead = document.createElement("thead");
  const header = document.createElement("tr");
  header.innerHTML = `<th>Category</th>` + players.map(p => `<th>${p === myId ? "You" : "Opponent"}</th>`).join("");
  thead.appendChild(header);

  const tbody = document.createElement("tbody");
  categories.forEach(cat => {
    const row = document.createElement("tr");
    row.innerHTML = `<td>${cat}</td>` + players.map(pid => `<td>${(scores[pid] && scores[pid][cat]) ?? ""}</td>`).join("");
    tbody.appendChild(row);
  });

  table.appendChild(thead);
  table.appendChild(tbody);

  const container = document.getElementById("scoreBoard");
  container.appendChild(table);
}

socket.on("gameOver", (scores) => {
  document.getElementById("status").innerText = "🏁 Game Over!";
  updateScoreTable(scores);
  document.getElementById("rollButton").disabled = true;
});
