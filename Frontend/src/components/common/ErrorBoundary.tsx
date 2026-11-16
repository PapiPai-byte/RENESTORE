import React, { Component, ComponentType, ReactNode } from 'react';

type ErrorBoundaryProps = {
  fallback?: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
};

class ErrorBoundaryInner extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? <div>Something went wrong.</div>;
    }
    return this.props.children;
  }
}

export const ErrorBoundary: ComponentType<ErrorBoundaryProps> = (props) => {
  return <ErrorBoundaryInner {...props}>{props.children}</ErrorBoundaryInner>;
};

ErrorBoundary.displayName = 'ErrorBoundary';