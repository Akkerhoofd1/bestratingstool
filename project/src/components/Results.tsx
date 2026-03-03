import { Calculator, CheckCircle, Package, Square } from 'lucide-react';

interface ResultsProps {
  results: {
    length: number;
    paversNeeded: number;
    wasteAmount: number;
    totalPavers: number;
  } | null;
}

export default function Results({ results }: ResultsProps) {
  if (!results) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-fit sticky top-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-slate-100 p-2 rounded-lg">
            <Calculator className="w-5 h-5 text-slate-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900">Resultaten</h2>
        </div>

        <div className="text-center py-12">
          <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calculator className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-slate-600">
            Voer projectafmetingen in om de berekening te starten
          </p>
        </div>
      </div>
    );
  }

  const resultItems = [
    {
      icon: Square,
      label: 'Totale lengte',
      value: `${results.length.toFixed(2)} m`,
      color: 'blue',
    },
    {
      icon: Package,
      label: 'Aantal tegels nodig',
      value: results.paversNeeded.toLocaleString('nl-NL'),
      color: 'slate',
    },
    {
      icon: Package,
      label: 'Extra voor afval',
      value: results.wasteAmount.toLocaleString('nl-NL'),
      color: 'amber',
    },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-fit sticky top-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-green-100 p-2 rounded-lg">
          <Calculator className="w-5 h-5 text-green-600" />
        </div>
        <h2 className="text-xl font-semibold text-slate-900">Resultaten</h2>
      </div>

      <div className="space-y-4 mb-6">
        {resultItems.map((item, index) => {
          const Icon = item.icon;
          const bgColor = `bg-${item.color}-50`;
          const textColor = `text-${item.color}-600`;

          return (
            <div
              key={index}
              className="p-4 rounded-lg border border-slate-200 bg-slate-50"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`${bgColor} p-1.5 rounded`}>
                  <Icon className={`w-4 h-4 ${textColor}`} />
                </div>
                <span className="text-sm text-slate-600">{item.label}</span>
              </div>
              <p className="text-2xl font-bold text-slate-900 ml-9">
                {item.value}
              </p>
            </div>
          );
        })}
      </div>

      <div className="p-5 bg-gradient-to-br from-green-500 to-green-600 rounded-lg text-white">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium">Totaal te bestellen</span>
        </div>
        <p className="text-4xl font-bold">
          {results.totalPavers.toLocaleString('nl-NL')}
        </p>
        <p className="text-sm text-green-100 mt-1">stuks</p>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-xs text-blue-800 leading-relaxed">
          <span className="font-semibold">Let op:</span> Dit is een indicatieve
          berekening. Neem altijd een kleine marge voor onvoorziene omstandigheden.
        </p>
      </div>
    </div>
  );
}
