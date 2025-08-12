import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom"; 
import Lobby from "./components/Lobby";   
import SpinWheelGame from "./components/SpinWheelGame";  
import Game from "./components/new/Game";
function App() { 
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Lobby />} />
        <Route path="/lobby" element={<Lobby />} />  
        <Route path="/spin-wheel/:gameId" element={<SpinWheelGame />} /> 
        <Route path="/demo" element={<Game />} />
      </Routes>
    </Router>
  );
}

export default App;
