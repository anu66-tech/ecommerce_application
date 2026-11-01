import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import adminRoutes from './routes/AdminRoutes'
import customerRoutes from './routes/CustomerRoutes'
import { initializeStore } from './pages/customer/store.js'
import { replaceCart } from './redux/cartSlice.js'
import { replaceWishlist } from './redux/wishlistSlice.js'
import { replaceProducts } from './redux/ProductSlice.js'
import './styles/index.js'

const router = createBrowserRouter([
  ...customerRoutes,
  ...adminRoutes,
  { path: '*', element: <Navigate to="/" replace /> },
])

function App() {
  const dispatch = useDispatch()
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    const handleStoreError = (event) => {
      setSaveError(event.detail?.message || 'The latest changes could not be saved.')
    }
    const handleStoreSaved = () => setSaveError('')
    window.addEventListener('store-error', handleStoreError)
    window.addEventListener('store-saved', handleStoreSaved)
    return () => {
      window.removeEventListener('store-error', handleStoreError)
      window.removeEventListener('store-saved', handleStoreSaved)
    }
  }, [])

  useEffect(() => {
    let active = true
    initializeStore().then((data) => {
      if (!active) return
      dispatch(replaceProducts(data.products))
      dispatch(replaceCart(data.cart))
      dispatch(replaceWishlist(data.wishlist))
      setReady(true)
    }).catch((loadError) => {
      if (!active) return
      setError(loadError.message || 'Could not load app data from the backend.')
    })
    return () => {
      active = false
    }
  }, [dispatch, retryCount])

  if (!ready) {
    return (
      <main role="status" className="backend-loading">
        {error ? (
          <>
            <h1>Could not connect to the data service.</h1>
            <p>{error}</p>
            <p>Check that the NestJS backend and PostgreSQL are running, then try again.</p>
            <button type="button" onClick={() => {
              setError('')
              setRetryCount((count) => count + 1)
            }}>Retry</button>
          </>
        ) : <p>Loading your store data…</p>}
      </main>
    )
  }
  return (
    <>
      <RouterProvider router={router} />
      {saveError && (
        <div
          role="alert"
          style={{
            position: 'fixed',
            right: '1rem',
            bottom: '1rem',
            zIndex: 1000,
            maxWidth: 'min(32rem, calc(100vw - 2rem))',
            padding: '1rem',
            color: '#fff',
            background: '#8b1d1d',
          }}
        >
          Could not save changes: {saveError}
        </div>
      )}
    </>
  )
}

export default App
