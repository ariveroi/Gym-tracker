'use client';
import { useActionState } from 'react';
import { ArrowRight, LockKeyhole } from 'lucide-react';
import { login } from './actions';
import { ErrorMessage } from '@/components/ui/states';
export function LoginForm({ configured }: { configured: boolean }) {
  const [state, action, pending] = useActionState(login, null);
  return (
    <form action={action} className="login-form">
      <label htmlFor="email">Email</label>
      <input
        id="email"
        name="email"
        type="email"
        autoComplete="username"
        placeholder="tu@email.com"
        required
      />
      <label htmlFor="password">Contraseña</label>
      <input
        id="password"
        name="password"
        type="password"
        autoComplete="current-password"
        placeholder="Tu contraseña"
        required
      />
      <ErrorMessage message={state?.error} />
      {!configured && (
        <p className="setup-note">
          Antes de entrar, configura las dos variables de Supabase de{' '}
          <code>.env.example</code>. Encontrarás los pasos en el README.
        </p>
      )}
      <button className="button primary" disabled={pending || !configured}>
        {pending ? 'Entrando…' : 'Entrar a mi espacio'}
        <ArrowRight size={18} />
      </button>
      <p className="private-note">
        <LockKeyhole size={13} /> Un espacio privado. Solo para ti.
      </p>
    </form>
  );
}
