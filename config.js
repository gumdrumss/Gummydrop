const gummyGameConfig = {
  // Range for the number of gummies to spawn
  gummyCountRange: [30, 70],

  // Range for the fall speed of gummies (in seconds)
  fallSpeedRange: [0.6, 1.2],

  // Duration of the fall animation (in seconds)
  fallDuration: 10,

  // Delay before the guessing phase starts (in seconds)
  guessDelay: 3,

  // Game area dimensions
  area: {
    width: 1280,
    height: 720
  },

  // Path to the gummy image
  gummyImage: 'assets/gummy.png',

  // Size of each gummy (in pixels)
  gummySize: 145,

  // Path to the background image
  backgroundImage: ' ',

  // Time allowed for guessing (in seconds)
  guessTime: 15,

  // Font family for the game
  fontFamily: 'Rubik, sans-serif',

  // Font color for text
  fontColor: 'white',

  // Box color for UI elements
  boxColor: '#ff66aa'
};
