<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useBestTimesStore } from '@/stores/bestTimes'
import { MINE_COUNT, createGrid, placeMerzMines, countNeighboringMines, checkForWin, getNeighboringCells } from '@/utils/grid'
import { formatTime } from '@/utils/time'

// Data.
const seconds = ref(0)
const intervalId = ref(null)
const grid = ref([])
const flaggedCells = ref(0)
const playing = ref(false)
const resetting = ref(false)
const gameLost = ref(false)
const gameWon = ref(false)
const playerName = ref('')
const router = useRouter()

// Computed.
const time = computed(() => {
  return formatTime(seconds.value)
})

const merzImage = computed(() => {
  if (resetting.value) return '/merz-game-reset.webp'
  return gameLost.value ? '/merz-game-lost.webp' : '/merz-mine.webp'
})

// Methods.
const { addScore } = useBestTimesStore()
const resetGame = () => {
  gameLost.value = false
  gameWon.value = false
  playing.value = false
  seconds.value = 0
  flaggedCells.value = 0
  clearInterval(intervalId.value)
  grid.value = createGrid()
  placeMerzMines(grid.value)
  grid.value = grid.value.map((row) => {
    return row.map((cell) => {
      return {
        ...cell,
        neighboringMines: countNeighboringMines(grid.value, cell),
      }
    })
  })
}

const startTimer = () => {
  intervalId.value = setInterval(() => {
    if (!playing.value) {
      clearInterval(intervalId.value)
    }
    seconds.value++
  }, 1000)
}

const winGame = () => {
  // Flag all remaining mines.
  const mines = grid.value.flat().filter((cell) => cell.isMine)
  mines.forEach((mine) => {
    if (!mine.isFlagged) {
      grid.value[mine.row][mine.col].isFlagged = true
      flaggedCells.value++
    }
  })
  gameWon.value = true
  playing.value = false
}

const saveTime = async () => {
  await addScore({
    name: playerName.value,
    time: seconds.value,
  })
  playerName.value = ''
  await router.push('/scoreboard')
}

const revealNeighbors = (cell) => {
  const neighbors = getNeighboringCells(grid.value, cell)
  for (const neighbor of neighbors) {
    if (!neighbor.isRevealed && !neighbor.isMine) {
      if (!neighbor.isFlagged) {
        grid.value[neighbor.row][neighbor.col].isRevealed = true

        // Keep revealing if there are no neighboring mines.
        if (neighbor.neighboringMines === 0) {
          revealNeighbors(neighbor)
        }
      }
    }
  }
}

const revealCell = (cell) => {
  if (!gameWon.value && !playing.value) {
    playing.value = true
    startTimer()
  }
  if (playing && !cell.isRevealed) {
    cell.isRevealed = true
    if (cell.isFlagged) {
      cell.isFlagged = false
      flaggedCells.value--
    }
    if (cell.isMine) {
      gameLost.value = true
      playing.value = false
    } else {
      if (cell.neighboringMines === 0) {
        revealNeighbors(cell)
      }
      if (checkForWin(grid.value)) {
        winGame()
      }
    }
  }
}

const flagCell = (cell) => {
  if (playing.value && !cell.isRevealed) {
    cell.isFlagged = !cell.isFlagged
    if (cell.isFlagged) {
      flaggedCells.value++
    } else {
      flaggedCells.value--
    }
    if (checkForWin(grid.value)) {
      winGame()
    }
  }
}

const doubleClick = (cell) => {
  if (playing.value) {
    const neighbors = getNeighboringCells(grid.value, cell)
    const flaggedNeighbors = neighbors.filter((neighbor) => neighbor.isFlagged)
    if (cell.isRevealed && cell.neighboringMines === flaggedNeighbors.length) {
      for (const neighbor of neighbors) {
        if (!neighbor.isRevealed && !neighbor.isFlagged) {
          revealCell(neighbor)
        }
      }
    }
  }
}

// Mounted.
onMounted(() => {
  resetGame()
})
</script>

