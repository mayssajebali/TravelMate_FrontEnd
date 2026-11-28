import { Component } from 'react'

export default class ErrorBoundary extends Component {
  state = { error: null }
  static getDerivedStateFromError(error) { return { error } }
  componentDidUpdate(prev) {
    if (prev.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: null })
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 20, background: '#fff', borderRadius: 16, border: '1px solid #e7e3d8' }}>
          <b>Cette page a rencontré une erreur.</b>
          <p style={{ color: '#6b7280', fontSize: 14 }}>{String(this.state.error.message || this.state.error)}</p>
        </div>
      )
    }
    return this.props.children
  }
}