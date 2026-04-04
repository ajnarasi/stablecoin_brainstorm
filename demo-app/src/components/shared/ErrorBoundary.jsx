import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h2 style={{ color: '#C62828' }}>Something went wrong</h2>
          <p>{this.state.error?.message}</p>
          <button onClick={() => { this.setState({ hasError: false }); window.location.href = '/'; }}>
            Return to Home
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
