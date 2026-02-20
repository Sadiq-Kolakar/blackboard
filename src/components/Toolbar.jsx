import React from 'react';
import useStore from '../state/store';
import './Toolbar.css';

const Toolbar = ({ canvasRef }) => {
  const {
    tool,
    color,
    strokeWidth,
    setTool,
    setColor,
    setStrokeWidth,
    undo,
    redo,
    canUndo,
    canRedo,
    deleteSelected,
    resetCanvas,
    setPendingImage,
  } = useStore();

  const handleNewCanvas = () => {
    const hasObjects = useStore.getState().objects.length > 0;
    if (!hasObjects || window.confirm('Start a new canvas? Unsaved work will be cleared.')) {
      resetCanvas();
    }
  };

  const handleSave = async () => {
    if (window.electronAPI) {
      const canvasData = useStore.getState().getCanvasData();
      await window.electronAPI.saveFileDialog(canvasData);
    } else {
      const canvasData = useStore.getState().getCanvasData();
      const blob = new Blob([JSON.stringify(canvasData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'canvas.json';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleLoad = async () => {
    if (window.electronAPI) {
      const result = await window.electronAPI.loadFileDialog();
      if (result.success && result.data) {
        useStore.getState().loadCanvasData(result.data);
      }
    } else {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const data = JSON.parse(event.target.result);
            useStore.getState().loadCanvasData(data);
          };
          reader.readAsText(file);
        }
      };
      input.click();
    }
  };

  const handleExport = async () => {
    if (canvasRef?.current?.getStage) {
      const stage = canvasRef.current.getStage();
      if (stage) {
        const dataURL = stage.toDataURL({ pixelRatio: 2 });
        if (window.electronAPI) {
          await window.electronAPI.exportImageDialog(dataURL);
        } else {
          const a = document.createElement('a');
          a.href = dataURL;
          a.download = 'canvas.png';
          a.click();
        }
      }
    }
  };

  const handleInsertImage = async () => {
    if (window.electronAPI) {
      const result = await window.electronAPI.showOpenImageDialog();
      if (result.success && result.path) {
        const imageResult = await window.electronAPI.readImageFile(result.path);
        if (imageResult.success) {
          useStore.getState().setTool('image');
          setPendingImage(imageResult.data);
        }
      }
    } else {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            useStore.getState().setTool('image');
            setPendingImage(event.target.result);
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    }
  };

  return (
    <div className="toolbar">
      <div className="toolbar-section">
        <button className="tool-btn wide-btn" onClick={handleNewCanvas} title="New Canvas (Ctrl+N)">
          ✨ New
        </button>
      </div>

      <div className="toolbar-section">
        <button
          className={`tool-btn ${tool === 'draw' ? 'active' : ''}`}
          onClick={() => setTool('draw')}
          title="Draw (D)"
        >
          ✏️
        </button>
        <button
          className={`tool-btn ${tool === 'erase' ? 'active' : ''}`}
          onClick={() => setTool('erase')}
          title="Erase (E)"
        >
          🧹
        </button>
        <button
          className={`tool-btn ${tool === 'select' ? 'active' : ''}`}
          onClick={() => setTool('select')}
          title="Select (S)"
        >
          👆
        </button>
        <button
          className={`tool-btn ${tool === 'text' ? 'active' : ''}`}
          onClick={() => setTool('text')}
          title="Text (T)"
        >
          📝
        </button>
        <button
          className="tool-btn"
          onClick={handleInsertImage}
          title="Insert Image (I)"
        >
          🖼️
        </button>
      </div>

      <div className="toolbar-section">
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          title="Color"
        />
        <div className="size-control">
          <label>Size:</label>
          <input
            type="range"
            min="1"
            max="50"
            value={strokeWidth}
            onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
            title={`Size: ${strokeWidth}px`}
          />
          <span>{strokeWidth}px</span>
        </div>
      </div>

      <div className="toolbar-section">
        <button
          className="tool-btn"
          onClick={undo}
          disabled={!canUndo()}
          title="Undo (Ctrl+Z)"
        >
          ↶
        </button>
        <button
          className="tool-btn"
          onClick={redo}
          disabled={!canRedo()}
          title="Redo (Ctrl+Y)"
        >
          ↷
        </button>
        <button
          className="tool-btn"
          onClick={deleteSelected}
          title="Delete (Del)"
        >
          🗑️
        </button>
      </div>

      <div className="toolbar-section">
        <button className="tool-btn" onClick={handleSave} title="Save (Ctrl+S)">
          💾 Save
        </button>
        <button className="tool-btn" onClick={handleLoad} title="Load (Ctrl+O)">
          📂 Load
        </button>
        <button
          className="tool-btn"
          onClick={handleExport}
          title="Export PNG (Ctrl+E)"
        >
          📤 Export
        </button>
      </div>
    </div>
  );
};

export default Toolbar;
