import { useEffect, useState } from 'react'
import { Form, Link, useNavigate, useSearchParams } from 'react-router-dom'
import { checkBackendHealth } from '@/api/backend.js'
import { useStore } from '../store/store.js'
import useDebouncedValue from '../hooks/useDebouncedValue.js'
import Icon from './Icon.jsx'

export function Header({ count, wishlistCount, onAccount }) {
  const currentUser = useStore('currentUser')
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [backendStatus, setBackendStatus] = useState('connecting')
  const currentQuery = searchParams.get('q') ?? ''
  const [search, setSearch] = useState(currentQuery)
  const [shouldSearch, setShouldSearch] = useState(false)
  const debouncedSearch = useDebouncedValue(search)

  useEffect(() => setSearch(currentQuery), [currentQuery])

  useEffect(() => {
    const controller = new AbortController()
    checkBackendHealth({ signal: controller.signal })
      .then(() => setBackendStatus('connected'))
      .catch((error) => {
        if (error.name !== 'AbortError') {
          console.error('Could not connect to the backend.', error)
          setBackendStatus('disconnected')
        }
      })
    return () => controller.abort()
  }, [])

  useEffect(() => {
    if (!shouldSearch || search !== debouncedSearch) return
    const query = debouncedSearch.trim()
    navigate(query ? `/products?q=${encodeURIComponent(query)}` : '/products', {
      replace: true,
    })
    setShouldSearch(false)
  }, [debouncedSearch, navigate, search, shouldSearch])

  return (
    <>
      <div className="flex min-h-8.75 items-center justify-center bg-green px-4 py-1.75 text-center text-[10px] tracking-[.12em] text-[#fffdf6] max-[760px]:min-h-7.75 max-[760px]:text-[8px]">
        A little something extra — free shipping on orders over ₹4,999
      </div>
      <header className="site-header">
        <Link className="brand" to="/home">
          goodthings<span>.</span>
        </Link>
        <Form className="header-search" action="/products" method="get">
          <Icon name="search" size={17} />
          <input
            name="q"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setShouldSearch(true)
            }}
            placeholder="Search products"
            aria-label="Search products"
          />
          <button type="submit" aria-label="Search">
            ↵
          </button>
        </Form>
        <nav className="main-nav" aria-label="Main navigation">
          <Link to="/products">Products</Link>
        </nav>
        <div className="header-actions">
          <span
            className={`backend-status backend-status-${backendStatus}`}
            role="status"
            aria-live="polite"
          >
            <i aria-hidden="true" />
            <span>
              {backendStatus === 'connected'
                ? 'API connected'
                : backendStatus === 'disconnected'
                  ? 'API offline'
                  : 'Connecting API'}
            </span>
          </span>
          <Link className="header-text-link" to="/wishlist">
            Wishlist{wishlistCount > 0 && <span>{wishlistCount}</span>}
          </Link>
          <Link className="header-text-link" to="/cart">
            Cart{count > 0 && <span>{count}</span>}
          </Link>
          <Link
            className="header-text-link header-user-link"
            to={currentUser ? '/account' : '/login'}
            aria-label={currentUser ? `Account: ${currentUser.name}` : 'Sign In'}
            title={currentUser ? `Signed in as ${currentUser.name} - View Account Details` : 'Sign In'}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
          >
            <Icon name="user" size={16} />
            <span>{currentUser ? currentUser.name.split(' ')[0] : 'Sign In'}</span>
          </Link>
        </div>
      </header>
    </>
  )
}

export default Header
