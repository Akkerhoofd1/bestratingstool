import { useState } from 'react';
import { Calculator, Ruler, Scissors, AlertCircle } from 'lucide-react';

type BondPattern = 'halfsteens' | 'blok' | 'elleboog' | 'visgraat' | 'keper' | 'wild';

interface BondPatternInfo {
  name: string;
  offset: number;
  cuttingWaste: number;
  description: string;
}

interface StoneSize {
  name: string;
  length: number;
  width: number;
}

const STANDARD_STONE_SIZES: StoneSize[] = [
  { name: 'Aangepast (handmatig)', length: 0, width: 0 },
  { name: '5-duimer (21 x 10.5 cm)', length: 21, width: 10.5 },
  { name: '7-duimer (21 x 14 cm)', length: 21, width: 14 },
  { name: '10-duimer (20 x 10 cm)', length: 20, width: 10 },
  { name: 'BKK (21 x 6.8 cm)', length: 21, width: 6.8 },
  { name: 'Waalformaat (20 x 10 x 5 cm)', length: 20, width: 10 },
  { name: '30 x 30 cm', length: 30, width: 30 },
  { name: '40 x 40 cm', length: 40, width: 40 },
  { name: '50 x 50 cm', length: 50, width: 50 },
  { name: '60 x 60 cm', length: 60, width: 60 },
  { name: '80 x 80 cm', length: 80, width: 80 },
  { name: '100 x 100 cm', length: 100, width: 100 },
];

const BOND_PATTERNS: Record<BondPattern, BondPatternInfo> = {
  halfsteens: {
    name: 'Halfsteensverband',
    offset: 0.5,
    cuttingWaste: 3,
    description: '50% verspringing, standaard patroon'
  },
  blok: {
    name: 'Blokverband',
    offset: 0,
    cuttingWaste: 2,
    description: 'Geen verspringing, eenvoudig leggen'
  },
  elleboog: {
    name: 'Elleboogverband',
    offset: 0,
    cuttingWaste: 5,
    description: 'L-vorm patroon, meer snijwerk'
  },
  visgraat: {
    name: 'Visgraat',
    offset: 0,
    cuttingWaste: 8,
    description: '45° hoek, extra snijverlies randen'
  },
  keper: {
    name: 'Keperverband',
    offset: 0,
    cuttingWaste: 6,
    description: 'Diagonaal patroon, matig snijverlies'
  },
  wild: {
    name: 'Wildverband',
    offset: 0,
    cuttingWaste: 7,
    description: 'Willekeurig patroon, meer planning'
  }
};

