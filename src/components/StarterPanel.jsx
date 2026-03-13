import React from 'react';
import useStore from '../state/store';
import './StarterPanel.css';

const StarterPanel = () => {
  const { objects, scale, position, addObject, setTool, resetCanvas } = useStore();

  const handleClearCanvas = () => {
    if (objects.length === 0 || window.confirm('Clear the entire canvas? This cannot be undone.')) {
      resetCanvas();
    }
  };

  const addQuickNote = () => {
    const viewportCenterX = (window.innerWidth / 2 - position.x) / scale;
    const viewportCenterY = ((window.innerHeight - 60) / 2 - position.y) / scale;

    addObject({
      type: 'text',
      x: viewportCenterX,
      y: viewportCenterY,
      text: 'New note',
      fontSize: 24,
      fill: '#ffffff',
    });
    setTool('select');
  };

  return (
    <aside className="starter-panel">
      <h2>Canvas App</h2>
      <p>Quick actions to kickstart your board.</p>
      <div className="starter-actions">
        <button onClick={addQuickNote}>Add note</button>
        <button onClick={handleClearCanvas}>Clear canvas</button>
      </div>
      <div className="starter-meta">
        <span>Objects: {objects.length}</span>
        <span>Zoom: {Math.round(scale * 100)}%</span>
      </div>
    </aside>
  );
};

export default StarterPanel;
