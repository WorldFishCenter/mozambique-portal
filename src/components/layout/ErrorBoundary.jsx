import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Here you could send error reports to your error tracking service
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="card">
          <div className="card-status-top bg-danger"></div>
          <div className="card-body">
            <h3 className="card-title text-danger">Something went wrong</h3>
            <p className="text-muted">
              We're sorry, but there was an error loading this component. Try refreshing the page or
              contact support if the problem persists.
            </p>
            <button className="btn btn-outline-danger" onClick={() => window.location.reload()}>
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
