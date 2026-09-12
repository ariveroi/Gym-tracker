import { CircleDashed } from 'lucide-react';
export function EmptyState({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="empty-state">
      <CircleDashed size={36} strokeWidth={1.3} />
      <h2>{title}</h2>
      <p>{children}</p>
    </div>
  );
}
export function LoadingState() {
  return (
    <div className="loading-state" role="status">
      <span className="spinner" />
      <p>Cargando tu entrenamiento…</p>
    </div>
  );
}
export function ErrorMessage({
  message,
}: {
  message: string | null | undefined;
}) {
  return message ? (
    <p role="alert" className="error-message">
      {message}
    </p>
  ) : null;
}
