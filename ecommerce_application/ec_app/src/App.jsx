import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import adminRoutes from './routes/AdminRoutes'
import customerRoutes from './routes/CustomerRoutes'
import { initializeStore } from './pages/customer/store.js'
import './styles/index.js'

const router = createBrowserRouter([
  ...customerRoutes,
  ...adminRoutes,
  { path: '*', element: <Navigate to="/" replace /> },
])

function App() {
  initializeStore()
  return <RouterProvider router={router} />
}

export default App
