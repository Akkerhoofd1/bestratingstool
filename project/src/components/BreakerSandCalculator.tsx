import { useState } from 'react';
import { Box } from 'lucide-react';

export default function BreakerSandCalculator() {
  const [area, setArea] = useState<string>('');

  const calculate = () => {
    const areaNum = parseFloat(area);
    if (isNaN(areaNum) || areaNum <= 0) return null;

    const kgNeeded = areaNum * 3;
    const m3Needed = kgNeeded / 1600;
    const wheelbarrows = m3Needed / 0.08;
    const bigBags = kgNeeded / 1000;

    return {
      area: areaNum,
      kgNeeded,
      m3Needed,
      wheelbarrows,
      bigBags,
    };
  };

  const results = calculate();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-orange-100 p-2 rounded-lg">
              <Box className="w-5 h-5 text-orange-600" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900">
              Brekerzand Calculator
            </h2>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Oppervlakte (m²)
            </label>
            <input
              type="number"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            Informatie
          </h3>

          <div className="space-y-3 text-sm text-slate-700">
            <p>
              <span className="font-semibold">Brekerzand afstrooien:</span> Voor
              het afstrooien van bestrating wordt gemiddeld 3 kg brekerzand per
              m² gebruikt.
            </p>
            <p>
              <span className="font-semibold">Dichtheid:</span> Brekerzand heeft
              een dichtheid van ongeveer 1600 kg/m³.
            </p>
            <p>
              <span className="font-semibold">BigBags:</span> Een standaard BigBag
              bevat 1000 kg brekerzand.
            </p>
            <p>
              <span className="font-semibold">Kruiwagen:</span> Een standaard
              kruiwagen bevat ongeveer 80 liter (0,08 m³).
            </p>
          </div>
        </div>
      </div>

      <div className="lg:col-span-1">
        {results ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-fit sticky top-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-orange-100 p-2 rounded-lg">
                <Box className="w-5 h-5 text-orange-600" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900">Resultaten</h2>
            </div>

            <div className="space-y-4 mb-6">
              <div className="p-4 rounded-lg border border-slate-200 bg-slate-50">
                <div className="text-sm text-slate-600 mb-1">Oppervlakte</div>
                <p className="text-2xl font-bold text-slate-900">
                  {results.area.toFixed(2)}
                </p>
                <p className="text-xs text-slate-600 mt-1">m²</p>
              </div>

              <div className="p-4 rounded-lg border border-slate-200 bg-slate-50">
                <div className="text-sm text-slate-600 mb-1">Brekerzand nodig</div>
                <p className="text-2xl font-bold text-slate-900">
                  {results.kgNeeded.toFixed(0)}
                </p>
                <p className="text-xs text-slate-600 mt-1">kg</p>
              </div>

              <div className="p-4 rounded-lg border border-slate-200 bg-slate-50">
                <div className="text-sm text-slate-600 mb-1">Volume</div>
                <p className="text-2xl font-bold text-slate-900">
                  {results.m3Needed.toFixed(2)}
                </p>
                <p className="text-xs text-slate-600 mt-1">m³</p>
              </div>
            </div>

            <div className="p-5 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg text-white mb-4">
              <p className="text-xs text-orange-100 mb-2">BigBags nodig</p>
              <p className="text-4xl font-bold">
                {Math.ceil(results.bigBags)}
              </p>
              <p className="text-xs text-orange-100 mt-2">
                ({results.bigBags.toFixed(2)} BigBags)
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-100 rounded-lg border border-slate-300">
                <p className="text-slate-700">
                  <span className="font-semibold">Kruiwagens:</span>{' '}
                  {Math.ceil(results.wheelbarrows)} stuks
                </p>
                <p className="text-slate-600 mt-1">
                  (circa {results.wheelbarrows.toFixed(1)} kruiwagens)
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-fit sticky top-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-slate-100 p-2 rounded-lg">
                <Box className="w-5 h-5 text-slate-600" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900">
                Resultaten
              </h2>
            </div>

            <div className="text-center py-12">
              <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Box className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-600">
                Voer de oppervlakte in om de berekening te starten
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
