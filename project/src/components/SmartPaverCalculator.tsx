import { useState, useEffect } from 'react';
import { Calculator } from 'lucide-react';

interface PaverType {
  id: string;
  name: string;
  size: number;
  perM2: number;
}

const PAVER_TYPES: PaverType[] = [
  { id: '30x30', name: 'Tegel 30x30', size: 30, perM2: 11.11 },
  { id: '40x40', name: 'Tegel 40x40', size: 40, perM2: 6.25 },
  { id: '50x50', name: 'Tegel 50x50', size: 50, perM2: 4 },
  { id: '60x60', name: 'Tegel 60x60', size: 60, perM2: 2.78 },
  { id: 'bkk', name: 'BKK 21x10.5', size: 21, perM2: 45.35 },
  { id: 'waal', name: 'Waalformaat 20x5', size: 20, perM2: 100 },
];

type EdgeSelection = 'top' | 'right' | 'bottom' | 'left';

type BondPattern = 'stretcher' | 'herringbone' | 'basket';

interface EdgeCalculation {
  edge: EdgeSelection;
  lengthCm: number;
  wholePavers: number;
  cutPieceCm: number;
  halfPavers?: number;
  edgeType?: 'long' | 'short';
}

const BOND_PATTERNS: { id: BondPattern; name: string; wasteFactor: number }[] = [
  { id: 'stretcher', name: 'Halfsteens verband', wasteFactor: 1.03 },
  { id: 'herringbone', name: 'Visgraat/Keper', wasteFactor: 1.08 },
  { id: 'basket', name: 'Elleboogverband', wasteFactor: 1.05 },
];

