import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error("Caught by ErrorBoundary:", error, errorInfo)
    this.setState({ errorInfo })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', background: '#ffebee', color: '#c62828', minHeight: '100vh', fontFamily: 'monospace' }}>
          <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>Something went wrong.</h1>
          <p style={{ fontWeight: 'bold' }}>{this.state.error && this.state.error.toString()}</p>
          <pre style={{ marginTop: '20px', whiteSpace: 'pre-wrap', background: '#ffcdd2', padding: '20px', borderRadius: '8px' }}>
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </pre>
        </div>
      )
    }
    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
)
