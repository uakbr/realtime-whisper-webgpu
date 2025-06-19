import { Component } from "react";
import { ERROR_TYPES, RECOVERY_SUGGESTIONS } from "../utils/errorHandler";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      showSuggestions: false
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
    
    // Log to analytics or monitoring service if available
    // This would be implemented in a production environment
  }
  
  toggleSuggestions = () => {
    this.setState(prevState => ({
      showSuggestions: !prevState.showSuggestions
    }));
  }

  render() {
    if (this.state.hasError) {
      // Get recovery suggestions
      const suggestions = RECOVERY_SUGGESTIONS[ERROR_TYPES.UNKNOWN];
      
      return (
        <div className="error-boundary p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300">
          <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
          <p className="mb-4">{this.state.error?.message || "Unknown error"}</p>
          
          <div className="mb-4">
            <button
              className="text-sm underline"
              onClick={this.toggleSuggestions}
            >
              {this.state.showSuggestions ? 'Hide suggestions' : 'Show recovery suggestions'}
            </button>
            
            {this.state.showSuggestions && (
              <ul className="mt-2 ml-5 text-sm list-disc">
                {suggestions.map((suggestion, index) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            )}
          </div>
          
          <div className="flex space-x-3">
            <button
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              onClick={() => window.location.reload()}
            >
              Reload Page
            </button>
            
            <button
              className="px-4 py-2 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
            >
              Try to Recover
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
