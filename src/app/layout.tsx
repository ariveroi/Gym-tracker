import type { Metadata, Viewport } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: { default: 'Pulso · Tu entrenamiento', template: '%s · Pulso' },
  description: 'Tu espacio para entrenar, registrar y seguir avanzando.',
  applicationName: 'Pulso',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Pulso' },
  icons: { icon: '/icon.svg', apple: '/apple-icon.png' },
};
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#f7f8fa',
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
