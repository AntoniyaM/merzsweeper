export const MINE_COUNT = 40

export const createGrid = (rows = 20, cols = 12) => {
  const grid = []
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      if (!grid[i]) {
        grid[i] = []
      }
      grid[i].push({
        row: i,
        col: j,
        isRevealed: false,
        isMine: false,
        isFlagged: false,
        neighboringMines: 0,
      })
    }
  }

  return grid
}

export const placeMerzMines = (grid, mines = MINE_COUNT) => {
  const rows = grid.length
  const cols = grid[0].length
  let minesPlaced = 0

  while (minesPlaced < mines) {
    const randomRow = Math.floor(Math.random() * rows)
    const randomCol = Math.floor(Math.random() * cols)
    if (!grid[randomRow][randomCol].isMine) {
      grid[randomRow][randomCol].isMine = true
      minesPlaced++
    }
  }
}

export const getNeighboringCells = (grid, cell) => {
  const adjacentCells = []
  for (let i = cell.row - 1; i <= cell.row + 1; i++) {
    for (let j = cell.col - 1; j <= cell.col + 1; j++) {
      if (i >= 0 && i < grid.length && j >= 0 && j < grid[0].length) {
        adjacentCells.push(grid[i][j])
      }
    }
  }

  // Do not include the cell itself.
  return adjacentCells.filter((adjacentCell) => !(adjacentCell.row === cell.row && adjacentCell.col === cell.col))
}

export const countNeighboringMines = (grid, cell) => {
  const adjacentCells = getNeighboringCells(grid, cell)
  return adjacentCells.filter((adjacentCell) => grid[adjacentCell.row][adjacentCell.col].isMine).length
}

export const checkForWin = (grid) => {
  const cells = grid.flat()
  const nonMineCells = cells.filter((cell) => !cell.isMine)
  if (nonMineCells.every((cell) => cell.isRevealed)) {
    return true
  }
}
