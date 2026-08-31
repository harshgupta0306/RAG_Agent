interface ErrorCardProps {
  message: string;
  onRetry: () => void;
}

export default function ErrorCard({
  message,
  onRetry,
}: ErrorCardProps) {
  return (
    <section className="error-card" role="alert">
      <div className="error-icon" aria-hidden="true">
        !
      </div>
      <div>
        <h2>Something went wrong</h2>
        <p>The agent could not complete this request.</p>
        {message && <small>{message}</small>}
        <button type="button" onClick={onRetry}>
          Try again
        </button>
      </div>
    </section>
  );
}
