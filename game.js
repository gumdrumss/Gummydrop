// WebSocket Integration for Streamer.bot
let sbSocket = new WebSocket("ws://localhost:8080");

sbSocket.onopen = () => {
  console.log("Connected to Streamer.bot WebSocket");

  // Update the connection status on the screen
  const connectionStatus = document.getElementById("connection-status");
  connectionStatus.innerText = "Connected to Streamer.bot!";
  
  // Show the Start Game button and hide the connection status after 2 seconds
  setTimeout(() => {
    connectionStatus.classList.add("hidden");
    document.getElementById("start-btn").classList.remove("hidden");
  }, 2000);
};

sbSocket.onerror = (err) => {
  console.error("WebSocket error:", err);

  // Update the connection status to show an error message
  const connectionStatus = document.getElementById("connection-status");
  connectionStatus.innerText = "Failed to connect to Streamer.bot. Please check your connection.";
};

sbSocket.onmessage = (event) => {
  console.log(`[DEBUG] WebSocket message received: ${event.data}`); // Log all incoming messages
  try {
    const data = JSON.parse(event.data);

    // Check if the message is a chat message
    if (data.source === "chat" && data.info && data.info.message) {
      const user = data.info.user || "Unknown User"; // Extract username
      const message = data.info.message.trim(); // Extract and trim the chat message

      console.log(`[DEBUG] Chat message received: ${user} said "${message}"`);

      // Check if the message is a valid guess (a number)
      const guess = parseInt(message, 10);
      if (!isNaN(guess)) {
        console.log(`[DEBUG] Valid guess received: ${user} guessed ${guess}`);

        if (!window.gummyGuesses) window.gummyGuesses = [];

        // Avoid duplicate guesses from the same user
        const existingGuess = window.gummyGuesses.find(g => g.name === user);
        if (!existingGuess) {
          window.gummyGuesses.push({ name: user, guess: guess, timestamp: Date.now() });
          console.log(`[DEBUG] Registered guess: ${user} guessed ${guess}`);
        } else {
          console.log(`[DEBUG] Duplicate guess ignored for ${user}`);
        }
      } else {
        console.log(`[DEBUG] Invalid guess from ${user}: "${message}"`);
      }
    } else {
      console.log(`[DEBUG] Non-chat message received: ${event.data}`);
    }
  } catch (e) {
    console.error("[DEBUG] Error parsing WebSocket message:", e);
  }
};

// Function to send a message to the channel
function sendMessageToChannel(message) {
  if (sbSocket && sbSocket.readyState === WebSocket.OPEN) {
    sbSocket.send(JSON.stringify({ action: "sendMessage", message }));
  } else {
    console.error("WebSocket is not connected. Unable to send message.");
  }
}

