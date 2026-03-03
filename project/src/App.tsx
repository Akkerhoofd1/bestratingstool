import { useState } from 'react';
import UnifiedPaverCalculator from './components/UnifiedPaverCalculator';
import ProfessionalPaverCalculator from './components/ProfessionalPaverCalculator';
import VolumeCalculator from './components/VolumeCalculator';
import AdvancedSketchTool from './components/AdvancedSketchTool';
import SlopeCalculator from './components/SlopeCalculator';
import QuotationTool from './components/QuotationTool';
import BreakerSandCalculator from './components/BreakerSandCalculator';
import PVCCalculator from './components/PVCCalculator';
import FenceCalculator from './components/FenceCalculator';
import GravelCalculator from './components/GravelCalculator';
import HoursRegistration from './components/HoursRegistration';
import Header from './components/Header';
import { Square, Box, TrendingDown, FileText, Package, Wrench, Fence, Zap, Clock, Menu, X, Ruler, Calculator } from 'lucide-react';

type Tab = 'pavers' | 'professional' | 'volume' | 'sketch' | 'slope' | 'quotation' | 'breaker' | 'pvc' | 'fence' | 'gravel' | 'hours';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('pavers');
  const [menuOpen, setMenuOpen] = useState(false);

  const tabs = [
    { id: 'pavers' as Tab, label: 'Klinkerberekening', icon: Square },
    { id: 'professional' as Tab, label: 'Professionele Calculator', icon: Calculator },
    { id: 'volume' as Tab, label: 'Kuubberekening', icon: Box },
    { id: 'gravel' as Tab, label: 'Grindberekening', icon: Zap },
    { id: 'sketch' as Tab, label: 'Uitzettool Pro', icon: Ruler },
    { id: 'slope' as Tab, label: 'Hellingshoek', icon: TrendingDown },
    { id: 'breaker' as Tab, label: 'Brekerzand', icon: Package },
    { id: 'pvc' as Tab, label: 'PVC Riolering', icon: Wrench },
    { id: 'fence' as Tab, label: 'Schuttingen', icon: Fence },
    { id: 'hours' as Tab, label: 'Urenregistratie', icon: Clock },
    { id: 'quotation' as Tab, label: 'Offertetool', icon: FileText },
  ];

  const handleTabClick = (tabId: Tab) => {
    setActiveTab(tabId);
    setMenuOpen(false);
  };

  const activeTabData = tabs.find(t => t.id === activeTab);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 bg-white border-r border-slate-200 overflow-y-auto">
          <nav className="p-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 font-medium transition-all rounded-lg mb-1 ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Mobile Header Bar */}
        <div className="lg:hidden fixed top-16 left-0 right-0 bg-white border-b border-slate-200 z-10">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-full flex items-center justify-between px-4 py-4 font-medium text-left hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              {activeTabData && <activeTabData.icon className="w-5 h-5 text-blue-600" />}
              <span className="text-slate-900">{activeTabData?.label}</span>
            </div>
            {menuOpen ? <X className="w-5 h-5 text-slate-600" /> : <Menu className="w-5 h-5 text-slate-600" />}
          </button>

          {menuOpen && (
            <div className="absolute left-0 right-0 bg-white border-t border-slate-200 shadow-lg max-h-96 overflow-y-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-4 font-medium transition-all border-l-4 ${
                      activeTab === tab.id
                        ? 'border-blue-600 bg-blue-50 text-blue-600'
                        : 'border-transparent text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 max-w-6xl lg:mt-0 mt-20">
            {activeTab === 'pavers' && <UnifiedPaverCalculator />}
            {activeTab === 'professional' && <ProfessionalPaverCalculator />}
            {activeTab === 'volume' && <VolumeCalculator />}
            {activeTab === 'gravel' && <GravelCalculator />}
            {activeTab === 'sketch' && <AdvancedSketchTool />}
            {activeTab === 'slope' && <SlopeCalculator />}
            {activeTab === 'breaker' && <BreakerSandCalculator />}
            {activeTab === 'pvc' && <PVCCalculator />}
            {activeTab === 'fence' && <FenceCalculator />}
            {activeTab === 'hours' && <HoursRegistration />}
            {activeTab === 'quotation' && <QuotationTool />}
          </div>

          <footer className="text-center py-6 px-4 text-slate-600 text-xs sm:text-sm border-t border-slate-200 bg-white">
            <p>D van den Akker bestrating - Professionele rekentools voor straatwerk</p>
            <p className="mt-1 text-xs text-slate-500">© D van den Akker</p>
          </footer>
        </main>
      </div>
    </div>
  );
}

export default App;
