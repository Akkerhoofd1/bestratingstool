import React, { useState, useEffect } from 'react';
import { Calculator, Info, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';

type BondPattern = 'block' | 'stretcher' | 'herringbone' | 'diagonal';

interface DimensionInputs {
  length: string;
  width: string;
}

interface PaverInputs {
  length: string;
  width: string;
}

interface PaverSize {
  id: string;
  name: string;
  length: number;
  width: number;
  is_standard: boolean;
}

interface EdgeCalculation {
  side: string;
  length: number;
  wholePavers: number;
  halfPavers: number;
}

interface CalculationResult {
  area: number;
  paverArea: number;
  wholePaversForArea: number;
  edges: EdgeCalculation[];
  totalHalfPavers: number;
  totalWholePavers: number;
  wholePaversWithWaste: number;
  halfPaversWithWaste: number;
  wastePercentage: number;
}

export default function AdvancedPaverSystem() {
  const [dimensions, setDimensions] = useState<DimensionInputs>({ length: '', width: '' });
  const [paver, setPaver] = useState<PaverInputs>({ length: '21', width: '10.5' });
  const [bondPattern, setBondPattern] = useState<BondPattern>('stretcher');
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [paverSizes, setPaverSizes] = useState<PaverSize[]>([]);
  const [selectedSize, setSelectedSize] = useState<string>('custom');
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [customName, setCustomName] = useState('');

  useEffect(() => {
    loadPaverSizes();
  }, []);

  const loadPaverSizes = async () => {
    const { data, error } = await supabase
      .from('paver_sizes')
      .select('*')
      .order('is_standard', { ascending: false })
      .order('name');

    if (data) {
      setPaverSizes(data);
    }
  };

  const handleSizeSelect = (sizeId: string) => {
    setSelectedSize(sizeId);
    if (sizeId === 'custom') {
      return;
    }
    const size = paverSizes.find(s => s.id === sizeId);
    if (size) {
      setPaver({
        length: size.length.toString(),
        width: size.width.toString()
      });
    }
  };

  const handleAddCustomSize = async () => {
    if (!customName || !paver.length || !paver.width) {
      alert('Vul alle velden in');
      return;
    }

    const { data, error } = await supabase
      .from('paver_sizes')
      .insert({
        name: customName,
        length: parseFloat(paver.length),
        width: parseFloat(paver.width),
        is_standard: false
      })
      .select()
      .single();

    if (data) {
      await loadPaverSizes();
      setSelectedSize(data.id);
      setShowAddCustom(false);
      setCustomName('');
    } else if (error) {
      alert('Fout bij opslaan: ' + error.message);
    }
  };

  const calculateHalfPavers = (
    lengthM: number,
    paverLengthCm: number,
    paverWidthCm: number,
    pattern: BondPattern,
    sideName: string
  ): { wholePavers: number; halfPavers: number } => {
    const jointCm = 0.2;
    const lengthCm = lengthM * 100;

    if (pattern === 'block') {
      return { wholePavers: 0, halfPavers: 0 };
    }

    if (pattern === 'stretcher') {
      const effectiveLength = paverLengthCm + jointCm;

      if (sideName.includes('Korte')) {
        const numberOfRows = Math.floor(lengthCm / (paverWidthCm + jointCm));
        const halfPavers = numberOfRows / 2;
        return { wholePavers: 0, halfPavers };
      } else {
        return { wholePavers: 0, halfPavers: 0 };
      }
    }

    if (pattern === 'herringbone') {
      const patternUnit = paverLengthCm + paverWidthCm + (2 * jointCm);
      const halfSize = (paverLengthCm / 2) + jointCm;
      const halfPavers = Math.floor(lengthCm / halfSize);
      const wholePavers = Math.floor(lengthCm / patternUnit);

      return { wholePavers, halfPavers };
    }

    if (pattern === 'diagonal') {
      const effectiveLength = paverLengthCm + jointCm;
      const paversOnEdge = Math.floor(lengthCm / effectiveLength);
      const diagonalPavers = Math.ceil(paversOnEdge * 1.41);

      return { wholePavers: paversOnEdge, halfPavers: diagonalPavers };
    }

    return { wholePavers: 0, halfPavers: 0 };
  };

  const calculate = () => {
    const L = parseFloat(dimensions.length);
    const B = parseFloat(dimensions.width);
    const l = parseFloat(paver.length);
    const b = parseFloat(paver.width);

    if (!L || !B || !l || !b) return;

    const area = L * B;

    const jointCm = 0.2;
    const paverArea = ((l + jointCm) * (b + jointCm)) / 10000;

    const wholePaversForArea = Math.ceil(area / paverArea);

    const edges: EdgeCalculation[] = [
      {
        side: 'Lange zijde 1 (boven)',
        length: L,
        ...calculateHalfPavers(L, l, b, bondPattern, 'Lange zijde 1')
      },
      {
        side: 'Lange zijde 2 (onder)',
        length: L,
        ...calculateHalfPavers(L, l, b, bondPattern, 'Lange zijde 2')
      },
      {
        side: 'Korte zijde 1 (links)',
        length: B,
        ...calculateHalfPavers(B, l, b, bondPattern, 'Korte zijde 1')
      },
      {
        side: 'Korte zijde 2 (rechts)',
        length: B,
        ...calculateHalfPavers(B, l, b, bondPattern, 'Korte zijde 2')
      }
    ];

    const totalHalfPavers = edges.reduce((sum, edge) => sum + edge.halfPavers, 0);
    const totalWholePavers = wholePaversForArea;
    const wholePaversWithWaste = Math.ceil(totalWholePavers * 1.07);
    const halfPaversWithWaste = Math.ceil(totalHalfPavers);

    setResult({
      area,
      paverArea,
      wholePaversForArea,
      edges,
      totalHalfPavers,
      totalWholePavers,
      wholePaversWithWaste,
      halfPaversWithWaste,
      wastePercentage: 7
    });
  };

  const bondPatternInfo: Record<BondPattern, string> = {
    block: 'Geen halve stenen nodig (mits veelvoud van steenmaat)',
    stretcher: 'Halve stenen alleen op korte zijden: 1 per 2 rijen',
    herringbone: `Elke ${paver.length}+${paver.width} = ${parseFloat(paver.length) + parseFloat(paver.width)}cm: 1 halve steen aan alle zijden`,
    diagonal: 'Elke steen op de rand moet schuin gezaagd (×1,41)'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Calculator className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-800">Geavanceerde Bestratings Calculator</h1>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-600 p-4 mb-8">
            <p className="text-sm text-gray-700">
              Deze calculator berekent exact hoeveel hele en halve stenen je nodig hebt, inclusief specificaties per zijde.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Stap 1: Vakafmetingen</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Lengte (L) in meters
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={dimensions.length}
                      onChange={(e) => setDimensions({ ...dimensions, length: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="bijv. 4.62"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Breedte (B) in meters
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={dimensions.width}
                      onChange={(e) => setDimensions({ ...dimensions, width: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="bijv. 3.50"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Stap 2: Steenafmetingen</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Kies steenmaat
                    </label>
                    <select
                      value={selectedSize}
                      onChange={(e) => handleSizeSelect(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    >
                      <option value="custom">Eigen maat invoeren</option>
                      {paverSizes.map(size => (
                        <option key={size.id} value={size.id}>
                          {size.name} ({size.length}×{size.width}cm)
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedSize === 'custom' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Lengte steen (l) in cm
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={paver.length}
                          onChange={(e) => setPaver({ ...paver, length: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="bijv. 21"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Breedte steen (b) in cm
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={paver.width}
                          onChange={(e) => setPaver({ ...paver, width: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="bijv. 10.5"
                        />
                      </div>

                      {!showAddCustom ? (
                        <button
                          onClick={() => setShowAddCustom(true)}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          Opslaan als nieuwe steenmaat
                        </button>
                      ) : (
                        <div className="space-y-3 p-4 bg-green-50 rounded-lg border border-green-200">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Naam voor deze steenmaat
                            </label>
                            <input
                              type="text"
                              value={customName}
                              onChange={(e) => setCustomName(e.target.value)}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                              placeholder="bijv. Mijn tegel 25x25"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={handleAddCustomSize}
                              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                              Opslaan
                            </button>
                            <button
                              onClick={() => {
                                setShowAddCustom(false);
                                setCustomName('');
                              }}
                              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                            >
                              Annuleren
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Stap 3: Legverband</h2>
              <div className="space-y-3">
                {[
                  { value: 'block' as BondPattern, label: 'Blokverband', desc: 'Stenen recht boven elkaar' },
                  { value: 'stretcher' as BondPattern, label: 'Halfsteensverband', desc: 'Halve verschuiving per rij' },
                  { value: 'herringbone' as BondPattern, label: 'Elleboogverband', desc: 'L-patroon herhaling' },
                  { value: 'diagonal' as BondPattern, label: 'Visgraat 45°', desc: 'Diagonaal patroon' }
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setBondPattern(option.value)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      bondPattern === option.value
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="font-semibold text-gray-800">{option.label}</div>
                    <div className="text-sm text-gray-600 mt-1">{option.desc}</div>
                  </button>
                ))}
              </div>

              <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-gray-700">
                    <strong>Logica voor dit verband:</strong><br />
                    {bondPatternInfo[bondPattern]}
                  </div>
                </div>
              </div>

              <button
                onClick={calculate}
                className="w-full mt-6 bg-blue-600 text-white py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg"
              >
                Bereken Materiaalstaat
              </button>
            </div>
          </div>
        </div>

        {result && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Stap 4: Materiaalstaat Overzicht</h2>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
                <div className="text-sm text-gray-600 mb-1">Totaal Oppervlakte</div>
                <div className="text-3xl font-bold text-blue-900">{result.area.toFixed(2)} m²</div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
                <div className="text-sm text-gray-600 mb-1">Oppervlakte per Steen</div>
                <div className="text-3xl font-bold text-green-900">{(result.paverArea * 10000).toFixed(2)} cm²</div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
                <div className="text-sm text-gray-600 mb-1">Voegmarge</div>
                <div className="text-3xl font-bold text-purple-900">2 mm</div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Binnenvlak Berekening</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Hele stenen voor binnenvlak:</span>
                    <span className="text-2xl font-bold text-gray-900">{result.wholePaversForArea} stuks</span>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Randstenen per Zijde</h3>
                <div className="space-y-3">
                  {result.edges.map((edge, idx) => (
                    <div key={idx} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-semibold text-gray-800">{edge.side}</div>
                          <div className="text-sm text-gray-600">{edge.length.toFixed(2)}m lengte</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-600">Halve stenen:</div>
                          <div className="text-xl font-bold text-blue-600">{edge.halfPavers} stuks</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Totaal Overzicht</h3>
                <div className="space-y-3">
                  <div className="bg-blue-50 p-4 rounded-lg flex justify-between items-center">
                    <span className="font-medium text-gray-700">Hele stenen benodigd:</span>
                    <span className="text-xl font-bold text-blue-900">{result.totalWholePavers} stuks</span>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg flex justify-between items-center">
                    <span className="font-medium text-gray-700">Halve stenen benodigd:</span>
                    <span className="text-xl font-bold text-green-900">{result.totalHalfPavers.toFixed(2)} stuks</span>
                  </div>

                  <div className="bg-gradient-to-r from-red-100 to-red-200 p-6 rounded-lg border-2 border-red-300 mt-4">
                    <div className="font-bold text-gray-800 text-lg mb-3">TE BESTELLEN (incl. {result.wastePercentage}% snijverlies):</div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/50 p-4 rounded-lg">
                        <div className="text-sm text-gray-600 mb-1">Hele stenen:</div>
                        <div className="text-3xl font-bold text-red-900">{result.wholePaversWithWaste} stuks</div>
                      </div>
                      <div className="bg-white/50 p-4 rounded-lg">
                        <div className="text-sm text-gray-600 mb-1">Halve stenen:</div>
                        <div className="text-3xl font-bold text-red-900">{result.halfPaversWithWaste} stuks</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Berekening Details</h3>
                <div className="bg-slate-50 p-4 rounded-lg text-sm text-gray-700 space-y-2">
                  <div>• Oppervlakte: {result.area.toFixed(2)} m² = {result.wholePaversForArea} hele stenen</div>
                  <div>• Halve stenen voor randen: {result.totalHalfPavers.toFixed(2)} stuks</div>
                  <div>• Snijverlies van {result.wastePercentage}% alleen op hele stenen (omtrek wijzigt niet):</div>
                  <div className="ml-4">- Hele stenen: {result.totalWholePavers} × 1.07 = {result.wholePaversWithWaste} stuks</div>
                  <div className="ml-4">- Halve stenen: {result.totalHalfPavers.toFixed(2)} stuks (geen snijverlies)</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
