var board = [
    ['', '', ''],
    ['', '', ''],
    ['', '', '']
];

var currentPlayer = 'X';
var difficulty = 'easy';
var gameActive = true;
var difficultyLocked = false;

// Scoreboard stats
var scores = {
    x: 0,
    o: 0,
    draw: 0
};

// Cached DOM Elements
var boardEl;
var turnIndicatorEl;
var scorePlayerEl;
var scoreDrawEl;
var scoreAiEl;
var difficultyDisplayEl;
var diffButtons;
var resetButton;
var playAgainButton;
var gameOverModal;
var modalTitle;
var modalResult;

// Unified initialisation
window.onload = function() {
    boardEl = document.getElementById('tic-tac-toe-board');
    turnIndicatorEl = document.getElementById('active-player');
    scorePlayerEl = document.getElementById('score-player');
    scoreDrawEl = document.getElementById('score-draw');
    scoreAiEl = document.getElementById('score-ai');
    difficultyDisplayEl = document.getElementById('difficulty-display');
    diffButtons = document.querySelectorAll('.diff-btn');
    resetButton = document.getElementById('reset-button');
    playAgainButton = document.getElementById('play-again-button');
    gameOverModal = document.getElementById('game-over-modal');
    modalTitle = document.getElementById('modal-title');
    modalResult = document.getElementById('modal-result');

    loadScores();
    setupEventListeners();
};

// Load scores from localStorage
function loadScores() {
    scores.x = parseInt(localStorage.getItem('ttt_score_x')) || 0;
    scores.o = parseInt(localStorage.getItem('ttt_score_o')) || 0;
    scores.draw = parseInt(localStorage.getItem('ttt_score_draw')) || 0;
    updateScoreboardUI();
}

// Update scores in UI and localStorage
function updateScore(winner) {
    if (winner === 'X') {
        scores.x++;
        localStorage.setItem('ttt_score_x', scores.x);
    } else if (winner === 'O') {
        scores.o++;
        localStorage.setItem('ttt_score_o', scores.o);
    } else {
        scores.draw++;
        localStorage.setItem('ttt_score_draw', scores.draw);
    }
    updateScoreboardUI();
}

function updateScoreboardUI() {
    if (scorePlayerEl) scorePlayerEl.textContent = scores.x;
    if (scoreDrawEl) scoreDrawEl.textContent = scores.draw;
    if (scoreAiEl) scoreAiEl.textContent = scores.o;
}

// Reset the entire score history
function resetScores() {
    scores = { x: 0, o: 0, draw: 0 };
    localStorage.removeItem('ttt_score_x');
    localStorage.removeItem('ttt_score_o');
    localStorage.removeItem('ttt_score_draw');
    updateScoreboardUI();
}

// Set up clean event bindings programmatically
function setupEventListeners() {
    // Cell bindings
    var cells = document.querySelectorAll('.cell');
    cells.forEach(function(cell) {
        cell.addEventListener('click', function() {
            var row = parseInt(cell.getAttribute('data-row'));
            var col = parseInt(cell.getAttribute('data-col'));
            handleCellClick(row, col);
        });
        
        cell.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                var row = parseInt(cell.getAttribute('data-row'));
                var col = parseInt(cell.getAttribute('data-col'));
                handleCellClick(row, col);
            }
        });
    });

    // Difficulty buttons bindings
    diffButtons.forEach(function(btn) {
        btn.addEventListener('click', function() {
            if (!difficultyLocked) {
                var diff = btn.getAttribute('data-difficulty');
                setDifficulty(diff);
            }
        });
    });

    // Reset button binding
    if (resetButton) {
        resetButton.addEventListener('click', function() {
            resetScores();
            resetBoard();
        });
    }

    // Play again button binding
    if (playAgainButton) {
        playAgainButton.addEventListener('click', function() {
            resetBoard();
            closeModal();
        });
    }
}

function setDifficulty(diff) {
    difficulty = diff;
    if (difficultyDisplayEl) {
        difficultyDisplayEl.textContent = 'Difficulty: ' + difficulty;
    }
    
    // Update active visual tabs
    diffButtons.forEach(function(btn) {
        if (btn.getAttribute('data-difficulty') === difficulty) {
            btn.classList.add('active');
            btn.setAttribute('aria-checked', 'true');
        } else {
            btn.classList.remove('active');
            btn.setAttribute('aria-checked', 'false');
        }
    });
}

function lockDifficulty() {
    difficultyLocked = true;
    diffButtons.forEach(function(btn) {
        if (!btn.classList.contains('active')) {
            btn.style.opacity = '0.3';
            btn.style.cursor = 'not-allowed';
        }
    });
}

