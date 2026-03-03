import { Square } from 'lucide-react';

interface DimensionsInputProps {
  length: string;
  width: string;
  onLengthChange: (value: string) => void;
  onWidthChange: (value: string) => void;
}

export default function DimensionsInput({
  length,
  width,
  onLengthChange,
  onWidthChange,
}: DimensionsInputProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-blue-100 p-2 rounded-lg">
          <Square className="w-5 h-5 text-blue-600" />
        </div>
        <h2 className="text-xl font-semibold text-slate-900">
          Projectafmetingen
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Lengte (meter)
          </label>
          <input
            type="number"
            value={length}
            onChange={(e) => onLengthChange(e.target.value)}
            placeholder="0.00"
            step="0.01"
            min="0"
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Breedte (meter)
          </label>
          <input
            type="number"
            value={width}
            onChange={(e) => onWidthChange(e.target.value)}
            placeholder="0.00"
            step="0.01"
            min="0"
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      {length && width && parseFloat(length) > 0 && parseFloat(width) > 0 && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            <span className="font-semibold">Oppervlakte:</span>{' '}
            {(parseFloat(length) * parseFloat(width)).toFixed(2)} m²
          </p>
        </div>
      )}
    </div>
  );
}
