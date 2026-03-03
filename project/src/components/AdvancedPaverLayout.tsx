import React, { useState } from 'react';
import { Plus, X, Calculator, CreditCard as Edit2, Save } from 'lucide-react';

interface Dimension {
  id: string;
  label: string;
  length: number;
  isEditing: boolean;
}

type BondPattern = 'halfsteens' | 'keperwerk' | 'elleboog';

interface TileCalculation {
  dimension: string;
  tileSize: number;
  jointWidth: number;
  totalLength: number;
  effectiveTileSize: number;
  numberOfTiles: number;
  usedLength: number;
  remainingPiece: number;
  rowWidth?: number;
}

export default function AdvancedPaverLayout() {
  const [dimensions, setDimensions] = useState<Dimension[]>([
    { id: '1', label: 'Lengte A', length: 0, isEditing: false },
  ]);
  const [tileWidth, setTileWidth] = useState(20);
  const [tileLength, setTileLength] = useState(30);
  const [jointWidth, setJointWidth] = useState(5);
  const [jointDepth, setJointDepth] = useState(30);
  const [bondPattern, setBondPattern] = useState<BondPattern>('halfsteens');
  const [showResults, setShowResults] = useState(false);
  const [calculations, setCalculations] = useState<TileCalculation[]>([]);

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

  const calculateTiles = () => {
    const results: TileCalculation[] = [];
    const validDimensions = dimensions.filter(d => d.length > 0);

    if (validDimensions.length >= 2) {
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
    }

    setCalculations(results);
    setShowResults(true);
  };

  const calculateForDirection = (totalLengthCm: number, tileSizeCm: number, jointMm: number) => {
    const jointCm = jointMm / 10;
    // Elke tegel heeft voegen aan beide kanten: voeg + tegel + voeg
    const effectiveTileSize = (2 * jointCm) + tileSizeCm;

    // Bereken hoeveel hele tegels er passen
    let numberOfTiles = Math.floor(totalLengthCm / effectiveTileSize);
    // Gebruikte lengte = aantal tegels * (voeg + tegel + voeg)
    let usedLength = numberOfTiles * effectiveTileSize;
    let remainingPiece = totalLengthCm - usedLength;

    // Als er genoeg ruimte is voor nog een tegel (inclusief voegen), voeg deze toe
    if (remainingPiece >= effectiveTileSize) {
      numberOfTiles += 1;
      usedLength = numberOfTiles * effectiveTileSize;
      remainingPiece = totalLengthCm - usedLength;
    } else if (remainingPiece > (2 * jointCm)) {
      // Er is nog een stuk over dat groter is dan alleen de voegen
      numberOfTiles += 1;
      // Het snijstuk is: overgebleven ruimte - (voeg voor + voeg na)
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

  const getTotalTilesNeeded = () => {
    const validDimensions = dimensions.filter(d => d.length > 0);
    if (validDimensions.length < 2) return 0;

    const jointCm = jointWidth / 10;
    const lengthInCm = validDimensions[0].length * 100;
    const widthInCm = validDimensions[1].length * 100;

    // Bereken lengte richting
    const lengthEffective = (2 * jointCm) + tileLength;
    let lengthTiles = Math.floor(lengthInCm / lengthEffective);
    let lengthUsed = lengthTiles * lengthEffective;
    let lengthRemaining = lengthInCm - lengthUsed;
    if (lengthRemaining >= lengthEffective) {
      lengthTiles += 1;
    } else if (lengthRemaining > (2 * jointCm)) {
      lengthTiles += 1;
    }

    // Bereken breedte richting
    const widthEffective = (2 * jointCm) + tileWidth;
    let widthTiles = Math.floor(widthInCm / widthEffective);
    let widthUsed = widthTiles * widthEffective;
    let widthRemaining = widthInCm - widthUsed;
    if (widthRemaining >= widthEffective) {
      widthTiles += 1;
    } else if (widthRemaining > (2 * jointCm)) {
      widthTiles += 1;
    }

    return lengthTiles * widthTiles;
  };

  const calculateJointSand = () => {
    const validDimensions = dimensions.filter(d => d.length > 0);
    if (validDimensions.length < 2) return { volume: 0, weight: 0 };

    const jointCm = jointWidth / 10;
    const jointDepthCm = jointDepth / 10;
    const lengthInCm = validDimensions[0].length * 100;
    const widthInCm = validDimensions[1].length * 100;

    // Bereken aantal tegels per richting
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

    // Bereken totale lengte van voegen
    // Horizontale voegen: aantal rijen voegen (widthTiles + 1) × lengte
    const horizontalJointLength = (widthTiles + 1) * lengthInCm;
    // Verticale voegen: aantal kolommen voegen (lengthTiles + 1) × breedte
    const verticalJointLength = (lengthTiles + 1) * widthInCm;

    // Bereken volume per voeg (lengte × breedte × diepte in cm³)
    const horizontalJointVolume = horizontalJointLength * jointCm * jointDepthCm;
    const verticalJointVolume = verticalJointLength * jointCm * jointDepthCm;
    const totalVolumeCm3 = horizontalJointVolume + verticalJointVolume;

    // Converteer naar liters (1 liter = 1000 cm³)
    const volumeLiters = totalVolumeCm3 / 1000;

    // Voegzand dichtheid is ongeveer 1.6 kg per liter
    const weightKg = volumeLiters * 1.6;

    return {
      volume: volumeLiters,
      weight: weightKg,
      horizontalJoints: widthTiles + 1,
      verticalJoints: lengthTiles + 1,
    };
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
        <Calculator className="mr-3 text-blue-600" />
        Geavanceerde Legverband Calculator
      </h2>

      <div className="space-y-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Klinkerformaat & Voeg</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Klinker Breedte (cm)
              </label>
              <input
                type="number"
                value={tileWidth === 0 ? '' : tileWidth}
                onChange={(e) => setTileWidth(parseFloat(e.target.value) || 0)}
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Klinker Lengte (cm)
              </label>
              <input
                type="number"
                value={tileLength === 0 ? '' : tileLength}
                onChange={(e) => setTileLength(parseFloat(e.target.value) || 0)}
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Voegbreedte (mm)
              </label>
              <input
                type="number"
                value={jointWidth === 0 ? '' : jointWidth}
                onChange={(e) => setJointWidth(parseFloat(e.target.value) || 0)}
                step="0.5"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Voegdiepte (mm)
              </label>
              <input
                type="number"
                value={jointDepth === 0 ? '' : jointDepth}
                onChange={(e) => setJointDepth(parseFloat(e.target.value) || 0)}
                step="5"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Legverband
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                onClick={() => setBondPattern('halfsteens')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  bondPattern === 'halfsteens'
                    ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold'
                    : 'border-gray-300 bg-white hover:border-blue-300'
                }`}
              >
                <div className="font-medium">Halfsteens Verband</div>
                <div className="text-xs text-gray-600 mt-1">Strek - Kop - Strek</div>
              </button>
              <button
                onClick={() => setBondPattern('keperwerk')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  bondPattern === 'keperwerk'
                    ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold'
                    : 'border-gray-300 bg-white hover:border-blue-300'
                }`}
              >
                <div className="font-medium">Keperwerk</div>
                <div className="text-xs text-gray-600 mt-1">45° diagonaal patroon</div>
              </button>
              <button
                onClick={() => setBondPattern('elleboog')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  bondPattern === 'elleboog'
                    ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold'
                    : 'border-gray-300 bg-white hover:border-blue-300'
                }`}
              >
                <div className="font-medium">Elleboogverband</div>
                <div className="text-xs text-gray-600 mt-1">L-vorm patroon</div>
              </button>
            </div>
          </div>
        </div>

        <div className="border-t pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Afmetingen Tuin/Hoeken</h3>
            <button
              onClick={addDimension}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Voeg Lengte Toe
            </button>
          </div>

          <div className="space-y-3">
            {dimensions.map((dimension, index) => (
              <div key={dimension.id} className="flex items-center gap-3 bg-gray-50 p-4 rounded-lg">
                <div className="flex-1">
                  {dimension.isEditing ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={dimension.label}
                        onChange={(e) => updateDimensionLabel(dimension.id, e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                      <span className="font-medium text-gray-700">{dimension.label}</span>
                      <button
                        onClick={() => toggleEditLabel(dimension.id)}
                        className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <span className="text-gray-600 font-medium">m</span>
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
          onClick={calculateTiles}
          disabled={dimensions.every(d => d.length === 0) || tileWidth === 0 || tileLength === 0}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
        >
          <Calculator className="mr-2" />
          Bereken Tegels
        </button>

        {showResults && calculations.length > 0 && (
          <div className="border-t pt-6 space-y-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Resultaten</h3>

            {dimensions.filter(d => d.length > 0).length >= 2 && (
              <>
                <div className="bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Totaal aantal tegels voor oppervlakte:</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {getTotalTilesNeeded()} tegels
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Berekend: {dimensions[0].label} ({dimensions[0].length}m) × {dimensions[1].label} ({dimensions[1].length}m)
                  </p>
                </div>

                <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-6 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Benodigde voegzand:</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-2xl font-bold text-orange-600">
                        {calculateJointSand().volume.toFixed(1)} liter
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Volume (≈ {(calculateJointSand().volume / 25).toFixed(1)} zakken van 25L)
                      </p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-orange-600">
                        {calculateJointSand().weight.toFixed(1)} kg
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Gewicht (bij 1.6 kg/L)
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-orange-200">
                    <p className="text-xs text-gray-500">
                      Horizontale voegen: {calculateJointSand().horizontalJoints} × {dimensions[0].length}m = {(calculateJointSand().horizontalJoints * dimensions[0].length).toFixed(2)}m
                    </p>
                    <p className="text-xs text-gray-500">
                      Verticale voegen: {calculateJointSand().verticalJoints} × {dimensions[1].length}m = {(calculateJointSand().verticalJoints * dimensions[1].length).toFixed(2)}m
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Voegbreedte: {jointWidth}mm × Diepte: {jointDepth}mm
                    </p>
                  </div>
                </div>
              </>
            )}

            <div className="space-y-4">
              {calculations.map((calc, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg border-l-4 border-blue-500">
                  <h4 className="font-semibold text-gray-800 mb-3">{calc.dimension}</h4>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Totale lengte</p>
                      <p className="font-semibold text-gray-800">{calc.totalLength.toFixed(2)} m</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Klinker + voeg</p>
                      <p className="font-semibold text-gray-800">{(calc.tileSize + (calc.jointWidth / 10)).toFixed(2).replace('.', ',')} cm</p>
                      <p className="text-xs text-gray-500">({calc.tileSize}cm + {calc.jointWidth}mm)</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Aantal klinkers</p>
                      <p className="font-bold text-blue-600 text-lg">{calc.numberOfTiles} stuks</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Breedte rij ({bondPattern})</p>
                      <p className="font-bold text-green-600 text-lg">{calc.rowWidth?.toFixed(1)} cm</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Snijstuk over</p>
                      <p className="font-bold text-orange-600 text-lg">{calc.remainingPiece.toFixed(1)} cm</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      Gebruikte lengte: {calc.usedLength.toFixed(2)} m ({(calc.usedLength / calc.totalLength * 100).toFixed(1)}%)
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-2">💡 Tips:</h4>
              <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                <li>Snijstukken kleiner dan 5cm kunnen lastig te leggen zijn</li>
                <li>Overweeg de startpositie aan te passen voor een betere verdeling</li>
                <li>Houd rekening met 5-10% extra klinkers voor breuk en reserve</li>
                <li><strong>Halfsteens:</strong> Elke rij afwisselend strek en kop (1:1 verhouding)</li>
                <li><strong>Keperwerk:</strong> Klinkers diagonaal gelegd (45° hoek)</li>
                <li><strong>Elleboog:</strong> L-vormig patroon van twee klinkers</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
