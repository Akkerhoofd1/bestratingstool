import React, { useState, useEffect } from 'react';
import { Clock, Save, Calendar, Euro, Ruler, FileText, FileDown, X, Trash2, CreditCard as Edit } from 'lucide-react';
import { supabase } from '../lib/supabase';

const InputField = React.memo(({
  label,
  value,
  onChange,
  type = 'number',
  icon: Icon,
  step = '0.01',
}: {
  label: string;
  value: number | string;
  onChange: (value: number | string) => void;
  type?: string;
  icon: React.ElementType;
  step?: string;
}) => {
  const displayValue = type === 'number' && value === 0 ? '' : value;

  return (
    <div>
      <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
        <Icon className="w-4 h-4 mr-2" />
        {label}
      </label>
      <input
        type={type}
        value={displayValue}
        onChange={(e) => {
          if (type === 'number') {
            const val = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0;
            onChange(val);
          } else {
            onChange(e.target.value);
          }
        }}
        step={step}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>
  );
});

interface Registration {
  id?: string;
  date: string;
  week_number: number;
  year: number;
  stratenmaker_hours: number;
  stratenmaker_rate: number;
  opperman_hours: number;
  opperman_rate: number;
  koppel_hours: number;
  koppel_rate: number;
  sawing_meters: number;
  sawing_rate: number;
  sawing_material: string;
  total_labor_cost: number;
  total_sawing_cost: number;
  total_cost: number;
  notes: string;
}

interface WeeklySummary {
  week_number: number;
  year: number;
  total_hours: number;
  total_cost: number;
  entries_count: number;
}

interface SawingItem {
  material: string;
  meters: number;
  rate: number;
  cost: number;
  inputType: 'meters' | 'pieces';
  pieces?: number;
  sizeCm?: number;
}