export default function ProfessionalPaverCalculator() {
  const [gardenLength, setGardenLength] = useState<string>('');
  const [gardenWidth, setGardenWidth] = useState<string>('');
  const [selectedStoneIndex, setSelectedStoneIndex] = useState<number>(1);
  const [stoneLength, setStoneLength] = useState<string>('21');
  const [stoneWidth, setStoneWidth] = useState<string>('10.5');
  const [jointWidth, setJointWidth] = useState<string>('5');
  const [bondPattern, setBondPattern] = useState<BondPattern>('halfsteens');
  const [wastePercentage, setWastePercentage] = useState<string>('5');

  const handleStoneSelection = (index: number) => {
    setSelectedStoneIndex(index);
    const selected = STANDARD_STONE_SIZES[index];
    if (selected.length > 0) {
      setStoneLength(selected.length.toString());
      setStoneWidth(selected.width.toString());
    }
  };

  const calculate = () => {
    const gLength = parseFloat(gardenLength);
    const gWidth = parseFloat(gardenWidth);
    const sLength = parseFloat(stoneLength);
    const sWidth = parseFloat(stoneWidth);
    const joint = parseFloat(jointWidth);
    const waste = parseFloat(wastePercentage);

    if (isNaN(gLength) || isNaN(gWidth) || isNaN(sLength) || isNaN(sWidth) || isNaN(joint) || isNaN(waste) ||
        gLength <= 0 || gWidth <= 0 || sLength <= 0 || sWidth <= 0) {
      return null;
    }

    const area = gLength * gWidth;
    const gLengthCm = gLength * 100;
    const gWidthCm = gWidth * 100;
    const jointCm = joint / 10;

    const stoneLengthWithJoint = sLength + jointCm;
    const stoneWidthWithJoint = sWidth + jointCm;

    const totalLengthWithJoints = jointCm;
    let currentLength = jointCm;
    let stonesInLength = 0;
    while (currentLength + sLength + jointCm <= gLengthCm) {
      currentLength += sLength + jointCm;
      stonesInLength++;
    }
    const actualLengthUsed = currentLength;
    const remainderLength = gLengthCm - actualLengthUsed;
    const leftoverLength = remainderLength > 0 ? sLength - remainderLength : 0;

    let currentWidth = jointCm;
    let stonesInWidth = 0;
    while (currentWidth + sWidth + jointCm <= gWidthCm) {
      currentWidth += sWidth + jointCm;
      stonesInWidth++;
    }
    const actualWidthUsed = currentWidth;
    const remainderWidth = gWidthCm - actualWidthUsed;
    const leftoverWidth = remainderWidth > 0 ? sWidth - remainderWidth : 0;

    const baseStones = stonesInLength * stonesInWidth;

    const patternInfo = BOND_PATTERNS[bondPattern];
    const patternWasteMultiplier = 1 + (patternInfo.cuttingWaste / 100);
    const stonesWithPattern = baseStones * patternWasteMultiplier;

    const wasteStones = (stonesWithPattern * waste) / 100;
    const totalStones = Math.ceil(stonesWithPattern + wasteStones);

    const stoneLengthWithJointM = stoneLengthWithJoint / 100;
    const stonesPerRunningMeter = 1 / stoneLengthWithJointM;

    const stoneLengthM = sLength / 100;
    const stoneWidthM = sWidth / 100;
    const stoneArea = stoneLengthM * stoneWidthM;
    const stonesPerM2 = 1 / stoneArea;

    let startAdvice = '';
    if (remainderLength > 0 && remainderWidth > 0) {
      startAdvice = `Begin met voeg (${jointCm}mm), dan hele tegel. Zaag laatste tegel in beide richtingen.`;
    } else if (remainderLength > 0) {
      startAdvice = `Begin met voeg (${jointCm}mm), dan hele tegel. Zaag laatste tegel in lengterichting.`;
    } else if (remainderWidth > 0) {
      startAdvice = `Begin met voeg (${jointCm}mm), dan hele tegel. Zaag laatste tegel in breedterichting.`;
    } else {
      startAdvice = `Perfect! Begin met voeg (${jointCm}mm), geen zaagwerk nodig.`;
    }

    return {
      area,
      baseStones,
      stonesWithPattern: Math.ceil(stonesWithPattern),
      wasteStones: Math.ceil(wasteStones),
      totalStones,
      stonesInLength,
      stonesInWidth,
      actualLengthUsed: (actualLengthUsed / 100).toFixed(3),
      actualWidthUsed: (actualWidthUsed / 100).toFixed(3),
      remainderLength: remainderLength.toFixed(1),
      remainderWidth: remainderWidth.toFixed(1),
      leftoverLength: leftoverLength.toFixed(1),
      leftoverWidth: leftoverWidth.toFixed(1),
      startAdvice,
      stonesPerRunningMeter: stonesPerRunningMeter.toFixed(1),
      patternInfo,
      stonesPerM2: stonesPerM2.toFixed(1),
      needsCutting: remainderLength > 0 || remainderWidth > 0
    };
  };

  const results = calculate();

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-900 to-slate-700 text-white p-6 rounded-xl shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <Calculator className="w-8 h-8" />
          <h2 className="text-2xl font-bold">Professionele Klinker Calculator</h2>
        </div>
        <p className="text-slate-300 text-sm">
          Exacte berekening met voegen, legverband en snijadvies
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Ruler className="w-5 h-5 text-blue-600" />
          Basis Invoer
        </h3>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Lengte tuin (m)
              </label>
              <input
                type="number"
                value={gardenLength}
                onChange={(e) => setGardenLength(e.target.value)}
                placeholder="12.35"
                step="0.01"
                min="0"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Breedte tuin (m)
              </label>
              <input
                type="number"
                value={gardenWidth}
                onChange={(e) => setGardenWidth(e.target.value)}
                placeholder="4.80"
                step="0.01"
                min="0"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Kies steenformaat
            </label>
            <select
              value={selectedStoneIndex}
              onChange={(e) => handleStoneSelection(Number(e.target.value))}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              {STANDARD_STONE_SIZES.map((stone, index) => (
                <option key={index} value={index}>
                  {stone.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Steenlengte (cm)
              </label>
              <input
                type="number"
                value={stoneLength}
                onChange={(e) => {
                  setStoneLength(e.target.value);
                  setSelectedStoneIndex(0);
                }}
                placeholder="21"
                step="0.1"
                min="0"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Steenbreedte (cm)
              </label>
              <input
                type="number"
                value={stoneWidth}
                onChange={(e) => {
                  setStoneWidth(e.target.value);
                  setSelectedStoneIndex(0);
                }}
                placeholder="10.5"
                step="0.1"
                min="0"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Voegbreedte (mm)
              </label>
              <input
                type="number"
                value={jointWidth}
                onChange={(e) => setJointWidth(e.target.value)}
                placeholder="5"
                step="1"
                min="0"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Afvalpercentage (%)
              </label>
              <input
                type="number"
                value={wastePercentage}
                onChange={(e) => setWastePercentage(e.target.value)}
                placeholder="5"
                step="0.5"
                min="0"
                max="50"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Legverband
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {(Object.keys(BOND_PATTERNS) as BondPattern[]).map((pattern) => {
                const info = BOND_PATTERNS[pattern];
                return (
                  <button
                    key={pattern}
                    onClick={() => setBondPattern(pattern)}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      bondPattern === pattern
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-slate-300 bg-white hover:border-blue-300'
                    }`}
                  >
                    <div className={`font-semibold mb-1 ${
                      bondPattern === pattern ? 'text-blue-700' : 'text-slate-900'
                    }`}>
                      {info.name}
                    </div>
                    <div className="text-xs text-slate-600 mb-1">
                      {info.description}
                    </div>
                    <div className="text-xs font-medium text-slate-500">
                      +{info.cuttingWaste}% snijverlies
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {results && (
        <>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-md border border-blue-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4 text-lg">
              📐 Exacte Layout Berekening
            </h3>

            <div className="bg-white rounded-lg p-4 border border-blue-300 mb-4">
              <div className="text-sm font-semibold text-slate-900 mb-2">
                Lengte richting: {gardenLength}m = {(parseFloat(gardenLength) * 100).toFixed(1)}cm
              </div>
              <div className="text-xs text-slate-700 font-mono bg-slate-50 p-2 rounded">
                voeg ({(parseFloat(jointWidth) / 10).toFixed(1)}cm) + {results.stonesInLength} tegels × [{stoneLength}cm + {(parseFloat(jointWidth) / 10).toFixed(1)}cm voeg] = {results.actualLengthUsed}m
              </div>
              {parseFloat(results.remainderLength) > 0 && (
                <div className="mt-2 text-sm text-orange-700 bg-orange-50 p-2 rounded">
                  ⚠️ Overschot: {results.remainderLength}cm | Zaagstuk: {results.leftoverLength}cm
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg p-4 border border-blue-300 mb-4">
              <div className="text-sm font-semibold text-slate-900 mb-2">
                Breedte richting: {gardenWidth}m = {(parseFloat(gardenWidth) * 100).toFixed(1)}cm
              </div>
              <div className="text-xs text-slate-700 font-mono bg-slate-50 p-2 rounded">
                voeg ({(parseFloat(jointWidth) / 10).toFixed(1)}cm) + {results.stonesInWidth} tegels × [{stoneWidth}cm + {(parseFloat(jointWidth) / 10).toFixed(1)}cm voeg] = {results.actualWidthUsed}m
              </div>
              {parseFloat(results.remainderWidth) > 0 && (
                <div className="mt-2 text-sm text-orange-700 bg-orange-50 p-2 rounded">
                  ⚠️ Overschot: {results.remainderWidth}cm | Zaagstuk: {results.leftoverWidth}cm
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-slate-600 mb-1">Oppervlakte totaal</div>
                <div className="font-bold text-slate-900 text-xl">{results.area.toFixed(2)} m²</div>
              </div>
              <div>
                <div className="text-sm text-slate-600 mb-1">Tegels in lengte</div>
                <div className="font-bold text-slate-900">{results.stonesInLength} stuks</div>
              </div>
              <div>
                <div className="text-sm text-slate-600 mb-1">Tegels in breedte</div>
                <div className="font-bold text-slate-900">{results.stonesInWidth} stuks</div>
              </div>
              <div>
                <div className="text-sm text-slate-600 mb-1">Legverband</div>
                <div className="font-bold text-slate-900">{results.patternInfo.name}</div>
              </div>
              <div>
                <div className="text-sm text-slate-600 mb-1">Afval %</div>
                <div className="font-bold text-slate-900">{wastePercentage}%</div>
              </div>
              <div>
                <div className="text-sm text-slate-600 mb-1">Stenen per m²</div>
                <div className="font-bold text-slate-900">{results.stonesPerM2}</div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-md border border-green-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4 text-lg">
              🧱 Benodigde Stenen
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-green-300">
                <span className="text-slate-700">Basisberekening:</span>
                <span className="font-bold text-green-700 text-lg">{results.baseStones} stuks</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-green-300">
                <span className="text-slate-700">Met legverband (+{results.patternInfo.cuttingWaste}%):</span>
                <span className="font-bold text-green-600">{results.stonesWithPattern} stuks</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-green-300">
                <span className="text-slate-700">Afval ({wastePercentage}%):</span>
                <span className="font-bold text-green-600">{results.wasteStones} stuks</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-slate-900 font-semibold text-lg">Totaal te bestellen:</span>
                <span className="font-bold text-green-900 text-2xl">{results.totalStones} stuks</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl shadow-md border border-orange-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4 text-lg flex items-center gap-2">
              <Scissors className="w-5 h-5 text-orange-600" />
              Zaagwerk & Overschotten
            </h3>
            <div className="space-y-4">
              <div className="bg-white rounded-lg p-4 border border-orange-200">
                <div className="flex items-start gap-2 mb-3">
                  <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-slate-900 mb-1">Leg Advies</div>
                    <div className="text-slate-700 text-sm">{results.startAdvice}</div>
                  </div>
                </div>
              </div>

              {results.needsCutting && (
                <div className="bg-orange-100 rounded-lg p-4 border-2 border-orange-300">
                  <div className="font-semibold text-slate-900 mb-3">⚠️ Zaagwerk Nodig</div>
                  <div className="space-y-2">
                    {parseFloat(results.remainderLength) > 0 && (
                      <div className="bg-white p-3 rounded border border-orange-200">
                        <div className="text-sm font-medium text-slate-900">Lengte richting</div>
                        <div className="text-xs text-slate-700 mt-1">
                          Overschot: <span className="font-bold text-orange-700">{results.remainderLength}cm</span>
                        </div>
                        <div className="text-xs text-slate-700">
                          Zaag laatste tegel tot: <span className="font-bold text-orange-700">{(parseFloat(stoneLength) - parseFloat(results.leftoverLength)).toFixed(1)}cm</span>
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          (Overgebleven zaagstuk: {results.leftoverLength}cm)
                        </div>
                      </div>
                    )}
                    {parseFloat(results.remainderWidth) > 0 && (
                      <div className="bg-white p-3 rounded border border-orange-200">
                        <div className="text-sm font-medium text-slate-900">Breedte richting</div>
                        <div className="text-xs text-slate-700 mt-1">
                          Overschot: <span className="font-bold text-orange-700">{results.remainderWidth}cm</span>
                        </div>
                        <div className="text-xs text-slate-700">
                          Zaag laatste tegel tot: <span className="font-bold text-orange-700">{(parseFloat(stoneWidth) - parseFloat(results.leftoverWidth)).toFixed(1)}cm</span>
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          (Overgebleven zaagstuk: {results.leftoverWidth}cm)
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {!results.needsCutting && (
                <div className="bg-green-100 rounded-lg p-4 border-2 border-green-300">
                  <div className="font-semibold text-green-900 mb-2">✅ Geen Zaagwerk Nodig</div>
                  <div className="text-sm text-green-800">
                    De afmetingen passen perfect met de gekozen tegel- en voegmaat!
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-slate-600 mb-1">Stenen per str. meter</div>
                  <div className="font-bold text-slate-900">{results.stonesPerRunningMeter} st/m</div>
                </div>
                <div>
                  <div className="text-sm text-slate-600 mb-1">Snijverlies verband</div>
                  <div className="font-bold text-slate-900">{results.patternInfo.cuttingWaste}%</div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
