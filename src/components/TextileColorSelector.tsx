'use client';

import React, { useState, useMemo } from 'react';
import { Palette, Search, Check, ChevronDown, Sparkles } from 'lucide-react';

export interface TextileColor {
  name: string;
  hex: string;
  category?: 'basicos' | 'pasteles' | 'vivos' | 'oscuros';
}

export const TEXTILE_COLORS: TextileColor[] = [
  // Básicos
  { name: 'Blanco Óptico', hex: '#FFFFFF', category: 'basicos' },
  { name: 'Negro Azabache', hex: '#111111', category: 'basicos' },
  { name: 'Gris Jaspe', hex: '#9E9E9E', category: 'basicos' },
  { name: 'Gris Oscuro', hex: '#3E3E3E', category: 'basicos' },
  { name: 'Beige Arena', hex: '#D7C4A5', category: 'basicos' },
  { name: 'Crema / Marfil', hex: '#FFF4E0', category: 'basicos' },

  // Pasteles
  { name: 'Rosado Pastel', hex: '#F7C6D0', category: 'pasteles' },
  { name: 'Celeste Bebé', hex: '#A2D2FF', category: 'pasteles' },
  { name: 'Lila Pastel', hex: '#CDB4DB', category: 'pasteles' },
  { name: 'Verde Menta', hex: '#B7E4C7', category: 'pasteles' },
  { name: 'Amarillo Mantequilla', hex: '#FFF3B0', category: 'pasteles' },
  { name: 'Durazno / Peach', hex: '#FFD1BA', category: 'pasteles' },

  // Azules y Vivos
  { name: 'Azul Rey / Eléctrico', hex: '#0055A5', category: 'vivos' },
  { name: 'Azul Turquesa', hex: '#00A896', category: 'vivos' },
  { name: 'Rojo Escarlata', hex: '#D32F2F', category: 'vivos' },
  { name: 'Fucsia Neón', hex: '#E0218A', category: 'vivos' },
  { name: 'Amarillo Mostaza', hex: '#E1AD01', category: 'vivos' },
  { name: 'Naranja Cítrico', hex: '#FF6F00', category: 'vivos' },
  { name: 'Verde Grama', hex: '#2E7D32', category: 'vivos' },

  // Oscuros y Elegantes
  { name: 'Azul Marino', hex: '#122240', category: 'oscuros' },
  { name: 'Vinotinto', hex: '#5E1224', category: 'oscuros' },
  { name: 'Verde Militar', hex: '#4B5320', category: 'oscuros' },
  { name: 'Marrón Chocolate', hex: '#4E3629', category: 'oscuros' },
  { name: 'Morado Obispo', hex: '#581845', category: 'oscuros' },
  { name: 'Terracota', hex: '#A73822', category: 'oscuros' },
];

interface TextileColorSelectorProps {
  selectedColorName: string;
  selectedColorHex: string;
  onChange: (colorName: string, colorHex: string) => void;
}

export const TextileColorSelector: React.FC<TextileColorSelectorProps> = ({
  selectedColorName,
  selectedColorHex,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredColors = useMemo(() => {
    if (!search.trim()) return TEXTILE_COLORS;
    const q = search.toLowerCase();
    return TEXTILE_COLORS.filter(
      (c) => c.name.toLowerCase().includes(q) || c.hex.toLowerCase().includes(q)
    );
  }, [search]);

  const handleSelect = (color: TextileColor) => {
    onChange(color.name, color.hex);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
        Color de la Prenda
      </label>

      {/* Botón selector principal */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs flex items-center justify-between gap-2 shadow-sm hover:border-[#009fe3] transition-colors"
      >
        <div className="flex items-center gap-2.5 truncate">
          <span
            className="w-4 h-4 rounded-full border border-slate-300 shadow-sm shrink-0"
            style={{ backgroundColor: selectedColorHex || '#FFFFFF' }}
          />
          <span className="font-bold text-slate-800 dark:text-white truncate">
            {selectedColorName || 'Elegir color textil'}
          </span>
          <span className="font-mono text-[10px] text-slate-400 shrink-0">
            {selectedColorHex}
          </span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Menú desplegable */}
      {isOpen && (
        <div className="absolute z-50 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-3 space-y-3 animate-fadeIn">
          {/* Barra de búsqueda */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar tono (ej. Rosa, Azul, Negro)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#009fe3]"
              autoFocus
            />
          </div>

          {/* Grilla de colores */}
          <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
            {filteredColors.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-3">No se encontraron tonos coincidentes</p>
            ) : (
              <div className="grid grid-cols-2 gap-1.5">
                {filteredColors.map((color) => {
                  const isSelected = selectedColorHex.toLowerCase() === color.hex.toLowerCase();
                  return (
                    <button
                      key={color.name + color.hex}
                      type="button"
                      onClick={() => handleSelect(color)}
                      className={`flex items-center gap-2 p-1.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'border-[#009fe3] bg-blue-50/50 dark:bg-blue-950/30 text-[#009fe3] font-bold'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-slate-300 shadow-sm shrink-0"
                        style={{ backgroundColor: color.hex }}
                      />
                      <span className="text-[11px] truncate flex-1">{color.name}</span>
                      {isSelected && <Check className="w-3 h-3 text-[#009fe3] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Tono personalizado libre */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase shrink-0">Tono exacto:</span>
            <input
              type="color"
              value={selectedColorHex}
              onChange={(e) => onChange(selectedColorName || 'Color Personalizado', e.target.value)}
              className="w-7 h-7 rounded-lg cursor-pointer border border-slate-300 dark:border-slate-700 bg-transparent"
              title="Selector de color hexadecimal"
            />
            <input
              type="text"
              value={selectedColorName}
              onChange={(e) => onChange(e.target.value, selectedColorHex)}
              placeholder="Nombre del color..."
              className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-800 dark:text-white"
            />
          </div>
        </div>
      )}
    </div>
  );
};
