'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Dumbbell, ChartNoAxesCombined, History } from 'lucide-react';
export function BottomNavigation() {
  const path = usePathname();
  return (
    <nav className="bottom-nav" aria-label="Navegación principal">
      {[
        { href: '/', label: 'Hoy', Icon: Dumbbell },
        { href: '/historial', label: 'Historial', Icon: History },
        { href: '/progreso', label: 'Progreso', Icon: ChartNoAxesCombined },
      ].map(({ href, label, Icon }) => (
        <Link
          key={href}
          href={href}
          aria-current={
            (href === '/' ? path === '/' : path.startsWith(href))
              ? 'page'
              : undefined
          }
        >
          <Icon size={22} />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}
