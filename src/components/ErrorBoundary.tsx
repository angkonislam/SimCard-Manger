import { Component, ErrorInfo, ReactNode } from 'react';

interface State {
  hasError: boolean;
  error: Error | null;
}

interface Props {
  children: ReactNode;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('App crash:', error, info.componentStack);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen w-full bg-white dark:bg-slate-950 flex items-center justify-center p-6 text-gray-900 dark:text-gray-200">
        <div className="max-w-md w-full flex flex-col items-center gap-5 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-500/20 flex items-center justify-center text-3xl">
            ⚠
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="text-xl font-bold">Something went wrong</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {this.state.error?.message ?? 'Unexpected error occurred'}
            </p>
          </div>
          <button
            onClick={this.handleReload}
            className="px-6 py-3 rounded-xl bg-emerald-500 text-white font-semibold active:scale-95 transition-transform"
          >
            Reload app
          </button>
          {import.meta.env.DEV && this.state.error?.stack && (
            <pre className="text-left text-xs bg-gray-100 dark:bg-slate-800 rounded-lg p-3 overflow-auto max-h-64 w-full">
              {this.state.error.stack}
            </pre>
          )}
        </div>
      </div>
    );
  }
}
