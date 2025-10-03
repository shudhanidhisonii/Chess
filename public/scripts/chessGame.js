const socket = io();  // client socket.io
const chess = new Chess();

const boardElement = document.querySelector('.chessboard');

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;

const renderBoard = () => {
  const board = chess.board();
  boardElement.innerHTML = "";
  console.log(board);

  board.forEach((row, rowIndex) => {
    row.forEach((square, squareIndex) => {
      const squareElement = document.createElement('div');
      squareElement.classList.add(
        'square',
        (rowIndex + squareIndex) % 2 === 0 ? "light" : "dark"
      );
      squareElement.dataset.row = rowIndex;
      squareElement.dataset.col = squareIndex;

      if (square) {
        const pieceElement = document.createElement('div');
        pieceElement.classList.add("piece", square.color === 'w' ? 'text-white' : 'text-gray-900');
        pieceElement.innerText = getPieceUnicode(square);
        pieceElement.draggable = playerRole === square.color;

        pieceElement.addEventListener("dragstart", (e) => {
          if (pieceElement.draggable) {
            draggedPiece = pieceElement;
            sourceSquare = { row: rowIndex, col: squareIndex };
            e.dataTransfer.setData("text/plain", "");
          }
        });

        pieceElement.addEventListener("dragend", () => {
          draggedPiece = null;
          sourceSquare = null;
        });

        squareElement.appendChild(pieceElement);
      }

      squareElement.addEventListener("dragover", function (e) {
        e.preventDefault();
      });

      squareElement.addEventListener("drop", function (e) {
        e.preventDefault();
        if (draggedPiece) {
          const targetSource = {
            row: parseInt(squareElement.dataset.row),
            col: parseInt(squareElement.dataset.col)
          };
          handleMove(sourceSquare, targetSource);
        }
      });

      boardElement.appendChild(squareElement);
    });
  });

  // Flip board for black player
  if (playerRole === 'b') {
    boardElement.classList.add("flipped");
  } else {
    boardElement.classList.remove("flipped");
  }
};

// ✅ Unicode helper function
// ✅ Unicode helper function (filled black pieces + hollow white pieces)
const getPieceUnicode = (piece) => {
  const unicodePieces = {
    p: "♟︎", r: "♜", n: "♞", b: "♝", q: "♛", k: "♚",   // black pieces
    P: "♙", R: "♖", N: "♘", B: "♗", Q: "♕", K: "♔"    // white pieces
  };
  return unicodePieces[piece.color === 'w' ? piece.type.toUpperCase() : piece.type] || "";
};


// ✅ Convert source/target squares to SAN (algebraic notation)
const handleMove = (source, target) => {
  const move = {
    from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
    to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`
  };
  socket.emit("move", move);
};

// ✅ Socket events
socket.on("playerRole", (role) => {
  playerRole = role;
  renderBoard();
});

socket.on("spectatorRole", () => {
  playerRole = null;
  renderBoard();
});

socket.on("boardState", (board) => {
  chess.load(board);
  renderBoard();
});

socket.on("move", (move) => {
  chess.move(move);
  renderBoard();
});

// ✅ Initial render
renderBoard();
