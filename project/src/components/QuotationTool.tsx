import { useState, useMemo, useEffect } from 'react';
import { FileText, Plus, Trash2, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Product {
  id: string;
  category: string;
  name: string;
  unit: string;
  price: number;
}

interface SelectedItem {
  id: string;
  productId: string;
  category: string;
  name: string;
  unit: string;
  price: number;
  quantity: number;
}

type CategoryFilter = 'ALL' | 'STRAATWERK' | 'GRONDWERK' | 'PVC' | 'CONTAINERS' | 'VERHUUR' | 'OVERIG';

export default function QuotationTool() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [includePreDriving, setIncludePreDriving] = useState(false);
  const [clientName, setClientName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [placeDate, setPlaceDate] = useState('');
  const [quotationText, setQuotationText] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<CategoryFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const { data: productsData, error } = await supabase
          .from('products')
          .select('*')
          .order('category', { ascending: true })
          .order('name', { ascending: true });

        if (error) throw error;

        if (productsData) {
          const formattedProducts: Product[] = productsData.map((product) => ({
            id: product.id,
            category: product.category,
            name: product.name,
            unit: product.unit || 'stuk',
            price: parseFloat(product.price),
          }));

          setProducts(formattedProducts);
        }
      } catch (error) {
        console.error('Error loading products:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Filter by category
    if (activeFilter !== 'ALL') {
      if (activeFilter === 'CONTAINERS') {
        filtered = filtered.filter(p => p.category.includes('CONTAINER'));
      } else if (activeFilter === 'PVC') {
        filtered = filtered.filter(p => p.category.includes('PVC'));
      } else if (activeFilter === 'OVERIG') {
        filtered = filtered.filter(p =>
          p.category === 'OVERIG' ||
          p.category === 'ARBEID' ||
          p.category === 'GEMEENTEWERK'
        );
      } else {
        filtered = filtered.filter(p => p.category === activeFilter);
      }
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [products, activeFilter, searchQuery]);

  const removeItem = (id: string) => {
    setSelectedItems(selectedItems.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: string, newQuantity: number) => {
    setSelectedItems(
      selectedItems.map((item) =>
        item.id === id ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const totals = useMemo(() => {
    const subtotal = selectedItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    ) + (includePreDriving ? 65 : 0);
    const vat = subtotal * 0.21;
    const total = subtotal + vat;
    return { subtotal, vat, total };
  }, [selectedItems, includePreDriving]);

  const formatCurrency = (amount: number) => {
    return '€' + amount.toFixed(2).replace('.', ',');
  };

  const generateQuotation = () => {
    const lines: string[] = [];

    if (placeDate) {
      lines.push(placeDate, '');
    }

    if (clientName) {
      lines.push(`Geachte ${clientName},`);
    } else {
      lines.push('Geachte heer/mevrouw,');
    }

    lines.push(
      '',
      'Hartelijk dank voor uw aanvraag.',
      'Hierbij ontvangt u onze offerte voor het uitvoeren van de onderstaande werkzaamheden:',
      ''
    );

    if (projectName) {
      lines.push(projectName, '');
    }

    lines.push('Werkzaamheden:');

    selectedItems.forEach((item) => {
      const lineTotal = item.quantity * item.price;
      const qtyStr = item.quantity.toString().replace('.', ',');
      const unitStr = item.unit ? ' ' + item.unit : '';
      lines.push(
        `• ${qtyStr}${unitStr} ${item.name} à ${formatCurrency(item.price)} = ${formatCurrency(lineTotal)}`
      );
    });

    if (includePreDriving) {
      lines.push(`• 1x Voorrijkosten per klus = ${formatCurrency(65)}`);
    }

    lines.push(
      '',
      `Subtotaal (excl. btw): ${formatCurrency(totals.subtotal)}`,
      `BTW 21%: ${formatCurrency(totals.vat)}`,
      `Totaal (incl. btw): ${formatCurrency(totals.total)}`,
      '',
      'Prijzen zijn vermeld exclusief eventuele meerwerkzaamheden.',
      '',
      'Met vriendelijke groet,',
      'Dennis van den Akker',
      'D van den Akker bestrating'
    );

    setQuotationText(lines.join('\n'));
  };

  const selectQuotationText = () => {
    const textarea = document.getElementById('offerteText') as HTMLTextAreaElement;
    if (textarea) {
      textarea.focus();
      textarea.select();
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600 mb-4"></div>
              <p className="text-slate-600">Producten laden...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const filterButtons: { value: CategoryFilter; label: string }[] = [
    { value: 'ALL', label: 'Alle' },
    { value: 'STRAATWERK', label: 'Straatwerk' },
    { value: 'GRONDWERK', label: 'Grondwerk' },
    { value: 'CONTAINERS', label: 'Containers' },
    { value: 'VERHUUR', label: 'Verhuur' },
    { value: 'PVC', label: 'PVC' },
    { value: 'OVERIG', label: 'Overig' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-slate-800 p-2 rounded-lg">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900">Offertetool Dennis</h2>
        </div>

        <div className="bg-slate-50 rounded-lg p-4 mb-6 border border-slate-200">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Selecteer producten</h3>

          <div className="flex flex-wrap gap-2 mb-4">
            {filterButtons.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setActiveFilter(filter.value)}
                className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
                  activeFilter === filter.value
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Zoeken op werkzaamheid..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
            />
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              Geen producten gevonden
            </div>
          ) : (
            <>
              {Object.entries(
                filteredProducts.reduce((acc, product) => {
                  if (!acc[product.category]) {
                    acc[product.category] = [];
                  }
                  acc[product.category].push(product);
                  return acc;
                }, {} as Record<string, Product[]>)
              ).map(([category, categoryProducts]) => (
                <div key={category} className="mb-4 last:mb-0">
                  <h4 className="text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">{category}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {categoryProducts.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => {
                          const newItem: SelectedItem = {
                            id: Date.now().toString(),
                            productId: product.id,
                            category: product.category,
                            name: product.name,
                            unit: product.unit,
                            price: product.price,
                            quantity: 1,
                          };
                          setSelectedItems([...selectedItems, newItem]);
                        }}
                        className="flex items-center justify-between px-4 py-3 bg-white border border-slate-300 rounded-lg hover:border-slate-800 hover:bg-slate-800 hover:text-white transition-all text-left group"
                      >
                        <div className="flex-1">
                          <div className="text-sm font-medium text-slate-900 group-hover:text-white">{product.name}</div>
                          <div className="text-xs text-slate-500 group-hover:text-slate-200 mt-0.5">
                            {formatCurrency(product.price)} per {product.unit}
                          </div>
                        </div>
                        <Plus className="w-4 h-4 text-slate-400 group-hover:text-white flex-shrink-0 ml-2" />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-900">Geselecteerde items</h3>
          <label className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-full cursor-pointer hover:bg-slate-50 transition-colors">
            <input
              type="checkbox"
              checked={includePreDriving}
              onChange={(e) => setIncludePreDriving(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm font-medium text-slate-700">Voorrijkosten €65</span>
          </label>
        </div>

        {selectedItems.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-200">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">Geen items geselecteerd</p>
            <p className="text-slate-400 text-xs mt-1">Voeg producten toe om je offerte te maken</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-xl border border-slate-200 mb-4">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-700">Categorie</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-700">Werkzaamheid</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-700">Eenheid</th>
                    <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-700">Prijs (excl.)</th>
                    <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-700">Aantal</th>
                    <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-700">Totaal</th>
                    <th className="px-4 py-2.5 text-center text-xs font-semibold text-slate-700 w-20">Actie</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedItems.map((item, index) => {
                    const lineTotal = item.quantity * item.price;
                    return (
                      <tr
                        key={item.id}
                        className={`border-b border-slate-100 ${
                          index % 2 === 1 ? 'bg-slate-50' : 'bg-white'
                        }`}
                      >
                        <td className="px-4 py-2 text-xs text-slate-600">{item.category}</td>
                        <td className="px-4 py-2 text-xs text-slate-900">{item.name}</td>
                        <td className="px-4 py-2 text-xs text-slate-600">{item.unit}</td>
                        <td className="px-4 py-2 text-xs text-slate-900 text-right">
                          {formatCurrency(item.price)}
                        </td>
                        <td className="px-4 py-2 text-right">
                          <input
                            type="number"
                            value={item.quantity || ''}
                            onChange={(e) => {
                              const val = e.target.value.replace(',', '.');
                              updateQuantity(item.id, parseFloat(val) || 0);
                            }}
                            min="0"
                            step="0.01"
                            className="w-16 px-2 py-1 text-xs border border-slate-300 rounded focus:ring-2 focus:ring-slate-500 focus:border-transparent text-right"
                          />
                        </td>
                        <td className="px-4 py-2 text-xs font-medium text-slate-900 text-right">
                          {formatCurrency(lineTotal)}
                        </td>
                        <td className="px-4 py-2 text-center">
                          <button
                            onClick={() => removeItem(item.id)}
                            className="inline-flex items-center justify-center w-7 h-7 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Verwijderen"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="max-w-md ml-auto space-y-1">
              <div className="flex justify-between text-sm py-1">
                <span className="text-slate-600">Subtotaal (excl. btw)</span>
                <span className="font-semibold text-slate-900">{formatCurrency(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm py-1">
                <span className="text-slate-600">BTW 21%</span>
                <span className="font-semibold text-slate-900">{formatCurrency(totals.vat)}</span>
              </div>
              <div className="flex justify-between text-base pt-2 mt-1 border-t border-slate-300">
                <span className="font-bold text-slate-900">Totaal incl. btw</span>
                <span className="font-bold text-slate-900">{formatCurrency(totals.total)}</span>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-base font-semibold text-slate-900 mb-4">Offertetekst</h3>

        <div className="flex flex-wrap gap-3 mb-3 text-xs">
          <input
            type="text"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="Naam klant (optioneel)"
            className="flex-1 min-w-[150px] px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
          />
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="Project / omschrijving (optioneel)"
            className="flex-1 min-w-[150px] px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
          />
          <input
            type="text"
            value={placeDate}
            onChange={(e) => setPlaceDate(e.target.value)}
            placeholder="Plaats + datum (optioneel)"
            className="flex-1 min-w-[150px] px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
          />
        </div>

        <div className="flex gap-2 mb-3">
          <button
            onClick={generateQuotation}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
          >
            Genereer offertetekst
          </button>
          <button
            onClick={selectQuotationText}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs bg-slate-100 text-slate-800 rounded-lg hover:bg-slate-200 transition-colors"
          >
            Selecteer tekst
          </button>
        </div>

        <textarea
          id="offerteText"
          value={quotationText}
          onChange={(e) => setQuotationText(e.target.value)}
          placeholder="Hier verschijnt de offertetekst. Je kunt deze kopiëren en plakken in Word, e-mail of je offerteprogramma."
          className="w-full min-h-[450px] px-3 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent bg-slate-50 text-xs resize-vertical"
        />
      </div>
    </div>
  );
}
