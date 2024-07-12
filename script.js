console.clear()
console.log('Run: ', new Date())

class Tile {
    constructor(val, cell) {
        this.val = val
        this.cell = cell
        this.isStable = true
    }
    double() {
        this.val = 2 * this.val
    }
}

class Cell {
    constructor(i, j) {
        this.pos = [i, j]
        this.elem = document.getElementById(`cell-${i}${j}`)
        this.isEmpty = true
        this.tile = null
    }
    addNewTile(val) {
        this.acceptTile(new Tile(val, this))
    }
    acceptTile(tile) {
        if (tile === null) { return }
        this.tile = tile
        const val = tile.val
        this.elem.classList.add(`tile-${val}`)
        this.elem.innerText = val
    }
    shiftTileTo(other) {
        if (this.tile === null) { return }
        other.acceptTile(this.tile)
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
        this.nFreeCells = 16
        this.elem = document.getElementById('board')
        document.addEventListener('keydown', this.handleKeyDown.bind(this))
    }
    handleKeyDown(e) {
        e.key.match(/^Arrow/) && this.playMove(e.key.replace(/^Arrow/, '').toUpperCase())
    }
    addNewTile() {
        const randomIdx = Math.floor(Math.random() * this.nFreeCells)
        const randomVal = 2 + 2 * Math.floor(2 * Math.random())
        const randomEmptyCell = this.cells.flat().filter(c => !c.tile)[randomIdx]
        randomEmptyCell.addNewTile(randomVal)
        this.nFreeCells--
    }
    async moveLine(cells) {
        for (let n = 0; n < 4; n++) {
            for (let i = 1; i < 4; i++) {
                if (!cells[i - 1].tile) {
                    cells[i].shiftTileTo(cells[i - 1])
                } else if (
                    cells[i].tile &&
                    cells[i - 1].tile.isStable &&
                    cells[i].tile.isStable &&
                    cells[i - 1].tile.val === cells[i].tile.val
                ) {
                    cells[i - 1].doubleTile()
                    cells[i].clear()
                }
            }
        }
        cells.forEach(c => { c.tile ? c.tile.isStable = true : null })
    }
    moveInDirection(dir) {
        switch (dir) {
            case 'LEFT':
                this.cells.forEach(row => this.moveLine(row.map(el => el)))
                break
            case 'RIGHT':
                this.cells.forEach(row => this.moveLine(row.map(el => el).reverse()))
                break
            case 'UP':
                [0, 1, 2, 3].forEach(col => {
                    this.moveLine(
                        [0, 1, 2, 3].map(row => this.cells[row][col]
                        )
                    )
                })
                break
            case 'DOWN':
                [0, 1, 2, 3].forEach(col => {
                    this.moveLine(
                        [0, 1, 2, 3]
                            .map(row => this.cells[row][col])
                            .reverse()
                    )
                })
                break
        }
        this.nFreeCells = this.cells.flat().filter(c => !c.tile).length
        console.log(this.nFreeCells)
    }
    playMove(dir) {
        this.moveInDirection(dir)
        this.addNewTile()
    }
}

class Game {
    constructor() {
        this.board = new Board()
    }
}

const game = new Game
game.board.addNewTile()