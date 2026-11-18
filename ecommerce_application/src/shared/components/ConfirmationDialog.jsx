export function ConfirmationDialog({
  title,
  description,
  confirmLabel,
  onCancel,
  onConfirm,
}) {
  return (
    <div
      className="confirmation-dialog-backdrop"
      role="presentation"
      onClick={onCancel}
    >
      <section
        className="confirmation-dialog-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmation-dialog-title"
        aria-describedby="confirmation-dialog-desc"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="confirmation-dialog-title">{title}</h2>
        <p id="confirmation-dialog-desc">{description}</p>
        <div className="confirmation-dialog-actions">
          <button
            type="button"
            className="button button-light"
            autoFocus
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="button button-dark"
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  )
}

export default ConfirmationDialog
