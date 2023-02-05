export const initialLoadCount = 0;
export const initialLoadNeeded = 6;
export const initialLoadingString = `|${'='.repeat(initialLoadCount)}${' '.repeat(initialLoadNeeded - initialLoadCount + 1)}|\nLoading...`;

export let CONST = {
  ROOTS: 0,
  SCORE: 0,
  HIGHSCORE: 0,
  FIELD_SIZE: 8,
  TILE_WIDTH: 16,
  TILE_HEIGHT: 16,
  LOAD_COUNT: 0,
  LOAD_NEEDED: 6,
  LOADING_STRING: initialLoadingString
};
