import React, { useEffect, useRef, useState } from "react";

// React Snake Game (single-file component)
// - Tailwind CSS classes are used for styling (no import needed here)
// - Exported as default React component
// - Controls: Arrow keys + WASD, on-screen buttons (mobile)
// - Features: pause, restart, score, increasing speed, wall-wrap toggle

export default function SnakeGame() {
  const canvasRef = useRef(null);
  const [gridSize] = useState(20); // number of cells per side
  const [cellSize] = useState(20); // pixels per cell (canvas will be gridSize*cellSize)
  const [direction, setDirection] = useState({ x: 1, y: 0 });
  const [snake, setSnake] = useState(() => [
    { x: Math.floor(gridSize / 2) - 1, y: Math.floor(gridSize / 2) },
    { x: Math.floor(gridSize / 2), y: Math.floor(gridSize / 2) },
  ]);
  const [food, setFood] = useState(() => randomFoodPosition(snake, gridSize));
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(8); // moves per second
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    try {
      return Number(localStorage.getItem("snake_high_score") || 0);
    } catch (e) {
      return 0;
    }
  });
  const [wrapWalls, setWrapWalls] = useState(true);
  const lastMoveRef = useRef(Date.now());
  const dirRef = useRef(direction);
  const snakeRef = useRef(snake);
  const runningRef = useRef(running);

  // keep refs in sync
  useEffect(() => {
    dirRef.current = direction;
  }, [direction]);
  useEffect(() => {
    snakeRef.current = snake;
  }, [snake]);
  useEffect(() => {
    runningRef.current = running;
  }, [running]);

  // draw loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = gridSize * cellSize;
    canvas.height = gridSize * cellSize;

    function draw() {
      // clear
      ctx.fillStyle = "#0f172a"; // slate-900
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // grid (subtle)
      ctx.strokeStyle = "rgba(255,255,255,0.03)";
      ctx.lineWidth = 1;
      for (let i = 0; i <= gridSize; i++) {
        ctx.beginPath();
        ctx.moveTo(i * cellSize, 0);
        ctx.lineTo(i * cellSize, canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * cellSize);
        ctx.lineTo(canvas.width, i * cellSize);
        ctx.stroke();
      }

      // food
      drawCell(ctx, food.x, food.y, cellSize, "#ef4444"); // red-500

      // snake
      for (let i = 0; i < snake.length; i++) {
        const part = snake[i];
        const isHead = i === snake.length - 1;
        const color = isHead ? "#10b981" : "#34d399"; // emeralds
        drawCell(ctx, part.x, part.y, cellSize, color, isHead ? 4 : 2);
      }

      // overlay when paused
      if (!running) {
        ctx.fillStyle = "rgba(2,6,23,0.6)"; // semi-transparent dark
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#fff";
        ctx.font = "20px ui-sans-serif, system-ui";
        ctx.textAlign = "center";
        ctx.fillText(
          "PAUSED - Press Space to Start/Resume",
          canvas.width / 2,
          canvas.height / 2
        );
      }
    }

    draw();
  }, [snake, food, gridSize, cellSize, running]);

  // game loop (movement timing)
  useEffect(() => {
    let animationId;
    function tick() {
      const now = Date.now();
      const interval = 1000 / speed;
      if (runningRef.current && now - lastMoveRef.current >= interval) {
        moveSnake();
        lastMoveRef.current = now;
      }
      animationId = requestAnimationFrame(tick);
    }
    animationId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationId);
  }, [speed]);

  // keyboard controls
  useEffect(() => {
    function handleKey(e) {
      const key = e.key;
      if (key === " " || key === "Spacebar") {
        // toggle running
        e.preventDefault();
        setRunning((r) => !r);
        return;
      }

      const map = {
        ArrowUp: { x: 0, y: -1 },
        ArrowDown: { x: 0, y: 1 },
        ArrowLeft: { x: -1, y: 0 },
        ArrowRight: { x: 1, y: 0 },
        w: { x: 0, y: -1 },
        s: { x: 0, y: 1 },
        a: { x: -1, y: 0 },
        d: { x: 1, y: 0 },
      };
      const nd = map[key];
      if (nd) {
        const cur = dirRef.current;
        // prevent reversing directly
        if (cur.x + nd.x === 0 && cur.y + nd.y === 0) return;
        setDirection(nd);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  // helper functions
  function drawCell(ctx, x, y, size, color, radius = 0) {
    const px = x * size;
    const py = y * size;
    ctx.fillStyle = color;
    if (radius > 0) {
      // rounded rect
      const r = Math.min(radius, size / 3);
      roundRect(ctx, px + 1, py + 1, size - 2, size - 2, r);
      ctx.fill();
    } else {
      ctx.fillRect(px + 1, py + 1, size - 2, size - 2);
    }
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function randomFoodPosition(snakeArr, grid) {
    const taken = new Set(snakeArr.map((p) => `${p.x},${p.y}`));
    const free = [];
    for (let x = 0; x < grid; x++)
      for (let y = 0; y < grid; y++) {
        const k = `${x},${y}`;
        if (!taken.has(k)) free.push({ x, y });
      }
    if (free.length === 0) return { x: 0, y: 0 };
    return free[Math.floor(Math.random() * free.length)];
  }

  function moveSnake() {
    const curSnake = snakeRef.current.slice();
    const head = curSnake[curSnake.length - 1];
    const nd = dirRef.current;
    let newHead = { x: head.x + nd.x, y: head.y + nd.y };

    if (wrapWalls) {
      // wrap
      if (newHead.x < 0) newHead.x = gridSize - 1;
      if (newHead.x >= gridSize) newHead.x = 0;
      if (newHead.y < 0) newHead.y = gridSize - 1;
      if (newHead.y >= gridSize) newHead.y = 0;
    } else {
      // wall collision
      if (
        newHead.x < 0 ||
        newHead.x >= gridSize ||
        newHead.y < 0 ||
        newHead.y >= gridSize
      ) {
        return endGame();
      }
    }

    // self collision
    const collideSelf = curSnake.some(
      (p) => p.x === newHead.x && p.y === newHead.y
    );
    if (collideSelf) return endGame();

    curSnake.push(newHead);

    // food
    if (newHead.x === food.x && newHead.y === food.y) {
      setScore((s) => s + 1);
      const next = randomFoodPosition(curSnake, gridSize);
      setFood(next);
      // speed up a little
      setSpeed((s) => Math.min(20, s + 0.3));
    } else {
      // move: remove tail
      curSnake.shift();
    }

    setSnake(curSnake);
  }

  function endGame() {
    setRunning(false);
    // update high score
    setHighScore((h) => {
      const nh = Math.max(h, score);
      try {
        localStorage.setItem("snake_high_score", String(nh));
      } catch (e) {}
      return nh;
    });
  }

  function resetGame() {
    const start = [
      { x: Math.floor(gridSize / 2) - 1, y: Math.floor(gridSize / 2) },
      { x: Math.floor(gridSize / 2), y: Math.floor(gridSize / 2) },
    ];
    setSnake(start);
    dirRef.current = { x: 1, y: 0 };
    setDirection({ x: 1, y: 0 });
    const f = randomFoodPosition(start, gridSize);
    setFood(f);
    setScore(0);
    setSpeed(8);
    setRunning(false);
  }

  // on-screen controls for mobile
  function turn(dx, dy) {
    const cur = dirRef.current;
    if (cur.x + dx === 0 && cur.y + dy === 0) return;
    setDirection({ x: dx, y: dy });
  }

  return (
    <div className="w-full max-w-3xl mx-auto p-6">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="bg-slate-800 rounded-2xl p-4 shadow-lg flex-1">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white text-lg font-semibold">Snake — React</h2>
            <div className="text-sm text-slate-300">
              Score: <span className="font-medium text-white">{score}</span>
            </div>
          </div>

          <div className="flex justify-center">
            <canvas
              ref={canvasRef}
              className="rounded-lg border border-slate-700"
            />
          </div>

          <div className="mt-3 flex items-center justify-between text-sm text-slate-300">
            <div>Speed: {speed.toFixed(1)}</div>
            <div>High: {highScore}</div>
          </div>

          <div className="mt-4 flex gap-2 flex-wrap">
            <button
              onClick={() => setRunning((r) => !r)}
              className="px-3 py-1 rounded-lg bg-emerald-500 text-white font-medium"
            >
              {running ? "Pause" : "Start"}
            </button>
            <button
              onClick={resetGame}
              className="px-3 py-1 rounded-lg bg-slate-600 text-white"
            >
              Reset
            </button>
            <button
              onClick={() => setWrapWalls((w) => !w)}
              className="px-3 py-1 rounded-lg bg-slate-600 text-white"
            >
              Walls: {wrapWalls ? "Wrap" : "Solid"}
            </button>
            <button
              onClick={() => {
                setScore(0);
                setHighScore(0);
                try {
                  localStorage.removeItem("snake_high_score");
                } catch (e) {}
              }}
              className="px-3 py-1 rounded-lg bg-red-600 text-white"
            >
              Clear High
            </button>
          </div>

          <div className="mt-4 text-xs text-slate-400">
            Controls: Arrow keys or WASD. Space = Start/Pause.
          </div>
        </div>

        <div className="w-60 shrink-0 bg-slate-900 rounded-2xl p-4 text-slate-200">
          <h3 className="text-sm font-semibold mb-2">Settings</h3>
          <div className="text-sm mb-3">
            Grid: {gridSize} × {gridSize}
          </div>

          <label className="block text-sm mb-2">
            Speed: <span className="font-medium">{speed.toFixed(1)}</span>
            <input
              type="range"
              min="2"
              max="20"
              step="0.1"
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="w-full mt-2"
            />
          </label>

          <div className="text-sm mt-2">
            Use on-screen controls below on mobile.
          </div>

          <div className="mt-3 text-xs text-slate-400">
            Built with: React + canvas + Tailwind styling.
          </div>
        </div>
      </div>

      {/* Mobile controls */}
      <div className="mt-6 md:hidden flex justify-center">
        <div className="grid grid-cols-3 gap-2 w-48">
          <div />
          <button
            onClick={() => turn(0, -1)}
            className="p-3 bg-slate-700 rounded-lg"
          >
            ↑
          </button>
          <div />
          <button
            onClick={() => turn(-1, 0)}
            className="p-3 bg-slate-700 rounded-lg"
          >
            ←
          </button>
          <button
            onClick={() => setRunning((r) => !r)}
            className="p-3 bg-emerald-500 rounded-lg"
          >
            {running ? "||" : "▶"}
          </button>
          <button
            onClick={() => turn(1, 0)}
            className="p-3 bg-slate-700 rounded-lg"
          >
            →
          </button>
          <div />
          <button
            onClick={() => turn(0, 1)}
            className="p-3 bg-slate-700 rounded-lg"
          >
            ↓
          </button>
          <div />
        </div>
      </div>
    </div>
  );
}
