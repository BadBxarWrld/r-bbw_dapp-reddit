/*************************************************
 *  Dark Mode
 *************************************************/
function applyDarkMode(enabled) {
  const bodyEl = document.body;
  const iconEl = document.getElementById("dark-mode-icon");

  if (enabled) {
    bodyEl.classList.remove("light-mode");
    bodyEl.classList.add("dark-mode");
    if (iconEl) {
      iconEl.textContent = "🌞";
      iconEl.style.color = "#ffffff";
    }
    localStorage.setItem("darkMode", "enabled");
  } else {
    bodyEl.classList.remove("dark-mode");
    bodyEl.classList.add("light-mode");
    if (iconEl) {
      iconEl.textContent = "🌑";
      iconEl.style.color = "inherit";
    }
    localStorage.setItem("darkMode", "disabled");
  }
}

function toggleDarkMode() {
  const isDark = document.body.classList.contains("dark-mode");
  applyDarkMode(!isDark);
}

/*************************************************
 *  Brick-Breaker Game (pointer-based)
 *************************************************/
let canvas, ctx;
let x = 0, y = 0;
let dx = 2, dy = -2;
const ballRadius = 10;

const paddleHeight = 10;
const paddleWidth = 75;
let paddleX = 0;

// Set the paddle color to #a9f4bc
const PADDLE_COLOR = '#a9f4bc';

let gameActive = false;
let started = false;
let speedBoostCount = 0;

function initGame() {
  canvas.style.display = "block";
  exitGameBtn.style.display = "inline-block";

  if (!started) {
    started = true;
    speedBoostCount = 1;
    startGameBtn.textContent = "Faster";
  } else {
    speedBoostCount++;
    dx *= 1.3;
    dy *= 1.3;
    startGameBtn.textContent = `Faster x${speedBoostCount}`;
    return;
  }

  x = canvas.width / 2;
  y = canvas.height - 30;
  dx = 2;
  dy = -2;
  paddleX = (canvas.width - paddleWidth) / 2;

  gameActive = true;
  requestAnimationFrame(draw);
}

function draw() {
  if (!gameActive) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Ball
  ctx.beginPath();
  ctx.arc(x, y, ballRadius, 0, Math.PI * 2);
  ctx.fillStyle = "#fa7814";
  ctx.fill();
  ctx.closePath();

  // Paddle
  ctx.beginPath();
  ctx.rect(
    paddleX,
    canvas.height - paddleHeight - 2,
    paddleWidth,
    paddleHeight
  );
  ctx.fillStyle = PADDLE_COLOR;  // #a9f4bc
  ctx.fill();
  ctx.closePath();

  // Move ball
  x += dx;
  y += dy;

  // Bounce horizontally
  if (x + dx > canvas.width - ballRadius || x + dx < ballRadius) {
    dx = -dx;
  }
  // Bounce top
  if (y + dy < ballRadius) {
    dy = -dy;
  }
  // Bottom/paddle check
  else if (y + dy > canvas.height - ballRadius - paddleHeight) {
    if (x > paddleX && x < paddleX + paddleWidth) {
      dy = -dy;
      incrementScore();
    } else {
      // Missed paddle => bounce or end game if you prefer
      dy = -dy;
    }
  }

  requestAnimationFrame(draw);
}

/*************************************************
 *  Global Score Tracking
 *************************************************/
// The highest score among *all* users
let globalHighestScore = 0;
// The user (username) who set that global highest score
let globalHighestScorer = 'No one yet';
// The “current user” name—will default to “Guest”
let currentUsername = 'Guest';

// Increment user’s score on each paddle bounce
let currentUserScore = 0;

function incrementScore() {
  currentUserScore++;
  document.getElementById("userScore").innerText = currentUserScore;
}