export default function HoursRegistration() {
  const defaultSawingMaterials = [
    { name: 'Banden 13/15', sizeCm: null },
    { name: 'Banden 18/20', sizeCm: null },
    { name: 'Banden 12/25', sizeCm: null },
    { name: 'Banden 10/20', sizeCm: null },
    { name: 'Banden 6/20', sizeCm: null },
    { name: 'Banden 6/15', sizeCm: null },
    { name: 'Banden 5/15', sizeCm: null },
    { name: '30x30 4.5m1', sizeCm: 30 },
    { name: '30x30 8cm', sizeCm: 30 },
  ];

  const getSavedRates = () => {
    const saved = localStorage.getItem('savedRates');
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      stratenmaker_rate: 0,
      opperman_rate: 0,
      koppel_rate: 0,
      sawing_rate: 0,
    };
  };

  const getSavedMaterials = () => {
    const saved = localStorage.getItem('customSawingMaterials');
    if (saved) {
      return JSON.parse(saved);
    }
    return [];
  };

  const savedRates = getSavedRates();

  const [formData, setFormData] = useState<Registration>({
    date: new Date().toISOString().split('T')[0],
    week_number: getWeekNumber(new Date()),
    year: new Date().getFullYear(),
    stratenmaker_hours: 0,
    stratenmaker_rate: savedRates.stratenmaker_rate,
    opperman_hours: 0,
    opperman_rate: savedRates.opperman_rate,
    koppel_hours: 0,
    koppel_rate: savedRates.koppel_rate,
    sawing_meters: 0,
    sawing_rate: savedRates.sawing_rate,
    sawing_material: defaultSawingMaterials[0],
    total_labor_cost: 0,
    total_sawing_cost: 0,
    total_cost: 0,
    notes: '',
  });

  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [weeklySummaries, setWeeklySummaries] = useState<WeeklySummary[]>([]);
  const [selectedView, setSelectedView] = useState<'day' | 'week'>('day');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [customMaterials, setCustomMaterials] = useState<string[]>(getSavedMaterials());
  const [showCustomMaterialInput, setShowCustomMaterialInput] = useState(false);
  const [newCustomMaterial, setNewCustomMaterial] = useState('');
  const [generatedText, setGeneratedText] = useState<string>('');
  const [sawingItems, setSawingItems] = useState<SawingItem[]>([]);
  const [currentSawingMaterial, setCurrentSawingMaterial] = useState(defaultSawingMaterials[0].name);
  const [currentSawingMeters, setCurrentSawingMeters] = useState(0);
  const [currentSawingRate, setCurrentSawingRate] = useState(savedRates.sawing_rate);
  const [sawingInputType, setSawingInputType] = useState<'meters' | 'pieces'>('meters');
  const [currentSawingPieces, setCurrentSawingPieces] = useState(0);
  const [currentSawingSizeCm, setCurrentSawingSizeCm] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleMaterialChange = (materialName: string) => {
    if (materialName === '__custom__') {
      setShowCustomMaterialInput(true);
      return;
    }

    setCurrentSawingMaterial(materialName);

    const material = defaultSawingMaterials.find(m => m.name === materialName);
    if (material && material.sizeCm) {
      setCurrentSawingSizeCm(material.sizeCm);
      setSawingInputType('pieces');
    }
  };

  function getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }

  useEffect(() => {
    loadRegistrations();
  }, []);

  const loadRegistrations = async () => {
    try {
      const { data, error } = await supabase
        .from('hours_registration')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;

      if (data) {
        setRegistrations(data);
        calculateWeeklySummaries(data);
      }
    } catch (error) {
      console.error('Error loading registrations:', error);
    }
  };

  const calculateWeeklySummaries = (data: Registration[]) => {
    const summaries = new Map<string, WeeklySummary>();

    data.forEach((reg) => {
      const key = `${reg.year}-W${reg.week_number}`;
      const existing = summaries.get(key);

      const totalHours =
        (reg.stratenmaker_hours || 0) +
        (reg.opperman_hours || 0) +
        (reg.koppel_hours || 0);

      if (existing) {
        existing.total_hours += totalHours;
        existing.total_cost += reg.total_cost || 0;
        existing.entries_count += 1;
      } else {
        summaries.set(key, {
          week_number: reg.week_number,
          year: reg.year,
          total_hours: totalHours,
          total_cost: reg.total_cost || 0,
          entries_count: 1,
        });
      }
    });

    setWeeklySummaries(Array.from(summaries.values()).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.week_number - a.week_number;
    }));
  };

  const handleInputChange = (field: keyof Registration, value: string | number) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };

      if (field === 'date') {
        const date = new Date(value as string);
        updated.week_number = getWeekNumber(date);
        updated.year = date.getFullYear();
      }

      const strHours = typeof updated.stratenmaker_hours === 'string' ? parseFloat(updated.stratenmaker_hours) || 0 : updated.stratenmaker_hours;
      const strRate = typeof updated.stratenmaker_rate === 'string' ? parseFloat(updated.stratenmaker_rate) || 0 : updated.stratenmaker_rate;
      const oppHours = typeof updated.opperman_hours === 'string' ? parseFloat(updated.opperman_hours) || 0 : updated.opperman_hours;
      const oppRate = typeof updated.opperman_rate === 'string' ? parseFloat(updated.opperman_rate) || 0 : updated.opperman_rate;
      const koppelHours = typeof updated.koppel_hours === 'string' ? parseFloat(updated.koppel_hours) || 0 : updated.koppel_hours;
      const koppelRate = typeof updated.koppel_rate === 'string' ? parseFloat(updated.koppel_rate) || 0 : updated.koppel_rate;
      const sawMeters = typeof updated.sawing_meters === 'string' ? parseFloat(updated.sawing_meters) || 0 : updated.sawing_meters;
      const sawRate = typeof updated.sawing_rate === 'string' ? parseFloat(updated.sawing_rate) || 0 : updated.sawing_rate;

      updated.total_labor_cost = strHours * strRate + oppHours * oppRate + koppelHours * koppelRate;
      updated.total_sawing_cost = sawMeters * sawRate;
      updated.total_cost = updated.total_labor_cost + updated.total_sawing_cost;

      return updated;
    });
  };

  const addCustomMaterial = () => {
    const trimmedMaterial = newCustomMaterial.trim();
    const defaultMaterialNames = defaultSawingMaterials.map(m => m.name);

    if (trimmedMaterial && !customMaterials.includes(trimmedMaterial) && !defaultMaterialNames.includes(trimmedMaterial)) {
      const updated = [...customMaterials, trimmedMaterial];
      setCustomMaterials(updated);
      localStorage.setItem('customSawingMaterials', JSON.stringify(updated));
      setCurrentSawingMaterial(trimmedMaterial);
      setNewCustomMaterial('');
      setShowCustomMaterialInput(false);
    }
  };

  const addSawingItem = () => {
    let meters = currentSawingMeters;

    if (sawingInputType === 'pieces' && currentSawingPieces > 0 && currentSawingSizeCm > 0) {
      meters = (currentSawingPieces * currentSawingSizeCm) / 100;
    }

    if (meters > 0 && currentSawingRate > 0) {
      const cost = meters * currentSawingRate;
      const newItem: SawingItem = {
        material: currentSawingMaterial,
        meters: meters,
        rate: currentSawingRate,
        cost: cost,
        inputType: sawingInputType,
        pieces: sawingInputType === 'pieces' ? currentSawingPieces : undefined,
        sizeCm: sawingInputType === 'pieces' ? currentSawingSizeCm : undefined,
      };

      setSawingItems([...sawingItems, newItem]);

      const totalSawingCost = [...sawingItems, newItem].reduce((sum, item) => sum + item.cost, 0);
      setFormData(prev => ({
        ...prev,
        total_sawing_cost: totalSawingCost,
        total_cost: prev.total_labor_cost + totalSawingCost,
      }));

      setCurrentSawingMeters(0);
      setCurrentSawingPieces(0);
      setCurrentSawingSizeCm(0);
    }
  };

  const removeSawingItem = (index: number) => {
    const updated = sawingItems.filter((_, i) => i !== index);
    setSawingItems(updated);

    const totalSawingCost = updated.reduce((sum, item) => sum + item.cost, 0);
    setFormData(prev => ({
      ...prev,
      total_sawing_cost: totalSawingCost,
      total_cost: prev.total_labor_cost + totalSawingCost,
    }));
  };

  const editRegistration = async (reg: Registration) => {
    try {
      setEditingId(reg.id || null);

      const { data: sawingItemsData } = await supabase
        .from('sawing_items')
        .select('*')
        .eq('registration_id', reg.id);

      const items: SawingItem[] = sawingItemsData?.map(item => ({
        material: item.material,
        meters: item.meters,
        rate: item.rate,
        cost: item.cost,
        inputType: item.input_type as 'meters' | 'pieces',
        pieces: item.pieces || undefined,
        sizeCm: item.size_cm || undefined,
      })) || [];

      setSawingItems(items);
      setFormData(reg);
      setCurrentSawingRate(reg.sawing_rate);
      setCurrentSawingMaterial(reg.sawing_material || defaultSawingMaterials[0].name);

      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('Error loading registration for edit:', error);
      setMessage({ type: 'error', text: 'Fout bij laden van registratie.' });
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    const newDate = new Date();
    setFormData({
      date: newDate.toISOString().split('T')[0],
      week_number: getWeekNumber(newDate),
      year: newDate.getFullYear(),
      stratenmaker_hours: 0,
      stratenmaker_rate: savedRates.stratenmaker_rate,
      opperman_hours: 0,
      opperman_rate: savedRates.opperman_rate,
      koppel_hours: 0,
      koppel_rate: savedRates.koppel_rate,
      sawing_meters: 0,
      sawing_rate: savedRates.sawing_rate,
      sawing_material: defaultSawingMaterials[0].name,
      total_labor_cost: 0,
      total_sawing_cost: 0,
      total_cost: 0,
      notes: '',
    });
    setSawingItems([]);
    setCurrentSawingMeters(0);
    setCurrentSawingPieces(0);
  };

  const deleteRegistration = async (id: string) => {
    if (!confirm('Weet je zeker dat je deze registratie wilt verwijderen?')) {
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('hours_registration')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Registratie succesvol verwijderd!' });
      await loadRegistrations();
    } catch (error) {
      console.error('Error deleting registration:', error);
      setMessage({ type: 'error', text: 'Fout bij verwijderen. Probeer opnieuw.' });
    } finally {
      setLoading(false);
    }
  };

  const deleteCustomMaterial = (material: string) => {
    if (!confirm(`Weet je zeker dat je "${material}" wilt verwijderen?`)) {
      return;
    }

    const updated = customMaterials.filter(m => m !== material);
    setCustomMaterials(updated);
    localStorage.setItem('customSawingMaterials', JSON.stringify(updated));

    if (currentSawingMaterial === material) {
      setCurrentSawingMaterial(defaultSawingMaterials[0]);
    }
  };

  const generateWeekText = async (weekNumber: number, year: number) => {
    const weekRegistrations = registrations.filter(
      reg => reg.week_number === weekNumber && reg.year === year
    );

    if (weekRegistrations.length === 0) {
      setGeneratedText('Geen registraties gevonden voor deze week.');
      return;
    }

    let text = `Week ${weekNumber} - ${year}\n\n`;
    text += '='.repeat(50) + '\n\n';

    let totalStratenmakerHours = 0;
    let totalOppermanHours = 0;
    let totalKoppelHours = 0;
    let totalLaborCost = 0;
    let totalSawingCost = 0;
    let grandTotal = 0;

    const sawingMaterials: { [key: string]: number } = {};
    const remarks: string[] = [];

    for (const reg of weekRegistrations) {
      totalStratenmakerHours += reg.stratenmaker_hours;
      totalOppermanHours += reg.opperman_hours;
      totalKoppelHours += reg.koppel_hours;

      if (reg.remarks && reg.remarks.trim() !== '') {
        const dateStr = new Date(reg.date).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' });
        remarks.push(`${dateStr}: ${reg.remarks}`);
      }

      const { data: sawingItemsData } = await supabase
        .from('sawing_items')
        .select('*')
        .eq('registration_id', reg.id);

      if (sawingItemsData && sawingItemsData.length > 0) {
        sawingItemsData.forEach((item) => {
          if (sawingMaterials[item.material]) {
            sawingMaterials[item.material] += item.meters;
          } else {
            sawingMaterials[item.material] = item.meters;
          }
        });
      }

      totalLaborCost += reg.total_labor_cost;
      totalSawingCost += reg.total_sawing_cost;
      grandTotal += reg.total_cost;
    }

    text += 'ARBEIDSUREN\n';
    text += '-'.repeat(50) + '\n';
    if (totalStratenmakerHours > 0) {
      text += `Stratenmaker: ${totalStratenmakerHours.toFixed(2)} uur\n`;
    }
    if (totalOppermanHours > 0) {
      text += `Opperman: ${totalOppermanHours.toFixed(2)} uur\n`;
    }
    if (totalKoppelHours > 0) {
      text += `Koppel: ${totalKoppelHours.toFixed(2)} uur\n`;
    }
    const totalHours = totalStratenmakerHours + totalOppermanHours + totalKoppelHours;
    text += `\nTotaal uren: ${totalHours.toFixed(2)} uur\n\n`;

    if (Object.keys(sawingMaterials).length > 0) {
      text += 'ZAAGWERK\n';
      text += '-'.repeat(50) + '\n';
      Object.entries(sawingMaterials).forEach(([material, meters]) => {
        text += `${material}: ${meters.toFixed(2)}m\n`;
      });
      const totalSawingMeters = Object.values(sawingMaterials).reduce((sum, meters) => sum + meters, 0);
      text += `\nTotaal gezaagd: ${totalSawingMeters.toFixed(2)}m\n\n`;
    }

    if (remarks.length > 0) {
      text += 'OPMERKINGEN\n';
      text += '-'.repeat(50) + '\n';
      remarks.forEach((remark) => {
        text += `${remark}\n`;
      });
      text += '\n';
    }

    text += '='.repeat(50) + '\n';

    setGeneratedText(text);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedText);
    setMessage({ type: 'success', text: 'Tekst gekopieerd naar klembord!' });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      localStorage.setItem('savedRates', JSON.stringify({
        stratenmaker_rate: formData.stratenmaker_rate,
        opperman_rate: formData.opperman_rate,
        koppel_rate: formData.koppel_rate,
        sawing_rate: currentSawingRate,
      }));

      const totalSawingMeters = sawingItems.reduce((sum, item) => sum + item.meters, 0);
      const totalSawingCost = sawingItems.reduce((sum, item) => sum + item.cost, 0);
      const firstSawingMaterial = sawingItems.length > 0 ? sawingItems[0].material : '';

      const registrationPayload = {
        date: formData.date,
        week_number: formData.week_number,
        year: formData.year,
        stratenmaker_hours: formData.stratenmaker_hours,
        stratenmaker_rate: formData.stratenmaker_rate,
        opperman_hours: formData.opperman_hours,
        opperman_rate: formData.opperman_rate,
        koppel_hours: formData.koppel_hours,
        koppel_rate: formData.koppel_rate,
        sawing_meters: totalSawingMeters,
        sawing_rate: currentSawingRate,
        sawing_material: firstSawingMaterial,
        total_labor_cost: formData.total_labor_cost,
        total_sawing_cost: totalSawingCost,
        total_cost: formData.total_cost,
        notes: formData.notes,
      };

      let registrationId: string;

      if (editingId) {
        const { data: registrationData, error: registrationError } = await supabase
          .from('hours_registration')
          .update(registrationPayload)
          .eq('id', editingId)
          .select();

        if (registrationError) throw registrationError;

        registrationId = editingId;

        await supabase
          .from('sawing_items')
          .delete()
          .eq('registration_id', editingId);

        setMessage({ type: 'success', text: 'Urenregistratie succesvol bijgewerkt!' });
      } else {
        const { data: registrationData, error: registrationError } = await supabase
          .from('hours_registration')
          .insert([registrationPayload])
          .select();

        if (registrationError) throw registrationError;

        if (!registrationData || registrationData.length === 0) {
          throw new Error('Geen data ontvangen na opslaan');
        }

        registrationId = registrationData[0].id;
        setMessage({ type: 'success', text: 'Urenregistratie succesvol opgeslagen!' });
      }

      if (sawingItems.length > 0) {
        const sawingItemsToInsert = sawingItems.map(item => ({
          registration_id: registrationId,
          material: item.material,
          meters: item.meters,
          rate: item.rate,
          cost: item.cost,
          input_type: item.inputType,
          pieces: item.pieces || 0,
          size_cm: item.sizeCm || 0,
        }));

        const { error: sawingError } = await supabase
          .from('sawing_items')
          .insert(sawingItemsToInsert);

        if (sawingError) throw sawingError;
      }

      await loadRegistrations();

      setEditingId(null);
      const newDate = new Date();
      setFormData({
        date: newDate.toISOString().split('T')[0],
        week_number: getWeekNumber(newDate),
        year: newDate.getFullYear(),
        stratenmaker_hours: 0,
        stratenmaker_rate: formData.stratenmaker_rate,
        opperman_hours: 0,
        opperman_rate: formData.opperman_rate,
        koppel_hours: 0,
        koppel_rate: formData.koppel_rate,
        sawing_meters: 0,
        sawing_rate: currentSawingRate,
        sawing_material: currentSawingMaterial,
        total_labor_cost: 0,
        total_sawing_cost: 0,
        total_cost: 0,
        notes: '',
      });
      setSawingItems([]);
      setCurrentSawingMeters(0);
    } catch (error) {
      console.error('Error saving registration:', error);
      setMessage({ type: 'error', text: 'Fout bij opslaan. Probeer opnieuw.' });
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="bg-white rounded-xl shadow-lg p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <Clock className="mr-3 text-blue-600" />
          {editingId ? 'Registratie Bewerken' : 'Urenregistratie'}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedView('day')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedView === 'day'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Per Dag
          </button>
          <button
            onClick={() => setSelectedView('week')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedView === 'week'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Per Week
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <InputField
            label="Datum"
            value={formData.date}
            onChange={(value) => handleInputChange('date', value)}
            type="date"
            icon={Calendar}
          />
          <div className="md:col-span-2 flex items-center gap-4 pt-7">
            <span className="text-sm text-gray-600">
              Week {formData.week_number}, {formData.year}
            </span>
          </div>
        </div>

        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Arbeidsuren</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="Stratenmaker - Uren"
              value={formData.stratenmaker_hours}
              onChange={(value) => handleInputChange('stratenmaker_hours', value)}
              icon={Clock}
            />
            <InputField
              label="Stratenmaker - Uurloon (€)"
              value={formData.stratenmaker_rate}
              onChange={(value) => handleInputChange('stratenmaker_rate', value)}
              icon={Euro}
            />
            <InputField
              label="Opperman - Uren"
              value={formData.opperman_hours}
              onChange={(value) => handleInputChange('opperman_hours', value)}
              icon={Clock}
            />
            <InputField
              label="Opperman - Uurloon (€)"
              value={formData.opperman_rate}
              onChange={(value) => handleInputChange('opperman_rate', value)}
              icon={Euro}
            />
            <InputField
              label="Koppel - Uren"
              value={formData.koppel_hours}
              onChange={(value) => handleInputChange('koppel_hours', value)}
              icon={Clock}
            />
            <InputField
              label="Koppel - Uurloon (€)"
              value={formData.koppel_rate}
              onChange={(value) => handleInputChange('koppel_rate', value)}
              icon={Euro}
            />
          </div>
        </div>

        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Zaagwerk</h3>

          <div className="mb-4">
            <label className="text-sm font-medium text-gray-700 mb-2 block">Invoertype</label>
            <div className="flex gap-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  value="meters"
                  checked={sawingInputType === 'meters'}
                  onChange={(e) => setSawingInputType(e.target.value as 'meters' | 'pieces')}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Meters</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  value="pieces"
                  checked={sawingInputType === 'pieces'}
                  onChange={(e) => setSawingInputType(e.target.value as 'meters' | 'pieces')}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Stuks</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                <Ruler className="w-4 h-4 mr-2" />
                Materiaal
              </label>
              <select
                value={currentSawingMaterial}
                onChange={(e) => handleMaterialChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {defaultSawingMaterials.map(material => (
                  <option key={material.name} value={material.name}>{material.name}</option>
                ))}
                {customMaterials.map(material => (
                  <option key={material} value={material}>{material}</option>
                ))}
                <option value="__custom__">+ Eigen toevoegen</option>
              </select>
            </div>

            {sawingInputType === 'meters' ? (
              <InputField
                label="Aantal meters gezaagd (m1)"
                value={currentSawingMeters}
                onChange={(value) => setCurrentSawingMeters(typeof value === 'string' ? parseFloat(value) || 0 : value)}
                icon={Ruler}
              />
            ) : (
              <>
                <InputField
                  label="Aantal stuks"
                  value={currentSawingPieces}
                  onChange={(value) => setCurrentSawingPieces(typeof value === 'string' ? parseFloat(value) || 0 : value)}
                  icon={Ruler}
                  step="1"
                />
                <div>
                  <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                    <Ruler className="w-4 h-4 mr-2" />
                    Maat per stuk (cm)
                  </label>
                  <input
                    type="number"
                    value={currentSawingSizeCm === 0 ? '' : currentSawingSizeCm}
                    onChange={(e) => {
                      const val = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0;
                      setCurrentSawingSizeCm(val);
                    }}
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Wordt automatisch ingevuld"
                  />
                </div>
                {currentSawingPieces > 0 && currentSawingSizeCm > 0 && (
                  <div className="flex items-end">
                    <div className="bg-blue-50 px-3 py-2 rounded-lg w-full">
                      <p className="text-xs text-gray-600 mb-1">Totaal</p>
                      <p className="text-lg font-semibold text-blue-600">
                        {((currentSawingPieces * currentSawingSizeCm) / 100).toFixed(2)}m1
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}

            <InputField
              label="Prijs per meter (€)"
              value={currentSawingRate}
              onChange={(value) => setCurrentSawingRate(typeof value === 'string' ? parseFloat(value) || 0 : value)}
              icon={Euro}
            />
            <div className="flex items-end">
              <button
                type="button"
                onClick={addSawingItem}
                disabled={
                  (sawingInputType === 'meters' && (currentSawingMeters <= 0 || currentSawingRate <= 0)) ||
                  (sawingInputType === 'pieces' && (currentSawingPieces <= 0 || currentSawingSizeCm <= 0 || currentSawingRate <= 0))
                }
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Toevoegen
              </button>
            </div>
          </div>

          {sawingItems.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Toegevoegd zaagwerk:</h4>
              <div className="space-y-2">
                {sawingItems.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                  >
                    <div className="flex-1">
                      <span className="font-medium text-gray-800">{item.material}</span>
                      <span className="text-gray-600 ml-3">
                        {item.inputType === 'pieces' && item.pieces && item.sizeCm ? (
                          <>
                            {item.pieces} stuks × {item.sizeCm}cm = {item.meters.toFixed(2)}m × €{item.rate} = €{item.cost.toFixed(2)}
                          </>
                        ) : (
                          <>
                            {item.meters.toFixed(2)}m × €{item.rate} = €{item.cost.toFixed(2)}
                          </>
                        )}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeSawingItem(index)}
                      className="px-3 py-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      Verwijder
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {showCustomMaterialInput && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nieuw materiaal toevoegen
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCustomMaterial}
                  onChange={(e) => setNewCustomMaterial(e.target.value)}
                  placeholder="Bijv. Banden 8/20"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCustomMaterial();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={addCustomMaterial}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Toevoegen
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCustomMaterialInput(false);
                    setNewCustomMaterial('');
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Annuleren
                </button>
              </div>
            </div>
          )}

          {customMaterials.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Eigen materialen:</h4>
              <div className="flex flex-wrap gap-2">
                {customMaterials.map(material => (
                  <div
                    key={material}
                    className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-lg"
                  >
                    <span className="text-sm text-gray-700">{material}</span>
                    <button
                      type="button"
                      onClick={() => deleteCustomMaterial(material)}
                      className="text-red-600 hover:text-red-800 transition-colors"
                      title="Verwijder materiaal"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
            <FileText className="w-4 h-4 mr-2" />
            Opmerkingen
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Eventuele opmerkingen..."
          />
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Arbeidskosten</p>
              <p className="text-2xl font-bold text-gray-800">
                {formData.total_labor_cost > 0 ? `€${formData.total_labor_cost.toFixed(2)}` : '-'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Zaagkosten</p>
              <p className="text-2xl font-bold text-gray-800">
                {formData.total_sawing_cost > 0 ? `€${formData.total_sawing_cost.toFixed(2)}` : '-'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Totale kosten</p>
              <p className="text-2xl font-bold text-blue-600">
                {formData.total_cost > 0 ? `€${formData.total_cost.toFixed(2)}` : '-'}
              </p>
            </div>
          </div>
        </div>

        {message && (
          <div
            className={`p-4 rounded-lg ${
              message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 flex items-center justify-center"
          >
            <Save className="mr-2" />
            {loading ? 'Bezig met opslaan...' : editingId ? 'Wijzigingen opslaan' : 'Registratie opslaan'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
            >
              Annuleren
            </button>
          )}
        </div>
      </form>

      {selectedView === 'week' && weeklySummaries.length > 0 && (
        <div className="mt-8 border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Weekoverzicht</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Week
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Totaal Uren
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Totaal Kosten
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aantal Registraties
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acties
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {weeklySummaries.map((summary) => (
                  <tr key={`${summary.year}-W${summary.week_number}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Week {summary.week_number}, {summary.year}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {summary.total_hours.toFixed(2)} uur
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      €{summary.total_cost.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {summary.entries_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => generateWeekText(summary.week_number, summary.year)}
                        className="inline-flex items-center px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <FileDown className="w-4 h-4 mr-1" />
                        Genereer Tekst
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {generatedText && (
            <div className="mt-6 bg-gray-50 rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-semibold text-gray-800">Gegenereerde Weektekst</h4>
                <button
                  onClick={copyToClipboard}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Kopieer naar Klembord
                </button>
              </div>
              <textarea
                value={generatedText}
                readOnly
                rows={20}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg font-mono text-sm bg-white"
              />
            </div>
          )}
        </div>
      )}

      {selectedView === 'day' && registrations.length > 0 && (
        <div className="mt-8 border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Dagelijkse Registraties</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Datum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stratenmaker
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Opperman
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Koppel
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Zaagwerk
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Arbeidskosten
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Zaagkosten
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Totaal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acties
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {registrations.slice(0, 10).map((reg) => (
                  <tr key={reg.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {new Date(reg.date).toLocaleDateString('nl-NL')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {reg.stratenmaker_hours > 0 ? `${reg.stratenmaker_hours}u` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {reg.opperman_hours > 0 ? `${reg.opperman_hours}u` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {reg.koppel_hours > 0 ? `${reg.koppel_hours}u` : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {reg.sawing_meters > 0 ? (
                        <>
                          <div>{reg.sawing_material || 'Onbekend'}</div>
                          <div className="text-xs text-gray-400">{reg.sawing_meters}m</div>
                        </>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {reg.total_labor_cost > 0 ? `€${reg.total_labor_cost.toFixed(2)}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {reg.total_sawing_cost > 0 ? `€${reg.total_sawing_cost.toFixed(2)}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">
                      €{reg.total_cost.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex gap-2">
                        <button
                          onClick={() => editRegistration(reg)}
                          className="inline-flex items-center px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          title="Bewerk registratie"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteRegistration(reg.id!)}
                          className="inline-flex items-center px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                          title="Verwijder registratie"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
