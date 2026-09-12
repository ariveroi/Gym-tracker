import Link from 'next/link';
export default function NotFound() {
  return (
    <main className="error-page">
      <h1>No encontramos esta página</h1>
      <Link className="button primary" href="/">
        Volver a Hoy
      </Link>
    </main>
  );
}