<template>
  <div class="container">
    <div class="text-center">
      <h1>Merz-Sweeper</h1>
      <p>
        <strong>Sei vorsichtig! Herr Merz lauert hinter jeder Ecke. 👀</strong>
      </p>
      <p>
        <RouterLink to="/scoreboard" class="button button--outline">📋 Score Board</RouterLink>
      </p>
    </div>

    <Transition name="slide-down" appear>
      <div v-if="gameWon" class="overlay">
        <div class="text-center">
          <p>
            <strong>Klasse Leistung!</strong>
          </p>
          <input v-model="playerName" type="text" placeholder="Dein Gamer-Tag" maxlength="25" />
          <div @click="saveTime" class="button">
            Submit
          </div>
        </div>
      </div>
    </Transition>

    <div class="game">
      <div class="stats d-flex">
        <div class="mine-count d-flex align-center">
          0{{ MINE_COUNT - flaggedCells }}
        </div>
        <div class="reset"
             @click="resetGame"
             @mousedown="resetting = true"
             @mouseup="resetting = false"
             @touchstart="resetting = true"
             @touchend="resetting = false">
          <img :src="merzImage" alt="">
        </div>
        <div class="timer d-flex align-center">
          {{ time }}
        </div>
      </div>
      <div
        v-for="(row, rowIndex) in grid"
        :key="rowIndex"
        class="row">
        <div
          v-for="cell in row"
          :key="cell"
          class="cell"
          :class="{ 'is-revealed': cell.isRevealed }"
          @dblclick="doubleClick(cell)"
          @click.left="revealCell(cell)"
          @click.right.prevent="flagCell(cell)">
          <div
            v-if="cell.isRevealed || (gameLost && cell.isMine)"
            class="cell-content d-flex align-center justify-center"
            :class="[
              `color-${cell.neighboringMines}`,
              { 'is-mine': cell.isMine }
            ]">
            <img v-if="cell.isMine" src="/merz-mine.webp" alt="Der Kopf von Friedrich Merz">
            <template v-else>
              {{ cell.neighboringMines ?? cell.neighboringMines > 0 ? cell.neighboringMines : '' }}
            </template>
          </div>
          <div v-else-if="cell.isFlagged" class="cell-content">🚩</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
@import '@/assets/mixins/bp';

.overlay {
  width: 80vw;
  height: 300px;
  max-width: 600px;
  backdrop-filter: blur(4px);
  position: fixed;
  top: 60%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid $color-white;
  border-radius: $border-radius;
  box-shadow: 0 0 12px rgba($color-black, 0.15);
  z-index: 2;

  p,
  strong {
    text-shadow: 1px 1px $color-grey;
  }
}

.stats {
  justify-content: space-between;
  margin-bottom: 1.25rem;
}

.mine-count,
.timer {
  background: $color-contrast;
  color: $color-white;
  font-family: $font-family-cells;
  font-size: 1.75rem;
  padding-inline: 1rem;
  border-radius: $border-radius;

  @include bp(m) {
    font-size: 2.5rem;
  }
}

.reset {
  cursor: pointer;

  img {
    height: 50px;
    transform: scale(1.4);

    @include bp(m) {
      height: 65px;
    }
  }
}

.game {
  background: $color-white;
  border-radius: $border-radius;
  padding: 1.25rem;
  margin-block: 2rem;
  margin-inline: auto;
  max-width: 340px;

  @include bp(m) {
    padding: 1.5rem;
    max-width: 650px;
  }
}

.row {
  display: grid;
  grid-template-columns: repeat(12, 25px);
  grid-auto-rows: 25px;
  place-content: center;

  @include bp(m) {
    grid-template-columns: repeat(12, 50px);
    grid-auto-rows: 50px;
  }
}

.cell {
  background: $cell-bg;
  border: 3px solid;
  border-color: $color-contrast-light $color-contrast-dark $color-contrast-dark $color-contrast-light;
  cursor: pointer;
  user-select: none;

  @include bp(m) {
    border-width: 4px;
  }

  &.is-revealed {
    background: rgba($color-contrast, 0.3);
    border-width: 1px;
  }
}

.cell-content {
  height: 100%;
  font-family: $font-family-cells;
  font-size: 1.75rem;
  font-weight: 600;

  &.is-mine {
    img {
      width: 80%;
    }
  }
}

@each $color in $cell-colors {
  $i: index($cell-colors, $color);
  .color-#{$i} {
    color: $color;
  }
}
</style>
