const socket = io();
let board = null;
let game = new Chess();
let myColor = null;
let currentRoom = null;

const $ = (sel) => document.querySelector(sel);
const roomInput = $('#room');
const joinBtn = $('#join');
const colorSpan = $('#color');
const turnSpan = $('#turn');
const gameoverDiv = $('#gameover');
const resetBtn = $('#reset');
const shareInput = $('#sharelink');

const url = new URL(window.location.href);
const hashRoom = url.hash.replace('#', '');
if (hashRoom) {
  roomInput.value = hashRoom;
}

function updateShareLink() {
  const base = window.location.origin + window.location.pathname;
  shareInput.value = `${base}#${currentRoom || ''}`;
}

function sanitizeRoomName(v){
  return (v || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g,'-')
    .replace(/[^a-z0-9_-]/g,'');
}

function onDragStart(source, piece) {
  if (myColor === 'spectator') return false;
  if (game.isGameOver()) return false;
  if (myColor === 'w' && piece.search(/^b/) !== -1) return false;
  if (myColor === 'b' && piece.search(/^w/) !== -1) return false;
  if ((game.turn() === 'w' && myColor !== 'w') || (game.turn() === 'b' && myColor !== 'b')) return false;
}

function onDrop(source, target) {
  const move = { from: source, to: target, promotion: 'q' };
  const result = game.move(move);
  if (result === null) return 'snapback';
  socket.emit('move', move);
}

function onSnapEnd() {
  board.position(game.fen());
}

function setStatusUI(payload) {
  turnSpan.textContent = payload.turn === 'w' ? 'Hvid' : 'Sort';
  if (payload.over) {
    gameoverDiv.classList.remove('hidden');
    let txt = 'Spillet er slut: ';
    if (payload.checkmate) txt += 'Skakmat';
    else if (payload.draw) txt += 'Remis';
    else txt += 'Slut';
    gameoverDiv.textContent = txt;
  } else {
    gameoverDiv.classList.add('hidden');
    gameoverDiv.textContent = '';
  }
}

function createBoard() {
  const orientation = myColor === 'b' ? 'black' : 'white';
  board = Chessboard('board', {
    draggable: true,
    position: game.fen(),
    orientation,
    onDragStart,
    onDrop,
    onSnapEnd
  });
}

function doJoin(){
  let room = sanitizeRoomName(roomInput.value);
  if(!room) room = 'default';
  currentRoom = room;
  window.location.hash = room;
  updateShareLink();
  socket.emit('join', String(room));
}

joinBtn.addEventListener('click', doJoin);
roomInput.addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ e.preventDefault(); doJoin(); }});

resetBtn.addEventListener('click', () => socket.emit('reset'));

socket.on('joined', ({ color, fen, room }) => {
  myColor = color;
  colorSpan.textContent = color === 'w' ? 'Du er HVID' : color === 'b' ? 'Du er SORT' : 'Tilskuer';
  game.load(fen || game.fen());
  if (board) board.destroy();
  createBoard();
});

socket.on('moved', ({ move, fen }) => {
  game.load(fen);
  board.position(fen);
});

socket.on('reset', ({ fen }) => {
  game.load(fen);
  board.position(fen);
});

socket.on('status', (payload) => setStatusUI(payload));

const form = document.getElementById('chatform');
const input = document.getElementById('msg');
const messages = document.getElementById('messages');

form.addEventListener('submit', (e) => {
  e.preventDefault();
  if (input.value) {
    appendMsg('dig', input.value);
    socket.emit('chat', input.value);
    input.value = '';
  }
});

socket.on('chat', (msg) => appendMsg('modstander', msg));

function appendMsg(who, text) {
  const div = document.createElement('div');
  div.className = `bubble ${who}`;
  div.textContent = text;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

if (hashRoom) {
  currentRoom = hashRoom;
  updateShareLink();
  socket.emit('join', hashRoom);
}