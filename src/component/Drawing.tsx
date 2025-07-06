import React, { useRef, useState, useEffect } from 'react';
import { Stage, Layer, Rect, Circle, Line, Transformer } from 'react-konva';
import { v4 as uuidv4 } from 'uuid';
import './Drawing.css';

export type ShapeType = 'rectangle' | 'circle' | 'line';

interface BaseShape {
  id: string;
  type: ShapeType;
  stroke: string;
  strokeWidth: number;
  dash: number[];
  draggable: boolean;
  isSelected: boolean;
}

interface RectShape extends BaseShape {
  type: 'rectangle';
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
}

interface CircleShape extends BaseShape {
  type: 'circle';
  x: number;
  y: number;
  radius: number;
  fill: string;
}

interface LineShape extends BaseShape {
  type: 'line';
  points: number[];
}

type Shape = RectShape | CircleShape | LineShape;

const DrawingApp: React.FC = () => {
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawingType, setDrawingType] = useState<ShapeType>('rectangle');
  const [lineStart, setLineStart] = useState<{ x: number; y: number } | null>(null);
  const [strokeColor, setStrokeColor] = useState<string>('#000000');
  const [strokeWidth, setStrokeWidth] = useState<number>(2);
  const [dashStyle, setDashStyle] = useState<'solid' | 'dashed'>('solid');
  const [fillColor, setFillColor] = useState<string>('#f0f0f0');
  const [history, setHistory] = useState<Shape[][]>([]);
  const [redoStack, setRedoStack] = useState<Shape[][]>([]);

  const stageRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);
  const selectedShapeRef = useRef<any>(null);

  const pushToHistory = () => {
    setHistory((prev) => [...prev, shapes]);
    setRedoStack([]);
  };

  const createShape = (e: any) => {
    const stage = stageRef.current.getStage();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const dashArray = dashStyle === 'dashed' ? [10, 5] : [];

    if (drawingType === 'line') {
      if (!lineStart) {
        setLineStart(pointer);
      } else {
        const id = uuidv4();
        const newLine: LineShape = {
          id,
          type: 'line',
          stroke: strokeColor,
          strokeWidth,
          dash: dashArray,
          draggable: true,
          isSelected: false,
          points: [lineStart.x, lineStart.y, pointer.x, pointer.y],
        };
        pushToHistory();
        setShapes((prev) => [...prev, newLine]);
        setLineStart(null);
      }
      return;
    }

    const id = uuidv4();
    const baseProps = {
      id,
      stroke: strokeColor,
      strokeWidth,
      dash: dashArray,
      draggable: true,
      isSelected: false,
    };

    const newShape: Shape =
      drawingType === 'rectangle'
        ? {
            ...baseProps,
            type: 'rectangle',
            x: pointer.x,
            y: pointer.y,
            width: 100,
            height: 60,
            fill: fillColor,
          }
        : {
            ...baseProps,
            type: 'circle',
            x: pointer.x,
            y: pointer.y,
            radius: 40,
            fill: fillColor,
          };

    pushToHistory();
    setShapes((prev) => [...prev, newShape]);
    setSelectedId(id);
  };

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setShapes((prev) =>
      prev.map((shape) => ({ ...shape, isSelected: shape.id === id }))
    );
  };

  const updateShape = (id: string, updatedProps: Partial<Shape>) => {
    pushToHistory();
    setShapes((prev) =>
      prev.map((shape) =>
        shape.id === id ? { ...shape, ...updatedProps } as Shape : shape
      )
    );
  };

  useEffect(() => {
    if (transformerRef.current && selectedId) {
      const node = selectedShapeRef.current;
      if (node) {
        transformerRef.current.nodes([node]);
        transformerRef.current.getLayer().batchDraw();
      }
    }
  }, [selectedId, shapes]);

  const saveDrawing = () => {
    const json = JSON.stringify(shapes);
    localStorage.setItem('drawingData', json);
    alert('Drawing saved!');
  };

  const undoLast = () => {
    const prev = history[history.length - 1];
    if (prev) {
      setRedoStack((r) => [...r, shapes]);
      setShapes(prev);
      setHistory(history.slice(0, -1));
    }
  };

  const redoLast = () => {
    const next = redoStack[redoStack.length - 1];
    if (next) {
      setHistory((h) => [...h, shapes]);
      setShapes(next);
      setRedoStack(redoStack.slice(0, -1));
    }
  };

  return (
    <div className="container">
      <h2>Drawing App with Resize</h2>

      <div className="control-panel">
        <label>Shape:</label>
        <select value={drawingType} onChange={(e) => setDrawingType(e.target.value as ShapeType)}>
          <option value="rectangle">Rectangle</option>
          <option value="circle">Circle</option>
          <option value="line">Line</option>
        </select>

        <label>Stroke Color:</label>
        <input type="color" value={strokeColor} onChange={(e) => setStrokeColor(e.target.value)} />

        <label>Stroke Width:</label>
        <input type="number" min="1" value={strokeWidth} onChange={(e) => setStrokeWidth(parseInt(e.target.value))} />

        <label>Line Style:</label>
        <select value={dashStyle} onChange={(e) => setDashStyle(e.target.value as 'solid' | 'dashed')}>
          <option value="solid">Solid</option>
          <option value="dashed">Dashed</option>
        </select>

        <label>Fill Color:</label>
        <input type="color" value={fillColor} onChange={(e) => setFillColor(e.target.value)} />

        <button className='drawing_btn' onClick={saveDrawing}>Save</button>
        <button className='drawing_btn' onClick={undoLast}>Undo</button>
        <button className='drawing_btn' onClick={redoLast}>Redo</button>
      </div>

      <div className="canvas-wrapper">
        <Stage width={window.innerWidth - 100} height={500} ref={stageRef} onMouseDown={createShape}>
          <Layer>
            {shapes.map((shape) => {
              const isSelected = shape.id === selectedId;

              if (shape.type === 'rectangle') {
                return (
                  <Rect
                    key={shape.id}
                    ref={isSelected ? selectedShapeRef : null}
                    {...shape}
                    onClick={() => handleSelect(shape.id)}
                    onTransformEnd={(e) => {
                      const node = e.target;
                      const scaleX = node.scaleX();
                      const scaleY = node.scaleY();
                      node.scaleX(1);
                      node.scaleY(1);
                      updateShape(shape.id, {
                        x: node.x(),
                        y: node.y(),
                        width: Math.max(5, node.width() * scaleX),
                        height: Math.max(5, node.height() * scaleY),
                      });
                    }}
                    onDragEnd={(e) => updateShape(shape.id, {
                      x: e.target.x(),
                      y: e.target.y()
                    })}
                  />
                );
              }

              if (shape.type === 'circle') {
                return (
                  <Circle
                    key={shape.id}
                    ref={isSelected ? selectedShapeRef : null}
                    {...shape}
                    onClick={() => handleSelect(shape.id)}
                    onTransformEnd={(e) => {
                      const node = e.target;
                      const scale = node.scaleX();
                      node.scaleX(1);
                      node.scaleY(1);
                      updateShape(shape.id, {
                        x: node.x(),
                        y: node.y(),
                        radius: Math.max(5, shape.radius! * scale),
                      });
                    }}
                    onDragEnd={(e) => updateShape(shape.id, {
                      x: e.target.x(),
                      y: e.target.y()
                    })}
                  />
                );
              }

              if (shape.type === 'line') {
                return (
                  <Line
                    key={shape.id}
                    {...shape}
                    onClick={() => handleSelect(shape.id)}
                    onDragEnd={(e) => {
                      const [x1, y1, x2, y2] = shape.points;
                      const dx = e.target.x() - x1;
                      const dy = e.target.y() - y1;
                      updateShape(shape.id, {
                        points: [x1 + dx, y1 + dy, x2 + dx, y2 + dy]
                      });
                    }}
                    draggable
                  />
                );
              }

              return null;
            })}

            <Transformer
              ref={transformerRef}
              rotateEnabled={false}
              ignoreStroke
              enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
              boundBoxFunc={(oldBox, newBox) => {
                if (newBox.width < 5 || newBox.height < 5) return oldBox;
                return newBox;
              }}
            />
          </Layer>
        </Stage>
      </div>
    </div>
  );
};

export default DrawingApp;
