import React, { useRef, useState } from 'react';
import { Stage, Layer, Rect, Circle, Line } from 'react-konva';
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
  const stageRef = useRef<any>(null);

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
          strokeWidth: strokeWidth,
          dash: dashArray,
          draggable: true,
          isSelected: false,
          points: [lineStart.x, lineStart.y, pointer.x, pointer.y],
        };
        setShapes((prev) => [...prev, newLine]);
        setLineStart(null);
      }
      return;
    }

    const id = uuidv4();
    const common = {
      id,
      stroke: strokeColor,
      strokeWidth: strokeWidth,
      dash: dashArray,
      draggable: true,
      isSelected: false,
    };

    const newShape: Shape =
      drawingType === 'rectangle'
        ? {
            ...common,
            type: 'rectangle',
            x: pointer.x,
            y: pointer.y,
            width: 100,
            height: 60,
            fill: fillColor,
          }
        : {
            ...common,
            type: 'circle',
            x: pointer.x,
            y: pointer.y,
            radius: 40,
            fill: fillColor,
          };

    setShapes((prev) => [...prev, newShape]);
  };

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setShapes((prev) =>
      prev.map((shape) => ({ ...shape, isSelected: shape.id === id }))
    );
  };

  const updateShape = (updatedShape: Partial<Shape>) => {
    if (!selectedId) return;
    setShapes((prev) =>
      prev.map((shape) =>
        shape.id === selectedId ? { ...shape, ...updatedShape } as Shape : shape
      )
    );
  };

  const saveDrawing = () => {
    const json = JSON.stringify(shapes);
    localStorage.setItem('drawingData', json);
    alert('Drawing saved!');
  };

  return (
    <div className="container">
      <h2>Drawing App</h2>

      <div className="control-panel">
        <label>Shape:</label>
        <select
          value={drawingType}
          onChange={(e) => setDrawingType(e.target.value as ShapeType)}
        >
          <option value="rectangle">Rectangle</option>
          <option value="circle">Circle</option>
          <option value="line">Line</option>
        </select>

        <label>Stroke Color:</label>
        <input type="color" value={strokeColor} onChange={(e) => setStrokeColor(e.target.value)} />

        <label>Stroke Width:</label>
        <input
          type="number"
          min="1"
          value={strokeWidth}
          onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
        />

        <label>Line Style:</label>
        <select value={dashStyle} onChange={(e) => setDashStyle(e.target.value as 'solid' | 'dashed')}>
          <option value="solid">Solid</option>
          <option value="dashed">Dashed</option>
        </select>

        <label>Fill Color:</label>
        <input type="color" value={fillColor} onChange={(e) => setFillColor(e.target.value)} />

        <button onClick={saveDrawing}>Save</button>
      </div>

      <div className="canvas-wrapper">
        <Stage
          width={window.innerWidth - 100}
          height={500}
          ref={stageRef}
          onMouseDown={createShape}
        >
          <Layer>
            {shapes.map((shape) => {
              switch (shape.type) {
                case 'rectangle':
                  return (
                    <Rect
                      key={shape.id}
                      {...shape}
                      dash={shape.dash}
                      onClick={() => handleSelect(shape.id)}
                      onDragEnd={(e) => updateShape({ x: e.target.x(), y: e.target.y() })}
                    />
                  );
                case 'circle':
                  return (
                    <Circle
                      key={shape.id}
                      {...shape}
                      dash={shape.dash}
                      onClick={() => handleSelect(shape.id)}
                      onDragEnd={(e) => updateShape({ x: e.target.x(), y: e.target.y() })}
                    />
                  );
                case 'line':
                  return (
                    <Line
                      key={shape.id}
                      {...shape}
                      dash={shape.dash}
                      onClick={() => handleSelect(shape.id)}
                      onDragEnd={(e) => {
                        const [x1, y1, x2, y2] = shape.points;
                        const dx = e.target.x() - x1;
                        const dy = e.target.y() - y1;
                        updateShape({ points: [x1 + dx, y1 + dy, x2 + dx, y2 + dy] });
                      }}
                    />
                  );
              }
            })}
          </Layer>
        </Stage>
      </div>
    </div>
  );
};

export default DrawingApp;
