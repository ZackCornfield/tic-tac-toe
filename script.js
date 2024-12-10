"use strict";

class Player {
    constructor(sign) {
        this.sign = sign;
    }

    getSign() {
        return this.sign;
    }
}

class LogicalGameBoard {
    constructor() {
        this.board = ["", "", "", "", "", "", "", "", ""];
    }

    setField(index, sign) {
        this.board[index] = sign;
    }

    getField(index) {
        return this.board[index];
    }

    resetFields() {
        this.board.fill("");
    }
}

class DisplayController {
    constructor(logicalGameBoard, gameController) {
        this.logicalGameBoard = logicalGameBoard;
        this.gameController = gameController;

        this.gameStartButton = document.querySelector('.game-start__action-btn');
        this.gameConsole = document.querySelector('main');
        this.resultDisplayer = document.querySelector('.result-conveyer');
        this.nextRoundBtn = document.querySelector('.result-conveyer__continue-btn');
        this.quitGameBtn = document.querySelector('.result-conveyer__reset-btn');
        this.fieldElements = document.querySelectorAll('.game-board__field');
        this.fieldElementsStates = document.querySelectorAll('.game-board__state');
        this.restartBtn = document.querySelector('.main__restart-btn');
        this.scoreDisplayerElements = document.querySelectorAll('.main__score-displayer');

        this.playerXScore = 0;
        this.playerOScore = 0;
        this.tiedMatches = 0;
        this.tie = false;

        this.addEventListeners();
    }

    addEventListeners() {
        this.gameStartButton.addEventListener('click', (e) => this.startGame(e));
        this.restartBtn.addEventListener('click', (e) => this.restartGame(e));
        this.nextRoundBtn.addEventListener('click', (e) => this.nextRound(e));
        this.quitGameBtn.addEventListener('click', (e) => this.quitGame(e));

        this.fieldElementsStates.forEach((field) =>
            field.addEventListener('click', (e) => this.handleFieldClick(e))
        );
    }

    startGame(e) {
        this.activateBtn(e.target);
        setTimeout(() => {
            this.setActiveStates();
            e.target.parentElement.classList.add('disabled');
            this.gameConsole.classList.remove('disabled');
        }, 500);
    }

    handleFieldClick(e) {
        let fieldState = e.target.dataset.fieldState;
        if (this.gameController.getIsOver() || (fieldState == 'set-x' || fieldState == 'set-o')) return;

        this.gameController.playRound(parseInt(e.target.parentElement.dataset.index));
        this.updateGameboard();
        this.activateBtn(e.target.parentElement);
    }

    restartGame() {
        this.logicalGameBoard.resetFields();
        this.gameController.resetGame();
        this.removeBoardBackgroundColor(this.fieldElements);
        this.updateGameboard();
    }

    nextRound(e) {
        this.activateBtn(e.target);
        setTimeout(() => {
            e.target.parentElement.parentElement.classList.add('disabled');
            this.tie = false;
            this.restartGame();
        }, 500);
    }

    quitGame(e) {
        this.activateBtn(e.target);
        this.playerXScore = 0;
        this.playerOScore = 0;
        this.tiedMatches = 0;
        this.tie = false;
        this.resultDisplayer.classList.remove('disabled');
        this.updateScoreBoard('reset');
        setTimeout(() => {
            this.restartGame();
            e.target.parentElement.parentElement.classList.add('disabled');
            this.gameConsole.classList.add('disabled');
            this.gameStartButton.parentElement.classList.remove('disabled');
        }, 500);
    }

    updateGameboard() {
        for (let i = 0; i < this.fieldElementsStates.length; i++) {
            this.fieldElementsStates[i].dataset.fieldState = `set-${this.logicalGameBoard.getField(i)}`;
            this.setActiveStates();
        }
    }

    updateScoreBoard(scoreEntity) {
        if(scoreEntity === 'x'){this.scoreDisplayerElements[0].textContent = +this.playerXScore}
        else if(scoreEntity === 'o'){this.scoreDisplayerElements[2].textContent = ++this.playerOScore; }
        else if(scoreEntity === 'reset'){this.scoreDisplayerElements.forEach((el)=>el.textContent=0)}
        else { this.scoreDisplayerElements[1].textContent = ++this.tiedMatches; this.tie=true }

        if(scoreEntity === 'reset') return;

        setTimeout(()=>{
            this.resultDisplayer.classList.remove('disabled')
        }, 1000);
    }

