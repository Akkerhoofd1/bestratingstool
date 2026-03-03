import { Package, AlertCircle } from 'lucide-react';
import { PAVER_TYPES, PaverType } from './PaverCalculator';

interface PaverSelectionProps {
  selectedPaver: PaverType;
  onPaverChange: (paver: PaverType) => void;
  customWidth: string;
  customLength: string;
  customHeight: string;
  onCustomWidthChange: (value: string) => void;
  onCustomLengthChange: (value: string) => void;
  onCustomHeightChange: (value: string) => void;
  wastePercentage: string;
  onWastePercentageChange: (value: string) => void;
}

export default function PaverSelection({
  selectedPaver,
  onPaverChange,
  customWidth,
  customLength,
  customHeight,
  onCustomWidthChange,
  onCustomLengthChange,
  onCustomHeightChange,
  wastePercentage,
  onWastePercentageChange,
}: PaverSelectionProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-blue-100 p-2 rounded-lg">
          <Package className="w-5 h-5 text-blue-600" />
        </div>
        <h2 className="text-xl font-semibold text-slate-900">
          Klinker specificaties
        </h2>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3">
            Klinker type
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {PAVER_TYPES.map((paver) => (
              <button
                key={paver.id}
                onClick={() => onPaverChange(paver)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  selectedPaver.id === paver.id
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="font-medium text-slate-900 text-sm">
                  {paver.name}
                </div>
                {paver.id !== 'custom' && (
                  <div className="text-xs text-slate-600 mt-1">
                    {paver.length} × {paver.width} × {paver.height} cm
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {selectedPaver.id === 'custom' && (
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <h3 className="font-medium text-slate-900 mb-3 text-sm">
              Aangepaste afmetingen
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-slate-700 mb-2">
                  Lengte (cm)
                </label>
                <input
                  type="number"
                  value={customLength}
                  onChange={(e) => onCustomLengthChange(e.target.value)}
                  placeholder="0"
                  step="0.1"
                  min="0"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-700 mb-2">
                  Breedte (cm)
                </label>
                <input
                  type="number"
                  value={customWidth}
                  onChange={(e) => onCustomWidthChange(e.target.value)}
                  placeholder="0"
                  step="0.1"
                  min="0"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-700 mb-2">
                  Hoogte (cm)
                </label>
                <input
                  type="number"
                  value={customHeight}
                  onChange={(e) => onCustomHeightChange(e.target.value)}
                  placeholder="0"
                  step="0.1"
                  min="0"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Extra voor breuk/afval (%)
          </label>
          <input
            type="number"
            value={wastePercentage}
            onChange={(e) => onWastePercentageChange(e.target.value)}
            placeholder="5"
            step="1"
            min="0"
            max="50"
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="mt-2 flex items-start gap-2 text-xs text-slate-600">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <p>
              Aanbevolen: 5-10% voor standaard projecten, 10-15% voor complexe patronen
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
