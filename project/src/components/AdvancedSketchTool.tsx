import React, { useState, useRef, useEffect } from 'react';
import { Pencil, Trash2, Move, Save, Undo, Redo, Grid2x2 as Grid, Ruler, ZoomIn, ZoomOut, Maximize2, Download, Upload, Mountain, Target, Settings, FolderOpen } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Point {
  id: string;
  x: number;
  y: number;
}

interface Segment {
  id: string;
  startPointId: string;
  endPointId: string;
  type: 'line';
}

interface Polygon {
  id: string;
  pointIds: string[];
}

interface Benchmark {
  id: string;
  pointId: string;
  elevationMeters: number;
  isStartPoint: boolean;
}

interface ProjectState {
  points: Point[];
  segments: Segment[];
  polygons: Polygon[];
  benchmarks: Benchmark[];
}

type Unit = 'mm' | 'cm' | 'm';
type Mode = 'draw' | 'measure' | 'settings' | 'results';
type Tool = 'draw' | 'erase' | 'select' | 'benchmark';

export default function AdvancedSketchTool() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [points, setPoints] = useState<Point[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [polygons, setPolygons] = useState<Polygon[]>([]);
  const [benchmarks, setBenchmarks] = useState<Benchmark[]>([]);

  const [currentMode, setCurrentMode] = useState<Mode>('draw');
  const [currentTool, setCurrentTool] = useState<Tool>('draw');
  const [unit, setUnit] = useState<Unit>('cm');

  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPolyline, setCurrentPolyline] = useState<string[]>([]);
  const [currentPoint, setCurrentPoint] = useState<Point | null>(null);

  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [snapToPoints, setSnapToPoints] = useState(true);
  const [snapToAngles, setSnapToAngles] = useState(true);
  const [gridSize, setGridSize] = useState(1);

  const [zoom, setZoom] = useState(0.5);
  const [panOffset, setPanOffset] = useState({ x: 300, y: 300 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
  const [hoveredPointId, setHoveredPointId] = useState<string | null>(null);

  const [history, setHistory] = useState<ProjectState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const [targetPointId, setTargetPointId] = useState<string | null>(null);
  const [showBenchmarkInput, setShowBenchmarkInput] = useState(false);
  const [benchmarkValue, setBenchmarkValue] = useState('');

  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState('Nieuw Project');
  const [savedProjects, setSavedProjects] = useState<any[]>([]);
  const [showProjectList, setShowProjectList] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const canvasSize = { width: 10000, height: 10000 };
  const PIXELS_PER_METER = 200;

  const metersToUnit = (meters: number): number => {
    switch (unit) {
      case 'mm': return meters * 1000;
      case 'cm': return meters * 100;
      case 'm': return meters;
    }
  };

  const unitToMeters = (value: number): number => {
    switch (unit) {
      case 'mm': return value / 1000;
      case 'cm': return value / 100;
      case 'm': return value;
    }
  };

  const pixelsToMeters = (pixels: number): number => {
    return pixels / PIXELS_PER_METER;
  };

  const metersToPixels = (meters: number): number => {
    return meters * PIXELS_PER_METER;
  };

  const formatDistance = (meters: number): string => {
    const value = metersToUnit(meters);
    const decimals = unit === 'mm' ? 0 : unit === 'cm' ? 1 : 2;
    return `${value.toFixed(decimals)} ${unit}`;
  };

  const formatArea = (squareMeters: number): string => {
    const value = metersToUnit(1) * metersToUnit(1) * squareMeters;
    const decimals = unit === 'mm' ? 0 : unit === 'cm' ? 2 : 2;
    return `${value.toFixed(decimals)} ${unit}²`;
  };

  const getGridSizePixels = (): number => {
    return metersToPixels(unitToMeters(gridSize));
  };

  const saveToHistory = () => {
    const newState: ProjectState = {
      points: JSON.parse(JSON.stringify(points)),
      segments: JSON.parse(JSON.stringify(segments)),
      polygons: JSON.parse(JSON.stringify(polygons)),
      benchmarks: JSON.parse(JSON.stringify(benchmarks))
    };

    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newState);

    if (newHistory.length > 50) {
      newHistory.shift();
    } else {
      setHistoryIndex(historyIndex + 1);
    }

    setHistory(newHistory);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setPoints(prevState.points);
      setSegments(prevState.segments);
      setPolygons(prevState.polygons);
      setBenchmarks(prevState.benchmarks);
      setHistoryIndex(historyIndex - 1);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setPoints(nextState.points);
      setSegments(nextState.segments);
      setPolygons(nextState.polygons);
      setBenchmarks(nextState.benchmarks);
      setHistoryIndex(historyIndex + 1);
    }
  };

  const getCanvasPoint = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { id: '', x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;

    if ('touches' in e) {
      if (e.touches.length === 0) return { id: '', x: 0, y: 0 };
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = (clientX - rect.left - panOffset.x) / zoom;
    const y = (clientY - rect.top - panOffset.y) / zoom;

    return snapPoint({ id: '', x, y });
  };

  const snapPoint = (point: Point): Point => {
    let snapped = { ...point };

    if (snapToPoints) {
      const threshold = 15 / zoom;
      for (const p of points) {
        const dx = point.x - p.x;
        const dy = point.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < threshold) {
          return { ...point, x: p.x, y: p.y };
        }
      }
    }

    if (snapToAngles && currentPolyline.length > 0) {
      const lastPointId = currentPolyline[currentPolyline.length - 1];
      const lastPoint = points.find(p => p.id === lastPointId);
      if (lastPoint) {
        const dx = point.x - lastPoint.x;
        const dy = point.y - lastPoint.y;
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;
        const snapAngles = [0, 45, 90, 135, 180, -45, -90, -135];
        const threshold = 10;

        for (const snapAngle of snapAngles) {
          const diff = Math.abs(angle - snapAngle);
          if (diff < threshold || Math.abs(diff - 360) < threshold) {
            const dist = Math.sqrt(dx * dx + dy * dy);
            const rad = snapAngle * Math.PI / 180;
            snapped.x = lastPoint.x + dist * Math.cos(rad);
            snapped.y = lastPoint.y + dist * Math.sin(rad);
            break;
          }
        }
      }
    }

    if (snapToGrid) {
      const gridPixels = getGridSizePixels();
      snapped.x = Math.round(snapped.x / gridPixels) * gridPixels;
      snapped.y = Math.round(snapped.y / gridPixels) * gridPixels;
    }

    return snapped;
  };

  const calculateDistance = (p1: Point, p2: Point): number => {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return pixelsToMeters(Math.sqrt(dx * dx + dy * dy));
  };

  const calculatePolygonArea = (pointIds: string[]): number => {
    if (pointIds.length < 3) return 0;

    const polygonPoints = pointIds.map(id => points.find(p => p.id === id)).filter(p => p !== undefined) as Point[];

    let area = 0;
    for (let i = 0; i < polygonPoints.length; i++) {
      const j = (i + 1) % polygonPoints.length;
      area += polygonPoints[i].x * polygonPoints[j].y;
      area -= polygonPoints[j].x * polygonPoints[i].y;
    }

    return Math.abs(pixelsToMeters(1) * pixelsToMeters(1) * area / 2);
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
      const gridPixels = getGridSizePixels();
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 0.5 / zoom;

      for (let x = 0; x <= canvasSize.width; x += gridPixels) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvasSize.height);
        ctx.stroke();
      }

      for (let y = 0; y <= canvasSize.height; y += gridPixels) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvasSize.width, y);
        ctx.stroke();
      }
    }

    polygons.forEach(polygon => {
      const polygonPoints = polygon.pointIds.map(id => points.find(p => p.id === id)).filter(p => p !== undefined) as Point[];

      if (polygonPoints.length > 2) {
        ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2 / zoom;

        ctx.beginPath();
        ctx.moveTo(polygonPoints[0].x, polygonPoints[0].y);
        for (let i = 1; i < polygonPoints.length; i++) {
          ctx.lineTo(polygonPoints[i].x, polygonPoints[i].y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        const centerX = polygonPoints.reduce((sum, p) => sum + p.x, 0) / polygonPoints.length;
        const centerY = polygonPoints.reduce((sum, p) => sum + p.y, 0) / polygonPoints.length;
        const area = calculatePolygonArea(polygon.pointIds);

        const fontSize = 14 / zoom;
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.fillStyle = '#1e40af';
        const text = formatArea(area);
        const textWidth = ctx.measureText(text).width;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillRect(centerX - textWidth / 2 - 4 / zoom, centerY - 10 / zoom, textWidth + 8 / zoom, 20 / zoom);
        ctx.fillStyle = '#1e40af';
        ctx.fillText(text, centerX - textWidth / 2, centerY + 5 / zoom);
      }
    });

    segments.forEach(segment => {
      const start = points.find(p => p.id === segment.startPointId);
      const end = points.find(p => p.id === segment.endPointId);

      if (start && end) {
        ctx.strokeStyle = '#1f2937';
        ctx.lineWidth = 2 / zoom;
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();

        const midX = (start.x + end.x) / 2;
        const midY = (start.y + end.y) / 2;
        const distance = calculateDistance(start, end);

        const fontSize = 12 / zoom;
        ctx.font = `${fontSize}px Arial`;
        const text = formatDistance(distance);
        const textWidth = ctx.measureText(text).width;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillRect(midX - textWidth / 2 - 3 / zoom, midY - 8 / zoom, textWidth + 6 / zoom, 16 / zoom);
        ctx.fillStyle = '#1f2937';
        ctx.fillText(text, midX - textWidth / 2, midY + 4 / zoom);
      }
    });

    points.forEach(point => {
      const isSelected = point.id === selectedPointId;
      const isHovered = point.id === hoveredPointId;
      const benchmark = benchmarks.find(b => b.pointId === point.id);

      ctx.fillStyle = benchmark?.isStartPoint ? '#ef4444' : isSelected ? '#3b82f6' : isHovered ? '#60a5fa' : '#1f2937';
      ctx.beginPath();
      ctx.arc(point.x, point.y, (isSelected || isHovered ? 6 : 4) / zoom, 0, 2 * Math.PI);
      ctx.fill();

      if (benchmark) {
        const elevation = metersToUnit(benchmark.elevationMeters);
        const fontSize = 10 / zoom;
        ctx.font = `bold ${fontSize}px Arial`;
        const text = `${elevation.toFixed(unit === 'm' ? 3 : unit === 'cm' ? 1 : 0)} ${unit}`;
        const textWidth = ctx.measureText(text).width;

        ctx.fillStyle = benchmark.isStartPoint ? '#fee2e2' : '#fef3c7';
        ctx.fillRect(point.x + 8 / zoom, point.y - 15 / zoom, textWidth + 6 / zoom, 14 / zoom);
        ctx.fillStyle = benchmark.isStartPoint ? '#991b1b' : '#92400e';
        ctx.fillText(text, point.x + 11 / zoom, point.y - 5 / zoom);
      }
    });

    if (isDrawing && currentPolyline.length > 0 && currentPoint) {
      const lastPointId = currentPolyline[currentPolyline.length - 1];
      const lastPoint = points.find(p => p.id === lastPointId);

      if (lastPoint) {
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 2 / zoom;
        ctx.setLineDash([5 / zoom, 5 / zoom]);
        ctx.beginPath();
        ctx.moveTo(lastPoint.x, lastPoint.y);
        ctx.lineTo(currentPoint.x, currentPoint.y);
        ctx.stroke();
        ctx.setLineDash([]);

        const distance = calculateDistance(lastPoint, currentPoint);
        const fontSize = 14 / zoom;
        ctx.font = `bold ${fontSize}px Arial`;
        const text = formatDistance(distance);
        const textWidth = ctx.measureText(text).width;

        ctx.fillStyle = 'rgba(34, 197, 94, 0.9)';
        ctx.fillRect(currentPoint.x + 15 / zoom, currentPoint.y - 20 / zoom, textWidth + 8 / zoom, 20 / zoom);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(text, currentPoint.x + 19 / zoom, currentPoint.y - 5 / zoom);
      }
    }

    const startBenchmark = benchmarks.find(b => b.isStartPoint);
    const lastBenchmark = benchmarks.length > 1 ? benchmarks[benchmarks.length - 1] : null;

    if (startBenchmark && lastBenchmark && !lastBenchmark.isStartPoint && targetPointId) {
      const lastPoint = points.find(p => p.id === lastBenchmark.pointId);
      const targetPoint = points.find(p => p.id === targetPointId);

      if (lastPoint && targetPoint) {
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2 / zoom;
        ctx.setLineDash([10 / zoom, 5 / zoom]);
        ctx.beginPath();
        ctx.moveTo(lastPoint.x, lastPoint.y);
        ctx.lineTo(targetPoint.x, targetPoint.y);
        ctx.stroke();
        ctx.setLineDash([]);

        const distance = calculateDistance(lastPoint, targetPoint);
        const elevationDiff = startBenchmark.elevationMeters - lastBenchmark.elevationMeters;
        const slope = distance > 0 ? (elevationDiff / distance) * 1000 : 0;

        const midX = (lastPoint.x + targetPoint.x) / 2;
        const midY = (lastPoint.y + targetPoint.y) / 2;

        const fontSize = 12 / zoom;
        ctx.font = `bold ${fontSize}px Arial`;
        const lines = [
          `Afstand: ${formatDistance(distance)}`,
          `Δ hoogte: ${formatDistance(elevationDiff)}`,
          `Helling: ${slope.toFixed(1)}‰`
        ];

        const maxWidth = Math.max(...lines.map(l => ctx.measureText(l).width));
        const padding = 6 / zoom;
        const lineHeight = 16 / zoom;

        ctx.fillStyle = 'rgba(251, 191, 36, 0.95)';
        ctx.fillRect(midX - maxWidth / 2 - padding, midY - lineHeight * 2, maxWidth + padding * 2, lineHeight * 3 + padding);
        ctx.fillStyle = '#78350f';

        lines.forEach((line, i) => {
          const textWidth = ctx.measureText(line).width;
          ctx.fillText(line, midX - textWidth / 2, midY - lineHeight + i * lineHeight);
        });
      }
    }

    ctx.restore();
  };

  useEffect(() => {
    drawCanvas();
  }, [points, segments, polygons, benchmarks, currentPoint, currentPolyline, zoom, panOffset, showGrid, unit, selectedPointId, hoveredPointId, targetPointId, isDrawing]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 1 || e.shiftKey) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
      return;
    }

    handlePointerDown(e);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();

    if (e.touches.length === 2) {
      setIsPanning(true);
      setPanStart({ x: e.touches[0].clientX - panOffset.x, y: e.touches[0].clientY - panOffset.y });
      return;
    }

    handlePointerDown(e);
  };

  const handlePointerDown = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const point = getCanvasPoint(e);

    if (currentTool === 'draw') {
      const existingPoint = points.find(p => Math.abs(p.x - point.x) < 1 && Math.abs(p.y - point.y) < 1);

      if (existingPoint) {
        if (currentPolyline.length > 0 && currentPolyline[0] === existingPoint.id && currentPolyline.length > 2) {
          saveToHistory();
          const newPolygon: Polygon = {
            id: Date.now().toString(),
            pointIds: [...currentPolyline]
          };
          setPolygons([...polygons, newPolygon]);
          setCurrentPolyline([]);
          setIsDrawing(false);
          setCurrentPoint(null);
        } else if (!currentPolyline.includes(existingPoint.id)) {
          if (currentPolyline.length > 0) {
            saveToHistory();
            const lastPointId = currentPolyline[currentPolyline.length - 1];
            const newSegment: Segment = {
              id: Date.now().toString(),
              startPointId: lastPointId,
              endPointId: existingPoint.id,
              type: 'line'
            };
            setSegments([...segments, newSegment]);
          }
          setCurrentPolyline([...currentPolyline, existingPoint.id]);
          setIsDrawing(true);
        }
      } else {
        saveToHistory();
        const newPoint: Point = {
          id: Date.now().toString(),
          x: point.x,
          y: point.y
        };
        setPoints([...points, newPoint]);

        if (currentPolyline.length > 0) {
          const lastPointId = currentPolyline[currentPolyline.length - 1];
          const newSegment: Segment = {
            id: Date.now().toString() + '_seg',
            startPointId: lastPointId,
            endPointId: newPoint.id,
            type: 'line'
          };
          setSegments([...segments, newSegment]);
        }

        setCurrentPolyline([...currentPolyline, newPoint.id]);
        setIsDrawing(true);
      }
    } else if (currentTool === 'erase') {
      const clickedPoint = points.find(p => {
        const dx = p.x - point.x;
        const dy = p.y - point.y;
        return Math.sqrt(dx * dx + dy * dy) < 20 / zoom;
      });

      if (clickedPoint) {
        saveToHistory();
        setPoints(points.filter(p => p.id !== clickedPoint.id));
        setSegments(segments.filter(s => s.startPointId !== clickedPoint.id && s.endPointId !== clickedPoint.id));
        setPolygons(polygons.filter(poly => !poly.pointIds.includes(clickedPoint.id)));
        setBenchmarks(benchmarks.filter(b => b.pointId !== clickedPoint.id));
      }
    } else if (currentTool === 'select') {
      const clickedPoint = points.find(p => {
        const dx = p.x - point.x;
        const dy = p.y - point.y;
        return Math.sqrt(dx * dx + dy * dy) < 20 / zoom;
      });

      setSelectedPointId(clickedPoint ? clickedPoint.id : null);
    } else if (currentTool === 'benchmark') {
      const clickedPoint = points.find(p => {
        const dx = p.x - point.x;
        const dy = p.y - point.y;
        return Math.sqrt(dx * dx + dy * dy) < 20 / zoom;
      });

      if (clickedPoint) {
        setSelectedPointId(clickedPoint.id);
        setShowBenchmarkInput(true);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanning) {
      setPanOffset({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
      return;
    }

    handlePointerMove(e);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();

    if (isPanning && e.touches.length === 2) {
      setPanOffset({ x: e.touches[0].clientX - panStart.x, y: e.touches[0].clientY - panStart.y });
      return;
    }

    handlePointerMove(e);
  };

  const handlePointerMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const point = getCanvasPoint(e);

    if (isDrawing) {
      setCurrentPoint(point);
    }

    const hoveredPoint = points.find(p => {
      const dx = p.x - point.x;
      const dy = p.y - point.y;
      return Math.sqrt(dx * dx + dy * dy) < 20 / zoom;
    });

    setHoveredPointId(hoveredPoint ? hoveredPoint.id : null);
  };

  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (isPanning) {
      setIsPanning(false);
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

    setZoom(newZoom);
    setPanOffset({
      x: mouseX - worldX * newZoom,
      y: mouseY - worldY * newZoom
    });
  };

  const finishPolyline = () => {
    setCurrentPolyline([]);
    setIsDrawing(false);
    setCurrentPoint(null);
  };

  const closePolygon = () => {
    if (currentPolyline.length > 2) {
      saveToHistory();
      const newPolygon: Polygon = {
        id: Date.now().toString(),
        pointIds: [...currentPolyline]
      };
      setPolygons([...polygons, newPolygon]);
      setCurrentPolyline([]);
      setIsDrawing(false);
      setCurrentPoint(null);
    }
  };

  const clearAll = () => {
    saveToHistory();
    setPoints([]);
    setSegments([]);
    setPolygons([]);
    setBenchmarks([]);
    setCurrentPolyline([]);
    setIsDrawing(false);
    setCurrentPoint(null);
    setSelectedPointId(null);
    setTargetPointId(null);
  };

  const addBenchmark = () => {
    if (!selectedPointId || !benchmarkValue) return;

    saveToHistory();
    const elevation = unitToMeters(parseFloat(benchmarkValue));
    const isFirst = benchmarks.length === 0;

    const newBenchmark: Benchmark = {
      id: Date.now().toString(),
      pointId: selectedPointId,
      elevationMeters: elevation,
      isStartPoint: isFirst
    };

    setBenchmarks([...benchmarks, newBenchmark]);
    setBenchmarkValue('');
    setShowBenchmarkInput(false);
    setSelectedPointId(null);
  };

  const exportProject = () => {
    const project: ProjectState = {
      points,
      segments,
      polygons,
      benchmarks
    };

    const json = JSON.stringify(project, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `schets-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importProject = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const project: ProjectState = JSON.parse(event.target?.result as string);
        saveToHistory();
        setPoints(project.points);
        setSegments(project.segments);
        setPolygons(project.polygons);
        setBenchmarks(project.benchmarks);
      } catch (error) {
        alert('Fout bij het inladen van het bestand');
      }
    };
    reader.readAsText(file);
  };

  const getTotalArea = (): number => {
    return polygons.reduce((sum, poly) => sum + calculatePolygonArea(poly.pointIds), 0);
  };

  const getTotalPerimeter = (): number => {
    return segments.reduce((sum, seg) => {
      const start = points.find(p => p.id === seg.startPointId);
      const end = points.find(p => p.id === seg.endPointId);
      return start && end ? sum + calculateDistance(start, end) : sum;
    }, 0);
  };

  const saveProjectToDatabase = async () => {
    setIsSaving(true);
    try {
      const projectData: ProjectState = { points, segments, polygons, benchmarks };

      if (currentProjectId) {
        const { error } = await supabase
          .from('sketch_projects')
          .update({
            name: projectName,
            project_data: projectData,
            unit_preference: unit,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentProjectId);

        if (error) throw error;
        alert('Project opgeslagen!');
      } else {
        const { data, error } = await supabase
          .from('sketch_projects')
          .insert({
            name: projectName,
            project_data: projectData,
            unit_preference: unit
          })
          .select()
          .single();

        if (error) throw error;
        if (data) {
          setCurrentProjectId(data.id);
          alert('Project aangemaakt en opgeslagen!');
        }
      }
    } catch (error) {
      console.error('Fout bij opslaan:', error);
      alert('Fout bij opslaan van project');
    } finally {
      setIsSaving(false);
    }
  };

  const loadProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('sketch_projects')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setSavedProjects(data || []);
      setShowProjectList(true);
    } catch (error) {
      console.error('Fout bij laden:', error);
      alert('Fout bij laden van projecten');
    }
  };

  const loadProject = async (projectId: string) => {
    try {
      const { data, error } = await supabase
        .from('sketch_projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error) throw error;
      if (data) {
        saveToHistory();
        setPoints(data.project_data.points);
        setSegments(data.project_data.segments);
        setPolygons(data.project_data.polygons);
        setBenchmarks(data.project_data.benchmarks);
        setUnit(data.unit_preference as Unit);
        setProjectName(data.name);
        setCurrentProjectId(data.id);
        setShowProjectList(false);
      }
    } catch (error) {
      console.error('Fout bij laden:', error);
      alert('Fout bij laden van project');
    }
  };

  const deleteProject = async (projectId: string) => {
    if (!confirm('Weet je zeker dat je dit project wilt verwijderen?')) return;

    try {
      const { error } = await supabase
        .from('sketch_projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;
      setSavedProjects(savedProjects.filter(p => p.id !== projectId));
      if (currentProjectId === projectId) {
        setCurrentProjectId(null);
        setProjectName('Nieuw Project');
      }
    } catch (error) {
      console.error('Fout bij verwijderen:', error);
      alert('Fout bij verwijderen van project');
    }
  };

  const newProject = () => {
    if (points.length > 0 || segments.length > 0) {
      if (!confirm('Weet je zeker dat je een nieuw project wilt starten? Niet-opgeslagen wijzigingen gaan verloren.')) {
        return;
      }
    }
    saveToHistory();
    clearAll();
    setCurrentProjectId(null);
    setProjectName('Nieuw Project');
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <Pencil className="mr-3 text-blue-600" />
          Bestratings Teken- & Uitzettool
        </h2>

        <div className="flex gap-2">
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
            placeholder="Project naam"
          />
          <button onClick={saveProjectToDatabase} disabled={isSaving} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50">
            <Save className="w-4 h-4 inline mr-1" />
            {isSaving ? 'Bezig...' : 'Opslaan'}
          </button>
          <button onClick={loadProjects} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
            <FolderOpen className="w-4 h-4 inline mr-1" />
            Projecten
          </button>
          <button onClick={newProject} className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-700">
            Nieuw
          </button>
        </div>
      </div>

      {showProjectList && (
        <div className="mb-6 bg-gray-50 rounded-lg p-4 border-2 border-gray-300">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-lg">Opgeslagen Projecten</h3>
            <button onClick={() => setShowProjectList(false)} className="text-gray-600 hover:text-gray-800">
              Sluiten
            </button>
          </div>

          {savedProjects.length === 0 ? (
            <p className="text-gray-600 text-center py-4">Geen opgeslagen projecten</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {savedProjects.map((project) => (
                <div key={project.id} className="bg-white rounded-lg p-3 border border-gray-200 hover:border-blue-400 transition-colors">
                  <div className="font-semibold mb-1">{project.name}</div>
                  <div className="text-xs text-gray-600 mb-2">
                    {new Date(project.updated_at).toLocaleDateString('nl-NL')} {new Date(project.updated_at).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="text-xs text-gray-500 mb-3">
                    {project.project_data.points?.length || 0} punten • {project.project_data.segments?.length || 0} lijnen • {project.project_data.polygons?.length || 0} vlakken
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => loadProject(project.id)} className="flex-1 px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700">
                      Laden
                    </button>
                    <button onClick={() => deleteProject(project.id)} className="flex-1 px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700">
                      Verwijderen
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <div className="mb-4 flex flex-wrap gap-2 items-center">
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setCurrentMode('draw')}
                className={`px-4 py-2 rounded-lg transition-colors ${currentMode === 'draw' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
              >
                <Pencil className="w-4 h-4 inline mr-1" />
                Tekenen
              </button>
              <button
                onClick={() => setCurrentMode('measure')}
                className={`px-4 py-2 rounded-lg transition-colors ${currentMode === 'measure' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
              >
                <Mountain className="w-4 h-4 inline mr-1" />
                Meten
              </button>
              <button
                onClick={() => setCurrentMode('settings')}
                className={`px-4 py-2 rounded-lg transition-colors ${currentMode === 'settings' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
              >
                <Settings className="w-4 h-4 inline mr-1" />
                Instellingen
              </button>
              <button
                onClick={() => setCurrentMode('results')}
                className={`px-4 py-2 rounded-lg transition-colors ${currentMode === 'results' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
              >
                <Ruler className="w-4 h-4 inline mr-1" />
                Resultaten
              </button>
            </div>

            <div className="flex gap-1 ml-auto">
              <button onClick={undo} disabled={historyIndex <= 0} className="px-3 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50">
                <Undo className="w-4 h-4" />
              </button>
              <button onClick={redo} disabled={historyIndex >= history.length - 1} className="px-3 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50">
                <Redo className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="border-2 border-gray-300 rounded-lg bg-gray-50 relative" style={{ height: '600px' }}>
            <div className="absolute top-3 left-3 z-10 bg-white/95 px-3 py-2 rounded-lg shadow">
              <div className="text-sm font-bold">Zoom: {(zoom * 100).toFixed(0)}%</div>
            </div>

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
              onWheel={handleWheel}
              className={isPanning ? 'cursor-grabbing' : 'cursor-crosshair'}
              style={{ display: 'block', touchAction: 'none' }}
            />
          </div>
        </div>

        <div className="lg:col-span-1 space-y-4">
          {currentMode === 'draw' && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-bold mb-3">Tekengereedschap</h3>

              <div className="space-y-2">
                <button
                  onClick={() => setCurrentTool('draw')}
                  className={`w-full px-4 py-2 rounded-lg ${currentTool === 'draw' ? 'bg-blue-600 text-white' : 'bg-white'}`}
                >
                  <Pencil className="w-4 h-4 inline mr-2" />
                  Tekenen
                </button>
                <button
                  onClick={() => setCurrentTool('select')}
                  className={`w-full px-4 py-2 rounded-lg ${currentTool === 'select' ? 'bg-blue-600 text-white' : 'bg-white'}`}
                >
                  <Move className="w-4 h-4 inline mr-2" />
                  Selecteren
                </button>
                <button
                  onClick={() => setCurrentTool('erase')}
                  className={`w-full px-4 py-2 rounded-lg ${currentTool === 'erase' ? 'bg-red-600 text-white' : 'bg-white'}`}
                >
                  <Trash2 className="w-4 h-4 inline mr-2" />
                  Wissen
                </button>
              </div>

              <div className="mt-4 space-y-2">
                <button onClick={closePolygon} disabled={currentPolyline.length < 3} className="w-full px-4 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50">
                  Sluit Vlak
                </button>
                <button onClick={finishPolyline} disabled={currentPolyline.length === 0} className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg disabled:opacity-50">
                  Voltooi Lijn
                </button>
                <button onClick={clearAll} className="w-full px-4 py-2 bg-red-600 text-white rounded-lg">
                  Alles Wissen
                </button>
              </div>
            </div>
          )}

          {currentMode === 'measure' && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-bold mb-3">Meetpunten</h3>

              <button
                onClick={() => setCurrentTool('benchmark')}
                className={`w-full px-4 py-2 rounded-lg mb-4 ${currentTool === 'benchmark' ? 'bg-blue-600 text-white' : 'bg-white'}`}
              >
                <Mountain className="w-4 h-4 inline mr-2" />
                Meetpunt Plaatsen
              </button>

              {showBenchmarkInput && selectedPointId && (
                <div className="bg-white rounded-lg p-3 mb-4">
                  <label className="block text-sm font-medium mb-2">Hoogte ({unit})</label>
                  <input
                    type="number"
                    value={benchmarkValue}
                    onChange={(e) => setBenchmarkValue(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg mb-2"
                    step={unit === 'mm' ? 1 : unit === 'cm' ? 0.1 : 0.001}
                  />
                  <div className="flex gap-2">
                    <button onClick={addBenchmark} className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg">
                      Toevoegen
                    </button>
                    <button onClick={() => { setShowBenchmarkInput(false); setSelectedPointId(null); }} className="flex-1 px-3 py-2 bg-gray-400 text-white rounded-lg">
                      Annuleren
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Meetpunten:</h4>
                {benchmarks.map(b => {
                  const point = points.find(p => p.id === b.pointId);
                  return (
                    <div key={b.id} className={`p-2 rounded ${b.isStartPoint ? 'bg-red-100' : 'bg-yellow-100'}`}>
                      <div className="text-sm">
                        {b.isStartPoint && '⭐ '}Punt #{point ? points.indexOf(point) + 1 : '?'}
                      </div>
                      <div className="font-bold">{metersToUnit(b.elevationMeters).toFixed(unit === 'm' ? 3 : unit === 'cm' ? 1 : 0)} {unit}</div>
                    </div>
                  );
                })}
              </div>

              {benchmarks.length > 1 && (
                <div className="mt-4">
                  <button
                    onClick={() => setCurrentTool('select')}
                    className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg"
                  >
                    <Target className="w-4 h-4 inline mr-2" />
                    Kies Doelpunt
                  </button>
                  {selectedPointId && (
                    <button onClick={() => setTargetPointId(selectedPointId)} className="w-full mt-2 px-4 py-2 bg-green-600 text-white rounded-lg">
                      Stel in als Doel
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {currentMode === 'settings' && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-bold mb-3">Instellingen</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Eenheid</label>
                  <div className="flex gap-1">
                    {(['mm', 'cm', 'm'] as Unit[]).map(u => (
                      <button
                        key={u}
                        onClick={() => setUnit(u)}
                        className={`flex-1 px-3 py-2 rounded-lg ${unit === u ? 'bg-blue-600 text-white' : 'bg-white'}`}
                      >
                        {u}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Rastergrootte ({unit})</label>
                  <input
                    type="number"
                    value={gridSize}
                    onChange={(e) => setGridSize(parseFloat(e.target.value) || 1)}
                    className="w-full px-3 py-2 border rounded-lg"
                    step={unit === 'mm' ? 10 : unit === 'cm' ? 1 : 0.1}
                    min={unit === 'mm' ? 1 : unit === 'cm' ? 0.1 : 0.01}
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center">
                    <input type="checkbox" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} className="mr-2" />
                    <span className="text-sm">Toon raster</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" checked={snapToGrid} onChange={(e) => setSnapToGrid(e.target.checked)} className="mr-2" />
                    <span className="text-sm">Snap naar raster</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" checked={snapToPoints} onChange={(e) => setSnapToPoints(e.target.checked)} className="mr-2" />
                    <span className="text-sm">Snap naar punten</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" checked={snapToAngles} onChange={(e) => setSnapToAngles(e.target.checked)} className="mr-2" />
                    <span className="text-sm">Snap naar hoeken</span>
                  </label>
                </div>

                <div className="space-y-2 pt-4 border-t">
                  <button onClick={exportProject} className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg">
                    <Download className="w-4 h-4 inline mr-2" />
                    Exporteren
                  </button>
                  <label className="w-full px-4 py-2 bg-green-600 text-white rounded-lg cursor-pointer block text-center">
                    <Upload className="w-4 h-4 inline mr-2" />
                    Importeren
                    <input type="file" accept=".json" onChange={importProject} className="hidden" />
                  </label>
                </div>
              </div>
            </div>
          )}

          {currentMode === 'results' && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-bold mb-3">Resultaten</h3>

              <div className="space-y-3">
                <div className="bg-white rounded-lg p-3">
                  <div className="text-sm text-gray-600">Totale Oppervlakte</div>
                  <div className="text-xl font-bold text-blue-600">{formatArea(getTotalArea())}</div>
                </div>

                <div className="bg-white rounded-lg p-3">
                  <div className="text-sm text-gray-600">Totale Omtrek</div>
                  <div className="text-xl font-bold text-green-600">{formatDistance(getTotalPerimeter())}</div>
                </div>

                <div className="bg-white rounded-lg p-3">
                  <div className="text-sm text-gray-600">Punten</div>
                  <div className="text-lg font-bold">{points.length}</div>
                </div>

                <div className="bg-white rounded-lg p-3">
                  <div className="text-sm text-gray-600">Lijnen</div>
                  <div className="text-lg font-bold">{segments.length}</div>
                </div>

                <div className="bg-white rounded-lg p-3">
                  <div className="text-sm text-gray-600">Vlakken</div>
                  <div className="text-lg font-bold">{polygons.length}</div>
                </div>

                {polygons.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold mb-2">Vlakken Detail:</h4>
                    {polygons.map((poly, i) => (
                      <div key={poly.id} className="bg-blue-50 rounded p-2 mb-2">
                        <div className="text-sm">Vlak {i + 1}</div>
                        <div className="font-bold">{formatArea(calculatePolygonArea(poly.pointIds))}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
