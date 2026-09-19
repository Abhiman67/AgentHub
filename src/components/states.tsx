export function EmptyState({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-line bg-card p-8 text-center">
      <p className="text-lg font-extrabold">{title}</p>
      <p className="mt-2 text-sm text-muted">{body}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, retry }: { message: string; retry?: () => void }) {
  return (
    <div className="rounded-3xl border border-red-200 bg-red-50 p-6">
      <p className="font-bold">Something failed</p>
      <p className="text-sm">{message}. Your data is safe.</p>
      {retry && (
        <button onClick={retry} className="mt-3 rounded-full bg-ink px-4 py-2 text-sm font-bold text-white">
          Retry
        </button>
      )}
    </div>
  );
}

export function LoadingSkeleton() {
  return <div className="animate-pulse rounded-3xl bg-line/60 p-8">Reading your notes…</div>;
}