function unlockDifficulty() {
    difficultyLocked = false;
    diffButtons.forEach(function(btn) {
        btn.style.opacity = '';
        btn.style.cursor = '';
    });
}

function handleCellClick(row, col) {
    if (!gameActive || board[row][col] !== '') return;

    // Lock selection on the first move
    if (!difficultyLocked) {
        lockDifficulty();
    }

    makeMove(row, col);
}

function makeMove(row, col) {
    if (board[row][col] == '') {
        board[row][col] = currentPlayer;
        
        var cellElement = document.getElementById('cell-' + row + '-' + col);
        if (cellElement) {
            cellElement.textContent = currentPlayer;
            cellElement.classList.add(currentPlayer === 'X' ? 'x-selected' : 'o-selected');
        }

        var winner = checkWin();
        if (winner) {
            handleGameEnd(winner);
            return;
        } else if (isBoardFull()) {
            handleGameEnd('Draw');
            return;
        }

        if (currentPlayer == 'X') {
            currentPlayer = 'O';
            updateTurnIndicator();
            if (boardEl) boardEl.style.pointerEvents = 'none'; // Lock board during AI turn
            setTimeout(makeAIMove, 450); // Natural visual delay
        } else {
            currentPlayer = 'X';
            updateTurnIndicator();
            if (boardEl) boardEl.style.pointerEvents = 'auto';
        }
    }
}

function updateTurnIndicator() {
    if (turnIndicatorEl) {
        turnIndicatorEl.textContent = 'Player ' + currentPlayer;
        if (currentPlayer === 'X') {
            turnIndicatorEl.className = 'player-x active-glow';
        } else {
            turnIndicatorEl.className = 'player-o active-glow';
        }
    }
}

function handleGameEnd(winner) {
    gameActive = false;
    if (boardEl) boardEl.style.pointerEvents = 'none';

    if (winner !== 'Draw') {
        // Find and highlight the winning line combination
        var combo = getWinningCombo();
        if (combo) {
            combo.forEach(function(coords) {
                var cell = document.getElementById('cell-' + coords[0] + '-' + coords[1]);
                if (cell) {
                    cell.classList.add('win-highlight');
                }
            });
        }

        updateScore(winner);
        setTimeout(function() {
            showModal(winner === 'X' ? 'You Win!' : 'AI Wins!', winner);
        }, 700);
    } else {
        updateScore('Draw');
        setTimeout(function() {
            showModal("It's a Tie!", 'Draw');
        }, 700);
    }
}

function showModal(titleText, resultClass) {
    if (modalTitle) modalTitle.textContent = titleText;
    if (modalResult) {
        modalResult.textContent = resultClass === 'Draw' ? 'Draw!' : resultClass + ' Wins';
        modalResult.className = 'modal-result';
        if (resultClass === 'X') {
            modalResult.classList.add('x-win');
        } else if (resultClass === 'O') {
            modalResult.classList.add('o-win');
        } else {
            modalResult.classList.add('draw-win');
        }
    }
    if (gameOverModal) {
        gameOverModal.classList.add('show');
        gameOverModal.setAttribute('aria-hidden', 'false');
    }
}

function closeModal() {
    if (gameOverModal) {
        gameOverModal.classList.remove('show');
        gameOverModal.setAttribute('aria-hidden', 'true');
    }
}

function resetBoard() {
    board = [
        ['', '', ''],
        ['', '', ''],
        ['', '', '']
    ];
    currentPlayer = 'X';
    gameActive = true;

    var cells = document.querySelectorAll('.cell');
    cells.forEach(function(cell) {
        cell.textContent = '';
        cell.className = 'cell';
    });

    unlockDifficulty();
    updateTurnIndicator();
    if (boardEl) boardEl.style.pointerEvents = 'auto';
}

function getWinningCombo() {
    var lines = [
        [[0, 0], [0, 1], [0, 2]],
        [[1, 0], [1, 1], [1, 2]],
        [[2, 0], [2, 1], [2, 2]],
        [[0, 0], [1, 0], [2, 0]],
        [[0, 1], [1, 1], [2, 1]],
        [[0, 2], [1, 2], [2, 2]],
        [[0, 0], [1, 1], [2, 2]],
        [[0, 2], [1, 1], [2, 0]]
    ];

    for (var i = 0; i < lines.length; i++) {
        var a = lines[i][0];
        var b = lines[i][1];
        var c = lines[i][2];
        if (board[a[0]][a[1]] == board[b[0]][b[1]] && board[b[0]][b[1]] == board[c[0]][c[1]] && board[a[0]][a[1]] != '') {
            return lines[i];
        }
    }
    return null;
}