// DOMContentLoaded Event Listener
document.addEventListener("DOMContentLoaded", () => {
  // Apply dynamic styles from configuration
  document.body.style.setProperty('--fontFamily', gummyGameConfig.fontFamily);
  document.body.style.setProperty('--fontColor', gummyGameConfig.fontColor);
  document.body.style.setProperty('--boxColor', gummyGameConfig.boxColor);

  if (gummyGameConfig.backgroundImage) {
    document.body.style.backgroundImage = `url(${gummyGameConfig.backgroundImage})`;
  }

  // DOM element references
  const container = document.getElementById("gummy-container");
  const timerEl = document.getElementById("timer");
  const startBtn = document.getElementById("start-btn");
  const restartBtn = document.getElementById("restart-btn");
  const promptBox = document.getElementById("prompt-box");
  const answerBox = document.getElementById("answer-box");
  const winnerBox = document.getElementById("winner-box");
  const leaderboardBox = document.getElementById("leaderboard-box");
  const leaderboardList = document.getElementById("leaderboard-list");
  const winnerName = document.getElementById("winner-name");
  const debugLog = document.getElementById("debug-log");

  let gummyImg = gummyGameConfig.gummyImage;
  let gummyCount = 0;
  let correctCount = 0;
  let currentWinner = "Streamer";

  // Debugging function
  function debug(msg) {
    console.log("[DEBUG]", msg);
    if (debugLog) debugLog.innerText = "[DEBUG] " + msg;
  }

  // Hide all UI elements
  function hideAll() {
    document.getElementById("prompt-text").classList.add("hidden");
    answerBox.classList.add("hidden");
    winnerBox.classList.add("hidden");
    leaderboardBox.classList.add("hidden");
    document.getElementById("timer-box").classList.add("hidden");
    document.getElementById("timer-bar").style.width = "0%";
  }

  // Spawn gummies with sporadic timing
  function spawnGummiesSporadic(count) {
    const bandStart = window.innerWidth * 0.3;
    const bandWidth = window.innerWidth * 0.4;

    for (let i = 0; i < count; i++) {
      const delay = i * 200 + Math.random() * 100;
      setTimeout(() => {
        const gummy = document.createElement("img");
        gummy.src = gummyImg;
        gummy.className = "gummy";
        gummy.style.left = (bandStart + Math.random() * bandWidth) + "px";
        gummy.style.top = `-${Math.random() * 100}px`;
        gummy.style.width = gummyGameConfig.gummySize + "px";
        gummy.style.height = gummyGameConfig.gummySize + "px";
        gummy.style.animationDuration = (
          Math.random() *
            (gummyGameConfig.fallSpeedRange[1] - gummyGameConfig.fallSpeedRange[0]) +
          gummyGameConfig.fallSpeedRange[0]
        ) + "s";
        gummy.style.transform = `rotate(${Math.floor(Math.random() * 360)}deg)`;
        container.appendChild(gummy);
      }, delay);
    }
  }

  // Start the game
  function startGame() {
    container.innerHTML = "";
    hideAll();
    debug("Game started");

    // Announce the start of the game
    sendMessageToChannel("The Gummy Drop game has started! Get ready to guess!");

    gummyCount = Math.floor(Math.random() *
      (gummyGameConfig.gummyCountRange[1] - gummyGameConfig.gummyCountRange[0] + 1)) +
      gummyGameConfig.gummyCountRange[0];

    correctCount = gummyCount;
    debug("Spawning " + gummyCount + " gummies");
    spawnGummiesSporadic(gummyCount);

    // Wait for all gummies to fall, then start the guessing phase
    setTimeout(() => {
      debug("Guessing phase starts");
      document.getElementById("prompt-text").classList.remove("hidden");
      document.getElementById('timer-bar').style.width = '0%';
      document.getElementById("timer-box").classList.remove("hidden");

      // Announce the start of the guessing phase
      sendMessageToChannel("The guessing phase has started! Submit your guesses now!");

      let time = gummyGameConfig.guessTime;
      const interval = setInterval(() => {
        time--;
        document.getElementById('timer-bar').style.width = (100 - (time / gummyGameConfig.guessTime) * 100) + '%';
        if (time <= 0) {
          clearInterval(interval);
          debug("Guessing time up");
          document.getElementById("timer-box").classList.add("hidden");
          document.getElementById("timer-bar").style.width = "0%";
          document.getElementById("prompt-text").classList.add("hidden");

          // Announce the end of the guessing phase
          sendMessageToChannel("The guessing phase has ended! Let's see the results!");

          showAnswer();
        }
      }, 1000);
    }, (gummyGameConfig.fallDuration + 3) * 1000);
  }

  // Show the correct answer
  function showAnswer() {
    document.getElementById("correct-count").innerText = correctCount;
    answerBox.classList.remove("hidden");
    debug("Correct answer shown");

    setTimeout(() => {
      answerBox.classList.add("hidden");
      showWinner(currentWinner);
    }, 5000);
  }

  // Show the winner
  function showWinner(name) {
    if (!window.gummyGuesses || !window.gummyGuesses.some(g => g.guess === correctCount)) {
      winnerName.innerText = "No one guessed correctly";
    } else {
      const winner = window.gummyGuesses.find(g => g.guess === correctCount);
      winnerName.innerText = winner ? winner.name : "No one guessed correctly";
    }
    winnerBox.classList.remove("hidden");
    debug("Winner displayed");

    setTimeout(() => {
      winnerBox.classList.add("hidden");
      showLeaderboard();
    }, 5000);
  }

  // Show the leaderboard
  function showLeaderboard() {
    leaderboardList.innerHTML = "";
    let leaderboardData = [];
    if (window.gummyGuesses && window.gummyGuesses.length > 0) {
      leaderboardData = [...window.gummyGuesses];
      leaderboardData.sort((a, b) => {
        const aDiff = Math.abs(a.guess - correctCount);
        const bDiff = Math.abs(b.guess - correctCount);
        if (aDiff === bDiff) return a.timestamp - b.timestamp; // Tie-breaker: earlier guess wins
        return aDiff - bDiff; // Closest guess first
      });
    }
    leaderboardData.forEach((entry, index) => {
      const item = document.createElement("div");
      item.className = "leaderboard-entry";
      item.innerHTML = `
        <div class="leaderboard-rank">
          ${index + 1}<br/><span class="leaderboard-label">Rank</span>
        </div>
        <div class="leaderboard-name">
          ${entry.name}<br/><span class="leaderboard-label">Name</span>
        </div>
        <div class="leaderboard-guess">
          ${entry.guess}<br/><span class="leaderboard-label">Guess</span>
        </div>
      `;
      leaderboardList.appendChild(item);
    });

    leaderboardBox.classList.remove("hidden");
    console.log("[DEBUG] Leaderboard shown");

    setTimeout(() => {
      leaderboardBox.classList.add("hidden");
      restartBtn.classList.remove("hidden");
    }, 5000);
  }

  // Button event listeners
  startBtn.onclick = () => {
    debug("Start clicked");
    startBtn.classList.add("hidden");
    startGame();
  };

  restartBtn.onclick = () => {
    debug("Restart clicked");
    restartBtn.classList.add("hidden");
    startGame();
  };
});
