export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { Activity, LogOut } from 'lucide-react';
import { requireUser } from '@/features/auth/service';
import { logout } from '@/features/auth/actions';
import { BottomNavigation } from '@/components/bottom-navigation';
import { RestTimerProvider } from '@/hooks/use-rest-timer';
import { RestTimer } from '@/components/rest-timer';
export default async function PrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requireUser();
  return (
    <RestTimerProvider userId={user.id}>
      <div className="app-shell">
        <header className="app-top">
          <Link href="/" className="brand">
            <Activity size={24} />
            <span>
              pulso<span className="brand-dot">.</span>
            </span>
          </Link>
          <form action={logout}>
            <button
              className="icon-button"
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
            >
              <LogOut size={19} />
            </button>
          </form>
        </header>
        <main className="main-content" id="main">
          {children}
        </main>
        <RestTimer />
        <BottomNavigation />
      </div>
    </RestTimerProvider>
  );
}
