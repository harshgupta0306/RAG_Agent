interface ErrorInlineProps {
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export default function ErrorInline({
  message,
  onRetry,
  onDismiss,
}: ErrorInlineProps) {
  return (
    <div className="error-inline" role="alert">
      <span className="error-inline-icon" aria-hidden="true">!</span>
      <span className="error-inline-msg">{message}</span>
      <div className="error-inline-actions">
        {onRetry && (
          <button type="button" className="error-inline-btn" onClick={onRetry}>
            Retry
          </button>
        )}
        {onDismiss && (
          <button type="button" className="error-inline-btn muted" onClick={onDismiss}>
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
}
