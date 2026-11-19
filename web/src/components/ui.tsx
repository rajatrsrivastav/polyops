import { useEffect, useRef, type ReactNode } from 'react';
export function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const paths: Record<string, ReactNode> = {
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </>
    ),
    box: (
      <>
        <path d="m12 3 9 5-9 5-9-5 9-5ZM3 8v9l9 5 9-5V8M12 13v9M8 5l9 5" />
      </>
    ),
    orders: (
      <>
        <rect x="5" y="4" width="14" height="18" rx="2" />
        <path d="M9 2h6v5H9zM9 12h6M9 16h6" />
      </>
    ),
    stock: (
      <>
        <path d="M4 21V10h5v11M10 21V4h5v17M16 21V7h5v14M2 21h21" />
      </>
    ),
    spark: (
      <>
        <path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3ZM20 2v4M18 4h4" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    search: (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m16 16 5 5" />
      </>
    ),
    logout: (
      <>
        <path d="M9 4H4v16h5M14 8l4 4-4 4M8 12h10" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    close: <path d="m6 6 12 12M6 18 18 6" />,
  };
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name] ?? paths.box}
    </svg>
  );
}
export function State({
  loading,
  error,
  empty,
  children,
}: {
  loading?: boolean;
  error?: Error | null;
  empty?: boolean;
  children: ReactNode;
}) {
  if (loading)
    return (
      <div className="state" role="status">
        <span className="spinner" /> Loading your workspace…
      </div>
    );
  if (error)
    return (
      <div className="state error" role="alert">
        <strong>We couldn’t load this.</strong>
        <p>{error.message}</p>
        <button className="button secondary" onClick={() => window.location.reload()}>
          Try again
        </button>
      </div>
    );
  if (empty)
    return (
      <div className="state">
        <Icon name="box" size={32} />
        <strong>Nothing here yet</strong>
        <p>Your next update will appear here.</p>
      </div>
    );
  return <>{children}</>;
}
export function Notice({ error }: { error: Error | null }) {
  return error ? (
    <p className="notice" role="alert">
      {error.message}
    </p>
  ) : null;
}
export function Badge({ status }: { status: string }) {
  return <span className={`badge ${status}`}>{status.replace('_', ' ')}</span>;
}
export function PageTitle({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <header className="page-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="muted">{description}</p>
      </div>
      {action}
    </header>
  );
}
export function Pager({
  page,
  total,
  limit = 20,
  setPage,
}: {
  page: number;
  total: number;
  limit?: number;
  setPage: (page: number) => void;
}) {
  return (
    <div className="pager">
      <span>
        {total} results · Page {page} of {Math.max(1, Math.ceil(total / limit))}
      </span>
      <div>
        <button className="button secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>
          Previous
        </button>
        <button
          className="button secondary"
          disabled={page * limit >= total}
          onClick={() => setPage(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
export function Modal({
  title,
  children,
  close,
}: {
  title: string;
  children: ReactNode;
  close: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog ref={ref} onCancel={close} aria-labelledby="modal-title">
      <div className="modal-heading">
        <h2 id="modal-title">{title}</h2>
        <button className="icon-button" onClick={close} aria-label="Close dialog">
          <Icon name="close" />
        </button>
      </div>
      {children}
    </dialog>
  );
}