function exitGame() {
  gameActive = false;
  canvas.style.display = "none";
  exitGameBtn.style.display = "none";

  startGameBtn.textContent = "Start Game";
  started = false;
  speedBoostCount = 0;

  // Make sure we have the latest username from the DOM
  const usernameEl = document.getElementById("username");
  if (usernameEl && usernameEl.innerText) {
    currentUsername = usernameEl.innerText;
  }

  // Compare the user’s final score to the global highest
  if (currentUserScore > globalHighestScore) {
    globalHighestScore = currentUserScore;
    globalHighestScorer = currentUsername;

    // **Save** new highest score & scorer to localStorage
    localStorage.setItem(
      "globalHighScoreData",
      JSON.stringify({
        score: globalHighestScore,
        username: globalHighestScorer,
      })
    );
  }

  // Update the page to reflect the highest score overall
  document.getElementById("topScore").innerText =
    `${globalHighestScore} by ${globalHighestScorer}`;

  // Reset user’s score
  currentUserScore = 0;
  document.getElementById("userScore").innerText = "0";
}

/*************************************************
 *  Pointer -> Paddle
 *************************************************/
function onPointerMove(e) {
  if (!gameActive) return;
  const rect = canvas.getBoundingClientRect();
  const pointerX = e.clientX - rect.left;
  paddleX = pointerX - paddleWidth / 2;

  // Keep the paddle within the canvas bounds
  if (paddleX < 0) paddleX = 0;
  else if (paddleX + paddleWidth > canvas.width) {
    paddleX = canvas.width - paddleWidth;
  }
}

/*************************************************
 *  Devvit / Messaging Logic
 *************************************************/
class App {
  constructor() {
    const output = document.querySelector("#messageOutput");
    const usernameLabel = document.querySelector("#username");
    const userScoreSpan = document.getElementById("userScore");
    const topScoreSpan = document.getElementById("topScore");

    // Listen for Devvit messages from main.tsx
    window.addEventListener("message", (ev) => {
      const { type, data } = ev.data;
      if (type === "devvit-message") {
        const { message } = data;
        // Show raw JSON for debugging
        // output.replaceChildren(JSON.stringify(message, undefined, 2));

        if (message.type === "scoreInfo") {
          userScoreSpan.innerText = message.data.userScore;
          topScoreSpan.innerText = message.data.topScore;
        }
        // Or initialData => set username
        if (message.type === "initialData") {
          const { username } = message.data;
          if (usernameLabel) {
            usernameLabel.innerText = username;
          }
        }
      }
    });

    // Also handle direct messages from main.tsx
    window.addEventListener("message", (event) => {
      const msg = event.data;
      if (!msg || !msg.type) return;

      if (msg.type === "scoreInfo") {
        userScoreSpan.innerText = msg.data.userScore;
        topScoreSpan.innerText = msg.data.topScore;
      } else if (msg.type === "initialData") {
        if (usernameLabel) {
          usernameLabel.innerText = msg.data.username;
        }
      }
    });
  }
}

/*************************************************
 *  DOMContentLoaded - Hook Everything
 *************************************************/
document.addEventListener("DOMContentLoaded", () => {
  // 1) Dark Mode
  const darkModePreference = localStorage.getItem("darkMode");
  applyDarkMode(darkModePreference === "enabled");

  const darkModeToggle = document.getElementById("darkModeToggle");
  if (darkModeToggle) {
    darkModeToggle.addEventListener("click", toggleDarkMode);
  }

  // 2) Canvas & context
  canvas = document.getElementById("gameCanvas");
  ctx = canvas.getContext("2d");

  // 3) Buttons
  window.startGameBtn = document.getElementById("startGameBtn");
  window.exitGameBtn = document.getElementById("exitGameBtn");

  if (startGameBtn) startGameBtn.addEventListener("click", initGame);
  if (exitGameBtn) exitGameBtn.addEventListener("click", exitGame);

  // 4) Pointer-based paddle
  canvas.addEventListener("pointermove", onPointerMove);

  // 5) Instantiate Devvit logic
  new App();

  // 6) **Load** the global high score (if any) from localStorage
  const savedScoreData = localStorage.getItem("globalHighScoreData");
  if (savedScoreData) {
    try {
      const parsed = JSON.parse(savedScoreData);
      if (parsed && typeof parsed.score === "number") {
        globalHighestScore = parsed.score;
        globalHighestScorer = parsed.username || "No one yet";
      }
    } catch (err) {
      console.warn("Error parsing globalHighScoreData:", err);
    }
  }

  // Update the displayed top score from the loaded data
  document.getElementById("topScore").innerText =
    `${globalHighestScore} by ${globalHighestScorer}`;
});
