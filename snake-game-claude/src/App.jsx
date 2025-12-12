import React, { useState, useEffect, useRef } from "react";

const GRID_SIZE = 20;
const CELL_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_DIRECTION = { x: 1, y: 0 };
const GAME_SPEED = 150;

export default function SnakeGame() {
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [food, setFood] = useState({ x: 15, y: 15 });
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameMode, setGameMode] = useState("walls"); // 'walls' or 'pass-through'
  const directionRef = useRef(INITIAL_DIRECTION);

  const generateFood = (currentSnake) => {
    let newFood;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
    } while (
      currentSnake.some(
        (segment) => segment.x === newFood.x && segment.y === newFood.y
      )
    );
    return newFood;
  };

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setFood({ x: 15, y: 15 });
    setDirection(INITIAL_DIRECTION);
    directionRef.current = INITIAL_DIRECTION;
    setGameOver(false);
    setScore(0);
    setIsPlaying(true);
  };

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!isPlaying || gameOver) return;

      const key = e.key.toLowerCase();
      const currentDir = directionRef.current;

      if ((key === "arrowup" || key === "w") && currentDir.y === 0) {
        directionRef.current = { x: 0, y: -1 };
      } else if ((key === "arrowdown" || key === "s") && currentDir.y === 0) {
        directionRef.current = { x: 0, y: 1 };
      } else if ((key === "arrowleft" || key === "a") && currentDir.x === 0) {
        directionRef.current = { x: -1, y: 0 };
      } else if ((key === "arrowright" || key === "d") && currentDir.x === 0) {
        directionRef.current = { x: 1, y: 0 };
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [isPlaying, gameOver]);

  useEffect(() => {
    if (!isPlaying || gameOver) return;

    const gameLoop = setInterval(() => {
      setSnake((prevSnake) => {
        const head = prevSnake[0];
        let newHead = {
          x: head.x + directionRef.current.x,
          y: head.y + directionRef.current.y,
        };

        // Handle walls based on game mode
        if (gameMode === "walls") {
          // Check wall collision - game over
          if (
            newHead.x < 0 ||
            newHead.x >= GRID_SIZE ||
            newHead.y < 0 ||
            newHead.y >= GRID_SIZE
          ) {
            setGameOver(true);
            setIsPlaying(false);
            return prevSnake;
          }
        } else {
          // Pass-through mode - wrap around
          if (newHead.x < 0) newHead.x = GRID_SIZE - 1;
          if (newHead.x >= GRID_SIZE) newHead.x = 0;
          if (newHead.y < 0) newHead.y = GRID_SIZE - 1;
          if (newHead.y >= GRID_SIZE) newHead.y = 0;
        }

        // Check self collision
        if (
          prevSnake.some(
            (segment) => segment.x === newHead.x && segment.y === newHead.y
          )
        ) {
          setGameOver(true);
          setIsPlaying(false);
          return prevSnake;
        }

        const newSnake = [newHead, ...prevSnake];

        // Check food collision
        if (newHead.x === food.x && newHead.y === food.y) {
          setScore((prev) => prev + 10);
          setFood(generateFood(newSnake));
          return newSnake;
        }

        newSnake.pop();
        return newSnake;
      });

      setDirection(directionRef.current);
    }, GAME_SPEED);

    return () => clearInterval(gameLoop);
  }, [isPlaying, gameOver, food]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-green-900 to-blue-900 p-8">
      <div className="bg-white rounded-lg shadow-2xl p-8">
        <h1 className="text-4xl font-bold text-center mb-4 text-gray-800">
          Snake Game
        </h1>

        <div className="mb-4 text-center">
          <span className="text-2xl font-semibold text-gray-700">
            Score: {score}
          </span>
        </div>

        <div className="mb-4 flex justify-center gap-2">
          <button
            onClick={() => setGameMode("walls")}
            disabled={isPlaying}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              gameMode === "walls"
                ? "bg-blue-600 text-white"
                : "bg-gray-300 text-gray-700 hover:bg-gray-400"
            } ${isPlaying ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            Walls Mode
          </button>
          <button
            onClick={() => setGameMode("pass-through")}
            disabled={isPlaying}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              gameMode === "pass-through"
                ? "bg-purple-600 text-white"
                : "bg-gray-300 text-gray-700 hover:bg-gray-400"
            } ${isPlaying ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            Pass-Through Mode
          </button>
        </div>

        <div
          className="relative bg-gray-900 border-4 border-gray-700 rounded"
          style={{
            width: GRID_SIZE * CELL_SIZE,
            height: GRID_SIZE * CELL_SIZE,
          }}
        >
          {snake.map((segment, index) => (
            <div
              key={index}
              className={`absolute ${
                index === 0 ? "bg-green-400" : "bg-green-500"
              } rounded-sm`}
              style={{
                left: segment.x * CELL_SIZE,
                top: segment.y * CELL_SIZE,
                width: CELL_SIZE - 2,
                height: CELL_SIZE - 2,
              }}
            />
          ))}

          <div
            className="absolute bg-red-500 rounded-full"
            style={{
              left: food.x * CELL_SIZE,
              top: food.y * CELL_SIZE,
              width: CELL_SIZE - 2,
              height: CELL_SIZE - 2,
            }}
          />

          {gameOver && (
            <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
              <div className="text-center">
                <h2 className="text-4xl font-bold text-white mb-4">
                  Game Over!
                </h2>
                <p className="text-2xl text-white mb-4">Final Score: {score}</p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 text-center space-y-4">
          {!isPlaying && !gameOver && (
            <button
              onClick={resetGame}
              className="px-8 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
            >
              Start Game
            </button>
          )}

          {gameOver && (
            <button
              onClick={resetGame}
              className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              Play Again
            </button>
          )}

          <div className="text-gray-600 text-sm">
            <p>Use arrow keys or WASD to control the snake</p>
            <p>Eat the red dots to grow and score points</p>
            <p className="mt-2 font-semibold">
              {gameMode === "walls"
                ? "🧱 Walls Mode: Hit the wall and game over!"
                : "🌀 Pass-Through Mode: Go through walls to the other side!"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
