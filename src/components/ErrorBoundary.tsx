import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Home, ChevronDown, ChevronUp } from 'lucide-react';
import { KitengeRibbon, MaasaiMedallion } from './MotifDecorations';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
      showDetails: false,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('AZ-900 ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    });
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-between text-slate-800">
          <KitengeRibbon height={4} />

          <main className="max-w-xl mx-auto px-4 py-12 flex-1 flex flex-col items-center justify-center text-center">
            <div className="relative mb-6">
              <div className="w-16 h-16 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700 shadow-md">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <div className="absolute -bottom-2 -right-2">
                <MaasaiMedallion size={24} />
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {this.props.fallbackTitle || 'Session Recovered Gracefully'}
            </h1>

            <p className="mt-3 text-sm text-slate-600 max-w-md leading-relaxed">
              We caught a temporary runtime glitch in this module. Your quiz progress and bookmarks in localStorage remain safe.
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={this.handleReset}
                className="px-5 py-2.5 rounded-xl bg-[#0078D4] hover:bg-[#005A9E] text-white font-bold text-sm flex items-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Try Again</span>
              </button>

              <button
                type="button"
                onClick={this.handleReload}
                className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-sm flex items-center gap-2 shadow-2xs transition-all cursor-pointer"
              >
                <Home className="w-4 h-4 text-slate-500" />
                <span>Reload App</span>
              </button>
            </div>

            {/* Collapsible Error Diagnostics */}
            {this.state.error && (
              <div className="mt-8 w-full text-left">
                <button
                  type="button"
                  onClick={() => this.setState({ showDetails: !this.state.showDetails })}
                  className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-xs font-bold text-slate-700 border border-slate-200 transition-colors"
                >
                  <span>Technical Diagnostics</span>
                  {this.state.showDetails ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>

                {this.state.showDetails && (
                  <div className="mt-2 p-4 rounded-xl bg-slate-900 text-slate-100 text-xs font-mono overflow-x-auto text-left max-h-60 border border-slate-800">
                    <p className="text-rose-400 font-bold">
                      {this.state.error.name}: {this.state.error.message}
                    </p>
                    {this.state.error.stack && (
                      <pre className="mt-2 text-[11px] text-slate-400 whitespace-pre-wrap">
                        {this.state.error.stack}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            )}
          </main>

          <footer className="py-4 text-center text-xs text-slate-400">
            Azure Curriculum AZ-900 Study Studio • Self-healing active
          </footer>
        </div>
      );
    }

    return this.props.children;
  }
}
