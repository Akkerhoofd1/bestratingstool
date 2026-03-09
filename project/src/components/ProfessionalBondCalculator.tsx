import { useState, useEffect } from 'react';
import { Calculator, Grid3x3 } from 'lucide-react';

interface PaverSize {
  id: string;
  name: string;
  length: number;
  width: number;
  thickness?: string;
  weight_per_stone?: number;
}

type BondPattern = 'elleboog' | 'halfsteens' | 'blokverband' | 'keperwerk';

interface SelectedEdges {
  top: boolean;
  right: boolean;
  bottom: boolean;
  left: boolean;
}

export default function ProfessionalBondCalculator() {
  const [paverSizes, setPaverSizes] = useState<PaverSize[]>([]);
  const [selectedPaver, setSelectedPaver] = useState<PaverSize | null>(null);
  const [customLength, setCustomLength] = useState<string>('');
  const [customWidth, setCustomWidth] = useState<string>('');
  const [customThickness, setCustomThickness] = useState<string>('6');
  const [surfaceLength, setSurfaceLength] = useState<string>('');
  const [surfaceWidth, setSurfaceWidth] = useState<string>('');
  const [bondPattern, setBondPattern] = useState<BondPattern>('elleboog');
  const [showResults, setShowResults] = useState(false);
  const [useCustom, setUseCustom] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wastePercentage, setWastePercentage] = useState<string>('0');
  const [machineLayout, setMachineLayout] = useState(false);
  const [showWeight, setShowWeight] = useState(false);
  const [selectedEdges, setSelectedEdges] = useState<SelectedEdges>({
    top: true,
    right: true,
    bottom: true,
    left: true,
  });

  useEffect(() => {
    loadPaverSizes();
    loadSavedSettings();
  }, []);

  useEffect(() => {
    saveSettings();
  }, [selectedPaver, useCustom, customLength, customWidth, bondPattern, wastePercentage, machineLayout, showWeight, selectedEdges]);

  const loadSavedSettings = () => {
    try {
      const saved = localStorage.getItem('paverCalculatorSettings');
      if (saved) {
        const settings = JSON.parse(saved);
        if (settings.selectedPaverId) {
          const paver = paverSizes.find(p => p.id === settings.selectedPaverId);
          if (paver) setSelectedPaver(paver);
        }
        if (settings.useCustom !== undefined) setUseCustom(settings.useCustom);
        if (settings.customLength) setCustomLength(settings.customLength);
        if (settings.customWidth) setCustomWidth(settings.customWidth);
        if (settings.bondPattern) setBondPattern(settings.bondPattern);
        if (settings.wastePercentage) setWastePercentage(settings.wastePercentage);
        if (settings.machineLayout !== undefined) setMachineLayout(settings.machineLayout);
        if (settings.showWeight !== undefined) setShowWeight(settings.showWeight);
        if (settings.selectedEdges) setSelectedEdges(settings.selectedEdges);
      }
    } catch (err) {
      console.error('Error loading saved settings:', err);
    }
  };

  const saveSettings = () => {
    try {
      const settings = {
        selectedPaverId: selectedPaver?.id,
        useCustom,
        customLength,
        customWidth,
        bondPattern,
        wastePercentage,
        machineLayout,
        showWeight,
        selectedEdges,
      };
      localStorage.setItem('paverCalculatorSettings', JSON.stringify(settings));
    } catch (err) {
      console.error('Error saving settings:', err);
    }
  };

  const loadPaverSizes = async () => {
    try {
      setLoading(true);
      setError(null);
      const { createClient } = await import('../lib/supabase');
      const supabase = createClient();
      const { data, error } = await supabase
        .from('paver_sizes')
        .select('*')
        .eq('is_standard', true)
        .order('name');

      if (error) throw error;

      const mapped: PaverSize[] = (data || []).map((row: any) => ({
        id: row.id,
        name: row.name,
        length: parseFloat(row.length),
        width: parseFloat(row.width),
        thickness: row.thickness,
        weight_per_stone: row.weight_per_stone ? parseFloat(row.weight_per_stone) : undefined,
      }));

      setPaverSizes(mapped);

      const saved = localStorage.getItem('paverCalculatorSettings');
      if (saved) {
        try {
          const settings = JSON.parse(saved);
          if (settings.selectedPaverId) {
            const paver = mapped.find(p => p.id === settings.selectedPaverId);
            if (paver) {
              setSelectedPaver(paver);
            } else if (mapped.length > 0) {
              setSelectedPaver(mapped[0]);
            }
          } else if (mapped.length > 0) {
            setSelectedPaver(mapped[0]);
          }
        } catch (err) {
          console.error('Error parsing saved settings:', err);
          if (mapped.length > 0) {
            setSelectedPaver(mapped[0]);
          }
        }
      } else if (mapped.length > 0) {
        setSelectedPaver(mapped[0]);
      }

      setLoading(false);
    } catch (err) {
      console.error('Error loading paver sizes:', err);
      setError('Kon steenformaten niet laden uit database');
      setLoading(false);
    }
  };

  const getProductType = (): 'steen' | 'tegel' => {
    if (useCustom) {
      const thickness = parseFloat(customThickness);
      return thickness >= 6 ? 'steen' : 'tegel';
    } else {
      const thickness = selectedPaver?.thickness ? parseFloat(selectedPaver.thickness) : 6;
      return thickness >= 6 ? 'steen' : 'tegel';
    }
  };

  const calculateResults = () => {
    const L = parseFloat(surfaceLength);
    const W = parseFloat(surfaceWidth);

    let stoneL: number;
    let stoneW: number;

    if (useCustom) {
      stoneL = parseFloat(customLength);
      stoneW = parseFloat(customWidth);
      if (!stoneL || !stoneW || stoneL <= 0 || stoneW <= 0) return null;
    } else {
      if (!selectedPaver) return null;
      stoneL = selectedPaver.length;
      stoneW = selectedPaver.width;
    }

    if (!L || !W || L <= 0 || W <= 0) return null;

    const area = L * W;
    const stoneAreaM2 = (stoneL / 100) * (stoneW / 100);
    const baseStones = area / stoneAreaM2;

    const perimeter = 2 * (L * 100) + 2 * (W * 100);

    let halfStones = 0;
    let halfStonesLongSide = 0;
    let halfStonesShortSide = 0;
    let warnings: string[] = [];
    let repeatDistance = 0;

    const activeEdgesCount = (selectedEdges.top ? 1 : 0) + (selectedEdges.right ? 1 : 0) +
                             (selectedEdges.bottom ? 1 : 0) + (selectedEdges.left ? 1 : 0);

    switch (bondPattern) {
      case 'elleboog': {
        repeatDistance = stoneL + stoneW;
        const longSideLength = L * 100;
        const shortSideLength = W * 100;

        const longSidesCount = (selectedEdges.top ? 1 : 0) + (selectedEdges.bottom ? 1 : 0);
        const shortSidesCount = (selectedEdges.left ? 1 : 0) + (selectedEdges.right ? 1 : 0);

        halfStonesLongSide = Math.round(longSideLength / repeatDistance);
        halfStonesShortSide = Math.round(shortSideLength / repeatDistance);

        halfStones = (halfStonesLongSide * longSidesCount) + (halfStonesShortSide * shortSidesCount);
        break;
      }

      case 'halfsteens': {
        const lengthCm = L * 100;
        const widthCm = W * 100;

        // Voor de TOP/BOTTOM kanten (lopen langs de BREEDTE):
        // Bereken hoeveel rijen er zijn in de lengterichting
        const numberOfRowsLength = Math.ceil(lengthCm / stoneL);

        // Check of de breedte precies uitkomt op hele tegels
        const tilesAcrossWidth = widthCm / stoneW;
        const widthFitsExactly = tilesAcrossWidth === Math.floor(tilesAcrossWidth);

        if (widthFitsExactly) {
          // Perfecte breedte: elke 2e rij heeft een halve tegel nodig
          halfStonesLongSide = Math.ceil(numberOfRowsLength / 2);
        } else {
          // Niet-perfecte breedte: elke rij heeft een passtuk nodig
          halfStonesLongSide = numberOfRowsLength;
        }

        // Voor de LEFT/RIGHT kanten (lopen langs de LENGTE):
        // Bereken hoeveel rijen er zijn in de breedterichting
        const numberOfRowsWidth = Math.ceil(widthCm / stoneL);

        // Check of de lengte precies uitkomt op hele tegels
        const tilesAcrossLength = lengthCm / stoneW;
        const lengthFitsExactly = tilesAcrossLength === Math.floor(tilesAcrossLength);

        if (lengthFitsExactly) {
          // Perfecte lengte: elke 2e rij heeft een halve tegel nodig
          halfStonesShortSide = Math.ceil(numberOfRowsWidth / 2);
        } else {
          // Niet-perfecte lengte: elke rij heeft een passtuk nodig
          halfStonesShortSide = numberOfRowsWidth;
        }

        const shortSidesCount = (selectedEdges.left ? 1 : 0) + (selectedEdges.right ? 1 : 0);
        const longSidesCount = (selectedEdges.top ? 1 : 0) + (selectedEdges.bottom ? 1 : 0);

        halfStones = (halfStonesLongSide * longSidesCount) + (halfStonesShortSide * shortSidesCount);
        break;
      }

      case 'blokverband': {
        halfStones = 0;
        const lengthFits = (L * 100) % stoneL === 0;
        const widthFits = (W * 100) % stoneW === 0;
        if (!lengthFits || !widthFits) {
          warnings.push('LET OP: Afmetingen passen niet exact op deze steenmaat in blokverband!');
        }
        break;
      }

      case 'keperwerk': {
        const diagonalFactor = 1.41;
        const edgeLengthTotal =
          (selectedEdges.top ? L * 100 : 0) +
          (selectedEdges.bottom ? L * 100 : 0) +
          (selectedEdges.left ? W * 100 : 0) +
          (selectedEdges.right ? W * 100 : 0);
        halfStones = Math.round((edgeLengthTotal / stoneW) * diagonalFactor);
        halfStonesLongSide = Math.round(halfStones / 2);
        halfStonesShortSide = Math.round(halfStones / 2);
        warnings.push('Bij keperwerk zijn alle randstenen schuin gezaagd (45°)');
        break;
      }
    }

    const halfStoneAreaM2 = (stoneL / 200) * (stoneW / 100);
    const totalHalfStonesArea = halfStones * halfStoneAreaM2;
    const remainingAreaForWholeStones = area - totalHalfStonesArea;

    const wholeStonesFromHalves = Math.round(halfStones / 2);
    const wholeStonesNeeded = Math.round(remainingAreaForWholeStones / stoneAreaM2);

    const wastePercent = parseFloat(wastePercentage) || 0;
    const wasteAmount = Math.round(wholeStonesNeeded * (wastePercent / 100));
    const totalOrder = wholeStonesNeeded + wasteAmount + wholeStonesFromHalves;

    let stonesPerLayer: number;
    let layersPerPallet: number;
    let stonesPerPallet: number;
    let areaPerPallet: number;

    if (stoneL === 30 && stoneW === 30) {
      layersPerPallet = 20;
      stonesPerPallet = 240;
      areaPerPallet = 21.60;
      stonesPerLayer = stonesPerPallet / layersPerPallet;
    } else {
      stonesPerLayer = 45;
      layersPerPallet = 10;
      stonesPerPallet = stonesPerLayer * layersPerPallet;
      areaPerPallet = (stonesPerPallet * stoneAreaM2);
    }

    const palletsNeeded = Math.ceil(totalOrder / stonesPerPallet);

    let weightPerStone: number | undefined;
    let totalWeight: number | undefined;
    let arboWarning: string | undefined;

    if (!useCustom && selectedPaver?.weight_per_stone) {
      weightPerStone = selectedPaver.weight_per_stone;
      totalWeight = (wholeStonesNeeded + wasteAmount) * weightPerStone;

      if (weightPerStone > 9.5) {
        arboWarning = `ARBO-waarschuwing: Deze steen weegt ${weightPerStone.toFixed(2)} kg per stuk. Dit overschrijdt de ARBO-norm van 9,5 kg. Gebruik een tegeltiller of vacuümzuiger.`;
      }
    }

    return {
      area,
      baseStones: wholeStonesNeeded,
      halfStones,
      halfStonesLongSide,
      halfStonesShortSide,
      wholeStonesFromHalves,
      wasteAmount,
      totalOrder,
      stoneL,
      stoneW,
      repeatDistance,
      warnings,
      perimeter: perimeter / 100,
      halfStonesArea: totalHalfStonesArea,
      remainingArea: remainingAreaForWholeStones,
      palletsNeeded,
      stonesPerPallet,
      stonesPerLayer,
      layersPerPallet,
      areaPerPallet,
      weightPerStone,
      totalWeight,
      arboWarning,
    };
  };

  const results = showResults ? calculateResults() : null;

  const getBondPatternDescription = (pattern: BondPattern) => {
    switch (pattern) {
      case 'elleboog':
        return 'Herhaling elke (L + B) cm langs alle zijden';
      case 'halfsteens':
        return 'Halve steen elke 2e rij aan kopse kant';
      case 'blokverband':
        return 'Geen passtenen (mits maten kloppen)';
      case 'keperwerk':
        return 'Alle randstenen schuin gezaagd (45°)';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Grid3x3 className="w-8 h-8 text-blue-600" />
          <h2 className="text-2xl font-bold text-slate-900">Professionele Bestratings-Calculator</h2>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-50 p-5 rounded-lg border border-slate-200">
            <h3 className="font-semibold text-slate-900 mb-4">Afmetingen Vak</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Lengte (meters)
                </label>
                <input
                  type="number"
                  value={surfaceLength}
                  onChange={(e) => {
                    setSurfaceLength(e.target.value);
                    setShowResults(false);
                  }}
                  placeholder="0.00"
                  step="any"
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
                  value={surfaceWidth}
                  onChange={(e) => {
                    setSurfaceWidth(e.target.value);
                    setShowResults(false);
                  }}
                  placeholder="0.00"
                  step="any"
                  min="0"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-5 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-slate-900 mb-4">Type Bestrating</h3>

            <div className="flex gap-4 mb-4">
              <button
                onClick={() => {
                  setUseCustom(false);
                  setShowResults(false);
                }}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                  !useCustom
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-100'
                }`}
              >
                Standaard formaat
              </button>
              <button
                onClick={() => {
                  setUseCustom(true);
                  setShowResults(false);
                }}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                  useCustom
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-100'
                }`}
              >
                Aangepaste maat
              </button>
            </div>

            {!useCustom ? (
              <>
                {loading ? (
                  <div className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-slate-50 text-slate-500">
                    Steenformaten laden...
                  </div>
                ) : error ? (
                  <div className="w-full px-4 py-3 border border-red-300 rounded-lg bg-red-50 text-red-600">
                    {error}
                  </div>
                ) : paverSizes.length === 0 ? (
                  <div className="w-full px-4 py-3 border border-yellow-300 rounded-lg bg-yellow-50 text-yellow-700">
                    Geen standaard formaten beschikbaar
                  </div>
                ) : (
                  <select
                    value={selectedPaver?.id || ''}
                    onChange={(e) => {
                      const paver = paverSizes.find(p => p.id === e.target.value);
                      if (paver) setSelectedPaver(paver);
                      setShowResults(false);
                    }}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {paverSizes.map((paver) => (
                      <option key={paver.id} value={paver.id}>
                        {paver.name} ({paver.length} × {paver.width} cm)
                      </option>
                    ))}
                  </select>
                )}
              </>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Lengte (cm)
                  </label>
                  <input
                    type="number"
                    value={customLength}
                    onChange={(e) => {
                      setCustomLength(e.target.value);
                      setShowResults(false);
                    }}
                    placeholder="0.0"
                    step="0.1"
                    min="0"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Breedte (cm)
                  </label>
                  <input
                    type="number"
                    value={customWidth}
                    onChange={(e) => {
                      setCustomWidth(e.target.value);
                      setShowResults(false);
                    }}
                    placeholder="0.0"
                    step="0.1"
                    min="0"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Dikte (cm)
                  </label>
                  <input
                    type="number"
                    value={customThickness}
                    onChange={(e) => {
                      setCustomThickness(e.target.value);
                      setShowResults(false);
                    }}
                    placeholder="6"
                    step="0.1"
                    min="0"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}
          </div>

          {bondPattern !== 'blokverband' && (
            <div className="bg-orange-50 p-5 rounded-lg border border-orange-200">
              <h3 className="font-semibold text-slate-900 mb-4">Selecteer Kanten</h3>

              <div className="space-y-3 mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={machineLayout}
                    onChange={(e) => {
                      setMachineLayout(e.target.checked);
                      setShowResults(true);
                    }}
                    className="w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-slate-700 font-medium">Machinaal straten</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showWeight}
                    onChange={(e) => {
                      setShowWeight(e.target.checked);
                      setShowResults(true);
                    }}
                    className="w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-slate-700 font-medium">Toon gewicht</span>
                </label>
              </div>

              <div className="flex justify-center items-center py-8">
                {(() => {
                  const L = parseFloat(surfaceLength) || 0;
                  const W = parseFloat(surfaceWidth) || 0;
                  const maxSize = 300;
                  const ratio = L / W;

                  let rectWidth: number;
                  let rectHeight: number;

                  if (ratio > 1) {
                    rectWidth = maxSize;
                    rectHeight = maxSize / ratio;
                  } else {
                    rectHeight = maxSize;
                    rectWidth = maxSize * ratio;
                  }

                  const edgeThickness = 12;

                  return (
                    <div
                      className="relative bg-slate-200 rounded"
                      style={{
                        width: `${rectWidth}px`,
                        height: `${rectHeight}px`,
                        minWidth: '120px',
                        minHeight: '120px'
                      }}
                    >
                      <button
                        onClick={() => {
                          setSelectedEdges(prev => ({ ...prev, top: !prev.top }));
                          setShowResults(true);
                        }}
                        className={`absolute -top-2 left-0 right-0 rounded-t transition-all cursor-pointer hover:opacity-80 ${
                          selectedEdges.top ? 'bg-orange-600' : 'bg-slate-400'
                        }`}
                        style={{ height: `${edgeThickness}px` }}
                        title="Bovenkant"
                      />

                      <button
                        onClick={() => {
                          setSelectedEdges(prev => ({ ...prev, right: !prev.right }));
                          setShowResults(true);
                        }}
                        className={`absolute top-0 -right-2 bottom-0 rounded-r transition-all cursor-pointer hover:opacity-80 ${
                          selectedEdges.right ? 'bg-orange-600' : 'bg-slate-400'
                        }`}
                        style={{ width: `${edgeThickness}px` }}
                        title="Rechterkant"
                      />

                      <button
                        onClick={() => {
                          setSelectedEdges(prev => ({ ...prev, bottom: !prev.bottom }));
                          setShowResults(true);
                        }}
                        className={`absolute -bottom-2 left-0 right-0 rounded-b transition-all cursor-pointer hover:opacity-80 ${
                          selectedEdges.bottom ? 'bg-orange-600' : 'bg-slate-400'
                        }`}
                        style={{ height: `${edgeThickness}px` }}
                        title="Onderkant"
                      />

                      <button
                        onClick={() => {
                          setSelectedEdges(prev => ({ ...prev, left: !prev.left }));
                          setShowResults(true);
                        }}
                        className={`absolute top-0 -left-2 bottom-0 rounded-l transition-all cursor-pointer hover:opacity-80 ${
                          selectedEdges.left ? 'bg-orange-600' : 'bg-slate-400'
                        }`}
                        style={{ width: `${edgeThickness}px` }}
                        title="Linkerkant"
                      />

                      <div className="absolute inset-0 flex items-center justify-center text-slate-600 font-medium text-sm">
                        {L > 0 && W > 0 ? `${L.toFixed(2)} × ${W.toFixed(2)} m` : 'Vul afmetingen in'}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          <div className="bg-green-50 p-5 rounded-lg border border-green-200">
            <h3 className="font-semibold text-slate-900 mb-4">Legverband</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setBondPattern('elleboog');
                  setShowResults(false);
                }}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  bondPattern === 'elleboog'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-slate-300 bg-white hover:border-blue-300'
                }`}
              >
                <div className="font-semibold text-slate-900">Elleboogverband</div>
                <div className="text-xs text-slate-600 mt-1">
                  {getBondPatternDescription('elleboog')}
                </div>
              </button>

              <button
                onClick={() => {
                  setBondPattern('halfsteens');
                  setShowResults(false);
                }}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  bondPattern === 'halfsteens'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-slate-300 bg-white hover:border-blue-300'
                }`}
              >
                <div className="font-semibold text-slate-900">Halfsteensverband</div>
                <div className="text-xs text-slate-600 mt-1">
                  {getBondPatternDescription('halfsteens')}
                </div>
              </button>

              <button
                onClick={() => {
                  setBondPattern('blokverband');
                  setShowResults(false);
                }}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  bondPattern === 'blokverband'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-slate-300 bg-white hover:border-blue-300'
                }`}
              >
                <div className="font-semibold text-slate-900">Blokverband</div>
                <div className="text-xs text-slate-600 mt-1">
                  {getBondPatternDescription('blokverband')}
                </div>
              </button>

              <button
                onClick={() => {
                  setBondPattern('keperwerk');
                  setShowResults(false);
                }}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  bondPattern === 'keperwerk'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-slate-300 bg-white hover:border-blue-300'
                }`}
              >
                <div className="font-semibold text-slate-900">Keperverband</div>
                <div className="text-xs text-slate-600 mt-1">
                  {getBondPatternDescription('keperwerk')}
                </div>
              </button>
            </div>
          </div>

          <div className="bg-purple-50 p-5 rounded-lg border border-purple-200">
            <h3 className="font-semibold text-slate-900 mb-4">Snijverlies</h3>
            <div className="flex items-center gap-4">
              <input
                type="number"
                value={wastePercentage}
                onChange={(e) => {
                  setWastePercentage(e.target.value);
                  setShowResults(true);
                }}
                placeholder="0"
                step="1"
                min="0"
                max="50"
                className="w-24 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <span className="text-slate-700 font-medium">%</span>
              <span className="text-sm text-slate-600">
                Extra {getProductType() === 'steen' ? 'stenen' : 'tegels'} voor zaag- en breekverliezen (alleen hele)
              </span>
            </div>
          </div>

          <button
            onClick={() => setShowResults(true)}
            className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-md"
          >
            <Calculator className="w-5 h-5" />
            Bereken Materiaal
          </button>

          {results && (
            <div className="space-y-4 pt-6 border-t-2 border-slate-300">
              <h3 className="text-xl font-bold text-slate-900">Resultaten</h3>

              {results.arboWarning && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                  <div className="font-semibold text-red-800 mb-2">ARBO-waarschuwing:</div>
                  <div className="text-sm text-red-700">{results.arboWarning}</div>
                </div>
              )}

              {results.warnings.length > 0 && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
                  <div className="font-semibold text-yellow-800 mb-2">Let op:</div>
                  {results.warnings.map((warning, i) => (
                    <div key={i} className="text-sm text-yellow-700">{warning}</div>
                  ))}
                </div>
              )}

              <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-lg border-2 border-slate-300">
                <h4 className="font-semibold text-slate-700 mb-3">Oppervlakte</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm text-slate-600">Totaal oppervlak:</span>
                    <span className="text-2xl font-bold text-slate-900">
                      {results.area.toFixed(2)} m²
                    </span>
                  </div>
                  {bondPattern !== 'blokverband' && results.halfStones > 0 && (
                    <>
                      <div className="flex justify-between items-baseline text-sm">
                        <span className="text-slate-600">Oppervlak halve {getProductType() === 'steen' ? 'stenen' : 'tegels'}:</span>
                        <span className="font-semibold text-orange-700">
                          -{results.halfStonesArea.toFixed(2)} m²
                        </span>
                      </div>
                      <div className="flex justify-between items-baseline pt-2 border-t border-slate-300">
                        <span className="text-sm font-medium text-slate-700">Resterend voor hele {getProductType() === 'steen' ? 'stenen' : 'tegels'}:</span>
                        <span className="text-xl font-bold text-blue-700">
                          {results.remainingArea.toFixed(2)} m²
                        </span>
                      </div>
                    </>
                  )}
                </div>
                <div className="text-sm text-slate-600 mt-3 pt-3 border-t border-slate-300">
                  {getProductType() === 'steen' ? 'Steen' : 'Tegel'}formaat: {results.stoneL} × {results.stoneW} cm
                </div>
                {results.repeatDistance > 0 && (
                  <div className="text-sm text-slate-600">
                    Herhaling elleboog: {results.repeatDistance.toFixed(1)} cm
                  </div>
                )}
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border-2 border-blue-300">
                <h4 className="font-semibold text-slate-900 mb-4">Hele {getProductType() === 'steen' ? 'stenen' : 'tegels'} benodigd</h4>
                <div className="text-3xl font-bold text-blue-700 mb-2">
                  {results.baseStones} stuks
                </div>
                <div className="text-sm text-slate-600">
                  Berekend op resterend oppervlak (zonder snijverlies)
                </div>
              </div>

              {bondPattern !== 'blokverband' && (
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-lg border-2 border-orange-300">
                  <h4 className="font-semibold text-slate-900 mb-4">
                    Halve {getProductType() === 'steen' ? 'stenen' : 'tegels'} nodig
                  </h4>

                  {bondPattern === 'elleboog' && (
                    <div className="space-y-2 mb-3 text-sm">
                      {selectedEdges.top && (
                        <div className="flex justify-between">
                          <span className="text-slate-700">Boven kant ({surfaceWidth}m):</span>
                          <span className="font-semibold">{results.halfStonesShortSide} halve {getProductType() === 'steen' ? 'stenen' : 'tegels'}</span>
                        </div>
                      )}
                      {selectedEdges.bottom && (
                        <div className="flex justify-between">
                          <span className="text-slate-700">Onder kant ({surfaceWidth}m):</span>
                          <span className="font-semibold">{results.halfStonesShortSide} halve {getProductType() === 'steen' ? 'stenen' : 'tegels'}</span>
                        </div>
                      )}
                      {selectedEdges.left && (
                        <div className="flex justify-between">
                          <span className="text-slate-700">Linker kant ({surfaceLength}m):</span>
                          <span className="font-semibold">{results.halfStonesLongSide} halve {getProductType() === 'steen' ? 'stenen' : 'tegels'}</span>
                        </div>
                      )}
                      {selectedEdges.right && (
                        <div className="flex justify-between">
                          <span className="text-slate-700">Rechter kant ({surfaceLength}m):</span>
                          <span className="font-semibold">{results.halfStonesLongSide} halve {getProductType() === 'steen' ? 'stenen' : 'tegels'}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {bondPattern === 'halfsteens' && (
                    <div className="space-y-2 mb-3 text-sm">
                      {selectedEdges.top && (
                        <div className="flex justify-between">
                          <span className="text-slate-700">Boven kant ({surfaceWidth}m):</span>
                          <span className="font-semibold">{results.halfStonesLongSide} halve {getProductType() === 'steen' ? 'stenen' : 'tegels'}</span>
                        </div>
                      )}
                      {selectedEdges.bottom && (
                        <div className="flex justify-between">
                          <span className="text-slate-700">Onder kant ({surfaceWidth}m):</span>
                          <span className="font-semibold">{results.halfStonesLongSide} halve {getProductType() === 'steen' ? 'stenen' : 'tegels'}</span>
                        </div>
                      )}
                      {selectedEdges.left && (
                        <div className="flex justify-between">
                          <span className="text-slate-700">Linker kant ({surfaceLength}m):</span>
                          <span className="font-semibold">{results.halfStonesShortSide} halve {getProductType() === 'steen' ? 'stenen' : 'tegels'}</span>
                        </div>
                      )}
                      {selectedEdges.right && (
                        <div className="flex justify-between">
                          <span className="text-slate-700">Rechter kant ({surfaceLength}m):</span>
                          <span className="font-semibold">{results.halfStonesShortSide} halve {getProductType() === 'steen' ? 'stenen' : 'tegels'}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="pt-3 border-t-2 border-orange-400">
                    <div className="flex justify-between items-baseline">
                      <span className="font-semibold text-slate-900">Totaal halve {getProductType() === 'steen' ? 'stenen' : 'tegels'}:</span>
                      <span className="text-2xl font-bold text-orange-700">
                        {results.halfStones} stuks
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border-2 border-green-300">
                <h4 className="font-semibold text-slate-900 mb-4">Besteladvies</h4>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-700">Hele {getProductType() === 'steen' ? 'stenen' : 'tegels'} nodig:</span>
                    <span className="font-semibold">{results.baseStones} stuks</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-700">Snijverlies ({wastePercentage}%, alleen hele {getProductType() === 'steen' ? 'stenen' : 'tegels'}):</span>
                    <span className="font-semibold">+{results.wasteAmount} stuks</span>
                  </div>
                  <div className="pt-3 border-t-2 border-green-400 flex justify-between items-baseline">
                    <span className="text-lg font-bold text-slate-900">TOTAAL HELE {getProductType() === 'steen' ? 'STENEN' : 'TEGELS'}:</span>
                    <span className="text-4xl font-bold text-green-700">
                      {results.baseStones + results.wasteAmount}
                    </span>
                  </div>
                  {bondPattern !== 'blokverband' && (
                    <div className="pt-3 border-t border-green-300 flex justify-between items-baseline">
                      <span className="text-lg font-bold text-slate-900">TOTAAL HALVE {getProductType() === 'steen' ? 'STENEN' : 'TEGELS'}:</span>
                      <span className="text-3xl font-bold text-orange-700">
                        {results.halfStones}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {machineLayout && (
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg border-2 border-purple-300">
                  <h4 className="font-semibold text-slate-900 mb-4">Machinaal Straten - Pakken</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-700">{getProductType() === 'steen' ? 'Stenen' : 'Tegels'} per laag:</span>
                      <span className="font-semibold">{results.stonesPerLayer} stuks</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-700">Lagen per pak:</span>
                      <span className="font-semibold">{results.layersPerPallet} lagen</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-700">{getProductType() === 'steen' ? 'Stenen' : 'Tegels'} per pak:</span>
                      <span className="font-semibold">{results.stonesPerPallet} stuks</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-700">Oppervlakte per pak:</span>
                      <span className="font-semibold">{results.areaPerPallet.toFixed(2)} m²</span>
                    </div>
                    <div className="pt-3 border-t-2 border-purple-400 flex justify-between items-baseline">
                      <span className="text-lg font-bold text-slate-900">PAKKEN NODIG:</span>
                      <span className="text-4xl font-bold text-purple-700">
                        {results.palletsNeeded}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {showWeight && results.weightPerStone && (
                <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-6 rounded-lg border-2 border-amber-300">
                  <h4 className="font-semibold text-slate-900 mb-4">Gewicht</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-700">Gewicht per {getProductType()}:</span>
                      <span className="font-semibold">{results.weightPerStone.toFixed(2)} kg</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-700">Oppervlakte:</span>
                      <span className="font-semibold">{results.area.toFixed(2)} m²</span>
                    </div>
                    <div className="pt-3 border-t-2 border-amber-400 flex justify-between items-baseline">
                      <span className="text-lg font-bold text-slate-900">TOTAAL GEWICHT:</span>
                      <span className="text-4xl font-bold text-amber-700">
                        {results.totalWeight ? results.totalWeight.toFixed(0) : '0'} kg
                      </span>
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
