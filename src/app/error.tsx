'use client';
export default function ErrorPage({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <main className="error-page">
      <h1>No hemos podido cargar tus datos</h1>
      <p>
        Comprueba tu conexión. Si es la primera vez, revisa las variables de
        entorno y aplica la migración de Supabase.
      </p>
      <button className="button primary" onClick={reset}>
        Volver a intentar
      </button>
    </main>
  );
}
