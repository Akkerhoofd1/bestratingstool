import { useState } from 'react';
import { Square, Grid3x3, Ruler, Calculator, Plus, X, CreditCard as Edit2, Save } from 'lucide-react';

type CalculatorMode = 'simple' | 'bond' | 'advanced';
type BondPattern = 'halfsteens' | 'keperwerk' | 'elleboog';

interface PaverType {
  id: string;
  name: string;
  width: number;
  length: number;
  height: number;
  perM2?: number;
  useTileSize?: boolean;
}

interface Dimension {
  id: string;
  label: string;
  length: number;
  isEditing: boolean;
}

const PAVER_TYPES: PaverType[] = [
  { id: 'bkk', name: 'BKK Betonklinker', width: 10.5, length: 21, height: 8, perM2: 45.35 },
  { id: 'waal', name: 'Waalformaat', width: 5, length: 20, height: 8, perM2: 100 },
  { id: 'zevenduimer', name: 'Zevenduimer', width: 7, length: 21, height: 8, perM2: 68 },
  { id: 'dikformaat', name: 'Dikformaat', width: 7, length: 21, height: 8, perM2: 68 },
  { id: 'tegel30', name: 'Tegel 30x30', width: 30, length: 30, height: 3, useTileSize: true },
  { id: 'tegel60', name: 'Tegel 60x60', width: 60, length: 60, height: 3, useTileSize: true },
  { id: 'custom', name: 'Aangepast formaat', width: 0, length: 0, height: 0 },
];

