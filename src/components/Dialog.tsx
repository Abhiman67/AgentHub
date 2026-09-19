"use client";
import { useEffect } from "react";

type DialogProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  maxWidth?: number;
};

export function Dialog({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 440,
}: DialogProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="dialog-backdrop" onClick={onClose} role="presentation">
      <div
        className="dialog-modal"
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
      >
        <div className="dialog-header">
          <div>
            <h2 id="dialog-title" className="dialog-title">
              {title}
            </h2>
            {description && <p className="dialog-desc">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="dialog-close-btn"
            aria-label="Close dialog"
          >
            ×
          </button>
        </div>

        <div className="dialog-body">{children}</div>
      </div>
    </div>
  );
}

type ConfirmDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "brand" | "default";
  icon?: string;
  loading?: boolean;
  isLoading?: boolean;
};

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  icon,
  loading,
  isLoading,
}: ConfirmDialogProps) {
  const isPending = Boolean(loading || isLoading);
  const textBody = description || message || "";
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !isPending) onClose();
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose, isPending]);

  if (!isOpen) return null;

  const defaultIcon = variant === "danger" ? "⚿" : "◈";
  const displayIcon = icon ?? defaultIcon;

  return (
    <div className="dialog-backdrop" onClick={isPending ? undefined : onClose} role="presentation">
      <div
        className="dialog-modal"
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
      >
        <div className={`dialog-icon ${variant}`}>
          <span>{displayIcon}</span>
        </div>

        <h2 id="confirm-dialog-title" className="dialog-title">
          {title}
        </h2>
        {textBody && <p className="dialog-desc">{textBody}</p>}

        <div className="dialog-actions">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="dialog-btn-cancel"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className={`dialog-btn-confirm ${variant}`}
          >
            {isPending ? "Processing…" : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

type PromptDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (val: string) => void | Promise<void>;
  title: string;
  description?: string;
  defaultValue?: string;
  placeholder?: string;
  submitText?: string;
  cancelText?: string;
  loading?: boolean;
};

export function PromptDialog({
  isOpen,
  onClose,
  onSubmit,
  title,
  description,
  defaultValue = "",
  placeholder = "",
  submitText = "Save",
  cancelText = "Cancel",
  loading = false,
}: PromptDialogProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !loading) onClose();
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose, loading]);

  if (!isOpen) return null;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const val = (formData.get("promptValue") as string) || "";
    if (val.trim()) {
      onSubmit(val.trim());
    }
  }

  return (
    <div className="dialog-backdrop" onClick={loading ? undefined : onClose} role="presentation">
      <div
        className="dialog-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="prompt-dialog-title"
      >
        <div className="dialog-icon brand">
          <span>✎</span>
        </div>

        <h2 id="prompt-dialog-title" className="dialog-title">
          {title}
        </h2>
        {description && <p className="dialog-desc">{description}</p>}

        <form onSubmit={handleSubmit}>
          <input
            name="promptValue"
            defaultValue={defaultValue}
            placeholder={placeholder}
            autoFocus
            required
            className="dialog-input"
            aria-label={title}
          />

          <div className="dialog-actions">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="dialog-btn-cancel"
            >
              {cancelText}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="dialog-btn-confirm default"
            >
              {loading ? "Saving…" : submitText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
