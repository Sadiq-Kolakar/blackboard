import React, { useRef } from 'react';
import Canvas from './canvas/Canvas';
import Toolbar from './components/Toolbar';
import ZoomControls from './components/ZoomControls';
import './App.css';

function App() {
  const canvasRef = useRef(null);

  return (
    <div className="app">
      <Toolbar canvasRef={canvasRef} />
      <Canvas ref={canvasRef} />
      <ZoomControls />
    </div>
  );
}

export default App;

