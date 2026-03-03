import { useState } from 'react';
import { Layers, AlertCircle } from 'lucide-react';

export type BondType = 'stretcher' | 'flemish' | 'english' | 'diagonal' | 'elbow';

interface BondPattern {
  id: BondType;
  name: string;
  description: string;
  formula: (length: number, width: number, jointWidth: number) => number;
  explanation: string;
}

const BOND_PATTERNS: BondPattern[] = [
  {
    id: 'stretcher',
    name: 'Keperwerk',
    description: 'Afwisselend patroon op halve stenen',
    formula: (l, _w, j) => l + j,
    explanation:
      'Stenen liggen in lengterichting, afwisselend verschoven om halve steenlengte.',
  },
  {
    id: 'flemish',
    name: 'Vlaams verband',
    description: 'Afwisselend lang en kort gezicht',
    formula: (l, w, j) => (l + w) / 2 + j,
    explanation:
      'Stenen liggen afwisselend in lengterichting en breedterichting.',
  },
  {
    id: 'english',
    name: 'Engels verband',
    description: 'Rijen met lange en korte zijden',
    formula: (l, _w, j) => l + j,
    explanation:
      'Rijen stenen wisselen af tussen lengterichting en breedterichting.',
  },
  {
    id: 'diagonal',
    name: 'Halsteens',
    description: 'Diagonaal in halsteens patroon',
    formula: (l, w, j) => {
      const diagonal = Math.sqrt(l * l + w * w);
      return diagonal + j * 2;
    },
    explanation:
      'Stenen liggen diagonaal, afmetingen berekend via stelling van Pythagoras.',
  },
  {
    id: 'elbow',
    name: 'Elleboogverband',
    description: 'Geknikte stenen in hoekpatroon',
    formula: (l, w, j) => (l + w) / 2 + j,
    explanation:
      'Stenen in geknikte vorm, afwisselend in beide richtingen gelegd.',
  },
];

export default function BondCalculator() {
  const [stoneLengthCm, setStoneLengthCm] = useState<string>('');
  const [stoneWidthCm, setStoneWidthCm] = useState<string>('');
  const [jointWidthMm, setJointWidthMm] = useState<string>('10');
  const [selectedBond, setSelectedBond] = useState<BondType>('stretcher');

  const calculateBondDimensions = () => {
    const l = parseFloat(stoneLengthCm);
    const w = parseFloat(stoneWidthCm);
    const j = parseFloat(jointWidthMm) / 10;

    if (!l || !w || l <= 0 || w <= 0) return null;

    const bond = BOND_PATTERNS.find((b) => b.id === selectedBond);
    if (!bond) return null;

    const result = bond.formula(l, w, j);

    return {
      stoneLength: l,
      stoneWidth: w,
      jointWidth: j,
      dimensionPerRow: result,
      pattern: bond,
    };
  };

  const results = calculateBondDimensions();
  const selectedPattern = BOND_PATTERNS.find((b) => b.id === selectedBond);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-purple-100 p-2 rounded-lg">
              <Layers className="w-5 h-5 text-purple-600" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900">
              Legverband Calculator
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Steenlengte (cm)
              </label>
              <input
                type="number"
                value={stoneLengthCm}
                onChange={(e) => setStoneLengthCm(e.target.value)}
                placeholder="0.00"
                step="0.1"
                min="0"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Steenbreedte (cm)
              </label>
              <input
                type="number"
                value={stoneWidthCm}
                onChange={(e) => setStoneWidthCm(e.target.value)}
                placeholder="0.00"
                step="0.1"
                min="0"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Voegbreedte (mm)
              </label>
              <input
                type="number"
                value={jointWidthMm}
                onChange={(e) => setJointWidthMm(e.target.value)}
                placeholder="10"
                step="1"
                min="0"
                max="50"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {stoneLengthCm && stoneWidthCm && (
            <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
              <p className="text-sm text-purple-800">
                <span className="font-semibold">Steengrootte:</span> {stoneLengthCm}
                cm × {stoneWidthCm}cm
              </p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            Legverband Type
          </h3>

          <div className="space-y-3">
            {BOND_PATTERNS.map((bond) => (
              <button
                key={bond.id}
                onClick={() => setSelectedBond(bond.id)}
                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                  selectedBond === bond.id
                    ? 'border-purple-600 bg-purple-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="font-medium text-slate-900">{bond.name}</div>
                <div className="text-sm text-slate-600 mt-1">
                  {bond.description}
                </div>
              </button>
            ))}
          </div>

          {selectedPattern && (
            <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-sm text-slate-700">
                <span className="font-semibold">Uitleg:</span>{' '}
                {selectedPattern.explanation}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="lg:col-span-1">
        {results ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-fit sticky top-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-purple-100 p-2 rounded-lg">
                <Layers className="w-5 h-5 text-purple-600" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900">Resultaten</h2>
            </div>

            <div className="space-y-4 mb-6">
              <div className="p-4 rounded-lg border border-slate-200 bg-slate-50">
                <div className="text-sm text-slate-600 mb-1">Verband type</div>
                <p className="text-lg font-bold text-slate-900">
                  {selectedPattern?.name}
                </p>
              </div>

              <div className="p-4 rounded-lg border border-slate-200 bg-slate-50">
                <div className="text-sm text-slate-600 mb-1">
                  Originele steengrootte
                </div>
                <p className="text-sm text-slate-900">
                  {results.stoneLength.toFixed(1)} cm × {results.stoneWidth.toFixed(1)} cm
                </p>
              </div>

              <div className="p-4 rounded-lg border border-slate-200 bg-slate-50">
                <div className="text-sm text-slate-600 mb-1">Voegbreedte</div>
                <p className="text-sm text-slate-900">
                  {results.jointWidth.toFixed(1)} cm ({jointWidthMm} mm)
                </p>
              </div>
            </div>

            <div className="p-5 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg text-white">
              <p className="text-xs text-purple-100 mb-2">
                Kant tot kant per leg
              </p>
              <p className="text-4xl font-bold">
                {results.dimensionPerRow.toFixed(2)}
              </p>
              <p className="text-xs text-purple-100 mt-2">cm</p>
            </div>

            <div className="mt-4 p-3 bg-slate-100 rounded-lg border border-slate-300 text-xs text-slate-700">
              <p>
                <span className="font-semibold">Dit is:</span>{' '}
                {(results.dimensionPerRow / 100).toFixed(3)} meter
              </p>
            </div>

            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200 flex items-start gap-3">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600" />
              <p className="text-xs text-blue-800">
                Dit is de breedte van kant tot kant bij het gekozen legverband,
                inclusief voeg.
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
                Voer steenafmetingen in om de berekening te starten
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
