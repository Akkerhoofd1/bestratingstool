import { useState, useEffect } from 'react';
import { Wrench, Plus, Trash2, Loader, Package } from 'lucide-react';
import { supabase, type Product } from '../lib/supabase';

interface SelectedItem {
  id: string;
  product: Product;
  quantity: number;
}

export default function PVCCalculator() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    category: '',
    unit: 'stuk'
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = Array.from(new Set(products.map((p) => p.category)));

  const filteredProducts = selectedCategory
    ? products.filter((p) => p.category === selectedCategory)
    : products;

  const addItem = () => {
    if (!selectedProductId || !quantity || parseFloat(quantity) <= 0) return;

    const product = products.find((p) => p.id === selectedProductId);
    if (!product) return;

    const newItem: SelectedItem = {
      id: Date.now().toString(),
      product,
      quantity: parseFloat(quantity),
    };

    setSelectedItems([...selectedItems, newItem]);
    setSelectedProductId('');
    setQuantity('');
  };

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

  const saveNewProduct = async () => {
    if (!newProduct.name || !newProduct.price || !newProduct.category) {
      alert('Vul alle verplichte velden in');
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .insert({
          name: newProduct.name,
          price: parseFloat(newProduct.price),
          category: newProduct.category,
          unit: newProduct.unit
        })
        .select()
        .single();

      if (error) throw error;

      setProducts([...products, data]);
      setNewProduct({ name: '', price: '', category: '', unit: 'stuk' });
      setShowAddProduct(false);
      alert('Product succesvol toegevoegd!');
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Fout bij opslaan van product');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const totalCost = selectedItems.reduce((sum, item) => {
    return sum + item.quantity * item.product.price;
  }, 0);

  const totalItems = selectedItems.reduce((sum, item) => sum + item.quantity, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 text-teal-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-teal-100 p-2 rounded-lg">
              <Wrench className="w-5 h-5 text-teal-600" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900">PVC Riolering Calculator</h2>
          </div>
          <button
            onClick={() => setShowAddProduct(!showAddProduct)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Package className="w-4 h-4" />
            {showAddProduct ? 'Annuleren' : 'Eigen Product Toevoegen'}
          </button>
        </div>

        {showAddProduct && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Nieuw product toevoegen</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Productnaam *
                </label>
                <input
                  type="text"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  placeholder="Bijv. PVC Buis Ø110 mm"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Prijs (€) *
                </label>
                <input
                  type="number"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Categorie *
                </label>
                <input
                  type="text"
                  value={newProduct.category}
                  onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                  placeholder="Bijv. Buizen"
                  list="categories"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <datalist id="categories">
                  {categories.map((cat) => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Eenheid
                </label>
                <select
                  value={newProduct.unit}
                  onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="stuk">stuk</option>
                  <option value="meter">meter</option>
                  <option value="m2">m²</option>
                  <option value="m3">m³</option>
                  <option value="kg">kg</option>
                </select>
              </div>
            </div>
            <button
              onClick={saveNewProduct}
              disabled={saving || !newProduct.name || !newProduct.price || !newProduct.category}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Opslaan...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Product Opslaan
                </>
              )}
            </button>
          </div>
        )}

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Materiaal toevoegen</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Categorie
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setSelectedProductId('');
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
              >
                <option value="">Alle categorieën</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Selecteer product
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
              >
                <option value="">-- Kies product --</option>
                {filteredProducts.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} - {formatCurrency(product.price)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Aantal
                </label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="0"
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      addItem();
                    }
                  }}
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={addItem}
                  disabled={!selectedProductId || !quantity || parseFloat(quantity) <= 0}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Toevoegen
                </button>
              </div>
            </div>
          </div>
        </div>

        {selectedItems.length > 0 ? (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-900">Geselecteerde materialen</h3>
            <div className="space-y-2">
              {selectedItems.map((item) => {
                const lineTotal = item.quantity * item.product.price;
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">
                        {item.product.name}
                      </p>
                      <p className="text-xs text-slate-600">
                        {formatCurrency(item.product.price)} per stuk
                      </p>
                      <p className="text-xs text-teal-600 font-medium">
                        {item.product.category}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) =>
                          updateQuantity(item.id, parseFloat(e.target.value) || 0)
                        }
                        min="0"
                        step="0.01"
                        className="w-20 px-2 py-1 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-teal-500 focus:border-transparent text-right"
                      />
                      <span className="text-xs text-slate-600 w-12">
                        stuk
                      </span>

                      <div className="w-24 text-right">
                        <p className="text-sm font-semibold text-slate-900">
                          {formatCurrency(lineTotal)}
                        </p>
                      </div>

                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Verwijderen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-lg">
            <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Wrench className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-600">
              Nog geen materialen toegevoegd. Selecteer een materiaal hierboven.
            </p>
          </div>
        )}

        {selectedItems.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-teal-50 rounded-lg border border-teal-200">
              <p className="text-sm text-teal-700 mb-1">Totaal items</p>
              <p className="text-2xl font-bold text-teal-900">{totalItems.toFixed(2)}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-sm text-slate-700 mb-1">BTW 21%</p>
              <p className="text-2xl font-bold text-slate-900">
                {formatCurrency(totalCost * 0.21)}
              </p>
            </div>
            <div className="p-4 bg-teal-600 rounded-lg">
              <p className="text-sm text-teal-100 mb-1">Totaal incl. BTW</p>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(totalCost * 1.21)}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Informatie</h3>
        <div className="space-y-3 text-sm text-slate-700">
          <p>
            <span className="font-semibold">PVC riolering:</span> Geschikt voor afvoer
            van hemelwater en huishoudelijk afvalwater.
          </p>
          <p>
            <span className="font-semibold">Diameter keuze:</span> Ø110 mm is standaard
            voor huishoudelijk afvalwater, Ø125 mm voor hoofdleidingen.
          </p>
          <p>
            <span className="font-semibold">Let op:</span> Controleer altijd de lokale
            bouwvoorschriften en normen voor riolering.
          </p>
          <p>
            <span className="font-semibold">Installatie:</span> Gebruik altijd de
            juiste lijm of rubbers bij het verbinden van PVC buizen.
          </p>
        </div>
      </div>
    </div>
  );
}
