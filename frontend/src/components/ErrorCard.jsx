export default function ErrorCard({ error, onTryAgain }) {
  if (!error) return null;

  return (
    <div className="error-card">
      <div className="error-message-text">
        {typeof error === 'string' ? error : error?.message || 'An unexpected error occurred.'}
      </div>
      {onTryAgain && (
        <button
          type="button"
          className="ghost-action-btn"
          onClick={onTryAgain}
          style={{ width: 'fit-content', color: 'var(--text-1)', padding: '0px' }}
        >
          Try again
        </button>
      )}
    </div>
  );
}
