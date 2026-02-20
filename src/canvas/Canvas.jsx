import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { Stage, Layer, Line, Text, Image, Transformer } from 'react-konva';
import useImage from 'use-image';
import useStore from '../state/store';
import './Canvas.css';

const Canvas = forwardRef((props, ref) => {
  const stageRef = useRef(null);
  const layerRef = useRef(null);
  const transformerRef = useRef(null);
  const isPanning = useRef(false);
  const lastPointerPosition = useRef({ x: 0, y: 0 });
  const [pendingImage, setPendingImage] = useState(null);

  useImperativeHandle(ref, () => ({
    getStage: () => stageRef.current,
  }));

  const {
    tool,
    color,
    strokeWidth,
    scale,
    position,
    objects,
    selectedObjectId,
    isDrawing,
    currentPath,
    editingTextId,
    setTool,
    setScale,
    setPosition,
    addObject,
    updateObject,
    deleteObject,
    setSelectedObject,
    setIsDrawing,
    setCurrentPath,
    setEditingTextId,
    pendingImage: storePendingImage,
  } = useStore();

  // Handle pending image from store
  useEffect(() => {
    if (storePendingImage) {
      setPendingImage(storePendingImage);
      useStore.setState({ pendingImage: null });
    }
  }, [storePendingImage]);

  // Update transformer when selection changes
  useEffect(() => {
    if (tool === 'select' && selectedObjectId && transformerRef.current) {
      const selectedNode = layerRef.current.findOne(`#${selectedObjectId}`);
      if (selectedNode) {
        transformerRef.current.nodes([selectedNode]);
        transformerRef.current.getLayer().batchDraw();
      }
    } else if (transformerRef.current) {
      transformerRef.current.nodes([]);
    }
  }, [selectedObjectId, tool]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger shortcuts if the user is typing in an input or textarea
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName) || e.target.isContentEditable) {
        return;
      }

      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          useStore.getState().undo();
        } else if ((e.key === 'y') || (e.key === 'z' && e.shiftKey)) {
          e.preventDefault();
          useStore.getState().redo();
        } else if (e.key === 's') {
          e.preventDefault();
          document.querySelector('.toolbar button[title*="Save"]')?.click();
        } else if (e.key === 'o') {
          e.preventDefault();
          document.querySelector('.toolbar button[title*="Load"]')?.click();
        } else if (e.key === 'e') {
          e.preventDefault();
          document.querySelector('.toolbar button[title*="Export"]')?.click();
        } else if (e.key === 'n') {
          e.preventDefault();
          document.querySelector('.toolbar button[title*="New Canvas"]')?.click();
        }
      } else {
        if (e.key === 'Delete' || e.key === 'Backspace') {
          e.preventDefault();
          useStore.getState().deleteSelected();
        } else if (e.key === 'd' || e.key === 'D') {
          e.preventDefault();
          setTool('draw');
        } else if (e.key === 'e' || e.key === 'E') {
          e.preventDefault();
          setTool('erase');
        } else if (e.key === 's' || e.key === 'S') {
          e.preventDefault();
          setTool('select');
        } else if (e.key === 't' || e.key === 'T') {
          e.preventDefault();
          setTool('text');
        } else if (e.key === 'i' || e.key === 'I') {
          e.preventDefault();
          document.querySelector('.toolbar button[title*="Image"]')?.click();
        } else if (e.key === '+' || e.key === '=') {
          e.preventDefault();
          setScale(Math.min(scale * 1.2, 5));
        } else if (e.key === '-') {
          e.preventDefault();
          setScale(Math.max(scale / 1.2, 0.1));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [scale, setScale, setTool]);

  // Auto-save every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (window.electronAPI) {
        const canvasData = useStore.getState().getCanvasData();
        window.electronAPI.saveFile(canvasData, 'autosave.json');
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, []);

  const handleWheel = (e) => {
    e.evt.preventDefault();
    const stage = e.target.getStage();
    const oldScale = scale;
    const pointer = stage.getPointerPosition();
    const mousePointTo = {
      x: (pointer.x - position.x) / oldScale,
      y: (pointer.y - position.y) / oldScale,
    };

    // Smoother zoom factor
    const scaleBy = 1.05;
    const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
    const clampedScale = Math.max(0.1, Math.min(5, newScale));

    setScale(clampedScale);
    setPosition({
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    });
  };

  const handleMouseDown = (e) => {
    const stage = e.target.getStage();
    const pointer = stage.getPointerPosition();
    const pointerPos = {
      x: (pointer.x - position.x) / scale,
      y: (pointer.y - position.y) / scale,
    };

    if (tool === 'select') {
      const clickedOnEmpty = e.target === e.target.getStage();
      if (clickedOnEmpty) {
        setSelectedObject(null);
        return;
      }
      const clickedObject = objects.find((obj) => obj.id === e.target.id());
      if (clickedObject) {
        setSelectedObject(clickedObject.id);
      }
    } else if (tool === 'draw' || tool === 'erase') {
      setIsDrawing(true);
      const path = {
        type: 'path',
        points: [pointerPos.x, pointerPos.y],
        color: tool === 'erase' ? '#ffffff' : color,
        strokeWidth: strokeWidth,
        globalCompositeOperation: tool === 'erase' ? 'destination-out' : 'source-over',
      };
      setCurrentPath(path);
      const id = addObject(path);
      setCurrentPath({ ...path, id });
    } else if (tool === 'text') {
      const textObj = {
        type: 'text',
        x: pointerPos.x,
        y: pointerPos.y,
        text: 'Double click to edit',
        fontSize: 20,
        fill: color,
      };
      const id = addObject(textObj);
      setEditingTextId(id);
      setTool('select');
      setSelectedObject(id);
    } else if (tool === 'image' && pendingImage) {
      const imgObj = {
        type: 'image',
        x: pointerPos.x,
        y: pointerPos.y,
        width: 200,
        height: 200,
        image: pendingImage,
      };
      addObject(imgObj);
      setPendingImage(null);
      setTool('select');
    } else if (e.evt.button === 1 || (e.evt.button === 0 && e.evt.ctrlKey)) {
      // Middle mouse or Ctrl+Left mouse for panning
      isPanning.current = true;
      lastPointerPosition.current = pointer;
    }
  };

  const handleMouseMove = (e) => {
    const stage = e.target.getStage();
    const pointer = stage.getPointerPosition();
    const pointerPos = {
      x: (pointer.x - position.x) / scale,
      y: (pointer.y - position.y) / scale,
    };

    if (isPanning.current) {
      const dx = pointer.x - lastPointerPosition.current.x;
      const dy = pointer.y - lastPointerPosition.current.y;
      setPosition({
        x: position.x + dx,
        y: position.y + dy,
      });
      lastPointerPosition.current = pointer;
    } else if (isDrawing && currentPath) {
      const newPoints = currentPath.points.concat([pointerPos.x, pointerPos.y]);
      updateObject(currentPath.id, { points: newPoints });
      setCurrentPath({ ...currentPath, points: newPoints });
    }
  };

  const handleMouseUp = () => {
    isPanning.current = false;
    setIsDrawing(false);
    setCurrentPath(null);
  };

  const handleTextDoubleClick = (e) => {
    const textNode = e.target;
    const stage = textNode.getStage();
    const textPosition = textNode.absolutePosition();
    const stageBox = stage.container().getBoundingClientRect();
    const areaPosition = {
      x: stageBox.left + textPosition.x,
      y: stageBox.top + textPosition.y,
    };

    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);
    textarea.value = textNode.text();
    textarea.style.position = 'absolute';
    textarea.style.top = `${areaPosition.y}px`;
    textarea.style.left = `${areaPosition.x}px`;
    textarea.style.width = `${textNode.width()}px`;
    textarea.style.height = `${textNode.height()}px`;
    textarea.style.fontSize = `${textNode.fontSize()}px`;
    textarea.style.border = 'none';
    textarea.style.padding = '0px';
    textarea.style.margin = '0px';
    textarea.style.overflow = 'hidden';
    textarea.style.background = 'transparent';
    textarea.style.outline = 'none';
    textarea.style.resize = 'none';
    textarea.style.color = textNode.fill();
    textarea.focus();

    const removeTextarea = () => {
      textarea.parentNode?.removeChild(textarea);
    };

    const setTextareaWidth = () => {
      const newWidth = textarea.scrollWidth;
      textarea.style.width = `${newWidth}px`;
    };

    textarea.addEventListener('keydown', (e) => {
      if (e.keyCode === 13 && !e.shiftKey) {
        e.preventDefault();
        updateObject(textNode.id(), { text: textarea.value });
        removeTextarea();
      }
      if (e.keyCode === 27) {
        removeTextarea();
      }
    });

    textarea.addEventListener('keydown', setTextareaWidth);
    textarea.addEventListener('input', setTextareaWidth);
  };

  const ImageObject = ({ obj, onMouseEnter, onMouseLeave }) => {
    const [image] = useImage(obj.image);
    return (
      <Image
        id={obj.id}
        image={image}
        x={obj.x}
        y={obj.y}
        width={obj.width}
        height={obj.height}
        draggable={tool === 'select'}
        onClick={() => tool === 'select' && setSelectedObject(obj.id)}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onDragEnd={(e) => {
          updateObject(obj.id, {
            x: e.target.x(),
            y: e.target.y(),
          });
        }}
        onTransformEnd={(e) => {
          const node = e.target;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();
          node.scaleX(1);
          node.scaleY(1);
          updateObject(obj.id, {
            x: node.x(),
            y: node.y(),
            width: Math.max(5, node.width() * scaleX),
            height: Math.max(5, node.height() * scaleY),
          });
        }}
      />
    );
  };

  return (
    <div className="canvas-container">
      <Stage
        ref={stageRef}
        width={window.innerWidth}
        height={window.innerHeight - 60}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{ cursor: tool === 'select' ? 'default' : 'crosshair' }}
      >
        <Layer ref={layerRef} scaleX={scale} scaleY={scale} x={position.x} y={position.y}>
          {objects.map((obj) => {
            if (obj.type === 'path') {
              return (
                <Line
                  key={obj.id}
                  id={obj.id}
                  points={obj.points}
                  stroke={obj.color}
                  strokeWidth={obj.strokeWidth}
                  tension={0.5}
                  lineCap="round"
                  lineJoin="round"
                  globalCompositeOperation={obj.globalCompositeOperation}
                  onMouseEnter={(e) => {
                    const node = e.target;
                    node.shadowColor(node.stroke());
                    node.shadowBlur(15);
                    node.shadowOpacity(0.8);
                    node.getStage().container().style.cursor = 'pointer';
                  }}
                  onMouseLeave={(e) => {
                    const node = e.target;
                    node.shadowBlur(0);
                    node.shadowOpacity(0);
                    node.getStage().container().style.cursor = tool === 'select' ? 'default' : 'crosshair';
                  }}
                />
              );
            } else if (obj.type === 'text') {
              return (
                <Text
                  key={obj.id}
                  id={obj.id}
                  x={obj.x}
                  y={obj.y}
                  text={obj.text}
                  fontSize={obj.fontSize}
                  fill={obj.fill}
                  draggable={tool === 'select'}
                  onClick={() => tool === 'select' && setSelectedObject(obj.id)}
                  onDblClick={handleTextDoubleClick}
                  onDragEnd={(e) => {
                    updateObject(obj.id, {
                      x: e.target.x(),
                      y: e.target.y(),
                    });
                  }}
                  onMouseEnter={(e) => {
                    const node = e.target;
                    node.shadowColor(node.fill());
                    node.shadowBlur(15);
                    node.shadowOpacity(0.8);
                    node.getStage().container().style.cursor = 'move';
                  }}
                  onMouseLeave={(e) => {
                    const node = e.target;
                    node.shadowBlur(0);
                    node.shadowOpacity(0);
                    node.getStage().container().style.cursor = tool === 'select' ? 'default' : 'crosshair';
                  }}
                />
              );
            } else if (obj.type === 'image') {
              return (
                <ImageObject
                  key={obj.id}
                  obj={obj}
                  onMouseEnter={(e) => {
                    const node = e.target;
                    node.shadowColor('white');
                    node.shadowBlur(15);
                    node.shadowOpacity(0.6);
                    node.getStage().container().style.cursor = 'move';
                  }}
                  onMouseLeave={(e) => {
                    const node = e.target;
                    node.shadowBlur(0);
                    node.shadowOpacity(0);
                    node.getStage().container().style.cursor = tool === 'select' ? 'default' : 'crosshair';
                  }}
                />
              );
            }
            return null;
          })}
          {tool === 'select' && selectedObjectId && (
            <Transformer
              ref={transformerRef}
              boundBoxFunc={(oldBox, newBox) => {
                if (Math.abs(newBox.width) < 5 || Math.abs(newBox.height) < 5) {
                  return oldBox;
                }
                return newBox;
              }}
            />
          )}
        </Layer>
      </Stage>
    </div>
  );
});

Canvas.displayName = 'Canvas';

export default Canvas;

