import { useState } from 'react';
import { TrendingDown, AlertCircle, ArrowDown, ArrowUp } from 'lucide-react';

interface SlopeResults {
  totalDistance: number;
  heightDifference: number;
  dropPerMeter: number;
  slopePercentage: number;
  startHeight: number;
  endHeight: number;
  isDescending: boolean;
}

type CalculationMode = 'manual' | 'percentage';

export default function SlopeCalculator() {
  const [mode, setMode] = useState<CalculationMode>('manual');
  const [startHeightCm, setStartHeightCm] = useState<string>('');
  const [endDistanceM, setEndDistanceM] = useState<string>('');
  const [endHeightCm, setEndHeightCm] = useState<string>('');
  const [slopePercentageInput, setSlopePercentageInput] = useState<number>(2);

  const calculateSlope = (): SlopeResults | null => {
    if (mode === 'manual') {
      const startHeight = parseFloat(startHeightCm);
      const endDistance = parseFloat(endDistanceM);
      const endHeight = parseFloat(endHeightCm);

      if (isNaN(startHeight) || isNaN(endDistance) || isNaN(endHeight) || endDistance <= 0) return null;

      const heightDifference = startHeight - endHeight;
      const dropPerMeter = heightDifference / endDistance;
      const slopePercentage = (dropPerMeter / 100) * 100;

      return {
        totalDistance: endDistance,
        heightDifference,
        dropPerMeter,
        slopePercentage,
        startHeight,
        endHeight,
        isDescending: heightDifference > 0,
      };
    } else {
      const startHeight = parseFloat(startHeightCm);
      const endDistance = parseFloat(endDistanceM);

      if (isNaN(startHeight) || isNaN(endDistance) || endDistance <= 0) return null;

      const dropPerMeter = slopePercentageInput;
      const heightDifference = dropPerMeter * endDistance;
      const endHeight = startHeight - heightDifference;
      const slopePercentage = slopePercentageInput;

      return {
        totalDistance: endDistance,
        heightDifference,
        dropPerMeter,
        slopePercentage,
        startHeight,
        endHeight,
        isDescending: heightDifference > 0,
      };
    }
  };

  const results = calculateSlope();

  const generateIntermediatePoints = (results: SlopeResults) => {
    const points = [];
    const steps = Math.ceil(results.totalDistance);

    for (let i = 0; i <= steps; i++) {
      const distance = i;
      const height = results.startHeight - (results.dropPerMeter * distance);
      points.push({ distance, height });
    }

    return points;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-amber-100 p-2 rounded-lg">
              <TrendingDown className="w-5 h-5 text-amber-600" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900">
              Hellingshoek Calculator
            </h2>
          </div>

          <div className="space-y-6">
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setMode('manual')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                  mode === 'manual'
                    ? 'bg-amber-500 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Handmatige invoer
              </button>
              <button
                onClick={() => setMode('percentage')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                  mode === 'percentage'
                    ? 'bg-amber-500 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Afschot percentage
              </button>
            </div>

            <div className="p-5 rounded-lg bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200">
              <h3 className="font-semibold text-slate-900 mb-4">
                Startpunt (0 meter)
              </h3>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Hoogte (cm)
                </label>
                <input
                  type="number"
                  value={startHeightCm}
                  onChange={(e) => setStartHeightCm(e.target.value)}
                  placeholder="0"
                  step="0.1"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {mode === 'percentage' ? (
              <>
                <div className="p-5 rounded-lg bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200">
                  <h3 className="font-semibold text-slate-900 mb-4">Afstand</h3>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Afstand (meter)
                    </label>
                    <input
                      type="number"
                      value={endDistanceM}
                      onChange={(e) => setEndDistanceM(e.target.value)}
                      placeholder="0"
                      step="0.5"
                      min="0"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div className="p-5 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200">
                  <h3 className="font-semibold text-slate-900 mb-4">
                    Afschot Percentage
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700">
                        {slopePercentageInput.toFixed(1)} cm per meter
                      </span>
                      <span className="text-lg font-bold text-amber-600">
                        {slopePercentageInput.toFixed(1)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="15"
                      step="0.1"
                      value={slopePercentageInput}
                      onChange={(e) => setSlopePercentageInput(parseFloat(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                    <div className="flex justify-between text-xs text-slate-600">
                      <span>0.5%</span>
                      <span className="text-green-600 font-medium">Aanbevolen: 1-2%</span>
                      <span>15%</span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-5 rounded-lg bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200">
                <h3 className="font-semibold text-slate-900 mb-4">Eindpunt</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Afstand (meter)
                    </label>
                    <input
                      type="number"
                      value={endDistanceM}
                      onChange={(e) => setEndDistanceM(e.target.value)}
                      placeholder="0"
                      step="0.5"
                      min="0"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Hoogte (cm)
                    </label>
                    <input
                      type="number"
                      value={endHeightCm}
                      onChange={(e) => setEndHeightCm(e.target.value)}
                      placeholder="0"
                      step="0.1"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              </div>
            )}

            {results && (
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-sm text-amber-800">
                  <span className="font-semibold">Start:</span> {results.startHeight.toFixed(1)}
                  cm | <span className="font-semibold">Eind:</span> {results.endHeight.toFixed(1)}
                  cm @ {results.totalDistance.toFixed(1)}m
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            Informatie
          </h3>

          <div className="space-y-3 text-sm text-slate-700">
            <p>
              <span className="font-semibold">Hellingshoek:</span> De gradiënt van
              het startpunt naar het eindpunt bepaalt hoeveel zakking per meter
              nodig is.
            </p>
            <p>
              <span className="font-semibold">Afwatering:</span> Bij bestrating is
              een minimale helling van 1-2% (1-2 cm per meter) aanbevolen voor
              goede afwatering.
            </p>
            <p>
              <span className="font-semibold">Toepassing:</span> Berekening is
              nuttig voor opritten, looppadden, en bestratingsprojecten.
            </p>
          </div>

          {results && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                  <span className="font-semibold">Opmerking:</span> Controleer
                  altijd lokale bouwvoorschriften voor minimale en maximale
                  hellingen in uw gebied.
                </span>
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="lg:col-span-1">
        {results ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-fit sticky top-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-amber-100 p-2 rounded-lg">
                <TrendingDown className="w-5 h-5 text-amber-600" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900">Resultaten</h2>
            </div>

            <div className="space-y-4 mb-6">
              <div className="p-4 rounded-lg border border-slate-200 bg-slate-50">
                <div className="text-sm text-slate-600 mb-1">Totale afstand</div>
                <p className="text-2xl font-bold text-slate-900">
                  {results.totalDistance.toFixed(2)}
                </p>
                <p className="text-xs text-slate-600 mt-1">meter</p>
              </div>

              <div className="p-4 rounded-lg border border-slate-200 bg-slate-50">
                <div className="text-sm text-slate-600 mb-1">
                  Hoogteverschil
                </div>
                <p className="text-2xl font-bold text-slate-900">
                  {results.heightDifference.toFixed(1)}
                </p>
                <p className="text-xs text-slate-600 mt-1">cm</p>
              </div>

              <div className="p-4 rounded-lg border border-slate-200 bg-slate-50">
                <div className="text-sm text-slate-600 mb-1 flex items-center gap-2">
                  Per meter
                  {results.isDescending ? (
                    <ArrowDown className="w-4 h-4 text-red-500" />
                  ) : (
                    <ArrowUp className="w-4 h-4 text-green-500" />
                  )}
                </div>
                <p className="text-2xl font-bold text-slate-900">
                  {Math.abs(results.dropPerMeter).toFixed(2)}
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  cm/{results.isDescending ? 'zakking' : 'stijging'}
                </p>
              </div>
            </div>

            <div className="p-5 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg text-white mb-4">
              <p className="text-xs text-amber-100 mb-2">Hellingspercentage</p>
              <p className="text-4xl font-bold">
                {Math.abs(results.slopePercentage).toFixed(2)}%
              </p>
              <p className="text-xs text-amber-100 mt-2">
                {results.isDescending ? 'dalend' : 'stijgend'} gradient
              </p>
            </div>

            <div className="border-t border-slate-200 pt-4">
              <h4 className="text-sm font-semibold text-slate-900 mb-3">
                Hoogte per meter
              </h4>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {generateIntermediatePoints(results).map((point, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-200 text-sm"
                  >
                    <span className="font-medium text-slate-700">
                      {point.distance}m
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-900 font-semibold">
                        {point.height.toFixed(1)} cm
                      </span>
                      {index > 0 && (
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          results.isDescending
                            ? 'bg-red-100 text-red-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {results.isDescending ? '-' : '+'}{Math.abs(results.dropPerMeter).toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-100 rounded-lg border border-slate-300">
                <p className="text-slate-700">
                  <span className="font-semibold">Start hoogte:</span>{' '}
                  {results.startHeight.toFixed(1)} cm
                </p>
              </div>
              <div className="p-3 bg-slate-100 rounded-lg border border-slate-300">
                <p className="text-slate-700">
                  <span className="font-semibold">Eind hoogte:</span>{' '}
                  {results.endHeight.toFixed(1)} cm
                </p>
              </div>
            </div>

            {results.slopePercentage < 1 && (
              <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
                <p className="text-xs text-orange-800">
                  <span className="font-semibold">Waarschuwing:</span> Helling is
                  minder dan 1%. Zorg voor goede afwatering.
                </p>
              </div>
            )}

            {results.slopePercentage > 10 && (
              <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
                <p className="text-xs text-orange-800">
                  <span className="font-semibold">Waarschuwing:</span> Helling is
                  meer dan 10%. Zeer steil voor voetgangers.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-fit sticky top-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-slate-100 p-2 rounded-lg">
                <TrendingDown className="w-5 h-5 text-slate-600" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900">
                Resultaten
              </h2>
            </div>

            <div className="text-center py-12">
              <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingDown className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-600">
                Voer start- en eindpunt in om de helling te berekenen
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
