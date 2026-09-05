import { Component, createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return <span role="status" className="inline-flex items-center justify-center gap-3">
    <span aria-hidden="true" className="h-5 w-5 rounded-full border-2 border-current border-r-transparent motion-safe:animate-spin" />
    <span>{label}</span>
  </span>;
}

type Toast = { id: number; message: string; kind: 'success' | 'error' };
const ToastContext = createContext<(message: string, kind: Toast['kind']) => void>(() => {});
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const nextId = useRef(0);
  const notify = useCallback((message: string, kind: Toast['kind']) => {
    const id = ++nextId.current;
    setItems(previous => [...previous.slice(-2), { id, message, kind }]);
    timers.current.push(setTimeout(() => setItems(previous => previous.filter(item => item.id !== id)), 8000));
  }, []);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  return <ToastContext.Provider value={notify}>
    {children}
    <div className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-md flex-col gap-2">
      {items.map(item => <div key={item.id} role={item.kind === 'error' ? 'alert' : 'status'} className={`flex items-center justify-between gap-3 rounded-control border p-4 shadow-lg ${item.kind === 'error' ? 'border-danger-border bg-danger-soft text-danger-ink' : 'border-success-border bg-success-soft text-success-ink'}`}>
        <p className="text-sm font-semibold">{item.message}</p>
        <button aria-label="Dismiss notification" className="min-h-12 min-w-12 rounded-control text-xl" onClick={() => setItems(previous => previous.filter(toast => toast.id !== item.id))}>×</button>
      </div>)}
    </div>
  </ToastContext.Provider>;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (!this.state.failed) return this.props.children;
    return <main className="page-shell max-w-xl">
      <h1 className="page-title">Something went wrong</h1>
      <p className="my-6 text-muted">Your machine status is saved on the server. Reload to reconnect.</p>
      <button className="btn btn-primary" onClick={() => window.location.reload()}>Reload page</button>
      <a className="text-link ml-4" href="/">All machines</a>
    </main>;
  }
}
