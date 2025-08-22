import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { Chess } from 'chess.js';

const app = express();

// Health-check endpoint (til Render)
app.get('/health', (req, res) => res.status(200).send('ok'));

app.use(express.static('public'));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*'} });

// Hvert "rum" er et spil
const games = new Map();
function getOrCreateGame(room) {
  if (!games.has(room)) {
    games.set(room, { chess: new Chess(), players: { white: null, black: null } });
  }
  return games.get(room);
}

io.on('connection', (socket) => {
  let currentRoom = null;
  let myColor = null;

  socket.on('join', (room) => {
    currentRoom = room || 'default';
    const game = getOrCreateGame(currentRoom);

    if (!game.players.white) {
      game.players.white = socket.id; myColor = 'w';
    } else if (!game.players.black) {
      game.players.black = socket.id; myColor = 'b';
    } else {
      myColor = 'spectator';
    }

    socket.join(currentRoom);
    socket.emit('joined', { color: myColor, fen: game.chess.fen(), room: currentRoom });
    io.to(currentRoom).emit('status', statusPayload(currentRoom));
  });

  socket.on('move', ({ from, to, promotion }) => {
    if (!currentRoom) return;
    const game = getOrCreateGame(currentRoom);
    const chess = game.chess;

    const turn = chess.turn(); // 'w' eller 'b'
    const isMyTurn =
      (turn === 'w' && game.players.white === socket.id) ||
      (turn === 'b' && game.players.black === socket.id);
    if (!isMyTurn) return;

    const move = chess.move({ from, to, promotion: promotion || 'q' });
    if (move) {
      io.to(currentRoom).emit('moved', { move, fen: chess.fen() });
      io.to(currentRoom).emit('status', statusPayload(currentRoom));
    } else {
      socket.emit('illegal', { from, to });
    }
  });

  socket.on('reset', () => {
    if (!currentRoom) return;
    const game = getOrCreateGame(currentRoom);
    game.chess = new Chess();
    io.to(currentRoom).emit('reset', { fen: game.chess.fen() });
    io.to(currentRoom).emit('status', statusPayload(currentRoom));
  });

  socket.on('chat', (msg) => {
    if (!currentRoom) return;
    socket.to(currentRoom).emit('chat', msg);
  });

  socket.on('disconnect', () => {
    if (!currentRoom) return;
    const game = games.get(currentRoom);
    if (!game) return;
    if (game.players.white === socket.id) game.players.white = null;
    if (game.players.black === socket.id) game.players.black = null;
    io.to(currentRoom).emit('status', statusPayload(currentRoom));
  });
});

function statusPayload(room) {
  const g = games.get(room);
  if (!g) return { players: { white: null, black: null }, turn: 'w', over: false };
  const chess = g.chess;
  return {
    players: g.players,
    turn: chess.turn(),
    over: chess.isGameOver(),
    checkmate: chess.isCheckmate(),
    draw: chess.isDraw(),
    in_check: chess.isCheck(),
  };
}

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';
server.listen(PORT, HOST, () => console.log(`Server kører på http://${HOST}:${PORT}`));
