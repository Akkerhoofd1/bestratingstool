import { useState } from 'react';
import DimensionsInput from './DimensionsInput';
import PaverSelection from './PaverSelection';
import Results from './Results';

export interface PaverType {
  id: string;
  name: string;
  width: number;
  length: number;
  height: number;
  perM2?: number;
  useTileSize?: boolean;
}

export const PAVER_TYPES: PaverType[] = [
  { id: 'bkk', name: 'BKK Betonklinker', width: 10.5, length: 21, height: 8, perM2: 45.35 },
  { id: 'waal', name: 'Waalformaat', width: 5, length: 20, height: 8, perM2: 100 },
  { id: 'zevenduimer', name: 'Zevenduimer', width: 7, length: 21, height: 8, perM2: 68 },
  { id: 'dikformaat', name: 'Dikformaat', width: 7, length: 21, height: 8, perM2: 68 },
  { id: 'tegel30', name: 'Tegel 30x30', width: 30, length: 30, height: 3, useTileSize: true },
  { id: 'tegel60', name: 'Tegel 60x60', width: 60, length: 60, height: 3, useTileSize: true },
  { id: 'custom', name: 'Aangepast formaat', width: 0, length: 0, height: 0 },
];

export default function PaverCalculator() {
  const [length, setLength] = useState<string>('');
  const [selectedPaver, setSelectedPaver] = useState<PaverType>(PAVER_TYPES[0]);
  const [customWidth, setCustomWidth] = useState<string>('');
  const [customLength, setCustomLength] = useState<string>('');
  const [customHeight, setCustomHeight] = useState<string>('');
  const [wastePercentage, setWastePercentage] = useState<string>('5');

  const calculateResults = () => {
    const l = parseFloat(length);
    const waste = parseFloat(wastePercentage);

    if (!l || l <= 0) return null;

    let paversNeeded: number;

    if (selectedPaver.id === 'custom') {
      const cw = parseFloat(customWidth);
      const cl = parseFloat(customLength);
      const ch = parseFloat(customHeight);
      if (!cw || !cl || !ch || cw <= 0 || cl <= 0 || ch <= 0) return null;
      // Voor aangepaste maat: bereken hoeveel stuks in de lengte passen
      const paverLengthM = cl / 100;
      paversNeeded = l / paverLengthM;
    } else if (selectedPaver.useTileSize) {
      // Voor tegels: bereken hoeveel tegels in de lengte passen
      const tileLengthM = selectedPaver.length / 100;
      paversNeeded = l / tileLengthM;
    } else if (selectedPaver.perM2) {
      // Voor klinkers: gebruik lengte als basis
      const paverLengthM = selectedPaver.length / 100;
      paversNeeded = l / paverLengthM;
    } else {
      return null;
    }

    const wasteAmount = (paversNeeded * waste) / 100;
    const totalPavers = Math.ceil(paversNeeded + wasteAmount);

    return {
      length: l,
      paversNeeded: Math.ceil(paversNeeded),
      wasteAmount: Math.ceil(wasteAmount),
      totalPavers,
    };
  };

  const results = calculateResults();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-blue-100 p-2 rounded-lg">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-slate-900">Lengte</h2>
          </div>
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
        </div>

        <PaverSelection
          selectedPaver={selectedPaver}
          onPaverChange={setSelectedPaver}
          customWidth={customWidth}
          customLength={customLength}
          customHeight={customHeight}
          onCustomWidthChange={setCustomWidth}
          onCustomLengthChange={setCustomLength}
          onCustomHeightChange={setCustomHeight}
          wastePercentage={wastePercentage}
          onWastePercentageChange={setWastePercentage}
        />
      </div>

      <div className="lg:col-span-1">
        <Results results={results} />
      </div>
    </div>
  );
}
