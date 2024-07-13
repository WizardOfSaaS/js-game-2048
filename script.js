console.clear()
console.log('Run: ', new Date())

class Tile {
    constructor(val, cell) {
        this.val = val
        this.cell = cell
        this.isStable = true
    }
    double() {
        game.score += this.val
        this.val = 2 * this.val
        this.val === 2048 && game.got2048()
    }
}

class Cell {
    constructor(i, j) {
        this.pos = [i, j]
        this.elem = document.getElementById(`cell-${i}${j}`)
        this.isEmpty = true
        this.tile = null
    }
    async addNewTile(val) {
        await new Promise((resolve, reject) => {
            setTimeout(resolve, 120)
        })
        this.acceptTile(new Tile(val, this))
    }
    acceptTile(tile) {
        if (tile === null) { return }
        this.tile = tile
        const val = tile.val
        this.elem.classList.add(`tile-${val}`)
        this.elem.innerText = val
    }
    async shiftTileTo(other) {
        if (this.tile === null) { return }
        other.acceptTile(this.tile)
        await new Promise((resolve, reject) => {
            setTimeout(resolve, 20)
        })
        this.clear()
    }
    doubleTile() {
        this.elem.classList.remove(`tile-${this.tile.val}`)
        this.tile.double()
        this.tile.isStable = false
        const val = this.tile.val
        this.elem.classList.add(`tile-${val}`)
        this.elem.innerText = val
    }
    clear() {
        if (!this.tile) { return }
        this.elem.classList.remove(`tile-${this.tile.val}`)
        this.elem.innerText = ''
        this.tile = null
    }
}

class Board {
    constructor() {
        this.cells = [0, 1, 2, 3].map(i => (
            [0, 1, 2, 3].map(j => new Cell(i, j))
        ))
        this.elem = document.getElementById('board')
        document.addEventListener('keydown', this.handleKeyDown.bind(this))
        this.reset()
    }
    handleKeyDown(e) {
        if (!game.isActive) { return }
        e.key.match(/^Arrow/) && this.playMove(e.key.replace(/^Arrow/, '').toUpperCase())
    }
    async addNewTile() {
        const randomIdx = Math.floor(Math.random() * this.nFreeCells)
        const randomVal = 2 + 2 * Math.floor(2 * Math.random())
        const randomEmptyCell = this.cells.flat().filter(c => !c.tile)[randomIdx]
        await randomEmptyCell.addNewTile(randomVal)
        this.nFreeCells--
    }
    async moveLine(cells) {
        let changed = false;
        for (let n = 0; n < 4; n++) {
            for (let i = 1; i < 4; i++) {
                if (!cells[i - 1].tile && cells[i].tile) {
                    await cells[i].shiftTileTo(cells[i - 1])
                    changed = changed || true
                } else if (
                    cells[i].tile &&
                    cells[i - 1].tile.isStable &&
                    cells[i].tile.isStable &&
                    cells[i - 1].tile.val === cells[i].tile.val
                ) {
                    cells[i - 1].doubleTile()
                    cells[i].clear()
                    changed = changed || true
                }
            }
        }
        cells.forEach(c => { c.tile ? c.tile.isStable = true : null })
        return changed
    }
    async moveInDirection(dir) {
        let promises
        let changed = false
        switch (dir) {
            case 'LEFT':
                promises = this.cells.map(row => this.moveLine(row.map(el => el)))
                changed = (await Promise.all(promises)).some(el => el)
                break
            case 'RIGHT':
                promises = this.cells.map(row => this.moveLine(row.map(el => el).reverse()))
                changed = (await Promise.all(promises)).some(el => el)
                break
            case 'UP':
                promises = [0, 1, 2, 3].map(col => {
                    return this.moveLine(
                        [0, 1, 2, 3].map(row => this.cells[row][col]
                        )
                    )
                })
                changed = (await Promise.all(promises)).some(el => el)
                break
            case 'DOWN':
                promises = [0, 1, 2, 3].map(col => {
                    return this.moveLine(
                        [0, 1, 2, 3]
                            .map(row => this.cells[row][col])
                            .reverse()
                    )
                })
                changed = (await Promise.all(promises)).some(el => el)
                break
        }
        if (changed) {
            this.nFreeCells = this.cells.flat().filter(c => !c.tile).length
        }
        console.log("Changed: ", changed)
        return changed
    }
    async playMove(dir) {
        const changed = await this.moveInDirection(dir)
        if (changed) {
            await this.addNewTile()
        }
        if (!this.checkMovesPossible()) {
            console.log('GAME OVER')
            game.isGameOver = true
        }
        game.update()
    }
    checkMovesPossible() {
        if (this.nFreeCells) { return true }
        const xMovePossible = this.cells.some(row => {
            return [0, 1, 2].some(j => row[j].tile.val == row[j + 1].tile.val)
        })
        if (xMovePossible) { return true }
        const yMovePossible = [0, 1, 2, 3].some(j => {
            return [0, 1, 2].some(i => {
                return this.cells[i][j].tile.val === this.cells[i + 1][j].tile.val
            })
        })
        return yMovePossible || false
    }
    fade() {
        this.elem.classList.add('fade')
    }
    reset() {
        this.elem.classList.remove('fade')
        this.nFreeCells = 16
        this.cells.flat().forEach(c => c.clear())
    }
}

class Game {
    constructor() {
        this.board = new Board()
        this.scoreElem = document.getElementById('score')
        this.scoreDiv = document.getElementById('score-container')
        this.statusElem = document.getElementById('status')
        this.resetBtn = document.getElementById('reset-btn')
        this.resetBtn.addEventListener('click', this.reset.bind(this))
        this.continueBtn = document.getElementById('continue-btn')
        this.continueBtn.addEventListener('click', this.handleContinue.bind(this))
        this.reset()
        this.update()
    }
    got2048() {
        if (this.hasReached2048) { return }
        this.hasReached2048 = true
        this.handleWin()
    }
    update() {
        console.log('Score:', this.score)
        this.scoreElem.innerText = this.score
        if (this.isGameOver) { this.handleGameOver() }
    }
    handleGameOver() {
        this.isActive = false
        this.board.fade()
        this.scoreDiv.classList.add('imp')
        this.resetBtn.classList.add('imp')
        this.statusElem.innerText = 'GAME OVER'
        this.statusElem.classList.add('imp')
    }
    handleWin() {
        this.isActive = false
        this.board.fade()
        this.statusElem.innerText = 'YOU WIN!'
        this.continueBtn.classList.add('imp')
        this.statusElem.classList.add('imp')
    }
    handleContinue() {
        this.statusElem.innerText = ''
        this.continueBtn.classList.remove('imp')
        this.board.elem.classList.remove('fade')
        this.isActive = true
    }
    reset() {
        this.scoreDiv.classList.remove('imp')
        this.statusElem.classList.remove('imp')
        this.resetBtn.classList.remove('imp')
        this.statusElem.innerText = ''
        this.hasReached2048 = false
        this.score = 0
        this.isGameOver = false
        this.board.reset()
        this.board.addNewTile()
        this.board.addNewTile()
        this.isActive = true
    }
}

const game = new Game
