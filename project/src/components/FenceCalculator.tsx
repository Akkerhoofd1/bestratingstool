import { useState } from 'react';
import { Fence, Calculator, Plus, Trash2 } from 'lucide-react';

interface FenceSection {
  id: number;
  length: string;
}

interface Gate {
  id: number;
  width: string;
}

interface SectionResult {
  sectionId: number;
  length: number;
  panels: number;
  posts: number;
  layout: string;
  remainingCm: number;
}

interface FenceResults {
  totalLength: number;
  panels: number;
  posts: number;
  concrete: number;
  concreteBags: number;
  cornerPosts: number;
  sectionResults: SectionResult[];
}

const FenceCalculator = () => {
  const [sections, setSections] = useState<FenceSection[]>([{ id: 1, length: '10' }]);
  const [panelWidth, setPanelWidth] = useState<string>('180');
  const [height, setHeight] = useState<string>('180');
  const [postType, setPostType] = useState<'wood' | 'concrete'>('wood');
  const [postThickness, setPostThickness] = useState<string>('10');
  const [corners, setCorners] = useState<string>('0');
  const [gates, setGates] = useState<Gate[]>([]);
  const [includeCapCovers, setIncludeCapCovers] = useState<boolean>(false);
  const [results, setResults] = useState<FenceResults | null>(null);

  const addSection = () => {
    const newId = sections.length > 0 ? Math.max(...sections.map(s => s.id)) + 1 : 1;
    setSections([...sections, { id: newId, length: '0' }]);
  };

  const removeSection = (id: number) => {
    if (sections.length > 1) {
      setSections(sections.filter(s => s.id !== id));
    }
  };

  const updateSectionLength = (id: number, length: string) => {
    setSections(sections.map(s => s.id === id ? { ...s, length } : s));
  };

  const addGate = () => {
    const newId = gates.length > 0 ? Math.max(...gates.map(g => g.id)) + 1 : 1;
    setGates([...gates, { id: newId, width: '100' }]);
  };

  const removeGate = (id: number) => {
    setGates(gates.filter(g => g.id !== id));
  };

  const updateGateWidth = (id: number, width: string) => {
    setGates(gates.map(g => g.id === id ? { ...g, width } : g));
  };

  const calculateSectionLayout = (lengthM: number, panelWidthCm: number, postThicknessCm: number) => {
    const totalLengthCm = lengthM * 100;

    let layout = '';
    let currentLengthCm = 0;
    let panelCount = 0;
    let postCount = 1;

    layout = 'Paal';
    currentLengthCm += postThicknessCm;

    while (currentLengthCm + panelWidthCm + postThicknessCm <= totalLengthCm) {
      layout += ' + Paneel + Paal';
      currentLengthCm += panelWidthCm + postThicknessCm;
      panelCount++;
      postCount++;
    }

    const remainingCm = totalLengthCm - currentLengthCm;

    return { layout, panelCount, postCount, remainingCm };
  };

  const calculateFence = () => {
    const totalLength = sections.reduce((sum, section) => {
      return sum + (parseFloat(section.length) || 0);
    }, 0);

    const gateLength = gates.reduce((sum, gate) => {
      return sum + (parseFloat(gate.width) || 0) / 100;
    }, 0);

    const panelWidthCm = parseFloat(panelWidth) || 180;
    const heightCm = parseFloat(height) || 180;
    const numCorners = parseInt(corners) || 0;
    const postThicknessCm = parseFloat(postThickness) || 10;

    const sectionResults: SectionResult[] = sections.map(section => {
      const sectionLength = parseFloat(section.length) || 0;
      const { layout, panelCount, postCount, remainingCm } = calculateSectionLayout(
        sectionLength,
        panelWidthCm,
        postThicknessCm
      );

      return {
        sectionId: section.id,
        length: sectionLength,
        panels: panelCount,
        posts: postCount,
        layout,
        remainingCm
      };
    });

    const totalPanels = sectionResults.reduce((sum, sr) => sum + sr.panels, 0);
    const totalPosts = sectionResults.reduce((sum, sr) => sum + sr.posts, 0);

    const numberOfPosts = totalPosts + numCorners;

    let concretePerPost: number;

    if (postType === 'wood') {
      concretePerPost = 0.025 + (postThicknessCm - 10) * 0.001;
    } else {
      if (heightCm <= 150) {
        concretePerPost = 0.03;
      } else if (heightCm <= 180) {
        concretePerPost = 0.035;
      } else {
        concretePerPost = 0.04;
      }
      concretePerPost += (postThicknessCm - 10) * 0.002;
    }

    const totalConcrete = numberOfPosts * concretePerPost;

    const concreteBags = Math.ceil(totalConcrete / 0.025);

    setResults({
      totalLength,
      panels: totalPanels,
      posts: numberOfPosts,
      concrete: totalConcrete,
      concreteBags: concreteBags,
      cornerPosts: numCorners,
      sectionResults
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-6 rounded-xl shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <Fence className="w-8 h-8" />
          <h2 className="text-2xl font-bold">Schuttingenberekening</h2>
        </div>
        <p className="text-emerald-50">
          Bereken benodigde schuttingpanelen, palen en beton
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Fence className="w-5 h-5 text-emerald-600" />
            Schutting Details
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Lengtes (m)
              </label>
              <div className="space-y-2">
                {sections.map((section, index) => (
                  <div key={section.id} className="flex gap-2 items-center">
                    <span className="text-xs text-slate-500 w-16">Lengte {index + 1}:</span>
                    <input
                      type="number"
                      value={section.length}
                      onChange={(e) => updateSectionLength(section.id, e.target.value)}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                      placeholder="0"
                      step="0.1"
                    />
                    {sections.length > 1 && (
                      <button
                        onClick={() => removeSection(section.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={addSection}
                  className="w-full px-3 py-2 border border-emerald-300 text-emerald-700 rounded-lg hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Lengte toevoegen
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Aantal hoeken
              </label>
              <input
                type="number"
                value={corners}
                onChange={(e) => setCorners(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="0"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Poorten / Openingen (cm)
              </label>
              <div className="space-y-2">
                {gates.map((gate, index) => (
                  <div key={gate.id} className="flex gap-2 items-center">
                    <span className="text-xs text-slate-500 w-16">Poort {index + 1}:</span>
                    <input
                      type="number"
                      value={gate.width}
                      onChange={(e) => updateGateWidth(gate.id, e.target.value)}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                      placeholder="100"
                      step="1"
                    />
                    <button
                      onClick={() => removeGate(gate.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={addGate}
                  className="w-full px-3 py-2 border border-emerald-300 text-emerald-700 rounded-lg hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Poort toevoegen
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Hoogte schutting (cm)
              </label>
              <select
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="150">150 cm</option>
                <option value="180">180 cm</option>
                <option value="200">200 cm</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Breedte paneel (cm)
              </label>
              <select
                value={panelWidth}
                onChange={(e) => setPanelWidth(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="150">150 cm</option>
                <option value="180">180 cm</option>
                <option value="200">200 cm</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Type paal
              </label>
              <select
                value={postType}
                onChange={(e) => setPostType(e.target.value as 'wood' | 'concrete')}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="wood">Houten paal</option>
                <option value="concrete">Betonnen paal</option>
              </select>
            </div>

            {postType === 'concrete' && (
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeCapCovers}
                    onChange={(e) => setIncludeCapCovers(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                  />
                  <span className="text-sm font-medium text-slate-700">
                    Afdekkappen toevoegen (per paneel)
                  </span>
                </label>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Dikte paal (cm)
              </label>
              <input
                type="number"
                value={postThickness}
                onChange={(e) => setPostThickness(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="10"
                step="1"
                min="8"
                max="20"
              />
            </div>

            <button
              onClick={calculateFence}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-3 rounded-lg font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
              <Calculator className="w-5 h-5" />
              Bereken
            </button>
          </div>
        </div>

        {results && (
          <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
            <h3 className="font-semibold text-slate-900 mb-4">Resultaten</h3>

            <div className="space-y-4">
              <div className="bg-sky-50 p-4 rounded-lg border border-sky-200">
                <div className="flex justify-between items-center">
                  <span className="text-slate-700 font-medium">Totale lengte</span>
                  <span className="text-2xl font-bold text-sky-700">
                    {results.totalLength.toFixed(1)} m
                  </span>
                </div>
                {gates.length > 0 && (
                  <p className="text-xs text-slate-600 mt-1">
                    Minus {gates.length} poort(en)
                  </p>
                )}
              </div>

              <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                <div className="flex justify-between items-center">
                  <span className="text-slate-700 font-medium">Schuttingpanelen</span>
                  <span className="text-2xl font-bold text-emerald-700">
                    {results.panels}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  {panelWidth}cm breed × {height}cm hoog
                </p>
              </div>

              <div className="bg-teal-50 p-4 rounded-lg border border-teal-200">
                <div className="flex justify-between items-center">
                  <span className="text-slate-700 font-medium">
                    {postType === 'wood' ? 'Houten' : 'Betonnen'} palen
                  </span>
                  <span className="text-2xl font-bold text-teal-700">
                    {results.posts}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  {postThickness}cm dik • {results.cornerPosts > 0 ? `${results.cornerPosts} hoekpalen + ` : ''}{results.posts - results.cornerPosts} standaardpalen
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div className="flex justify-between items-center">
                  <span className="text-slate-700 font-medium">Beton benodigd</span>
                  <span className="text-2xl font-bold text-slate-700">
                    {results.concrete.toFixed(2)} m³
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Ca. {results.concreteBags} zakken droge beton (25kg)
                </p>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <h4 className="font-semibold text-slate-900 mb-3 text-sm">Indeling per lengte</h4>
                <div className="space-y-3">
                  {results.sectionResults.map((section, index) => (
                    <div key={section.sectionId} className="bg-white p-3 rounded-lg border border-purple-300">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-semibold text-slate-800">
                          Lengte {index + 1}: {section.length.toFixed(2)}m
                        </span>
                        <span className="text-xs text-slate-600">
                          {section.panels} panelen • {section.posts} palen
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 mb-2 break-words leading-relaxed">
                        {section.layout}
                      </p>
                      <div className="bg-purple-50 p-2 rounded border border-purple-200">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-medium text-slate-700">Restant om te zagen:</span>
                          <span className="text-lg font-bold text-purple-700">
                            {section.remainingCm.toFixed(1)} cm
                          </span>
                        </div>
                        {section.remainingCm >= parseFloat(panelWidth) && (
                          <p className="text-xs text-purple-600 mt-1">
                            Je kunt nog een volledig paneel plaatsen!
                          </p>
                        )}
                        {section.remainingCm < parseFloat(panelWidth) && section.remainingCm > parseFloat(postThickness) && (
                          <p className="text-xs text-purple-600 mt-1">
                            Zaaglengte paneel: {(section.remainingCm - parseFloat(postThickness)).toFixed(1)}cm
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-slate-900 mb-3 text-sm">Totaal materiaal</h4>
                <div className="space-y-3">
                  <div className="bg-white p-3 rounded-lg">
                    <h5 className="font-semibold text-xs text-slate-600 mb-2">Panelen</h5>
                    <ul className="space-y-1 text-sm text-slate-700">
                      <li>• {results.panels}× schuttingpaneel {panelWidth}×{height}cm</li>
                      {postType === 'concrete' && includeCapCovers && (
                        <li>• {results.panels}× afdekkappen voor panelen</li>
                      )}
                    </ul>
                  </div>

                  <div className="bg-white p-3 rounded-lg">
                    <h5 className="font-semibold text-xs text-slate-600 mb-2">Palen</h5>
                    <ul className="space-y-1 text-sm text-slate-700">
                      <li>• {results.posts}× {postType === 'wood' ? 'houten' : 'betonnen'} paal ({postThickness}cm)</li>
                      {results.cornerPosts > 0 && <li>• {results.cornerPosts}× hoekpalen voor {corners} hoeken</li>}
                      <li>• {results.posts}× bevestigingsset per paal</li>
                    </ul>
                  </div>

                  <div className="bg-white p-3 rounded-lg">
                    <h5 className="font-semibold text-xs text-slate-600 mb-2">Fundering</h5>
                    <ul className="space-y-1 text-sm text-slate-700">
                      <li>• {results.concreteBags} zakken droge beton (25kg)</li>
                      <li>• {results.concrete.toFixed(2)} m³ totaal beton</li>
                    </ul>
                  </div>

                  {gates.length > 0 && (
                    <div className="bg-white p-3 rounded-lg">
                      <h5 className="font-semibold text-xs text-slate-600 mb-2">Poorten</h5>
                      <ul className="space-y-1 text-sm text-slate-700">
                        <li>• {gates.length}× poort(en) met kozijn</li>
                        <li>• {gates.length}× hang- en sluitwerk set</li>
                      </ul>
                    </div>
                  )}

                  <div className="bg-white p-3 rounded-lg">
                    <h5 className="font-semibold text-xs text-slate-600 mb-2">Extra</h5>
                    <ul className="space-y-1 text-sm text-slate-700">
                      <li>• Schroeven/bevestigingsmaterialen</li>
                      <li>• Waterpas en meetgereedschap</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                <p className="text-xs text-amber-800">
                  <strong>Let op:</strong> Houd rekening met 5-10% extra materiaal voor snijverlies en beschadigingen. Poorten/kozijnen zijn niet inbegrepen in de berekening.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FenceCalculator;
