import { Component } from 'react';
import PropTypes from 'prop-types';

/**
 * ErrorBoundary component to catch JavaScript errors in child component tree
 * and display a fallback UI instead of crashing the whole application
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  /**
   * Update state when an error occurs
   * @param {Error} error - The error that was thrown
   * @returns {Object} - New state with error information
   */
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  /**
   * Capture error information for logging
   * @param {Error} error - The error that was thrown
   * @param {Object} errorInfo - Component stack information
   */
  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    
    // Log the error to an error reporting service
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    
    // You could send this to an error tracking service like Sentry
    // if (typeof window.Sentry !== 'undefined') {
    //   window.Sentry.captureException(error);
    // }
  }

  /**
   * Reset the error state to allow recovery
   */
  resetError = () => {
    this.setState({ 
      hasError: false,
      error: null,
      errorInfo: null
    });
  }

  render() {
    if (this.state.hasError) {
      // Render fallback UI
      return (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <p>We're sorry, but an error occurred in this component.</p>
          
          {this.props.showDetails && (
            <details style={{ whiteSpace: 'pre-wrap', marginBottom: '1rem' }}>
              <summary>Error Details</summary>
              <p>{this.state.error && this.state.error.toString()}</p>
              <p>Component Stack:</p>
              <pre>{this.state.errorInfo && this.state.errorInfo.componentStack}</pre>
            </details>
          )}
          
          <button 
            onClick={this.resetError}
            className="error-reset-button"
          >
            Try Again
          </button>
          
          {this.props.fallback ? this.props.fallback : null}
        </div>
      );
    }

    // If no error, render children normally
    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  fallback: PropTypes.node,
  showDetails: PropTypes.bool
};

ErrorBoundary.defaultProps = {
  fallback: null,
  showDetails: process.env.NODE_ENV !== 'production'
};

export default ErrorBoundary;