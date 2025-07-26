import { useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const SnakeGame = () => {
  useEffect(() => {
    // Redirect to the snake game HTML page
    window.location.href = "/snake-game.html";
  }, []);

  return null;
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<SnakeGame />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
