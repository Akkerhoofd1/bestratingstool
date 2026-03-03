import { useState } from 'react';
import { Box, AlertCircle } from 'lucide-react';

export type MaterialType = 'sand' | 'soil';
export type OperationType = 'incomingCompact' | 'outgoingLoose';

interface VolumeResults {
  area: number;
  depth: number;
  solidVolume: number;
  looseVolume: number;
  material: MaterialType;
  operation: OperationType;
}

const MATERIAL_CONFIG = {
  sand: {
    name: 'Zand',
    solidToLooseFactor: 1.2,
    description: 'Zand (verdicht naar los)',
  },
  soil: {
    name: 'Grond',
    solidToLooseFactor: 1.35,
    description: 'Grond (verdicht naar los)',
  },
};

export default function VolumeCalculator() {
  const [length, setLength] = useState<string>('');
  const [width, setWidth] = useState<string>('');
  const [depth, setDepth] = useState<string>('');
  const [material, setMaterial] = useState<MaterialType>('sand');
  const [operation, setOperation] = useState<OperationType>('incomingCompact');

  const calculateVolume = (): VolumeResults | null => {
    const l = parseFloat(length);
    const w = parseFloat(width);
    const d = parseFloat(depth);

    if (!l || !w || !d || l <= 0 || w <= 0 || d <= 0) return null;

    const area = l * w;
    const solidVolume = (area * d) / 1000;
    const looseVolume =
      solidVolume * MATERIAL_CONFIG[material].solidToLooseFactor;

    return {
      area,
      depth: d,
      solidVolume,
      looseVolume,
      material,
      operation,
    };
  };

  const results = calculateVolume();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-green-100 p-2 rounded-lg">
              <Box className="w-5 h-5 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900">
              Kuubberekening
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Lengte (meter)
              </label>
              <input
                type="number"
                value={length}
                onChange={(e) => setLength(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Breedte (meter)
              </label>
              <input
                type="number"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Diepte (cm)
              </label>
              <input
                type="number"
                value={depth}
                onChange={(e) => setDepth(e.target.value)}
                placeholder="0"
                step="0.5"
                min="0"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {length && width && depth && (
            <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-green-800">
                <span className="font-semibold">Oppervlakte:</span>{' '}
                {(parseFloat(length) * parseFloat(width)).toFixed(2)} m²
              </p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            Operatie type
          </h3>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <button
              onClick={() => setOperation('incomingCompact')}
              className={`p-5 rounded-lg border-2 transition-all text-left ${
                operation === 'incomingCompact'
                  ? 'border-green-600 bg-green-50'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="font-medium text-slate-900">Aanvoeren</div>
              <div className="text-xs text-slate-600 mt-1">Vaste m³</div>
            </button>
            <button
              onClick={() => setOperation('outgoingLoose')}
              className={`p-5 rounded-lg border-2 transition-all text-left ${
                operation === 'outgoingLoose'
                  ? 'border-green-600 bg-green-50'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="font-medium text-slate-900">Afvoeren</div>
              <div className="text-xs text-slate-600 mt-1">Losse m³</div>
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Materiaal type
            </h3>

            <div className="grid grid-cols-2 gap-4">
              {(Object.entries(MATERIAL_CONFIG) as [MaterialType, typeof MATERIAL_CONFIG.sand][]).map(
                ([type, config]) => (
                  <button
                    key={type}
                    onClick={() => setMaterial(type)}
                    className={`p-5 rounded-lg border-2 transition-all text-left ${
                      material === type
                        ? 'border-green-600 bg-green-50'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="font-medium text-slate-900">
                      {config.name}
                    </div>
                    <div className="text-xs text-slate-600 mt-1">
                      +{((config.solidToLooseFactor - 1) * 100).toFixed(0)}% bij
                      uitgraven
                    </div>
                  </button>
                )
              )}
            </div>

            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200 flex items-start gap-3">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600" />
              <p className="text-xs text-blue-800">
                <span className="font-semibold">Verschil vaste vs losse:</span> Bij
                uitgraven neemt het volume toe door luchtbellen. Zand +20%, Grond
                +35%.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-1">
        {results ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-fit sticky top-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-green-100 p-2 rounded-lg">
                <Box className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900">Resultaten</h2>
            </div>

            <div className="space-y-4 mb-6">
              <div className="p-4 rounded-lg border border-slate-200 bg-slate-50">
                <div className="text-sm text-slate-600 mb-1">Vaste m³</div>
                <p className="text-3xl font-bold text-slate-900">
                  {results.solidVolume.toFixed(2)}
                </p>
                <p className="text-xs text-slate-600 mt-1">m³ vast volume</p>
              </div>

              <div className="p-4 rounded-lg border border-slate-200 bg-slate-50">
                <div className="text-sm text-slate-600 mb-1">Luchtige m³</div>
                <p className="text-3xl font-bold text-slate-900">
                  {results.looseVolume.toFixed(2)}
                </p>
                <p className="text-xs text-slate-600 mt-1">m³ met luchtige volume</p>
              </div>

              <div className="p-4 rounded-lg border border-amber-200 bg-amber-50">
                <div className="text-sm text-amber-800 mb-1">Verschil</div>
                <p className="text-3xl font-bold text-amber-900">
                  {(results.looseVolume - results.solidVolume).toFixed(2)}
                </p>
                <p className="text-xs text-amber-700 mt-1">
                  +{((results.looseVolume / results.solidVolume - 1) * 100).toFixed(0)}%
                </p>
              </div>
            </div>

            <div className={`p-4 rounded-lg text-white ${
              results.operation === 'incomingCompact'
                ? 'bg-gradient-to-br from-blue-500 to-blue-600'
                : 'bg-gradient-to-br from-orange-500 to-orange-600'
            }`}>
              <p className="text-xs mb-1 opacity-90">
                {results.operation === 'incomingCompact' ? 'Aanvoeren' : 'Afvoeren'}
              </p>
              <p className="text-2xl font-bold">
                {results.operation === 'incomingCompact'
                  ? results.solidVolume.toFixed(2)
                  : results.looseVolume.toFixed(2)} m³
              </p>
              <p className="text-xs mt-2 opacity-90">
                {results.operation === 'incomingCompact'
                  ? 'Benodigd vaste volume'
                  : 'Te vervoeren luchtig volume'}
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
                Voer afmetingen in om de berekening te starten
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
