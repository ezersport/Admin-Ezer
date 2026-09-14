'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Palette, Check, X, Copy } from 'lucide-react';

// Utilidades de conversión HSV <-> HEX
function hsvToHex(h: number, s: number, v: number): string {
  s = s / 100;
  v = v / 100;
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0, g = 0, b = 0;
  if (h >= 0 && h < 60) { r = c; g = x; b = 0; }
  else if (h >= 60 && h < 120) { r = x; g = c; b = 0; }
  else if (h >= 120 && h < 180) { r = 0; g = c; b = x; }
  else if (h >= 180 && h < 240) { r = 0; g = x; b = c; }
  else if (h >= 240 && h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }
  const toHex = (n: number) => {
    const hex = Math.max(0, Math.min(255, Math.round((n + m) * 255))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function hexToHsv(hex: string): { h: number; s: number; v: number } {
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  if (clean.length !== 6) return { h: 0, s: 100, v: 100 };
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d === 0) h = 0;
  else if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h = Math.round(h * 60);
  if (h < 0) h += 360;
  const s = max === 0 ? 0 : Math.round((d / max) * 100);
  const v = Math.round(max * 100);
  return { h, s, v };
}

export const COMMON_TEXTILE_PRESETS = [
  { name: 'Rojo Escarlata', hex: '#D32F2F' },
  { name: 'Azul Rey', hex: '#0055A5' },
  { name: 'Gris Jaspe', hex: '#9E9E9E' },
  { name: 'Negro Azabache', hex: '#111111' },
  { name: 'Blanco Óptico', hex: '#FFFFFF' },
  { name: 'Rosado Pastel', hex: '#F7C6D0' },
  { name: 'Azul Marino', hex: '#122240' },
  { name: 'Celeste Bebé', hex: '#A2D2FF' },
  { name: 'Verde Militar', hex: '#4B5320' },
  { name: 'Amarillo Mostaza', hex: '#E1AD01' },
  { name: 'Vinotinto', hex: '#5E1224' },
  { name: 'Beige Arena', hex: '#D7C4A5' },
];

interface ColorTonePickerProps {
  colorName: string;
  colorHex: string;
  onChange: (name: string, hex: string) => void;
}

export const ColorTonePicker: React.FC<ColorTonePickerProps> = ({
  colorName,
  colorHex,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const initialHsv = hexToHsv(colorHex || '#D32F2F');
  const [hue, setHue] = useState<number>(initialHsv.h);
  const [sat, setSat] = useState<number>(initialHsv.s);
  const [val, setVal] = useState<number>(initialHsv.v);

  const satValRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Sincronizar si cambia colorHex externamente
  useEffect(() => {
    if (colorHex) {
      const hsv = hexToHsv(colorHex);
      setHue(hsv.h);
      setSat(hsv.s);
      setVal(hsv.v);
    }
  }, [colorHex]);

  // Manejador para el área de Saturación/Brillo
  const handleSatValInteraction = useCallback(
    (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
      if (!satValRef.current) return;
      const rect = satValRef.current.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
      const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
      const y = Math.max(0, Math.min(rect.height, clientY - rect.top));

      const newSat = Math.round((x / rect.width) * 100);
      const newVal = Math.round((1 - y / rect.height) * 100);

      setSat(newSat);
      setVal(newVal);

      const newHex = hsvToHex(hue, newSat, newVal);
      onChange(colorName || 'Color Tono', newHex);
    },
    [hue, colorName, onChange]
  );

  // Manejador para la Barra de Tono (Hue rainbow slider)
  const handleHueInteraction = useCallback(
    (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
      if (!hueRef.current) return;
      const rect = hueRef.current.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
      const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
      const newHue = Math.round((x / rect.width) * 360) % 360;

      setHue(newHue);
      const newHex = hsvToHex(newHue, sat, val);
      onChange(colorName || 'Color Tono', newHex);
    },
    [sat, val, colorName, onChange]
  );

  const startSatValDrag = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    handleSatValInteraction(e);
    const onMove = (moveEvent: MouseEvent | TouchEvent) => handleSatValInteraction(moveEvent);
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove);
    window.addEventListener('touchend', onUp);
  };

  const startHueDrag = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    handleHueInteraction(e);
    const onMove = (moveEvent: MouseEvent | TouchEvent) => handleHueInteraction(moveEvent);
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove);
    window.addEventListener('touchend', onUp);
  };

  // Cerrar al hacer clic afuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const selectPreset = (preset: { name: string; hex: string }) => {
    const hsv = hexToHsv(preset.hex);
    setHue(hsv.h);
    setSat(hsv.s);
    setVal(hsv.v);
    onChange(preset.name, preset.hex);
  };

  return (
    <div className="relative" ref={popoverRef}>
      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
        Color de la Prenda (Tono)
      </label>

      {/* Botón principal para abrir el selector de tono */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:border-[#009fe3] focus:border-[#009fe3] rounded-xl px-3 py-2 text-xs flex items-center justify-between gap-2 shadow-xs transition-all cursor-pointer"
      >
        <div className="flex items-center gap-2.5 truncate">
          <span
            className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600 shadow-xs shrink-0"
            style={{ backgroundColor: colorHex || '#D32F2F' }}
          />
          <span className="font-bold text-slate-900 dark:text-white truncate">
            {colorName || 'Seleccionar Color'}
          </span>
          <span className="font-mono text-[11px] text-slate-400 shrink-0">
            {colorHex || '#D32F2F'}
          </span>
        </div>
        <span className="text-[11px] font-bold text-[#009fe3] bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-md shrink-0">
          Escoger Tono ▾
        </span>
      </button>

      {/* Popover con Barra de Tono y Caja de Gradiente (Igual a la imagen) */}
      {isOpen && (
        <div className="absolute z-50 mt-2 left-0 w-80 sm:w-88 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-4 space-y-4 animate-fade-in">
          {/* Cabecera del popover */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-[#009fe3]" />
              <span>Selector de Tono Textil</span>
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 1. Caja de Saturación y Brillo */}
          <div
            ref={satValRef}
            onMouseDown={startSatValDrag}
            onTouchStart={startSatValDrag}
            className="relative w-full h-40 rounded-2xl cursor-crosshair overflow-hidden select-none border border-slate-200 dark:border-slate-800 shadow-inner"
            style={{
              backgroundColor: `hsl(${hue}, 100%, 50%)`,
              backgroundImage: `
                linear-gradient(to right, #fff 0%, transparent 100%),
                linear-gradient(to top, #000 0%, transparent 100%)
              `,
            }}
          >
            {/* Puntero de selección circular */}
            <div
              className="absolute w-5 h-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-md pointer-events-none"
              style={{
                left: `${sat}%`,
                top: `${100 - val}%`,
                backgroundColor: colorHex,
              }}
            />
          </div>

          {/* 2. Barra de Tono (Rainbow Hue Bar Slider) */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
              <span>Barra de Tono:</span>
              <span>{hue}°</span>
            </div>
            <div
              ref={hueRef}
              onMouseDown={startHueDrag}
              onTouchStart={startHueDrag}
              className="relative w-full h-4 rounded-full cursor-pointer select-none border border-slate-200 dark:border-slate-800"
              style={{
                background:
                  'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)',
              }}
            >
              {/* Thumb redondo del slider de tono */}
              <div
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-white border-2 border-slate-300 shadow-md flex items-center justify-center pointer-events-none"
                style={{ left: `${(hue / 360) * 100}%` }}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: `hsl(${hue}, 100%, 50%)` }}
                />
              </div>
            </div>
          </div>

          {/* 3. Nombre del Color y Código Hex */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">
                Nombre del Color:
              </label>
              <input
                type="text"
                value={colorName}
                onChange={(e) => onChange(e.target.value, colorHex)}
                placeholder="Ej: Rojo, Azul, Gris"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#009fe3]"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">
                Código Hex:
              </label>
              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5">
                <span
                  className="w-3.5 h-3.5 rounded-full border border-slate-300 shadow-xs shrink-0"
                  style={{ backgroundColor: colorHex }}
                />
                <input
                  type="text"
                  value={colorHex}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val.startsWith('#') && val.length <= 7) {
                      onChange(colorName, val);
                    }
                  }}
                  className="w-full bg-transparent font-mono text-xs font-bold text-slate-900 dark:text-white uppercase focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* 4. Muestras Rápidas de Telas Populares */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
              Tonos Textiles Frecuentes:
            </span>
            <div className="grid grid-cols-4 gap-1.5">
              {COMMON_TEXTILE_PRESETS.map((p) => {
                const isSelected = colorHex.toUpperCase() === p.hex.toUpperCase();
                return (
                  <button
                    key={p.hex + p.name}
                    type="button"
                    onClick={() => selectPreset(p)}
                    className={`flex items-center gap-1.5 p-1 rounded-lg border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#009fe3] bg-blue-50/50 dark:bg-blue-950/40 text-[#009fe3] font-bold'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full border border-slate-300 shadow-xs shrink-0"
                      style={{ backgroundColor: p.hex }}
                    />
                    <span className="text-[10px] truncate">{p.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Botón Listo */}
          <div className="pt-1 flex justify-end">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-full bg-[#009fe3] hover:bg-[#0082ba] text-white py-2 rounded-xl text-xs font-bold transition-all shadow-xs"
            >
              Listo (Color Seleccionado)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
