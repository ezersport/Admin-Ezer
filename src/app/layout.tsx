import type { Metadata, Viewport } from 'next';
import './globals.css';
import { DesktopSidebar } from '../components/DesktopSidebar';
import { MobileBottomNav } from '../components/MobileBottomNav';
import { ThemeProvider } from '../components/ThemeContext';

export const metadata: Metadata = {
  title: 'Ezer Sport Admin | Taller Textil & Finanzas',
  description: 'Panel administrativo de taller textil, inventario, pedidos y finanzas Ezer Sport',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon.png',
    apple: '/apple-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Ezer Admin',
  },
};

export const viewport: Viewport = {
  themeColor: '#009fe3',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col md:flex-row bg-[var(--bg-main)] text-[var(--text-primary)] transition-colors duration-200">
        <ThemeProvider>
          {/* Sidebar fija para Desktop */}
          <DesktopSidebar />

          {/* Contenedor Principal de Vistas */}
          <div className="flex-1 flex flex-col min-w-0 pb-24 md:pb-0 overflow-x-hidden">
            {children}
          </div>

          {/* Barra de Navegación Móvil Ergonómica para Teléfonos */}
          <MobileBottomNav />
        </ThemeProvider>
      </body>
    </html>
  );
}