export default function UnifiedPaverCalculator() {
  const [mode, setMode] = useState<CalculatorMode>('simple');

  const [length, setLength] = useState<string>('');
  const [width, setWidth] = useState<string>('');
  const [selectedPaver, setSelectedPaver] = useState<PaverType>(PAVER_TYPES[0]);
  const [customWidth, setCustomWidth] = useState<string>('');
  const [customLength, setCustomLength] = useState<string>('');
  const [customHeight, setCustomHeight] = useState<string>('');
  const [wastePercentage, setWastePercentage] = useState<string>('5');
  const [bondPattern2, setBondPattern2] = useState<BondPattern>('halfsteens');

  const [dimensions, setDimensions] = useState<Dimension[]>([
    { id: '1', label: 'Lengte A', length: 0, isEditing: false },
  ]);
  const [tileWidth, setTileWidth] = useState(20);
  const [tileLength, setTileLength] = useState(30);
  const [jointWidth, setJointWidth] = useState(5);
  const [jointDepth, setJointDepth] = useState(30);
  const [bondPattern, setBondPattern] = useState<BondPattern>('halfsteens');
  const [showResults, setShowResults] = useState(false);

  const calculateSimple = () => {
    const l = parseFloat(length);
    const w = parseFloat(width);
    const waste = parseFloat(wastePercentage);

    if (!l || l <= 0 || !w || w <= 0) return null;

    const area = l * w;
    let paversNeeded: number;

    if (selectedPaver.id === 'custom') {
      const cw = parseFloat(customWidth);
      const cl = parseFloat(customLength);
      const ch = parseFloat(customHeight);
      if (!cw || !cl || !ch || cw <= 0 || cl <= 0 || ch <= 0) return null;
      const paverAreaM2 = (cw / 100) * (cl / 100);
      paversNeeded = area / paverAreaM2;
    } else if (selectedPaver.useTileSize) {
      const paverAreaM2 = (selectedPaver.width / 100) * (selectedPaver.length / 100);
      paversNeeded = area / paverAreaM2;
    } else if (selectedPaver.perM2) {
      paversNeeded = area * selectedPaver.perM2;
    } else {
      return null;
    }

    const wasteAmount = (paversNeeded * waste) / 100;
    const totalPavers = Math.ceil(paversNeeded + wasteAmount);

    return {
      length: l,
      width: w,
      area,
      paversNeeded: Math.ceil(paversNeeded),
      wasteAmount: Math.ceil(wasteAmount),
      totalPavers,
    };
  };

  const calculateWithBond = () => {
    const l = parseFloat(length);
    const w = parseFloat(width);
    const waste = parseFloat(wastePercentage);

    if (!l || l <= 0 || !w || w <= 0) return null;

    const area = l * w;
    let paversNeeded: number;
    let bondWaste = 0;

    if (selectedPaver.id === 'custom') {
      const cw = parseFloat(customWidth);
      const cl = parseFloat(customLength);
      const ch = parseFloat(customHeight);
      if (!cw || !cl || !ch || cw <= 0 || cl <= 0 || ch <= 0) return null;
      const paverAreaM2 = (cw / 100) * (cl / 100);
      paversNeeded = area / paverAreaM2;
    } else if (selectedPaver.useTileSize) {
      const paverAreaM2 = (selectedPaver.width / 100) * (selectedPaver.length / 100);
      paversNeeded = area / paverAreaM2;
    } else if (selectedPaver.perM2) {
      paversNeeded = area * selectedPaver.perM2;
    } else {
      return null;
    }

    switch (bondPattern2) {
      case 'halfsteens':
        bondWaste = 3;
        break;
      case 'keperwerk':
        bondWaste = 10;
        break;
      case 'elleboog':
        bondWaste = 5;
        break;
    }

    const bondWasteAmount = (paversNeeded * bondWaste) / 100;
    const wasteAmount = (paversNeeded * waste) / 100;
    const totalPavers = Math.ceil(paversNeeded + bondWasteAmount + wasteAmount);

    return {
      length: l,
      width: w,
      area,
      paversNeeded: Math.ceil(paversNeeded),
      bondWaste: bondWasteAmount,
      bondWastePercentage: bondWaste,
      wasteAmount: Math.ceil(wasteAmount),
      totalPavers,
    };
  };

  const addDimension = () => {
    const nextLetter = String.fromCharCode(65 + dimensions.length);
    const newDimension: Dimension = {
      id: Date.now().toString(),
      label: `Lengte ${nextLetter}`,
      length: 0,
      isEditing: false,
    };
    setDimensions([...dimensions, newDimension]);
  };

  const removeDimension = (id: string) => {
    if (dimensions.length > 1) {
      setDimensions(dimensions.filter(d => d.id !== id));
    }
  };

  const updateDimensionLength = (id: string, length: number) => {
    setDimensions(dimensions.map(d =>
      d.id === id ? { ...d, length } : d
    ));
  };

  const updateDimensionLabel = (id: string, label: string) => {
    setDimensions(dimensions.map(d =>
      d.id === id ? { ...d, label } : d
    ));
  };

  const toggleEditLabel = (id: string) => {
    setDimensions(dimensions.map(d =>
      d.id === id ? { ...d, isEditing: !d.isEditing } : d
    ));
  };

  const calculateForDirection = (totalLengthCm: number, tileSizeCm: number, jointMm: number) => {
    const jointCm = jointMm / 10;
    const effectiveTileSize = (2 * jointCm) + tileSizeCm;

    let numberOfTiles = Math.floor(totalLengthCm / effectiveTileSize);
    let usedLength = numberOfTiles * effectiveTileSize;
    let remainingPiece = totalLengthCm - usedLength;

    if (remainingPiece >= effectiveTileSize) {
      numberOfTiles += 1;
      usedLength = numberOfTiles * effectiveTileSize;
      remainingPiece = totalLengthCm - usedLength;
    } else if (remainingPiece > (2 * jointCm)) {
      numberOfTiles += 1;
      remainingPiece = remainingPiece - (2 * jointCm);
      usedLength = totalLengthCm - remainingPiece;
    }

    return {
      effectiveTileSize,
      numberOfTiles,
      usedLength: usedLength / 100,
      remainingPiece: remainingPiece,
    };
  };

  const calculateRowWidth = (bondPattern: BondPattern, tileWidth: number, tileLength: number, numberOfTiles: number, jointWidth: number): number => {
    const jointCm = jointWidth / 10;

    switch (bondPattern) {
      case 'halfsteens':
        return (numberOfTiles * tileWidth) + ((numberOfTiles + 1) * jointCm);
      case 'keperwerk':
        const diagonalLength = Math.sqrt(Math.pow(tileWidth, 2) + Math.pow(tileLength, 2));
        return (numberOfTiles * diagonalLength) + ((numberOfTiles + 1) * jointCm);
      case 'elleboog':
        const rowsNeeded = Math.ceil(numberOfTiles / 2);
        return (rowsNeeded * (tileWidth + tileLength)) + ((rowsNeeded + 1) * jointCm);
      default:
        return (numberOfTiles * tileWidth) + ((numberOfTiles + 1) * jointCm);
    }
  };

  const getTotalTilesNeeded = () => {
    const validDimensions = dimensions.filter(d => d.length > 0);
    if (validDimensions.length < 2) return 0;

    const jointCm = jointWidth / 10;
    const lengthInCm = validDimensions[0].length * 100;
    const widthInCm = validDimensions[1].length * 100;

    const lengthEffective = (2 * jointCm) + tileLength;
    let lengthTiles = Math.floor(lengthInCm / lengthEffective);
    let lengthRemaining = lengthInCm - lengthTiles * lengthEffective;
    if (lengthRemaining >= lengthEffective) {
      lengthTiles += 1;
    } else if (lengthRemaining > (2 * jointCm)) {
      lengthTiles += 1;
    }

    const widthEffective = (2 * jointCm) + tileWidth;
    let widthTiles = Math.floor(widthInCm / widthEffective);
    let widthRemaining = widthInCm - widthTiles * widthEffective;
    if (widthRemaining >= widthEffective) {
      widthTiles += 1;
    } else if (widthRemaining > (2 * jointCm)) {
      widthTiles += 1;
    }

    return lengthTiles * widthTiles;
  };

  const calculateJointSand = () => {
    const validDimensions = dimensions.filter(d => d.length > 0);
    if (validDimensions.length < 2) return { volume: 0, weight: 0, horizontalJoints: 0, verticalJoints: 0 };

    const jointCm = jointWidth / 10;
    const jointDepthCm = jointDepth / 10;
    const lengthInCm = validDimensions[0].length * 100;
    const widthInCm = validDimensions[1].length * 100;

    const lengthEffective = (2 * jointCm) + tileLength;
    let lengthTiles = Math.floor(lengthInCm / lengthEffective);
    if ((lengthInCm - lengthTiles * lengthEffective) > (2 * jointCm)) {
      lengthTiles += 1;
    }

    const widthEffective = (2 * jointCm) + tileWidth;
    let widthTiles = Math.floor(widthInCm / widthEffective);
    if ((widthInCm - widthTiles * widthEffective) > (2 * jointCm)) {
      widthTiles += 1;
    }

    const horizontalJointLength = (widthTiles + 1) * lengthInCm;
    const verticalJointLength = (lengthTiles + 1) * widthInCm;

    const horizontalJointVolume = horizontalJointLength * jointCm * jointDepthCm;
    const verticalJointVolume = verticalJointLength * jointCm * jointDepthCm;
    const totalVolumeCm3 = horizontalJointVolume + verticalJointVolume;

    const volumeLiters = totalVolumeCm3 / 1000;
    const weightKg = volumeLiters * 1.6;

    return {
      volume: volumeLiters,
      weight: weightKg,
      horizontalJoints: widthTiles + 1,
      verticalJoints: lengthTiles + 1,
    };
  };

  const calculateAdvanced = () => {
    const validDimensions = dimensions.filter(d => d.length > 0);
    if (validDimensions.length < 2) return [];

    const results = [];

    const lengthInCm = validDimensions[0].length * 100;
    const calcLength = calculateForDirection(lengthInCm, tileLength, jointWidth);
    const rowWidth = calculateRowWidth(bondPattern, tileWidth, tileLength, calcLength.numberOfTiles, jointWidth);

    results.push({
      dimension: validDimensions[0].label,
      tileSize: tileLength,
      jointWidth: jointWidth,
      totalLength: validDimensions[0].length,
      effectiveTileSize: calcLength.effectiveTileSize,
      numberOfTiles: calcLength.numberOfTiles,
      usedLength: calcLength.usedLength,
      remainingPiece: calcLength.remainingPiece,
      rowWidth: rowWidth,
    });

    const widthInCm = validDimensions[1].length * 100;
    const calcWidth = calculateForDirection(widthInCm, tileWidth, jointWidth);
    const widthRowWidth = calculateRowWidth(bondPattern, tileWidth, tileLength, calcWidth.numberOfTiles, jointWidth);

    results.push({
      dimension: validDimensions[1].label,
      tileSize: tileWidth,
      jointWidth: jointWidth,
      totalLength: validDimensions[1].length,
      effectiveTileSize: calcWidth.effectiveTileSize,
      numberOfTiles: calcWidth.numberOfTiles,
      usedLength: calcWidth.usedLength,
      remainingPiece: calcWidth.remainingPiece,
      rowWidth: widthRowWidth,
    });

    return results;
  };

  const handleCalculate = () => {
    setShowResults(true);
  };

  const simpleResults = mode === 'simple' ? calculateSimple() : null;
  const bondResults = mode === 'bond' ? calculateWithBond() : null;
  const advancedResults = mode === 'advanced' ? calculateAdvanced() : [];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Klinkerberekening</h2>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setMode('simple')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
              mode === 'simple'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Square className="w-5 h-5" />
            Simpel
          </button>
          <button
            onClick={() => setMode('bond')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
              mode === 'bond'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Grid3x3 className="w-5 h-5" />
            Legverband
          </button>
          <button
            onClick={() => setMode('advanced')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
              mode === 'advanced'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Ruler className="w-5 h-5" />
            Geavanceerd
          </button>
        </div>

        {mode === 'simple' && (
          <div className="space-y-6">
            <div className="bg-slate-50 p-5 rounded-lg border border-slate-200">
              <h3 className="font-semibold text-slate-900 mb-4">Afmetingen</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Lengte (meters)
                  </label>
                  <input
                    type="number"
                    value={length}
                    onChange={(e) => setLength(e.target.value)}
                    placeholder="0"
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Breedte (meters)
                  </label>
                  <input
                    type="number"
                    value={width}
                    onChange={(e) => setWidth(e.target.value)}
                    placeholder="0"
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-5 rounded-lg border border-slate-200">
              <h3 className="font-semibold text-slate-900 mb-4">Klinker Type</h3>
              <select
                value={selectedPaver.id}
                onChange={(e) => {
                  const paver = PAVER_TYPES.find(p => p.id === e.target.value);
                  if (paver) setSelectedPaver(paver);
                }}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
              >
                {PAVER_TYPES.map((paver) => (
                  <option key={paver.id} value={paver.id}>
                    {paver.name} {paver.id !== 'custom' ? `(${paver.width}x${paver.length}x${paver.height}cm)` : ''}
                  </option>
                ))}
              </select>

              {selectedPaver.id === 'custom' && (
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Breedte (cm)</label>
                    <input
                      type="number"
                      value={customWidth}
                      onChange={(e) => setCustomWidth(e.target.value)}
                      placeholder="0"
                      step="0.1"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Lengte (cm)</label>
                    <input
                      type="number"
                      value={customLength}
                      onChange={(e) => setCustomLength(e.target.value)}
                      placeholder="0"
                      step="0.1"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Hoogte (cm)</label>
                    <input
                      type="number"
                      value={customHeight}
                      onChange={(e) => setCustomHeight(e.target.value)}
                      placeholder="0"
                      step="0.1"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}

              <div className="mt-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Verspilling (%)
                </label>
                <input
                  type="number"
                  value={wastePercentage}
                  onChange={(e) => setWastePercentage(e.target.value)}
                  placeholder="5"
                  step="1"
                  min="0"
                  max="100"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {simpleResults && (
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-lg border border-slate-300">
                  <h3 className="font-semibold text-slate-900 mb-3">Oppervlakte</h3>
                  <div className="flex justify-between items-baseline">
                    <span className="text-slate-700">{simpleResults.length}m × {simpleResults.width}m</span>
                    <span className="font-bold text-slate-900 text-2xl">{simpleResults.area.toFixed(2)} m²</span>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-slate-900 mb-4">Klinkers Benodigdheden</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-700">Benodigde klinkers:</span>
                      <span className="font-bold text-blue-600">{simpleResults.paversNeeded} stuks</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-700">Verspilling ({wastePercentage}%):</span>
                      <span className="font-bold text-slate-600">{simpleResults.wasteAmount} stuks</span>
                    </div>
                    <div className="flex justify-between pt-3 border-t border-blue-300">
                      <span className="text-slate-900 font-semibold">Totaal:</span>
                      <span className="font-bold text-blue-700 text-xl">{simpleResults.totalPavers} stuks</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {mode === 'bond' && (
          <div className="space-y-6">
            <div className="bg-slate-50 p-5 rounded-lg border border-slate-200">
              <h3 className="font-semibold text-slate-900 mb-4">Afmetingen</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Lengte (meters)
                  </label>
                  <input
                    type="number"
                    value={length}
                    onChange={(e) => setLength(e.target.value)}
                    placeholder="0"
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Breedte (meters)
                  </label>
                  <input
                    type="number"
                    value={width}
                    onChange={(e) => setWidth(e.target.value)}
                    placeholder="0"
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-5 rounded-lg border border-slate-200">
              <h3 className="font-semibold text-slate-900 mb-4">Klinker Type</h3>
              <select
                value={selectedPaver.id}
                onChange={(e) => {
                  const paver = PAVER_TYPES.find(p => p.id === e.target.value);
                  if (paver) setSelectedPaver(paver);
                }}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
              >
                {PAVER_TYPES.map((paver) => (
                  <option key={paver.id} value={paver.id}>
                    {paver.name} {paver.id !== 'custom' ? `(${paver.width}x${paver.length}x${paver.height}cm)` : ''}
                  </option>
                ))}
              </select>

              {selectedPaver.id === 'custom' && (
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Breedte (cm)</label>
                    <input
                      type="number"
                      value={customWidth}
                      onChange={(e) => setCustomWidth(e.target.value)}
                      placeholder="0"
                      step="0.1"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Lengte (cm)</label>
                    <input
                      type="number"
                      value={customLength}
                      onChange={(e) => setCustomLength(e.target.value)}
                      placeholder="0"
                      step="0.1"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Hoogte (cm)</label>
                    <input
                      type="number"
                      value={customHeight}
                      onChange={(e) => setCustomHeight(e.target.value)}
                      placeholder="0"
                      step="0.1"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="bg-blue-50 p-5 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-slate-900 mb-4">Legverband</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                  onClick={() => setBondPattern2('halfsteens')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    bondPattern2 === 'halfsteens'
                      ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold'
                      : 'border-slate-300 bg-white hover:border-blue-300'
                  }`}
                >
                  <div className="font-medium">Halfsteens</div>
                  <div className="text-xs text-slate-600 mt-1">Strek - Kop - Strek</div>
                </button>
                <button
                  onClick={() => setBondPattern2('keperwerk')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    bondPattern2 === 'keperwerk'
                      ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold'
                      : 'border-slate-300 bg-white hover:border-blue-300'
                  }`}
                >
                  <div className="font-medium">Keperwerk</div>
                  <div className="text-xs text-slate-600 mt-1">45° diagonaal</div>
                </button>
                <button
                  onClick={() => setBondPattern2('elleboog')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    bondPattern2 === 'elleboog'
                      ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold'
                      : 'border-slate-300 bg-white hover:border-blue-300'
                  }`}
                >
                  <div className="font-medium">Elleboogverband</div>
                  <div className="text-xs text-slate-600 mt-1">L-vorm patroon</div>
                </button>
              </div>
            </div>

            <div className="bg-slate-50 p-5 rounded-lg border border-slate-200">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Verspilling (%)
              </label>
              <input
                type="number"
                value={wastePercentage}
                onChange={(e) => setWastePercentage(e.target.value)}
                placeholder="5"
                step="1"
                min="0"
                max="100"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {bondResults && (
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-lg border border-slate-300">
                  <h3 className="font-semibold text-slate-900 mb-3">Oppervlakte</h3>
                  <div className="flex justify-between items-baseline">
                    <span className="text-slate-700">{bondResults.length}m × {bondResults.width}m</span>
                    <span className="font-bold text-slate-900 text-2xl">{bondResults.area.toFixed(2)} m²</span>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-slate-900 mb-4">Klinkers Benodigdheden ({bondPattern2})</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-700">Benodigde klinkers:</span>
                      <span className="font-bold text-blue-600">{bondResults.paversNeeded} stuks</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-700">Snijverlies legverband ({bondResults.bondWastePercentage}%):</span>
                      <span className="font-bold text-orange-600">{Math.ceil(bondResults.bondWaste)} stuks</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-700">Extra verspilling ({wastePercentage}%):</span>
                      <span className="font-bold text-slate-600">{bondResults.wasteAmount} stuks</span>
                    </div>
                    <div className="flex justify-between pt-3 border-t border-blue-300">
                      <span className="text-slate-900 font-semibold">Totaal:</span>
                      <span className="font-bold text-blue-700 text-xl">{bondResults.totalPavers} stuks</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {mode === 'advanced' && (
          <div className="space-y-6">
            <div className="bg-blue-50 p-5 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-slate-900 mb-4">Klinkerformaat & Voeg</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Klinker Breedte (cm)
                  </label>
                  <input
                    type="number"
                    value={tileWidth === 0 ? '' : tileWidth}
                    onChange={(e) => setTileWidth(parseFloat(e.target.value) || 0)}
                    step="0.1"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Klinker Lengte (cm)
                  </label>
                  <input
                    type="number"
                    value={tileLength === 0 ? '' : tileLength}
                    onChange={(e) => setTileLength(parseFloat(e.target.value) || 0)}
                    step="0.1"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Voegbreedte (mm)
                  </label>
                  <input
                    type="number"
                    value={jointWidth === 0 ? '' : jointWidth}
                    onChange={(e) => setJointWidth(parseFloat(e.target.value) || 0)}
                    step="0.5"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Voegdiepte (mm)
                  </label>
                  <input
                    type="number"
                    value={jointDepth === 0 ? '' : jointDepth}
                    onChange={(e) => setJointDepth(parseFloat(e.target.value) || 0)}
                    step="5"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Legverband
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button
                    onClick={() => setBondPattern('halfsteens')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      bondPattern === 'halfsteens'
                        ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold'
                        : 'border-slate-300 bg-white hover:border-blue-300'
                    }`}
                  >
                    <div className="font-medium">Halfsteens Verband</div>
                    <div className="text-xs text-slate-600 mt-1">Strek - Kop - Strek</div>
                  </button>
                  <button
                    onClick={() => setBondPattern('keperwerk')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      bondPattern === 'keperwerk'
                        ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold'
                        : 'border-slate-300 bg-white hover:border-blue-300'
                    }`}
                  >
                    <div className="font-medium">Keperwerk</div>
                    <div className="text-xs text-slate-600 mt-1">45° diagonaal</div>
                  </button>
                  <button
                    onClick={() => setBondPattern('elleboog')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      bondPattern === 'elleboog'
                        ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold'
                        : 'border-slate-300 bg-white hover:border-blue-300'
                    }`}
                  >
                    <div className="font-medium">Elleboogverband</div>
                    <div className="text-xs text-slate-600 mt-1">L-vorm patroon</div>
                  </button>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">Afmetingen</h3>
                <button
                  onClick={addDimension}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Voeg Lengte Toe
                </button>
              </div>

              <div className="space-y-3">
                {dimensions.map((dimension) => (
                  <div key={dimension.id} className="flex items-center gap-3 bg-slate-50 p-4 rounded-lg">
                    <div className="flex-1">
                      {dimension.isEditing ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={dimension.label}
                            onChange={(e) => updateDimensionLabel(dimension.id, e.target.value)}
                            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            onBlur={() => toggleEditLabel(dimension.id)}
                            autoFocus
                          />
                          <button
                            onClick={() => toggleEditLabel(dimension.id)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-700">{dimension.label}</span>
                          <button
                            onClick={() => toggleEditLabel(dimension.id)}
                            className="p-1 text-slate-500 hover:text-blue-600 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <input
                        type="number"
                        value={dimension.length === 0 ? '' : dimension.length}
                        onChange={(e) => updateDimensionLength(dimension.id, parseFloat(e.target.value) || 0)}
                        step="0.01"
                        placeholder="Lengte in meters"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <span className="text-slate-600 font-medium">m</span>
                    {dimensions.length > 1 && (
                      <button
                        onClick={() => removeDimension(dimension.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleCalculate}
              disabled={dimensions.every(d => d.length === 0) || tileWidth === 0 || tileLength === 0}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <Calculator className="mr-2" />
              Bereken
            </button>

            {showResults && advancedResults.length > 0 && dimensions.filter(d => d.length > 0).length >= 2 && (
              <div className="space-y-6 pt-6 border-t border-slate-200">
                <h3 className="text-xl font-bold text-slate-900">Resultaten</h3>

                <div className="bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-lg border border-blue-200">
                  <p className="text-sm text-slate-600 mb-2">Totaal aantal klinkers:</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {getTotalTilesNeeded()} stuks
                  </p>
                  <p className="text-xs text-slate-500 mt-2">
                    {dimensions[0].label} ({dimensions[0].length}m) × {dimensions[1].label} ({dimensions[1].length}m)
                  </p>
                </div>

                <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-6 rounded-lg border border-orange-200">
                  <p className="text-sm text-slate-600 mb-2">Benodigde voegzand:</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-2xl font-bold text-orange-600">
                        {calculateJointSand().volume.toFixed(1)} liter
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        ≈ {(calculateJointSand().volume / 25).toFixed(1)} zakken van 25L
                      </p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-orange-600">
                        {calculateJointSand().weight.toFixed(1)} kg
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Gewicht (bij 1.6 kg/L)
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {advancedResults.map((calc, index) => (
                    <div key={index} className="bg-slate-50 p-4 rounded-lg border-l-4 border-blue-500">
                      <h4 className="font-semibold text-slate-800 mb-3">{calc.dimension}</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-slate-600">Totale lengte</p>
                          <p className="font-semibold text-slate-900">{calc.totalLength.toFixed(2)} m</p>
                        </div>
                        <div>
                          <p className="text-slate-600">Aantal klinkers</p>
                          <p className="font-bold text-blue-600 text-lg">{calc.numberOfTiles} stuks</p>
                        </div>
                        <div>
                          <p className="text-slate-600">Breedte rij</p>
                          <p className="font-bold text-green-600 text-lg">{calc.rowWidth?.toFixed(1)} cm</p>
                        </div>
                        <div>
                          <p className="text-slate-600">Snijstuk over</p>
                          <p className="font-bold text-orange-600 text-lg">{calc.remainingPiece.toFixed(1)} cm</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
