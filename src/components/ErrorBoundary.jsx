import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('present.now crashed:', error, info)
  }

  handleReset = () => {
    try {
      // Do not wipe saved documents — just recover the UI.
      this.setState({ hasError: false, error: null })
    } catch {
      // ignore
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-screen flex-col items-center justify-center gap-3 bg-gray-50 p-6 text-center dark:bg-gray-950">
          <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Something went wrong</h1>
          <p className="max-w-sm text-sm text-gray-500 dark:text-gray-400">
            present.now hit an unexpected error. Your saved documents are safe in local storage. Try reloading the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 rounded-lg bg-accent-500 px-4 py-2 text-sm font-medium text-white hover:bg-accent-600"
          >
            Reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
