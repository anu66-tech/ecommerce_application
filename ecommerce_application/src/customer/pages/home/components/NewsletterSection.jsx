import { useState } from 'react'
import Icon from '../../../../shared/components/Icon.jsx'
import { subscribeNewsletterApi } from '../api/homeApi.js'

export function NewsletterSection() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    const trimmed = email.trim()
    if (!trimmed) {
      setError('Please enter your email address.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Please enter a valid email address (e.g. name@domain.com).')
      return
    }
    setError('')
    try {
      await subscribeNewsletterApi(trimmed)
    } catch (err) {
      console.warn('Newsletter API subscribe:', err)
    }
    setSuccess(true)
  }

  return (
    <section className="newsletter">
      <span className="eyebrow">A NOTE FROM US, NOW AND THEN</span>
      <h2>A little good in your inbox.</h2>
      <p>New finds, slow-living notes, and 10% off your first order.</p>
      {success ? (
        <div style={{ color: '#276b38', fontWeight: 600, padding: '12px 0', fontSize: '12px' }}>
          ✓ You’re on the list — talk soon!
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="email"
              placeholder="Your email address"
              aria-label="Your email address"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (error) setError('')
              }}
              className={error ? 'input-error' : ''}
            />
            <button type="submit">
              Count me in <Icon name="arrow" size={16} />
            </button>
          </div>
          {error && <span className="field-error-text">{error}</span>}
        </form>
      )}
      <span className="newsletter-note">No noise. Just the good stuff.</span>
    </section>
  )
}

export default NewsletterSection