export default function SmartPaverCalculator() {
  const [length, setLength] = useState<string>('');
  const [width, setWidth] = useState<string>('');
  const [selectedPaver, setSelectedPaver] = useState<PaverType>(() => {
    const saved = localStorage.getItem('lastSelectedPaver');
    if (saved) {
      const found = PAVER_TYPES.find(p => p.id === saved);
      if (found) return found;
    }
    return PAVER_TYPES[3];
  });
  const [cutWaste, setCutWaste] = useState<string>('5');
  const [selectedEdges, setSelectedEdges] = useState<Set<EdgeSelection>>(new Set());
  const [jointWidth, setJointWidth] = useState<string>('0');
  const [jointDepth, setJointDepth] = useState<string>('0');
  const [bondPattern, setBondPattern] = useState<BondPattern>('stretcher');
  const [showResults, setShowResults] = useState(false);
  const [halfPaversCount, setHalfPaversCount] = useState<string>('0');

  useEffect(() => {
    localStorage.setItem('lastSelectedPaver', selectedPaver.id);
  }, [selectedPaver]);

  const toggleEdge = (edge: EdgeSelection) => {
    const newEdges = new Set(selectedEdges);
    if (newEdges.has(edge)) {
      newEdges.delete(edge);
    } else {
      newEdges.add(edge);
    }
    setSelectedEdges(newEdges);
    setShowResults(false);
  };

  const calculateEdge = (lengthM: number, paverSizeCm: number, jointCm: number, pattern: BondPattern): { whole: number; cut: number; half: number } => {
    const totalCm = lengthM * 100;
    const effectivePaverSize = paverSizeCm + jointCm;

    let wholePavers = 0;
    let halfPavers = 0;
    let cutCm = 0;

    if (pattern === 'stretcher') {
      const halfSize = (paverSizeCm / 2) + jointCm;
      const fullSize = paverSizeCm + jointCm;

      const numHalves = Math.floor(totalCm / halfSize);
      wholePavers = Math.floor(numHalves / 2);
      halfPavers = numHalves % 2;

      const usedLength = wholePavers * fullSize + halfPavers * halfSize;
      cutCm = totalCm - usedLength;
    } else {
      wholePavers = Math.floor(totalCm / effectivePaverSize);
      cutCm = totalCm - (wholePavers * effectivePaverSize);
    }

    return { whole: wholePavers, cut: Math.round(cutCm * 10) / 10, half: halfPavers };
  };

  const calculate = () => {
    const l = parseFloat(length);
    const w = parseFloat(width);
    const waste = parseFloat(cutWaste);
    const joint = parseFloat(jointWidth);
    const jDepth = parseFloat(jointDepth);
    const halfPavers = parseFloat(halfPaversCount) || 0;

    if (!l || l <= 0 || !w || w <= 0) return null;

    const area = l * w;

    let paversPerM2: number;
    if (bondPattern === 'stretcher' || bondPattern === 'basket') {
      paversPerM2 = selectedPaver.perM2;
    } else {
      const effectivePaverSize = (selectedPaver.size + joint) / 100;
      paversPerM2 = 1 / (effectivePaverSize * effectivePaverSize);
    }

    const bondPatternData = BOND_PATTERNS.find(p => p.id === bondPattern);
    const bondWasteFactor = bondPatternData?.wasteFactor || 1;

    const baseStones = area * paversPerM2 * bondWasteFactor;
    const wasteAmount = (baseStones * waste) / 100;
    const totalStones = Math.ceil(baseStones + wasteAmount);

    const edgeCalculations: EdgeCalculation[] = [];
    const isLongSide = (length: number) => length >= Math.max(l, w);

    selectedEdges.forEach(edge => {
      if (edge === 'top' || edge === 'bottom') {
        const calc = calculateEdge(w, selectedPaver.size, joint, bondPattern);
        edgeCalculations.push({
          edge,
          lengthCm: w * 100,
          wholePavers: calc.whole,
          cutPieceCm: calc.cut,
          halfPavers: calc.half,
          edgeType: isLongSide(w) ? 'long' : 'short'
        });
      } else if (edge === 'left' || edge === 'right') {
        const calc = calculateEdge(l, selectedPaver.size, joint, bondPattern);
        edgeCalculations.push({
          edge,
          lengthCm: l * 100,
          wholePavers: calc.whole,
          cutPieceCm: calc.cut,
          halfPavers: calc.half,
          edgeType: isLongSide(l) ? 'long' : 'short'
        });
      }
    });

    const totalHalfPavers = edgeCalculations.reduce((sum, calc) => sum + calc.halfPavers, 0);
    const halfPaverLength = selectedPaver.size / 2;
    const stonesToCut = totalHalfPavers > 0 ? Math.ceil(totalHalfPavers / 2) : 0;

    let jointSandM3 = 0;
    if (joint > 0 && jDepth > 0) {
      const perimeterM = 2 * (l + w);
      const avgJointsPerMeter = 100 / (selectedPaver.size + joint);
      const totalJointLengthM = area * avgJointsPerMeter;
      jointSandM3 = (joint / 100) * (jDepth / 100) * totalJointLengthM;
    }

    return {
      length: l,
      width: w,
      area,
      baseStones: Math.ceil(baseStones),
      wasteAmount: Math.ceil(wasteAmount),
      totalStones,
      edgeCalculations,
      jointSandM3,
      paverSize: selectedPaver.size,
      jointWidth: joint,
      jointDepth: jDepth,
      bondPattern: bondPatternData?.name || 'Onbekend',
      halfPaversCount: totalHalfPavers,
      stonesToCut,
      halfPaverLength
    };
  };

  const handleCalculate = () => {
    setShowResults(true);
  };

  const results = showResults ? calculate() : null;

  const l = parseFloat(length) || 0;
  const w = parseFloat(width) || 0;
  const maxDimension = Math.max(l, w);
  const scaleFactor = maxDimension > 0 ? 280 / maxDimension : 1;
  const rectWidth = w * scaleFactor;
  const rectHeight = l * scaleFactor;

  const getEdgeName = (edge: EdgeSelection): string => {
    const names: Record<EdgeSelection, string> = {
      top: 'Boven',
      right: 'Rechts',
      bottom: 'Onder',
      left: 'Links'
    };
    return names[edge];
  };

  const isTile = selectedPaver.id.includes('x') && !selectedPaver.id.includes('bkk') && !selectedPaver.id.includes('waal');
  const productName = isTile ? 'tegels' : 'stenen';
  const productNameCapitalized = isTile ? 'Tegels' : 'Stenen';
  const productNameSingular = isTile ? 'tegel' : 'steen';
  const productNameSingularCapitalized = isTile ? 'Tegel' : 'Steen';

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Slimme Klinkerberekening</h2>

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
                  onChange={(e) => {
                    setLength(e.target.value);
                    setShowResults(false);
                  }}
                  placeholder="6.20"
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
                  onChange={(e) => {
                    setWidth(e.target.value);
                    setShowResults(false);
                  }}
                  placeholder="6.00"
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {l > 0 && w > 0 && (
            <div className="bg-blue-50 p-5 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-slate-900 mb-4">Selecteer zijdes voor zaagberekening</h3>
              <p className="text-sm text-slate-600 mb-4">Klik op de zijdes (niet op de cijfers) om te selecteren</p>

              <div className="flex justify-center items-center py-8">
                <div className="relative" style={{
                  width: Math.max(rectWidth + 100, 220),
                  height: Math.max(rectHeight + 100, 220)
                }}>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <div
                      style={{
                        width: rectWidth,
                        height: rectHeight,
                      }}
                      className="relative bg-gradient-to-br from-slate-400 to-slate-500 rounded-lg shadow-lg border-4 border-slate-600"
                    >
                      <button
                        onClick={() => toggleEdge('top')}
                        className={`absolute -top-1 left-0 right-0 h-2 transition-all cursor-pointer hover:h-3 ${
                          selectedEdges.has('top')
                            ? 'bg-orange-500 shadow-lg'
                            : 'bg-slate-600 hover:bg-orange-300'
                        }`}
                        title="Klik om bovenzijde te selecteren"
                      />

                      <button
                        onClick={() => toggleEdge('right')}
                        className={`absolute top-0 -right-1 bottom-0 w-2 transition-all cursor-pointer hover:w-3 ${
                          selectedEdges.has('right')
                            ? 'bg-orange-500 shadow-lg'
                            : 'bg-slate-600 hover:bg-orange-300'
                        }`}
                        title="Klik om rechterzijde te selecteren"
                      />

                      <button
                        onClick={() => toggleEdge('bottom')}
                        className={`absolute -bottom-1 left-0 right-0 h-2 transition-all cursor-pointer hover:h-3 ${
                          selectedEdges.has('bottom')
                            ? 'bg-orange-500 shadow-lg'
                            : 'bg-slate-600 hover:bg-orange-300'
                        }`}
                        title="Klik om onderzijde te selecteren"
                      />

                      <button
                        onClick={() => toggleEdge('left')}
                        className={`absolute top-0 -left-1 bottom-0 w-2 transition-all cursor-pointer hover:w-3 ${
                          selectedEdges.has('left')
                            ? 'bg-orange-500 shadow-lg'
                            : 'bg-slate-600 hover:bg-orange-300'
                        }`}
                        title="Klik om linkerzijde te selecteren"
                      />
                    </div>

                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-sm font-medium text-slate-600 pointer-events-none">
                      {w.toFixed(2)}m
                    </div>
                    <div className="absolute top-1/2 -right-12 -translate-y-1/2 text-sm font-medium text-slate-600 pointer-events-none">
                      {l.toFixed(2)}m
                    </div>
                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-sm font-medium text-slate-600 pointer-events-none">
                      {w.toFixed(2)}m
                    </div>
                    <div className="absolute top-1/2 -left-12 -translate-y-1/2 text-sm font-medium text-slate-600 pointer-events-none">
                      {l.toFixed(2)}m
                    </div>
                  </div>
                </div>
              </div>

              {selectedEdges.size > 0 && (
                <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-sm text-orange-800 font-medium">
                    Geselecteerde zijdes: {Array.from(selectedEdges).map(e => getEdgeName(e)).join(', ')}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="bg-slate-50 p-5 rounded-lg border border-slate-200">
            <h3 className="font-semibold text-slate-900 mb-4">Materiaal en Verband</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Materiaal soort
              </label>
              <select
                value={selectedPaver.id}
                onChange={(e) => {
                  const paver = PAVER_TYPES.find(p => p.id === e.target.value);
                  if (paver) setSelectedPaver(paver);
                  setShowResults(false);
                }}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {PAVER_TYPES.map((paver) => (
                  <option key={paver.id} value={paver.id}>
                    {paver.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Legverband
              </label>
              <select
                value={bondPattern}
                onChange={(e) => {
                  setBondPattern(e.target.value as BondPattern);
                  setShowResults(false);
                }}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {BOND_PATTERNS.map((pattern) => (
                  <option key={pattern.id} value={pattern.id}>
                    {pattern.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Voegbreedte (mm)
                  </label>
                  <input
                    type="number"
                    value={jointWidth}
                    onChange={(e) => {
                      setJointWidth(e.target.value);
                      setShowResults(false);
                    }}
                    placeholder="0"
                    step="1"
                    min="0"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Voegdiepte (mm)
                  </label>
                  <input
                    type="number"
                    value={jointDepth}
                    onChange={(e) => {
                      setJointDepth(e.target.value);
                      setShowResults(false);
                    }}
                    placeholder="0"
                    step="1"
                    min="0"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Aantal halve {productName}
                </label>
                <input
                  type="number"
                  value={halfPaversCount}
                  onChange={(e) => {
                    setHalfPaversCount(e.target.value);
                    setShowResults(false);
                  }}
                  placeholder="0"
                  step="1"
                  min="0"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-5 rounded-lg border border-slate-200">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Snijverlies (%)
            </label>
            <input
              type="number"
              value={cutWaste}
              onChange={(e) => {
                setCutWaste(e.target.value);
                setShowResults(false);
              }}
              placeholder="5"
              step="1"
              min="0"
              max="100"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <button
            onClick={handleCalculate}
            disabled={!length || !width || parseFloat(length) <= 0 || parseFloat(width) <= 0}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <Calculator className="mr-2" />
            Bereken
          </button>

          {results && (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-lg border border-slate-300">
                <h3 className="font-semibold text-slate-900 mb-3">Oppervlakte</h3>
                <div className="flex justify-between items-baseline">
                  <span className="text-slate-700">{results.length}m × {results.width}m</span>
                  <span className="font-bold text-slate-900 text-2xl">{results.area.toFixed(2)} m²</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-slate-900 mb-4">
                  Totaal Benodigde {productNameCapitalized}
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-700">Legverband:</span>
                    <span className="font-bold text-blue-600">{results.bondPattern}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-700">Basis aantal:</span>
                    <span className="font-bold text-blue-600">{results.baseStones} stuks</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-700">Snijverlies ({cutWaste}%):</span>
                    <span className="font-bold text-slate-600">{results.wasteAmount} stuks</span>
                  </div>
                  <div className="flex justify-between pt-3 border-t border-blue-300">
                    <span className="text-slate-900 font-semibold">Totaal:</span>
                    <span className="font-bold text-blue-700 text-xl">{results.totalStones} stuks</span>
                  </div>
                </div>
              </div>

              {(results.edgeCalculations.length > 0 || results.halfPaversCount > 0) && (
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-lg border border-orange-200">
                  <h3 className="font-semibold text-slate-900 mb-4">Zaagberekening per geselecteerde kant</h3>
                  <div className="space-y-4">
                    {results.edgeCalculations.map((edge, idx) => (
                      <div key={idx} className="bg-white p-4 rounded-lg border border-orange-200">
                        <div className="font-semibold text-orange-900 mb-3">
                          {getEdgeName(edge.edge)} - {edge.edgeType === 'long' ? 'Lange' : 'Korte'} zijde ({edge.lengthCm.toFixed(1)} cm)
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-600">Hele {productName}:</span>
                            <span className="font-bold text-orange-700">{edge.wholePavers} stuks</span>
                          </div>
                          {edge.halfPavers !== undefined && edge.halfPavers > 0 && bondPattern === 'stretcher' && (
                            <>
                              <div className="flex justify-between">
                                <span className="text-slate-600">Halve {productName} nodig:</span>
                                <span className="font-bold text-orange-700">{edge.halfPavers} stuks</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-600">Te zagen (halve lengte {results.halfPaverLength.toFixed(1)} cm):</span>
                                <span className="font-bold text-orange-700">{Math.ceil(edge.halfPavers / 2)} hele {productName}</span>
                              </div>
                            </>
                          )}
                          <div className="flex justify-between">
                            <span className="text-slate-600">Zaagstuk:</span>
                            <span className="font-bold text-orange-700">
                              {edge.cutPieceCm > 0 ? `${edge.cutPieceCm.toFixed(1)} cm` : 'Geen'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {results.jointSandM3 > 0 && (
                <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-6 rounded-lg border border-amber-200">
                  <h3 className="font-semibold text-slate-900 mb-3">Voegzand</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-700">Voegbreedte:</span>
                      <span className="font-bold text-amber-700">{results.jointWidth} mm</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-700">Voegdiepte:</span>
                      <span className="font-bold text-amber-700">{results.jointDepth} mm</span>
                    </div>
                    <div className="flex justify-between pt-3 border-t border-amber-300">
                      <span className="text-slate-900 font-semibold">Benodigd volume:</span>
                      <span className="font-bold text-amber-700 text-xl">{results.jointSandM3.toFixed(3)} m³</span>
                    </div>
                    <div className="text-sm text-amber-800 mt-2">
                      Circa {(results.jointSandM3 * 1600).toFixed(0)} kg (bij 1600 kg/m³)
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
