import { Ruler } from 'lucide-react';

export default function Header() {
  return (
    <header className="bg-white shadow-sm border-b border-slate-200">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-6xl">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="bg-blue-600 p-2 sm:p-3 rounded-lg flex-shrink-0">
            <Ruler className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold text-slate-900 truncate">
              Stratenmaker Tool
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 truncate">
              D van den Akker bestrating
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
