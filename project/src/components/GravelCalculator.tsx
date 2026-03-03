import { useState } from 'react';
import { Layers, AlertCircle } from 'lucide-react';

interface GravelResults {
  area: number;
  depth: number;
  volume: number;
  weight: number;
}

const GRAVEL_TYPES = {
  gravel8: {
    name: 'Grind 8-16 mm',
    densityKgM3: 1500,
    description: 'Standaard grind voor drainage',
  },
  gravel16: {
    name: 'Grind 16-32 mm',
    densityKgM3: 1450,
    description: 'Grof grind voor onderlaag',
  },
  pebbles: {
    name: 'Kiezels 20-40 mm',
    densityKgM3: 1400,
    description: 'Decoratieve kiezels',
  },
};

type GravelType = keyof typeof GRAVEL_TYPES;

export default function GravelCalculator() {
  const [area, setArea] = useState<string>('');
  const [depth, setDepth] = useState<string>('');
  const [grindType, setGrindType] = useState<GravelType>('gravel8');

  const calculateGravel = (): GravelResults | null => {
    const a = parseFloat(area);
    const d = parseFloat(depth);

    if (!a || !d || a <= 0 || d <= 0) return null;

    const volume = (a * d) / 100;
    const weight =
      volume * GRAVEL_TYPES[grindType].densityKgM3;

    return {
      area: a,
      depth: d,
      volume,
      weight,
    };
  };

  const results = calculateGravel();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-amber-100 p-2 rounded-lg">
              <Layers className="w-5 h-5 text-amber-600" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900">
              Grindberekening
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
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
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Grindlaag diepte (cm)
              </label>
              <input
                type="number"
                value={depth}
                onChange={(e) => setDepth(e.target.value)}
                placeholder="0"
                step="0.5"
                min="0"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {area && depth && (
            <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-sm text-amber-800">
                <span className="font-semibold">Oppervlakte:</span>{' '}
                {parseFloat(area).toFixed(2)} m²
              </p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            Grindtype
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(Object.entries(GRAVEL_TYPES) as [GravelType, typeof GRAVEL_TYPES.gravel8][]).map(
              ([type, config]) => (
                <button
                  key={type}
                  onClick={() => setGrindType(type)}
                  className={`p-5 rounded-lg border-2 transition-all text-left ${
                    grindType === type
                      ? 'border-amber-600 bg-amber-50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="font-medium text-slate-900">
                    {config.name}
                  </div>
                  <div className="text-xs text-slate-600 mt-1">
                    {config.description}
                  </div>
                </button>
              )
            )}
          </div>

          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600" />
            <p className="text-xs text-blue-800">
              <span className="font-semibold">Tip:</span> Gebruik Grind 8-16 mm voor drainage, Grind 16-32 mm voor onderlagen, en Kiezels voor decoratieve afwerking.
            </p>
          </div>
        </div>
      </div>

      <div className="lg:col-span-1">
        {results ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-fit sticky top-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-amber-100 p-2 rounded-lg">
                <Layers className="w-5 h-5 text-amber-600" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900">Resultaten</h2>
            </div>

            <div className="space-y-4 mb-6">
              <div className="p-4 rounded-lg border border-slate-200 bg-slate-50">
                <div className="text-sm text-slate-600 mb-1">Volume</div>
                <p className="text-3xl font-bold text-slate-900">
                  {results.volume.toFixed(2)}
                </p>
                <p className="text-xs text-slate-600 mt-1">m³</p>
              </div>

              <div className="p-4 rounded-lg border border-slate-200 bg-slate-50">
                <div className="text-sm text-slate-600 mb-1">Gewicht</div>
                <p className="text-3xl font-bold text-slate-900">
                  {(results.weight / 1000).toFixed(2)}
                </p>
                <p className="text-xs text-slate-600 mt-1">ton</p>
              </div>

              <div className="p-4 rounded-lg border border-slate-200 bg-slate-50">
                <div className="text-sm text-slate-600 mb-1">Zakken (25 kg)</div>
                <p className="text-3xl font-bold text-slate-900">
                  {Math.ceil(results.weight / 25)}
                </p>
                <p className="text-xs text-slate-600 mt-1">zakken à 25 kg</p>
              </div>

              <div className="p-4 rounded-lg border border-slate-200 bg-slate-50">
                <div className="text-sm text-slate-600 mb-1">Big bags</div>
                <p className="text-3xl font-bold text-slate-900">
                  {(results.weight / 1000).toFixed(0)}
                </p>
                <p className="text-xs text-slate-600 mt-1">big bags (1000 kg)</p>
              </div>
            </div>

            <div className="p-4 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg text-white">
              <p className="text-xs text-amber-100 mb-1">
                {GRAVEL_TYPES[grindType].name}
              </p>
              <p className="text-2xl font-bold">
                {results.volume.toFixed(2)} m³
              </p>
              <p className="text-xs text-amber-100 mt-2">
                Benodigd volume
              </p>
            </div>

            <div className="mt-4 p-3 bg-slate-100 rounded-lg border border-slate-300">
              <p className="text-xs text-slate-700">
                <span className="font-semibold">Oppervlakte:</span>{' '}
                {results.area.toFixed(2)} m²
              </p>
              <p className="text-xs text-slate-700 mt-1">
                <span className="font-semibold">Diepte:</span> {results.depth} cm
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-fit sticky top-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-slate-100 p-2 rounded-lg">
                <Layers className="w-5 h-5 text-slate-600" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900">
                Resultaten
              </h2>
            </div>

            <div className="text-center py-12">
              <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Layers className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-600">
                Voer afmetingen in om de berekening te starten
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