    activateBtn(element) {
        function removeTransition(e) {
            if (e.propertyName !== 'transform') return;
            e.target.classList.remove('clicked');
        }
        element.classList.add('clicked');
        element.addEventListener('transitionend', removeTransition);
    }
    
    setActiveStates() {
        document.querySelectorAll('[data-field-turn]').forEach((el)=>el.dataset.fieldTurn = `turn-${this.gameController.getCurrentPlayerSign()}`)

        if(this.tie === true){
            document.querySelectorAll('[data-field-turn]')[10].dataset.fieldTurn='';
            document.querySelectorAll('[data-field-turn]')[10].children[1].textContent = 'It\'s a Tie!';
            this.resultDisplayer.querySelector('p').classList.add('disabled')
            this.resultDisplayer.querySelector('section:nth-child(2)').classList.add('greyish-text')
        }
        else {
            document.querySelectorAll('[data-field-turn]')[10].children[1].textContent = 'Takes the round'
            this.resultDisplayer.querySelector('p').classList.remove('disabled')
            this.resultDisplayer.querySelector('section:nth-child(2)').classList.remove('greyish-text')
        }
    }

    setBoardBackgroundColor(boardElements) {
        let signArray = [];
        boardElements.forEach((el)=>signArray.push(this.logicalGameBoard.getField(el)))
        if(signArray.includes('x') === true){
            boardElements.forEach((el)=>this.fieldElements[el].classList.add('game-board--field-won-x'))
            this.updateScoreBoard('x')
        }else {
            boardElements.forEach((el)=>this.fieldElements[el].classList.add('game-board--field-won-o')) 
            this.updateScoreBoard('o')
        }
    }

    restartGame() {
        this.logicalGameBoard.resetFields();
        this.gameController.resetGame();
        this.removeBoardBackgroundColor(this.fieldElements);
        this.updateGameboard();
    }


    removeBoardBackgroundColor(boardElements) {
        boardElements.forEach((el) => (el.className = 'game-board__field'));
    }
}

class GameController {
    constructor(logicalGameBoard, displayController) {
        this.logicalGameBoard = logicalGameBoard;
        this.displayController = displayController;

        this.playerX = new Player("x");
        this.playerO = new Player("o");
        this.round = 1;
        this.isOver = false;
        this.result = false;
    }

    playRound(fieldIndex) {
        this.logicalGameBoard.setField(fieldIndex, this.getCurrentPlayerSign());
        this.checkWinner(fieldIndex);

        if (this.result) {
            this.isOver = true;
            return;
        }
        if (this.round === 9) {
            this.displayController.updateScoreBoard('tie');
            this.isOver = true;
            return;
        }
        this.round++;
    }

    getCurrentPlayerSign() {
        return this.round % 2 === 1 ? this.playerX.getSign() : this.playerO.getSign();
    }

    checkWinner(fieldIndex) {
        const winningCombinations = [
            [0, 1, 2],
            [3, 4, 5],
            [6, 7, 8],
            [0, 3, 6],
            [1, 4, 7],
            [2, 5, 8],
            [0, 4, 8],
            [2, 4, 6],
        ];

        winningCombinations
            .filter((combination) => combination.includes(fieldIndex))
            .some((combination) => {
                if (combination.every((index) => this.logicalGameBoard.getField(index) === this.getCurrentPlayerSign())) {
                    this.result = true;
                    this.displayController.setBoardBackgroundColor(combination);
                    return true;
                }
                return false;
            });
    }

    resetGame() {
        this.isOver = false;
        this.result = false;
        this.round = 1;
    }

    getIsOver() {
        return this.isOver;
    }
}

const logicalGameBoard = new LogicalGameBoard();
const gameController = new GameController(logicalGameBoard, null);
const displayController = new DisplayController(logicalGameBoard, gameController);
gameController.displayController = displayController;