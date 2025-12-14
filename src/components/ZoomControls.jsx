import React from 'react';
import useStore from '../state/store';
import './ZoomControls.css';

const ZoomControls = () => {
  const { scale, setScale, setPosition } = useStore();

  const handleZoomIn = () => {
    setScale(Math.min(scale * 1.2, 5));
  };

  const handleZoomOut = () => {
    setScale(Math.max(scale / 1.2, 0.1));
  };

  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  return (
    <div className="zoom-controls">
      <button onClick={handleZoomOut} title="Zoom Out (-)">
        −
      </button>
      <span className="zoom-level">{Math.round(scale * 100)}%</span>
      <button onClick={handleZoomIn} title="Zoom In (+)">
        +
      </button>
      <button onClick={handleReset} title="Reset View">
        ⌂
      </button>
    </div>
  );
};

export default ZoomControls;
