export const dynamic = 'force-dynamic';
import { Activity, ArrowUpRight } from 'lucide-react';
import { LoginForm } from '@/features/auth/login-form';
import { getSupabaseEnv } from '@/lib/supabase/env';
export default function LoginPage() {
  return (
    <main className="login-page">
      <div className="login-art" aria-hidden="true">
        <span className="art-caption">
          UN POCO MÁS FUERTE.
          <br />
          UN DÍA A LA VEZ.
        </span>
        <div className="orbit orbit-one" />
        <div className="orbit orbit-two" />
        <div className="orbit orbit-three" />
        <ArrowUpRight className="art-arrow" size={120} strokeWidth={1} />
        <span className="art-bottom">TU RITMO. TU PROGRESO.</span>
      </div>
      <section className="login-panel">
        <div className="brand">
          <Activity size={28} />
          <span>
            pulso<span className="brand-dot">.</span>
          </span>
        </div>
        <div className="login-intro">
          <span className="eyebrow">TU DIARIO DE FUERZA</span>
          <h1>
            Vuelve a<br />
            tu ritmo.
          </h1>
          <p>
            Entrena con intención.
            <br />
            Cada serie cuenta.
          </p>
        </div>
        <LoginForm configured={!!getSupabaseEnv()} />
        <p className="login-footer">Menos distracciones. Más constancia.</p>
      </section>
    </main>
  );
}
