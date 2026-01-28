import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/744e271c-c7d9-439f-a2cd-18d8a6231997', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'debug-session',
        runId: 'pre-fix',
        hypothesisId: 'H1',
        location: 'ErrorBoundary.tsx:componentDidCatch',
        message: 'ErrorBoundary caught error',
        data: {
          name: error.name,
          message: error.message,
          componentStack: errorInfo.componentStack,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion agent log
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  private handleRetry = () => {
    const message = this.state.error?.message ?? '';
    const shouldReload =
      /Failed to fetch dynamically imported module/i.test(message) ||
      /ChunkLoadError/i.test(message) ||
      /Loading chunk/i.test(message);

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/744e271c-c7d9-439f-a2cd-18d8a6231997', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'debug-session',
        runId: 'pre-fix',
        hypothesisId: 'H3',
        location: 'ErrorBoundary.tsx:handleRetry',
        message: 'Retry clicked after error',
        data: { shouldReload, message },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion agent log

    if (shouldReload && typeof window !== 'undefined') {
      window.location.reload();
      return;
    }

    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center min-h-[400px] p-4">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <AlertTriangle className="w-12 h-12 mx-auto text-destructive mb-2" />
              <CardTitle>Something went wrong</CardTitle>
              <CardDescription>
                An error occurred while loading this section
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <p className="text-sm text-muted-foreground text-center">
                {this.state.error?.message || 'Unknown error'}
              </p>
              <Button onClick={this.handleRetry} className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