// AI ALGORITHMS
function makeAIMove() {
    switch (difficulty) {
        case 'easy':
            makeRandomMove();
            break;
        case 'medium':
            if (!makeWinningMove() && !makeBlockingMove()) {
                makeRandomMove();
            }
            break;
        case 'hard':
            if (!makeWinningMove() && !makeBlockingMove() && !makeSmartMove()) {
                makeRandomMove();
            }
            break;
        case 'impossible':
            makeBestMove();
            break;
        default:
            makeRandomMove();
            break;
    }
    if (boardEl) boardEl.style.pointerEvents = 'auto';
}

function minimax(board, depth, isMaximizingPlayer) {
    var winner = checkWin();
    if (winner === 'X') {
        return -1;
    } else if (winner === 'O') {
        return 1;
    } else if (isBoardFull()) {
        return 0;
    }

    if (isMaximizingPlayer) {
        var bestScore = -Infinity;
        for (var i = 0; i < 3; i++) {
            for (var j = 0; j < 3; j++) {
                if (board[i][j] == '') {
                    board[i][j] = 'O';
                    var score = minimax(board, depth + 1, false);
                    board[i][j] = '';
                    bestScore = Math.max(score, bestScore);
                }
            }
        }
        return bestScore;
    } else {
        var bestScore = Infinity;
        for (var i = 0; i < 3; i++) {
            for (var j = 0; j < 3; j++) {
                if (board[i][j] == '') {
                    board[i][j] = 'X';
                    var score = minimax(board, depth + 1, true);
                    board[i][j] = '';
                    bestScore = Math.min(score, bestScore);
                }
            }
        }
        return bestScore;
    }
}

function makeBestMove() {
    var bestScore = -Infinity;
    var move;
    for (var i = 0; i < 3; i++) {
        for (var j = 0; j < 3; j++) {
            if (board[i][j] == '') {
                board[i][j] = 'O';
                var score = minimax(board, 0, false);
                board[i][j] = '';
                if (score > bestScore) {
                    bestScore = score;
                    move = { i: i, j: j };
                }
            }
        }
    }
    if (move) {
        makeMove(move.i, move.j);
    }
}

function makeWinningMove() {
    for (var i = 0; i < 3; i++) {
        for (var j = 0; j < 3; j++) {
            if (board[i][j] == '') {
                board[i][j] = currentPlayer;
                if (checkWin() == currentPlayer) {
                    board[i][j] = '';
                    makeMove(i, j);
                    return true;
                }
                board[i][j] = '';
            }
        }
    }
    return false;
}

function makeBlockingMove() {
    var opponent = currentPlayer == 'X' ? 'O' : 'X';
    for (var i = 0; i < 3; i++) {
        for (var j = 0; j < 3; j++) {
            if (board[i][j] == '') {
                board[i][j] = opponent;
                if (checkWin() == opponent) {
                    board[i][j] = '';
                    makeMove(i, j);
                    return true;
                }
                board[i][j] = '';
            }
        }
    }
    return false;
}

function makeSmartMove() {
    // Try center
    if (board[1][1] == '') {
        makeMove(1, 1);
        return true;
    }

    // Try corners
    var corners = [[0, 0], [0, 2], [2, 0], [2, 2]];
    for (var i = 0; i < corners.length; i++) {
        if (board[corners[i][0]][corners[i][1]] == '') {
            makeMove(corners[i][0], corners[i][1]);
            return true;
        }
    }

    return false;
}

function makeRandomMove() {
    var availableCells = [];
    for (var i = 0; i < 3; i++) {
        for (var j = 0; j < 3; j++) {
            if (board[i][j] == '') {
                availableCells.push([i, j]);
            }
        }
    }
    if (availableCells.length > 0) {
        var move = availableCells[Math.floor(Math.random() * availableCells.length)];
        makeMove(move[0], move[1]);
    }
}

function checkWin() {
    var lines = [
        [board[0][0], board[0][1], board[0][2]],
        [board[1][0], board[1][1], board[1][2]],
        [board[2][0], board[2][1], board[2][2]],
        [board[0][0], board[1][0], board[2][0]],
        [board[0][1], board[1][1], board[2][1]],
        [board[0][2], board[1][2], board[2][2]],
        [board[0][0], board[1][1], board[2][2]],
        [board[0][2], board[1][1], board[2][0]]
    ];

    for (var i = 0; i < lines.length; i++) {
        if (lines[i][0] == lines[i][1] && lines[i][1] == lines[i][2] && lines[i][0] != '') {
            return lines[i][0];
        }
    }
    return false;
}

function isBoardFull() {
    for (var i = 0; i < 3; i++) {
        for (var j = 0; j < 3; j++) {
            if (board[i][j] == '') {
                return false;
            }
        }
    }
    return true;
}
