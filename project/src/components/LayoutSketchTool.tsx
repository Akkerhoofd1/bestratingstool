import React, { useState, useRef, useEffect } from 'react';
import { Pencil, Trash2, Move, Type, Save, Undo, Grid2x2 as Grid, Ruler, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface Point {
  x: number;
  y: number;
}

interface Line {
  id: string;
  start: Point;
  end: Point;
  isHorizontal: boolean;
  isVertical: boolean;
}

interface Label {
  id: string;
  position: Point;
  text: string;
  lineId: string;
  isEditing: boolean;
}

interface Dimension {
  id: string;
  lineId: string;
  distance: number;
}

interface ShapeInfo {
  area: number;
  perimeter: number;
  isClosed: boolean;
}

type Tool = 'draw' | 'label' | 'move' | 'erase';
type Unit = 'mm' | 'cm' | 'm';

export default function LayoutSketchTool() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
  const [dimensions, setDimensions] = useState<Dimension[]>([]);
  const [currentTool, setCurrentTool] = useState<Tool>('draw');
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [currentPoint, setCurrentPoint] = useState<Point | null>(null);
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [unit, setUnit] = useState<Unit>('cm');
  const [showDimensions, setShowDimensions] = useState(true);
  const [firstStartPoint, setFirstStartPoint] = useState<Point | null>(null);
  const [zoom, setZoom] = useState<number>(0.5);
  const canvasSize = { width: 10000, height: 10000 };
  const [shapeInfo, setShapeInfo] = useState<ShapeInfo | null>(null);
  const [panOffset, setPanOffset] = useState({ x: 300, y: 300 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const getGridSize = (): number => {
    const baseScale = 20;
    switch (unit) {
      case 'mm':
        return baseScale / 10;
      case 'cm':
        return baseScale;
      case 'm':
        return baseScale * 10;
      default:
        return baseScale;
    }
  };

  useEffect(() => {
    drawCanvas();
  }, [lines, labels, dimensions, currentPoint, startPoint, showGrid, unit, showDimensions]);

  const snapPoint = (point: Point): Point => {
    if (!snapToGrid) return point;
    const currentGridSize = getGridSize();
    return {
      x: Math.round(point.x / currentGridSize) * currentGridSize,
      y: Math.round(point.y / currentGridSize) * currentGridSize,
    };
  };

  const getCanvasPoint = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();

    let clientX: number, clientY: number;

    if ('touches' in e) {
      if (e.touches.length === 0) return { x: 0, y: 0 };
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const point = {
      x: (clientX - rect.left - panOffset.x) / zoom,
      y: (clientY - rect.top - panOffset.y) / zoom,
    };

    return snapPoint(point);
  };

  const isLineHorizontal = (start: Point, end: Point, threshold = 15): boolean => {
    return Math.abs(end.y - start.y) < threshold;
  };

  const isLineVertical = (start: Point, end: Point, threshold = 15): boolean => {
    return Math.abs(end.x - start.x) < threshold;
  };

  const straightenLine = (start: Point, end: Point): { start: Point; end: Point; isHorizontal: boolean; isVertical: boolean } => {
    const isHoriz = isLineHorizontal(start, end);
    const isVert = isLineVertical(start, end);

    if (isHoriz) {
      return {
        start,
        end: { ...end, y: start.y },
        isHorizontal: true,
        isVertical: false,
      };
    } else if (isVert) {
      return {
        start,
        end: { ...end, x: start.x },
        isHorizontal: false,
        isVertical: true,
      };
    }

    return {
      start,
      end,
      isHorizontal: false,
      isVertical: false,
    };
  };

  const isPointAt90Degrees = (point: Point, lines: Line[], isEndPoint: boolean): boolean => {
    if (!currentPoint || !startPoint) return false;

    const currentLineIsHoriz = isLineHorizontal(startPoint, currentPoint);
    const currentLineIsVert = isLineVertical(startPoint, currentPoint);

    for (const line of lines) {
      const pointNearLineStart = Math.abs(point.x - line.start.x) < 15 && Math.abs(point.y - line.start.y) < 15;
      const pointNearLineEnd = Math.abs(point.x - line.end.x) < 15 && Math.abs(point.y - line.end.y) < 15;

      if (pointNearLineStart || pointNearLineEnd) {
        if ((currentLineIsHoriz && line.isVertical) || (currentLineIsVert && line.isHorizontal)) {
          return true;
        }
      }
    }

    if (isEndPoint && firstStartPoint && lines.length > 0) {
      const pointNearFirstStart = Math.abs(point.x - firstStartPoint.x) < 15 && Math.abs(point.y - firstStartPoint.y) < 15;

      if (pointNearFirstStart) {
        const firstLine = lines[0];
        if ((currentLineIsHoriz && firstLine.isVertical) || (currentLineIsVert && firstLine.isHorizontal)) {
          return true;
        }
      }
    }

    return false;
  };

  const calculatePixelDistance = (start: Point, end: Point): number => {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const convertPixelsToUnit = (pixels: number): number => {
    const baseScale = 20;
    switch (unit) {
      case 'mm':
        return (pixels / (baseScale / 10));
      case 'cm':
        return (pixels / baseScale);
      case 'm':
        return (pixels / (baseScale * 10));
      default:
        return (pixels / baseScale);
    }
  };

  const formatDimension = (pixels: number): string => {
    const value = convertPixelsToUnit(pixels);
    return `${value.toFixed(unit === 'mm' ? 0 : unit === 'cm' ? 1 : 2)} ${unit}`;
  };

  const formatDimensionWithMM = (pixels: number): string => {
    if (unit === 'cm') {
      const totalMM = convertPixelsToUnit(pixels) * 10;
      const cm = Math.floor(totalMM / 10);
      const mm = Math.round(totalMM % 10);
      if (cm === 0) {
        return `${mm} mm`;
      } else if (mm === 0) {
        return `${cm} cm`;
      } else {
        return `${cm} cm ${mm} mm`;
      }
    }
    return formatDimension(pixels);
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(panOffset.x, panOffset.y);
    ctx.scale(zoom, zoom);

    if (showGrid) {
      const currentGridSize = getGridSize();
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 0.5 / zoom;

      for (let x = 0; x <= canvasSize.width; x += currentGridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvasSize.height);
        ctx.stroke();
      }

      for (let y = 0; y <= canvasSize.height; y += currentGridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvasSize.width, y);
        ctx.stroke();
      }
    }

    lines.forEach((line) => {
      const isSelected = line.id === selectedLineId;

      ctx.strokeStyle = isSelected ? '#3b82f6' : '#1f2937';
      ctx.lineWidth = (isSelected ? 3 : 2) / zoom;

      ctx.beginPath();
      ctx.moveTo(line.start.x, line.start.y);
      ctx.lineTo(line.end.x, line.end.y);
      ctx.stroke();

      ctx.fillStyle = '#1f2937';
      ctx.beginPath();
      ctx.arc(line.start.x, line.start.y, 5 / zoom, 0, 2 * Math.PI);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(line.end.x, line.end.y, 5 / zoom, 0, 2 * Math.PI);
      ctx.fill();
    });

    labels.forEach((label) => {
      const fontSize = 14 / zoom;
      ctx.font = `bold ${fontSize}px Arial`;
      ctx.fillStyle = '#1f2937';

      const textWidth = ctx.measureText(label.text).width;
      const padding = 6 / zoom;

      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(
        label.position.x - padding,
        label.position.y - 20 / zoom - padding,
        textWidth + padding * 2,
        20 / zoom + padding * 2
      );

      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2 / zoom;
      ctx.strokeRect(
        label.position.x - padding,
        label.position.y - 20 / zoom - padding,
        textWidth + padding * 2,
        20 / zoom + padding * 2
      );

      ctx.fillStyle = '#1f2937';
      ctx.fillText(label.text, label.position.x, label.position.y);
    });

    if (showDimensions) {
      lines.forEach((line) => {
        const dimension = dimensions.find(d => d.lineId === line.id);
        if (dimension) {
          const midX = (line.start.x + line.end.x) / 2;
          const midY = (line.start.y + line.end.y) / 2;
          const text = formatDimension(dimension.distance);

          const fontSize = 12 / zoom;
          ctx.font = `bold ${fontSize}px Arial`;
          const textWidth = ctx.measureText(text).width;
          const padding = 4 / zoom;

          ctx.fillStyle = '#dbeafe';
          ctx.fillRect(
            midX - textWidth / 2 - padding,
            midY - 10 / zoom - padding,
            textWidth + padding * 2,
            20 / zoom + padding * 2
          );

          ctx.strokeStyle = '#3b82f6';
          ctx.lineWidth = 1.5 / zoom;
          ctx.strokeRect(
            midX - textWidth / 2 - padding,
            midY - 10 / zoom - padding,
            textWidth + padding * 2,
            20 / zoom + padding * 2
          );

          ctx.fillStyle = '#1e40af';
          ctx.fillText(text, midX - textWidth / 2, midY + 2 / zoom);
        }
      });
    }


    if (isDrawing && startPoint && currentPoint) {
      const straightened = straightenLine(startPoint, currentPoint);
      const isStartAt90 = isPointAt90Degrees(straightened.start, lines, false);
      const isEndAt90 = isPointAt90Degrees(straightened.end, lines, true);

      if (firstStartPoint && lines.length > 0) {
        ctx.strokeStyle = '#9ca3af';
        ctx.lineWidth = 1 / zoom;
        ctx.setLineDash([3 / zoom, 3 / zoom]);
        ctx.beginPath();
        ctx.moveTo(straightened.end.x, straightened.end.y);
        ctx.lineTo(firstStartPoint.x, straightened.end.y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(firstStartPoint.x, straightened.end.y);
        ctx.lineTo(firstStartPoint.x, firstStartPoint.y);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#9ca3af';
        ctx.beginPath();
        ctx.arc(firstStartPoint.x, firstStartPoint.y, 4 / zoom, 0, 2 * Math.PI);
        ctx.fill();
      }

      const is90Degrees = straightened.isHorizontal || straightened.isVertical;
      const lineColor = is90Degrees ? '#22c55e' : '#000000';
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 2 / zoom;
      ctx.setLineDash([5 / zoom, 5 / zoom]);
      ctx.beginPath();
      ctx.moveTo(straightened.start.x, straightened.start.y);
      ctx.lineTo(straightened.end.x, straightened.end.y);
      ctx.stroke();
      ctx.setLineDash([]);

      const previewDistance = calculatePixelDistance(straightened.start, straightened.end);
      const previewText = formatDimensionWithMM(previewDistance);

      const cursorX = straightened.end.x;
      const cursorY = straightened.end.y;

      const fontSize = 16 / zoom;
      ctx.font = `bold ${fontSize}px Arial`;
      const textWidth = ctx.measureText(previewText).width;
      const padding = 8 / zoom;
      const offsetX = 15 / zoom;
      const offsetY = -15 / zoom;

      ctx.fillStyle = 'rgba(59, 130, 246, 0.95)';
      ctx.fillRect(
        cursorX + offsetX - padding,
        cursorY + offsetY - 20 / zoom - padding,
        textWidth + padding * 2,
        24 / zoom + padding * 2
      );

      ctx.strokeStyle = '#1e40af';
      ctx.lineWidth = 2 / zoom;
      ctx.strokeRect(
        cursorX + offsetX - padding,
        cursorY + offsetY - 20 / zoom - padding,
        textWidth + padding * 2,
        24 / zoom + padding * 2
      );

      ctx.fillStyle = '#ffffff';
      ctx.fillText(previewText, cursorX + offsetX, cursorY + offsetY);
    }

    ctx.restore();
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const point = getCanvasPoint(e);

    if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
      return;
    }

    if (currentTool === 'draw') {
      setIsDrawing(true);
      setStartPoint(point);
      setCurrentPoint(point);
      if (lines.length === 0) {
        setFirstStartPoint(point);
      }
    } else if (currentTool === 'label') {
      const lineId = findNearestLine(point);
      if (lineId) {
        const line = lines.find(l => l.id === lineId);
        if (line) {
          const newLabel: Label = {
            id: Date.now().toString(),
            position: point,
            text: '',
            lineId: lineId,
            isEditing: false,
          };
          setLabels([...labels, newLabel]);
        }
      }
    } else if (currentTool === 'erase') {
      const lineId = findNearestLine(point, 10);
      if (lineId) {
        setLines(lines.filter(l => l.id !== lineId));
        setLabels(labels.filter(l => l.lineId !== lineId));
        setDimensions(dimensions.filter(d => d.lineId !== lineId));
      }
    }
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();

    if (e.touches.length === 2) {
      setIsPanning(true);
      setPanStart({
        x: e.touches[0].clientX - panOffset.x,
        y: e.touches[0].clientY - panOffset.y
      });
      return;
    }

    const point = getCanvasPoint(e);

    if (currentTool === 'draw') {
      setIsDrawing(true);
      setStartPoint(point);
      setCurrentPoint(point);
      if (lines.length === 0) {
        setFirstStartPoint(point);
      }
    } else if (currentTool === 'label') {
      const lineId = findNearestLine(point);
      if (lineId) {
        const line = lines.find(l => l.id === lineId);
        if (line) {
          const newLabel: Label = {
            id: Date.now().toString(),
            position: point,
            text: '',
            lineId: lineId,
            isEditing: false,
          };
          setLabels([...labels, newLabel]);
        }
      }
    } else if (currentTool === 'erase') {
      const lineId = findNearestLine(point, 20);
      if (lineId) {
        setLines(lines.filter(l => l.id !== lineId));
        setLabels(labels.filter(l => l.lineId !== lineId));
        setDimensions(dimensions.filter(d => d.lineId !== lineId));
      }
    }
  };

  const handleDimensionClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (currentTool !== 'draw' && currentTool !== 'label') return;

    const point = getCanvasPoint(e);

    lines.forEach((line) => {
      const dimension = dimensions.find(d => d.lineId === line.id);
      if (dimension) {
        const midX = (line.start.x + line.end.x) / 2;
        const midY = (line.start.y + line.end.y) / 2;
        const text = formatDimension(dimension.distance);

        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;

        ctx.font = 'bold 12px Arial';
        const textWidth = ctx.measureText(text).width;
        const padding = 4;

        if (
          point.x >= midX - textWidth / 2 - padding &&
          point.x <= midX + textWidth / 2 + padding &&
          point.y >= midY - 10 - padding &&
          point.y <= midY + 10 + padding
        ) {
          setDimensions(dimensions.filter(d => d.id !== dimension.id));
        }
      }
    });
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    handleDimensionClick(e);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanning) {
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
      return;
    }

    if (isDrawing && startPoint && currentTool === 'draw') {
      setCurrentPoint(getCanvasPoint(e));
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();

    if (isPanning && e.touches.length === 2) {
      setPanOffset({
        x: e.touches[0].clientX - panStart.x,
        y: e.touches[0].clientY - panStart.y,
      });
      return;
    }

    if (isDrawing && startPoint && currentTool === 'draw' && e.touches.length === 1) {
      setCurrentPoint(getCanvasPoint(e));
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (isDrawing && startPoint && currentTool === 'draw') {
      const endPoint = getCanvasPoint(e);
      const straightened = straightenLine(startPoint, endPoint);

      if (Math.abs(straightened.end.x - straightened.start.x) > 5 ||
          Math.abs(straightened.end.y - straightened.start.y) > 5) {
        const lineId = Date.now().toString();
        const newLine: Line = {
          id: lineId,
          start: straightened.start,
          end: straightened.end,
          isHorizontal: straightened.isHorizontal,
          isVertical: straightened.isVertical,
        };
        setLines([...lines, newLine]);

        const distance = calculatePixelDistance(straightened.start, straightened.end);
        const newDimension: Dimension = {
          id: Date.now().toString() + '_dim',
          lineId: lineId,
          distance: distance,
        };
        setDimensions([...dimensions, newDimension]);
      }

      setIsDrawing(false);
      setStartPoint(null);
      setCurrentPoint(null);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();

    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (isDrawing && startPoint && currentTool === 'draw') {
      if (currentPoint) {
        const straightened = straightenLine(startPoint, currentPoint);

        if (Math.abs(straightened.end.x - straightened.start.x) > 5 ||
            Math.abs(straightened.end.y - straightened.start.y) > 5) {
          const lineId = Date.now().toString();
          const newLine: Line = {
            id: lineId,
            start: straightened.start,
            end: straightened.end,
            isHorizontal: straightened.isHorizontal,
            isVertical: straightened.isVertical,
          };
          setLines([...lines, newLine]);

          const distance = calculatePixelDistance(straightened.start, straightened.end);
          const newDimension: Dimension = {
            id: Date.now().toString() + '_dim',
            lineId: lineId,
            distance: distance,
          };
          setDimensions([...dimensions, newDimension]);
        }
      }

      setIsDrawing(false);
      setStartPoint(null);
      setCurrentPoint(null);
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const worldX = (mouseX - panOffset.x) / zoom;
    const worldY = (mouseY - panOffset.y) / zoom;

    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.min(Math.max(0.1, zoom * delta), 5);

    const newPanX = mouseX - worldX * newZoom;
    const newPanY = mouseY - worldY * newZoom;

    setZoom(newZoom);
    setPanOffset({ x: newPanX, y: newPanY });
  };

  const findNearestLine = (point: Point, threshold = 15): string | null => {
    let nearestLine: string | null = null;
    let minDistance = threshold;

    lines.forEach((line) => {
      const distance = pointToLineDistance(point, line.start, line.end);
      if (distance < minDistance) {
        minDistance = distance;
        nearestLine = line.id;
      }
    });

    return nearestLine;
  };

  const pointToLineDistance = (point: Point, lineStart: Point, lineEnd: Point): number => {
    const A = point.x - lineStart.x;
    const B = point.y - lineStart.y;
    const C = lineEnd.x - lineStart.x;
    const D = lineEnd.y - lineStart.y;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;

    if (param < 0) {
      xx = lineStart.x;
      yy = lineStart.y;
    } else if (param > 1) {
      xx = lineEnd.x;
      yy = lineEnd.y;
    } else {
      xx = lineStart.x + param * C;
      yy = lineStart.y + param * D;
    }

    const dx = point.x - xx;
    const dy = point.y - yy;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleLabelClick = (labelId: string) => {
    setLabels(labels.map(l =>
      l.id === labelId ? { ...l, isEditing: true } : { ...l, isEditing: false }
    ));
  };

  const handleLabelChange = (labelId: string, newText: string) => {
    setLabels(labels.map(l =>
      l.id === labelId ? { ...l, text: newText } : l
    ));
  };

  const clearCanvas = () => {
    setLines([]);
    setLabels([]);
    setDimensions([]);
    setFirstStartPoint(null);
  };

  const undoLastLine = () => {
    if (lines.length > 0) {
      const lastLineId = lines[lines.length - 1].id;
      setLines(lines.slice(0, -1));
      setLabels(labels.filter(l => l.lineId !== lastLineId));
      setDimensions(dimensions.filter(d => d.lineId !== lastLineId));
      if (lines.length === 1) {
        setFirstStartPoint(null);
      }
      setShapeInfo(null);
    }
  };

  const checkIfShapeIsClosed = (): boolean => {
    if (lines.length < 3) return false;
    if (!firstStartPoint) return false;

    const lastLine = lines[lines.length - 1];
    const threshold = 15;

    return (
      Math.abs(lastLine.end.x - firstStartPoint.x) < threshold &&
      Math.abs(lastLine.end.y - firstStartPoint.y) < threshold
    );
  };

  const calculateShapeInfo = (): ShapeInfo | null => {
    if (lines.length < 3) return null;

    const isClosed = checkIfShapeIsClosed();

    let perimeter = 0;
    lines.forEach(line => {
      const distance = calculatePixelDistance(line.start, line.end);
      perimeter += distance;
    });

    let area = 0;
    if (isClosed) {
      const points: Point[] = [];
      lines.forEach(line => {
        points.push(line.start);
      });

      for (let i = 0; i < points.length; i++) {
        const j = (i + 1) % points.length;
        area += points[i].x * points[j].y;
        area -= points[j].x * points[i].y;
      }
      area = Math.abs(area) / 2;
    }

    return {
      area: convertPixelsToUnit(Math.sqrt(area)) * convertPixelsToUnit(Math.sqrt(area)),
      perimeter: convertPixelsToUnit(perimeter),
      isClosed
    };
  };

  useEffect(() => {
    if (lines.length >= 3) {
      const info = calculateShapeInfo();
      setShapeInfo(info);
    } else {
      setShapeInfo(null);
    }
  }, [lines, unit]);


  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
        <Pencil className="mr-3 text-blue-600" />
        Legverband Schets Tool
      </h2>

      <div className="mb-4 flex flex-wrap gap-3 items-center">
        <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setCurrentTool('draw')}
            className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
              currentTool === 'draw' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Pencil className="w-4 h-4 mr-2" />
            Tekenen
          </button>
          <button
            onClick={() => setCurrentTool('label')}
            className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
              currentTool === 'label' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Type className="w-4 h-4 mr-2" />
            Maat
          </button>
          <button
            onClick={() => setCurrentTool('erase')}
            className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
              currentTool === 'erase' ? 'bg-red-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Wissen
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={undoLastLine}
            className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            <Undo className="w-4 h-4 mr-2" />
            Ongedaan
          </button>
          <button
            onClick={clearCanvas}
            className="flex items-center px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Alles wissen
          </button>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setZoom(Math.min(zoom * 1.2, 5))}
              className="flex items-center px-3 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoom(1)}
              className="flex items-center px-3 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              title="Reset zoom"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoom(Math.max(zoom * 0.8, 0.1))}
              className="flex items-center px-3 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
              showGrid ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
            }`}
          >
            <Grid className="w-4 h-4 mr-2" />
            Raster
          </button>
          <button
            onClick={() => setSnapToGrid(!snapToGrid)}
            className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
              snapToGrid ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
            }`}
          >
            <Move className="w-4 h-4 mr-2" />
            Snap
          </button>
        </div>
      </div>

      <div className="mb-4 bg-blue-50 p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Ruler className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-gray-700">Teken per:</span>
            <div className="flex gap-1 bg-white rounded-lg p-1">
              <button
                onClick={() => setUnit('mm')}
                className={`px-4 py-2 rounded-md transition-colors font-medium ${
                  unit === 'mm' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                mm
              </button>
              <button
                onClick={() => setUnit('cm')}
                className={`px-4 py-2 rounded-md transition-colors font-medium ${
                  unit === 'cm' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                cm
              </button>
              <button
                onClick={() => setUnit('m')}
                className={`px-4 py-2 rounded-md transition-colors font-medium ${
                  unit === 'm' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                m
              </button>
            </div>
            <button
              onClick={() => setShowDimensions(!showDimensions)}
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                showDimensions ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
              }`}
            >
              <Ruler className="w-4 h-4 mr-2" />
              {showDimensions ? 'Maten aan' : 'Maten uit'}
            </button>
          </div>
          <div className="text-sm text-gray-600">
            {lines.length} lijnen | {dimensions.length} maten | Zoom: {(zoom * 100).toFixed(0)}% | Canvas: {(canvasSize.width / (unit === 'mm' ? 2 : unit === 'cm' ? 20 : 200)).toFixed(0)} x {(canvasSize.height / (unit === 'mm' ? 2 : unit === 'cm' ? 20 : 200)).toFixed(0)} {unit}
          </div>
        </div>
      </div>

      <div
        className="border-2 border-gray-300 rounded-lg bg-gray-50 relative"
        style={{
          height: '600px',
          width: '100%',
          overflow: 'hidden'
        }}
      >
        <div className="absolute top-3 left-3 z-10 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg border border-gray-200">
          <div className="text-lg font-bold text-gray-800">
            Zoom: {(zoom * 100).toFixed(0)}%
          </div>
        </div>
        <div className="absolute top-3 right-3 z-10 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg border border-gray-200">
          <div className="text-xs text-gray-600 space-y-1">
            <div className="font-semibold">Bediening:</div>
            <div>🖱️ Muiswiel = Zoom</div>
            <div>⇧ Shift + Sleep = Verschuiven</div>
            <div>📱 2 vingers = Verschuiven</div>
          </div>
        </div>
        <div
          className="w-full h-full overflow-hidden"
        >
          <canvas
            ref={canvasRef}
            width={canvasSize.width}
            height={canvasSize.height}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onClick={handleCanvasClick}
            onWheel={handleWheel}
            className={isPanning ? 'cursor-grabbing' : currentTool === 'draw' ? 'cursor-crosshair' : currentTool === 'erase' ? 'cursor-pointer' : 'cursor-default'}
            style={{
              display: 'block',
              transformOrigin: '0 0',
              touchAction: 'none'
            }}
          />
        </div>
      </div>

      <div className="mt-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-5">
        <h4 className="font-bold text-gray-800 mb-3 text-lg flex items-center">
          <Pencil className="w-5 h-5 mr-2 text-blue-600" />
          Hoe te gebruiken
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
          <div className="space-y-2">
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <div className="font-bold text-blue-700 mb-1">Tekenen</div>
              <div>Klik en sleep om een lijn te tekenen. Maten worden automatisch weergegeven.</div>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <div className="font-bold text-blue-700 mb-1">Navigatie</div>
              <div>🖱️ Scroll = Zoom | ⇧ Shift + Sleep = Verschuiven | 📱 2 vingers = Verschuiven</div>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <div className="font-bold text-blue-700 mb-1">Eenheden</div>
              <div>Kies mm, cm of m. De grid past automatisch aan (1 cel = 1 eenheid).</div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <div className="font-bold text-blue-700 mb-1">Lijnkleuren</div>
              <div>
                <span className="inline-flex items-center mr-3">
                  <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-1"></span> Haaks
                </span>
                <span className="inline-flex items-center">
                  <span className="inline-block w-3 h-3 bg-black rounded-full mr-1"></span> Schuin
                </span>
              </div>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <div className="font-bold text-blue-700 mb-1">Maten beheren</div>
              <div>Klik op een maat om te verwijderen. Toggle maten aan/uit met de knop.</div>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <div className="font-bold text-blue-700 mb-1">Labels</div>
              <div>Gebruik "Maat" knop om extra tekst toe te voegen aan lijnen.</div>
            </div>
          </div>
        </div>
      </div>

      {shapeInfo && (
        <div className="mt-4 bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-300 rounded-lg p-5">
          <h4 className="font-bold text-gray-800 mb-3 text-lg flex items-center">
            <Ruler className="w-5 h-5 mr-2 text-green-600" />
            Vorm Berekening
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-4 shadow">
              <div className="text-sm text-gray-600 mb-1">Omtrek</div>
              <div className="text-2xl font-bold text-blue-600">
                {shapeInfo.perimeter.toFixed(2)} {unit}
              </div>
            </div>
            {shapeInfo.isClosed && (
              <div className="bg-white rounded-lg p-4 shadow">
                <div className="text-sm text-gray-600 mb-1">Oppervlakte</div>
                <div className="text-2xl font-bold text-green-600">
                  {shapeInfo.area.toFixed(2)} {unit}²
                </div>
              </div>
            )}
          </div>
          {shapeInfo.isClosed ? (
            <div className="mt-3 text-sm text-green-700 font-medium flex items-center">
              <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Vorm is gesloten - oppervlakte berekend
            </div>
          ) : (
            <div className="mt-3 text-sm text-amber-700 font-medium flex items-center">
              <span className="inline-block w-2 h-2 bg-amber-500 rounded-full mr-2"></span>
              Vorm is niet gesloten - sluit de vorm om oppervlakte te zien
            </div>
          )}
        </div>
      )}

      {labels.length > 0 && (
        <div className="mt-4 bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-800 mb-3">Toegevoegde Maten:</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {labels.map((label) => (
              <div key={label.id} className="bg-white p-2 rounded border border-gray-200">
                {label.isEditing ? (
                  <input
                    type="text"
                    value={label.text}
                    onChange={(e) => handleLabelChange(label.id, e.target.value)}
                    onBlur={() => setLabels(labels.map(l => l.id === label.id ? { ...l, isEditing: false } : l))}
                    className="w-full px-2 py-1 border border-blue-500 rounded focus:outline-none"
                    autoFocus
                  />
                ) : (
                  <div
                    onClick={() => handleLabelClick(label.id)}
                    className="cursor-pointer hover:text-blue-600 transition-colors"
                  >
                    {label.text}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
