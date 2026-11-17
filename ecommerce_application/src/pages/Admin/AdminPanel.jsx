import { useEffect, useRef, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { makeId, money, setStore, updateStore, useStore } from '../customer/store'
import Sidebar from '../../components/Sidebar/Sidebar'
import useDebouncedValue from '../../hooks/useDebouncedValue'
import { downloadCsv } from '../../utils/csvExport'
import { useDispatch } from "react-redux";
import { removeProductFromCart } from '../../redux/cartSlice.js'
import { removeFromWishlist } from '../../redux/wishlistSlice.js'
import {
  fetchProducts,
  createProductApi,
  updateProductApi,
  deleteProductApi,
  fetchInventoryApi,
  updateInventoryStockApi,
  fetchCategoriesApi,
  createCategoryApi,
  updateCategoryApi,
  deleteCategoryApi,
  fetchOrdersApi,
  updateOrderStatusApi,
  logoutApi,
} from '../../api/backend.js'
import {
  addProduct,
  removeProduct as removeProductFromCatalog,
  updateProduct,
  updateProductStock,
} from '../../redux/ProductSlice.js'
function AdminShell() {
  const currentAdmin = useStore('currentAdmin')
  const location = useLocation()
  const isLoginPage = location.pathname === '/admin/login'

  const handleAdminLogout = async () => {
    try {
      await logoutApi('admin')
    } catch (err) {
      console.warn('Admin logout API err:', err)
    }
    setStore('currentAdmin', null)
  }

  return (
    <div className="app-shell admin-layout">
      <Sidebar />
      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <span className="eyebrow">STUDIO MANAGEMENT</span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#374334' }}>Admin Control Center</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {currentAdmin ? (
              <>
                <Link
                  to="/admin/account"
                  style={{ fontSize: '12px', color: '#374334', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                  title="View admin account details"
                >
                  🛡️ {currentAdmin.name || 'Studio Admin'} <span style={{ fontSize: '10px', color: '#6d7568' }}>(Account)</span>
                </Link>
                <button
                  type="button"
                  onClick={handleAdminLogout}
                  className="table-action delete-action"
                  style={{ fontSize: '11px', textDecoration: 'underline' }}
                >
                  Admin Sign Out
                </button>
              </>
            ) : (
              <Link
                to="/admin/login"
                style={{ fontSize: '11px', color: '#374334', textDecoration: 'underline' }}
              >
                Admin Sign In →
              </Link>
            )}
            <span className="admin-online"><i /> Online</span>
          </div>
        </header>
        {!currentAdmin && !isLoginPage ? (
          <div style={{ padding: '40px 20px', maxWidth: '520px', margin: '40px auto' }}>
            <div className="admin-panel" style={{ padding: '36px 28px', textAlign: 'center' }}>
              <span className="eyebrow">RESTRICTED ACCESS</span>
              <h2 style={{ margin: '8px 0 12px' }}>Admin Authentication Required</h2>
              <p style={{ color: '#7a7e75', fontSize: '13px', marginBottom: '24px' }}>
                Please sign in with your administrator credentials to access inventory, orders, and products.
              </p>
              <Link to="/admin/login" className="button button-dark" style={{ justifyContent: 'center' }}>
                Sign in to Admin Panel
              </Link>
            </div>
          </div>
        ) : (
          <Outlet />
        )}
      </main>
    </div>
  )
}

function PageHeading({ eyebrow, title, action }) {
  return <div className="admin-page-heading"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1></div>{action}</div>
}

function Overview({ products, orders }) {
  const navigate = useNavigate()
  const revenue = orders.reduce((sum, order) => sum + order.total, 0)
  const lowStock = products.filter((product) => product.stock > 0 && product.stock <= 10).length
  const metrics = [
    { label: 'Total revenue', value: money(revenue), note: 'All-time order total', to: null, icon: '💰' },
    { label: 'Orders', value: orders.length.toString(), note: 'Placed in this store', to: '/admin/orders', icon: '↗' },
    { label: 'Products', value: products.length.toString(), note: 'Across your collection', to: '/admin/products', icon: '▦' },
    { label: 'Needs a restock', value: lowStock.toString(), note: '10 items or fewer', to: '/admin/inventory', icon: '▥' },
  ]
  return (
    <>
      <PageHeading
        eyebrow="YOUR LITTLE CORNER OF THE INTERNET"
        title="Good morning, studio."
        action={<Link className="button button-dark" to="/admin/products">Manage products </Link>}
      />
      <div className="metric-grid">
        {metrics.map(({ label, value, note, to, icon }) => (
          to ? (
            <Link
              key={label}
              to={to}
              className="metric-card metric-card-interactive"
              title={`Go to ${label} page`}
            >
              <span className={`metric-icon ${label === 'Needs a restock' ? 'metric-alert' : ''}`}>{icon}</span>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                {label}
                <span className="metric-link-indicator" aria-hidden="true">→</span>
              </span>
              <b>{value}</b>
              <small>{note}</small>
            </Link>
          ) : (
            <article key={label} className="metric-card">
              <span className="metric-icon">{icon}</span>
              <span>{label}</span>
              <b>{value}</b>
              <small>{note}</small>
            </article>
          )
        ))}
      </div>
      <div className="admin-overview-grid">
        <section className="admin-panel">
          <div className="admin-panel-head">
            <div><span className="eyebrow">THE LATEST</span><h2><Link to="/admin/orders" className="overview-title-link">Recent orders</Link></h2></div>
            <Link to="/admin/orders">All orders →</Link>
          </div>
          {orders.length ? (
            <div className="admin-table-wrap"><table>
              <thead><tr><th>ORDER</th><th>CUSTOMER</th><th>DATE</th><th>STATUS</th><th>TOTAL</th></tr></thead>
              <tbody>{orders.slice(0, 5).map((order) => (
                <tr key={order.id} style={{ cursor: 'pointer' }} onClick={() => navigate('/admin/orders')} title="Click to view in Orders">
                  <td><Link to="/admin/orders" style={{ color: 'inherit', fontWeight: 'bold' }}>#{order.id.slice(-8)}</Link></td>
                  <td>{order.customer?.name || 'Guest'}</td>
                  <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td><span className={`status-pill status-${order.status.toLowerCase()}`}>{order.status}</span></td>
                  <td><b>{money(order.total)}</b></td>
                </tr>
              ))}</tbody>
            </table></div>
          ) : (
            <div className="admin-blank"><p>Your first order is just around the corner.</p><Link to="/admin/products">Make sure your products are ready </Link></div>
          )}
        </section>
        <section className="admin-panel popular-panel">
          <div className="admin-panel-head">
            <div><span className="eyebrow">YOUR COLLECTION</span><h2><Link to="/admin/products" className="overview-title-link">Popular products</Link></h2></div>
            <Link to="/admin/products">View all →</Link>
          </div>
          {[...products].sort((a, b) => b.reviews - a.reviews).slice(0, 4).map((product, index) => (
            <Link to="/admin/products" className="popular-row" key={product.id} style={{ textDecoration: 'none', color: 'inherit' }} title="View in Products catalog">
              <span className="popular-rank">0{index + 1}</span>{product.image ? <img src={product.image} alt="" /> : <span className="admin-image-placeholder" aria-label="No product image">No image</span>}
              <span><b>{product.name}</b><small>{product.category}</small></span><strong>{money(product.price)}</strong>
            </Link>
          ))}
        </section>
      </div>
    </>
  )
}

async function loadProductImage(file) {
  if (!file.type.startsWith('image/')) throw new Error('Choose an image file.')
  if (file.size > 10 * 1024 * 1024) throw new Error('Choose an image smaller than 10 MB.')

  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, 1200 / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', 0.82))
  if (!blob) throw new Error('This image could not be processed. Try another image.')
  if (blob.size > 700 * 1024) throw new Error('This image is still too large after compression. Choose a smaller image.')

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('The image could not be read. Try another image.'))
    reader.readAsDataURL(blob)
  })
}

export function ProductsAdmin({ products, categories }) {
  const [editing, setEditing] = useState(null)
  const [search, setSearch] = useState('')
  const dispatch = useDispatch();
  const debouncedSearch = useDebouncedValue(search)
  const [sortKey, setSortKey] = useState('newest')
  const [sortDirection, setSortDirection] = useState('asc')
  const [page, setPage] = useState(1)
  const pageSize = 10
  const [catalog, setCatalog] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [reloadVersion, setReloadVersion] = useState(0)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [pendingDelete, setPendingDelete] = useState(null)
  const [pendingImageRemoval, setPendingImageRemoval] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loadingImage, setLoadingImage] = useState(false)
  const [form, setForm] = useState(null)
  const [formErrors, setFormErrors] = useState({})
  const [imageInputKey, setImageInputKey] = useState(0)
  const orderBy = sortKey === 'newest' ? 'updatedAt' : sortKey === 'status' ? 'stock' : sortKey
  const order = sortDirection
  const requestKey = JSON.stringify([page, pageSize, debouncedSearch, orderBy, order, reloadVersion])
  const lastProductsKeyRef = useRef('')

  useEffect(() => {
    if (lastProductsKeyRef.current === requestKey) {
      return
    }
    lastProductsKeyRef.current = requestKey

    const controller = new AbortController()
    fetchProducts({
      page,
      limit: pageSize,
      q: debouncedSearch.trim(),
      orderBy,
      order,
    }, { signal: controller.signal }).then((result) => {
      if (controller.signal.aborted) return
      setCatalog({ ...result, requestKey })
      setLoadError('')
      if (result.page !== page) {
        setPage(result.page)
      }
    }).catch((requestError) => {
      if (requestError.name !== 'AbortError' && !controller.signal.aborted) {
        setLoadError(requestError.message)
      }
    })
    return () => controller.abort()
  }, [requestKey])

  useEffect(() => {
    const handleStoreSaved = (event) => {
      if (event.detail?.key === 'products') setReloadVersion((version) => version + 1)
    }
    window.addEventListener('store-saved', handleStoreSaved)
    return () => window.removeEventListener('store-saved', handleStoreSaved)
  }, [])

  const hasCurrentCatalog = catalog?.requestKey === requestKey
  const filtered = hasCurrentCatalog ? catalog.items : []
  const sortedProducts = filtered
  const pageProducts = filtered
  const pageCount = hasCurrentCatalog ? catalog.totalPages : 0
  const currentPage = hasCurrentCatalog ? catalog.page : page
  const totalProducts = hasCurrentCatalog ? catalog.total : 0
  const pageNumbers = Array.from(
    { length: Math.min(5, pageCount) },
    (_, index) => Math.max(1, Math.min(currentPage - 2, pageCount - 4)) + index,
  )
  const sortBy = (key) => {
    setSortDirection(sortKey === key && sortDirection === 'asc' ? 'desc' : 'asc')
    setSortKey(key)
    setPage(1)
  }
  const sortIndicator = (key) => sortKey === key ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'
  const exportProducts = async () => {
    setExporting(true)
    setLoadError('')
    try {
      const firstPage = await fetchProducts({
        page: 1,
        limit: 100,
        q: debouncedSearch.trim(),
        orderBy,
        order,
      })
      const allProducts = [...firstPage.items]
      for (let exportPage = 2; exportPage <= firstPage.totalPages; exportPage += 1) {
        const result = await fetchProducts({
          page: exportPage,
          limit: 100,
          q: debouncedSearch.trim(),
          orderBy,
          order,
        })
        allProducts.push(...result.items)
      }
      downloadCsv(
        'products.csv',
        ['Product ID', 'Product Name', 'Category', 'Price', 'Stock', 'Status'],
        allProducts.map((product) => [
          product.id,
          product.name,
          product.category,
          product.price,
          product.stock,
          product.stock === 0 ? 'Out of stock' : product.stock <= 10 ? 'Low stock' : 'In stock',
        ]),
      )
    } catch (exportError) {
      setLoadError(`Could not export products: ${exportError.message}`)
    } finally {
      setExporting(false)
    }
  }

  const resetForm = () => {
    setEditing(null)
    setForm(null)
    setError('')
    setImageInputKey((key) => key + 1)
  }
  const openAddForm = () => {
    if (form) {
      resetForm()
      return
    }
    setEditing(null)
    setError('')
    setForm({ name: '', category: categories[0]?.name ?? '', brand: '', price: '', stock: '', image: '', description: '' })
  }
  const editProduct = (product) => {
    setEditing(product.id)
    setError('')
    setImageInputKey((key) => key + 1)
    setForm({
      name: product.name,
      category: product.category,
      brand: product.brand ?? '',
      price: String(product.price),
      stock: String(product.stock),
      image: product.image ?? '',
      description: product.description ?? '',
    })
  }
  const requestRemoveProduct = (product) => {
    setDeleteError('')
    setPendingDelete(product)
  }
  const confirmRemoveProduct = async () => {
    if (!pendingDelete) return
    const idToDelete = pendingDelete.id
    try {
      try {
        await deleteProductApi(idToDelete)
      } catch (apiErr) {
        console.warn('Product delete API warning:', apiErr)
      }
      dispatch(removeProductFromCatalog(idToDelete))
      dispatch(removeProductFromCart(idToDelete));
      dispatch(removeFromWishlist(idToDelete));
      updateStore('products', (all) => all.filter((product) => product.id !== idToDelete));
      setPendingDelete(null)
    } catch (removeError) {
      setDeleteError(`Could not remove this product: ${removeError.message}`)
    }
  }
  const confirmRemoveImage = () => {
    setForm((current) => current ? { ...current, image: '' } : current)
    setPendingImageRemoval(false)
  }
  const handleImageChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setError('')
    setLoadingImage(true)
    try {
      const image = await loadProductImage(file)
      setForm((current) => ({ ...current, image }))
    } catch (imageError) {
      setError(imageError.message || 'The image could not be processed.')
      event.target.value = ''
    } finally {
      setLoadingImage(false)
    }
  }
  const saveProduct = async (event) => {
    event.preventDefault()
    const errors = {}
    if (!form.name || !form.name.trim()) {
      errors.name = 'Product name is required.'
    } else if (form.name.trim().length < 2) {
      errors.name = 'Product name must be at least 2 characters.'
    }

    if (!form.category || !form.category.trim()) {
      errors.category = 'Please select a category.'
    }

    const price = Number(form.price)
    if (form.price === '' || form.price === null || form.price === undefined || isNaN(price)) {
      errors.price = 'Please enter a valid price.'
    } else if (price <= 0) {
      errors.price = 'Price must be greater than 0.'
    }

    const stock = Number(form.stock)
    if (form.stock === '' || form.stock === null || form.stock === undefined || isNaN(stock)) {
      errors.stock = 'Please enter a stock quantity.'
    } else if (!Number.isInteger(stock) || stock < 0) {
      errors.stock = 'Stock must be a whole number (0 or more).'
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      setError('Please resolve the errors highlighted below.')
      return
    }
    setFormErrors({})
    setError('')
    const productValues = {
      name: form.name.trim(),
      category: form.category,
      brand: form.brand.trim() || 'Independent',
      price,
      stock,
      image: form.image,
      description: form.description.trim() || 'A thoughtful find for the everyday.',
    }
    setSaving(true)
    try {
      const now = new Date().toISOString()
      if (editing) {
        let updatedRemote = null
        try {
          updatedRemote = await updateProductApi(editing, productValues)
        } catch (apiErr) {
          console.warn('Product update API warning:', apiErr)
        }
        const existing = products.find((p) => p.id === editing)
        const updated = updatedRemote || {
          ...existing,
          ...productValues,
          id: editing,
          updatedAt: now,
        }
        dispatch(updateProduct(updated))
        updateStore('products', (all) => all.map((product) => product.id === editing ? updated : product))
      } else {
        let createdRemote = null
        try {
          createdRemote = await createProductApi(productValues)
        } catch (apiErr) {
          console.warn('Product create API warning:', apiErr)
        }
        const nextId = products.reduce((highestId, product) => {
          const match = /^p-(\d+)$/.exec(product.id)
          return Math.max(highestId, Number(match?.[1] ?? 0))
        }, 0) + 1
        const newProduct = createdRemote || {
          id: `p-${nextId}`,
          name: productValues.name,
          category: productValues.category,
          brand: productValues.brand,
          price: productValues.price,
          oldPrice: null,
          rating: 0,
          reviews: 0,
          stock: productValues.stock,
          featured: false,
          bestSeller: false,
          badge: '',
          color: 'sand',
          ...(productValues.image ? { image: productValues.image } : {}),
          description: productValues.description,
          createdAt: now,
          updatedAt: now,
        }
        dispatch(addProduct(newProduct))
        updateStore('products', (all) => [
          newProduct,
          ...all.filter((product) => product.id !== newProduct.id),
        ])
      }
      resetForm()
    } catch (saveError) {
      setError(`Could not save this product: ${saveError.message}`)
    } finally {
      setSaving(false)
    }
  }
  const removeProduct = (id) => {
    const product = products.find((item) => item.id === id)
    if (product) requestRemoveProduct(product)
  }

  const productForm = form && <form
    className={editing ? 'admin-product-dialog' : 'admin-add-form'}
    onSubmit={saveProduct}
    noValidate
    role={editing ? 'dialog' : undefined}
    aria-modal={editing ? 'true' : undefined}
    aria-labelledby={editing ? 'edit-product-title' : undefined}
    onKeyDown={editing ? (event) => { if (event.key === 'Escape') resetForm() } : undefined}
  >
    <div className="admin-panel-head">
      <div><span className="eyebrow">{editing ? 'UPDATE YOUR COLLECTION' : 'A NEW GOOD THING'}</span><h2 id={editing ? 'edit-product-title' : undefined}>{editing ? 'Edit product' : 'Add a product'}</h2></div>
      {editing && <button type="button" className="admin-dialog-close" onClick={resetForm} aria-label="Close edit product dialog">×</button>}
    </div>
    <div className="admin-form-grid">
      <label>
        Product name
        <input
          autoFocus={Boolean(editing)}
          className={formErrors.name ? 'input-error' : ''}
          value={form.name}
          onChange={(event) => {
            setForm({ ...form, name: event.target.value })
            if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: '' }))
            if (error) setError('')
          }}
          required
        />
        {formErrors.name && <span className="field-error-text">{formErrors.name}</span>}
      </label>
      <label>
        Category
        <select
          className={formErrors.category ? 'input-error' : ''}
          value={form.category}
          onChange={(event) => {
            setForm({ ...form, category: event.target.value })
            if (formErrors.category) setFormErrors((prev) => ({ ...prev, category: '' }))
            if (error) setError('')
          }}
          required
        >
          {categories.map((category) => <option key={category.id} value={category.name}>{category.name}</option>)}
        </select>
        {formErrors.category && <span className="field-error-text">{formErrors.category}</span>}
      </label>
      <label>Brand<input value={form.brand} onChange={(event) => setForm({ ...form, brand: event.target.value })} placeholder="Independent" /></label>
      <label>
        Price (INR)
        <input
          type="number"
          min="0.01"
          step="0.01"
          className={formErrors.price ? 'input-error' : ''}
          value={form.price}
          onChange={(event) => {
            setForm({ ...form, price: event.target.value })
            if (formErrors.price) setFormErrors((prev) => ({ ...prev, price: '' }))
            if (error) setError('')
          }}
          required
        />
        {formErrors.price && <span className="field-error-text">{formErrors.price}</span>}
      </label>
      <label>
        Stock quantity
        <input
          type="number"
          min="0"
          step="1"
          className={formErrors.stock ? 'input-error' : ''}
          value={form.stock}
          onChange={(event) => {
            setForm({ ...form, stock: event.target.value })
            if (formErrors.stock) setFormErrors((prev) => ({ ...prev, stock: '' }))
            if (error) setError('')
          }}
          required
        />
        {formErrors.stock && <span className="field-error-text">{formErrors.stock}</span>}
      </label>
      <label className="admin-form-wide">Product image<input key={imageInputKey} type="file" accept="image/*" onChange={handleImageChange} /><small>{loadingImage ? 'Preparing image…' : 'Upload an image up to 10 MB. It will be resized and saved in this browser.'}</small></label>
      {form.image && <div className="admin-image-preview admin-form-wide"><img src={form.image} alt="Product preview" /><button type="button" className="table-action delete-action" onClick={() => setPendingImageRemoval(true)}>Remove image</button></div>}
      <label className="admin-form-wide">Description<textarea rows="2" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
    </div>
    {error && <p className="form-error">{error}</p>}
    <div className="admin-form-actions">
      <button type="button" className="button button-light" onClick={resetForm} disabled={saving || loadingImage}>Cancel</button>
      <button className="button button-dark" disabled={saving || loadingImage}>{saving ? 'Saving…' : editing ? 'Save changes' : 'Save product'}</button>
    </div>
  </form>

  return <>
    <PageHeading eyebrow="THE THINGS YOU SELL" title="Products" action={<button className="button button-dark" disabled={loadingImage || saving} onClick={openAddForm}>{form ? 'Cancel' : '+ Add a product'}</button>} />
    {form && (editing
      ? <div className="admin-order-confirm-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) resetForm() }}>{productForm}</div>
      : productForm)}
    <section className="admin-panel admin-data-panel">
      <div className="table-toolbar"><div className="admin-search"><span>⌕</span><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} placeholder="Search products" aria-label="Search products" /></div><div className="admin-toolbar-actions"><span>{totalProducts} products</span><button type="button" className="csv-export-button" onClick={exportProducts} disabled={exporting}>{exporting ? 'Exporting…' : 'Export CSV'}</button></div></div>
      {loadError && <p className="form-error" role="alert">{loadError}</p>}
      <div className="admin-table-wrap"><table>
        <thead><tr>
          <th><button className="admin-sort-button" type="button" onClick={() => sortBy('name')}>PRODUCT <span aria-hidden="true">{sortIndicator('name')}</span></button></th>
          <th><button className="admin-sort-button" type="button" onClick={() => sortBy('category')}>CATEGORY <span aria-hidden="true">{sortIndicator('category')}</span></button></th>
          <th><button className="admin-sort-button" type="button" onClick={() => sortBy('price')}>PRICE <span aria-hidden="true">{sortIndicator('price')}</span></button></th>
          <th><button className="admin-sort-button" type="button" onClick={() => sortBy('stock')}>INVENTORY <span aria-hidden="true">{sortIndicator('stock')}</span></button></th>
          <th><button className="admin-sort-button" type="button" onClick={() => sortBy('status')}>STATUS <span aria-hidden="true">{sortIndicator('status')}</span></button></th>
          <th>ACTIONS</th>
        </tr></thead>
        <tbody>{pageProducts.map((product) => <tr key={product.id}>
          <td><div className="admin-product-cell">{product.image ? <img src={product.image} alt="" /> : <span className="admin-image-placeholder" aria-label="No product image">No image</span>}<b>{product.name}</b></div></td>
          <td>{product.category}</td><td><b>{money(product.price)}</b></td><td>{product.stock} in stock</td>
          <td><span className={`inventory-tag ${product.stock === 0 ? 'out' : product.stock <= 10 ? 'low' : ''}`}><i />{product.stock === 0 ? 'Sold out' : product.stock <= 10 ? 'Low stock' : 'In stock'}</span></td>
          <td><button type="button" className="table-action edit-action" onClick={() => editProduct(product)}>Edit</button><button type="button" className="table-action delete-action" onClick={() => removeProduct(product.id)}>Delete</button></td>
        </tr>)}</tbody>
      </table>{!hasCurrentCatalog && !loadError && <div className="admin-blank"><p>Loading products…</p></div>}{hasCurrentCatalog && !pageProducts.length && <div className="admin-blank"><p>No products match that search.</p></div>}</div>
      {pageCount > 1 && <nav className="admin-pagination" aria-label="Product table pages">
        <button type="button" onClick={() => setPage(currentPage - 1)} disabled={currentPage === 1}>Previous</button>
        {pageNumbers.map((pageNumber) => <button key={pageNumber} type="button" className={pageNumber === currentPage ? 'active' : ''} aria-current={pageNumber === currentPage ? 'page' : undefined} onClick={() => setPage(pageNumber)}>{pageNumber}</button>)}
        <span>Page {currentPage} of {pageCount}</span>
        <button type="button" onClick={() => setPage(currentPage + 1)} disabled={currentPage === pageCount}>Next</button>
      </nav>}
    </section>
    {pendingDelete && <div className="admin-order-confirm-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setPendingDelete(null) }}>
      <section className="admin-order-confirm" role="alertdialog" aria-modal="true" aria-labelledby="product-delete-title" aria-describedby="product-delete-description" onKeyDown={(event) => { if (event.key === 'Escape') setPendingDelete(null) }}>
        <span className="eyebrow">REMOVE FROM YOUR COLLECTION</span>
        <h2 id="product-delete-title">Delete this product?</h2>
        <p id="product-delete-description">“{pendingDelete.name}” will be removed from your products, cart, and wishlist. This can’t be undone.</p>
        {deleteError && <p className="form-error">{deleteError}</p>}
        <div className="admin-order-confirm-actions">
          <button type="button" className="button button-light" autoFocus onClick={() => setPendingDelete(null)}>Cancel</button>
          <button type="button" className="button button-dark" onClick={confirmRemoveProduct}>Delete product</button>
        </div>
      </section>
    </div>}
    {pendingImageRemoval && <div className="admin-order-confirm-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setPendingImageRemoval(false) }}>
      <section className="admin-order-confirm" role="alertdialog" aria-modal="true" aria-labelledby="image-remove-title" aria-describedby="image-remove-description" onKeyDown={(event) => { if (event.key === 'Escape') setPendingImageRemoval(false) }}>
        <span className="eyebrow">UPDATE PRODUCT IMAGE</span>
        <h2 id="image-remove-title">Remove this image?</h2>
        <p id="image-remove-description">The image will be removed from this product when you save your changes.</p>
        <div className="admin-order-confirm-actions">
          <button type="button" className="button button-light" autoFocus onClick={() => setPendingImageRemoval(false)}>Keep image</button>
          <button type="button" className="button button-dark" onClick={confirmRemoveImage}>Remove image</button>
        </div>
      </section>
    </div>}
  </>
}

export function CategoriesAdmin({ categories, products }) {
  const [name, setName] = useState('')
  const [newIcon, setNewIcon] = useState('')
  const [error, setError] = useState('')
  const [nameError, setNameError] = useState('')
  const [pendingCategoryDelete, setPendingCategoryDelete] = useState(null)
  const [deleteError, setDeleteError] = useState('')

  // Editing states
  const [editingCategory, setEditingCategory] = useState(null)
  const [editName, setEditName] = useState('')
  const [editIcon, setEditIcon] = useState('')
  const [editError, setEditError] = useState('')
  const [editNameError, setEditNameError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchCategoriesApi()
      .then((cats) => {
        if (Array.isArray(cats) && cats.length) {
          updateStore(
            'categories',
            () => cats.map((c) => ({ id: c.id, name: c.name, icon: c.icon || '✳' })),
            { skipSave: true }
          )
        }
      })
      .catch((err) => console.error('Categories load error:', err))
  }, [])

  const addCategory = async (event) => {
    event.preventDefault()
    const normalized = name.trim()
    const iconVal = newIcon.trim() || undefined
    if (!normalized) {
      setNameError('Please enter a category name.')
      return
    }
    if (normalized.length < 2) {
      setNameError('Category name must be at least 2 characters.')
      return
    }
    if (categories.some((item) => item.name.toLowerCase() === normalized.toLowerCase())) {
      setNameError('That category already exists.')
      return
    }
    setNameError('')
    setError('')
    try {
      const created = await createCategoryApi({ name: normalized, icon: iconVal })
      updateStore('categories', (all) => [
        ...all,
        { id: created?.id || makeId('category'), name: normalized, icon: created?.icon || iconVal || '✳' },
      ])
      setName('')
      setNewIcon('')
      setNameError('')
      setError('')
    } catch (apiErr) {
      setError(apiErr.message || 'Could not save category.')
    }
  }

  const startEditCategory = (category) => {
    setEditError('')
    setEditNameError('')
    setEditingCategory(category)
    setEditName(category.name)
    setEditIcon(category.icon || '')
  }

  const cancelEditCategory = () => {
    setEditingCategory(null)
    setEditName('')
    setEditIcon('')
    setEditError('')
    setEditNameError('')
  }

  const saveEditCategory = async (event) => {
    if (event) event.preventDefault()
    if (!editingCategory) return

    const normalizedName = editName.trim()
    const normalizedIcon = editIcon.trim() || undefined

    if (!normalizedName) {
      setEditNameError('Category name is required.')
      return
    }
    if (normalizedName.length < 2) {
      setEditNameError('Category name must be at least 2 characters.')
      return
    }

    if (
      normalizedName.toLowerCase() !== editingCategory.name.toLowerCase() &&
      categories.some(
        (item) => item.id !== editingCategory.id && item.name.toLowerCase() === normalizedName.toLowerCase()
      )
    ) {
      setEditNameError('A category with that name already exists.')
      return
    }

    setEditNameError('')
    setIsSaving(true)
    setEditError('')

    try {
      const updated = await updateCategoryApi(editingCategory.id, {
        name: normalizedName,
        icon: normalizedIcon,
      })

      const oldName = editingCategory.name
      const finalName = updated?.name || normalizedName
      const finalIcon = updated?.icon || normalizedIcon || editingCategory.icon || '✳'

      updateStore('categories', (all) =>
        all.map((item) =>
          item.id === editingCategory.id ? { ...item, name: finalName, icon: finalIcon } : item
        )
      )

      // If the category was renamed, also cascade the update to products in the frontend store
      if (oldName !== finalName) {
        updateStore('products', (all) =>
          all.map((product) =>
            product.category === oldName ? { ...product, category: finalName } : product
          )
        )
      }

      setEditingCategory(null)
      setEditName('')
      setEditIcon('')
    } catch (saveErr) {
      setEditError(saveErr.message || 'Could not update category.')
    } finally {
      setIsSaving(false)
    }
  }

  const requestRemoveCategory = (category) => {
    setDeleteError('')
    setPendingCategoryDelete(category)
  }

  const confirmRemoveCategory = async () => {
    if (!pendingCategoryDelete) return
    const used = products.some((product) => product.category === pendingCategoryDelete.name)
    if (used) {
      setDeleteError(`Move or remove products in ${pendingCategoryDelete.name} before deleting this category.`)
      return
    }
    try {
      await deleteCategoryApi(pendingCategoryDelete.id)
      updateStore('categories', (all) => all.filter((item) => item.id !== pendingCategoryDelete.id))
      setPendingCategoryDelete(null)
    } catch (removeError) {
      setDeleteError(`Could not delete this category: ${removeError.message}`)
    }
  }

  const categoryIsUsed = pendingCategoryDelete && products.some((product) => product.category === pendingCategoryDelete.name)

  return <>
    <PageHeading eyebrow="A PLACE FOR EVERYTHING" title="Categories" />
    <div className="admin-category-layout">
      <section className="admin-panel">
        <div className="admin-panel-head">
          <div><span className="eyebrow">YOUR COLLECTION, ORGANIZED</span><h2>Shop categories</h2></div>
          <span className="category-count">{categories.length} total</span>
        </div>
        {categories.map((category, index) => {
          const productCount = products.filter((product) => product.category === category.name).length
          return (
            <div className="category-admin-row" key={category.id}>
              <span className="category-index">0{index + 1}</span>
              <span className="category-icon-badge" aria-hidden="true">{category.icon || '✳'}</span>
              <div>
                <b>{category.name}</b>
                <small>{productCount} {productCount === 1 ? 'product' : 'products'}</small>
              </div>
              <div className="category-admin-actions">
                <button
                  type="button"
                  className="table-action edit-action"
                  onClick={() => startEditCategory(category)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="table-action delete-action"
                  onClick={() => requestRemoveCategory(category)}
                >
                  Delete
                </button>
              </div>
            </div>
          )
        })}
        {!categories.length && <div className="admin-blank"><p>No categories yet. Add your first one to start organizing.</p></div>}
      </section>
      <form className="admin-panel category-add" onSubmit={addCategory} noValidate>
        <span className="eyebrow">GROW YOUR COLLECTION</span>
        <h2>Add a category</h2>
        <p>Give your good things a home.</p>
        <label>
          Category name
          <input
            className={nameError ? 'input-error' : ''}
            value={name}
            onChange={(event) => {
              setName(event.target.value)
              if (nameError) setNameError('')
              if (error) setError('')
            }}
            placeholder="e.g. Garden & Outdoors"
            required
          />
          {nameError && <span className="field-error-text">{nameError}</span>}
        </label>
        <label>Category icon (optional)<input value={newIcon} onChange={(event) => setNewIcon(event.target.value)} placeholder="e.g. ⌂, ✿, ✳, ⌁, ◇" /></label>
        {error && <p className="form-error">{error}</p>}
        <button className="button button-dark">Add category </button>
      </form>
    </div>
    {editingCategory && (
      <div
        className="admin-order-confirm-backdrop"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) cancelEditCategory()
        }}
      >
        <section
          className="admin-order-confirm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="category-edit-title"
          aria-describedby="category-edit-description"
          onKeyDown={(event) => {
            if (event.key === 'Escape') cancelEditCategory()
          }}
          style={{ width: 'min(460px, 100%)', textAlign: 'left' }}
        >
          <span className="eyebrow">UPDATE CATEGORY</span>
          <h2 id="category-edit-title" style={{ margin: '4px 0 8px' }}>Edit category</h2>
          <p id="category-edit-description" style={{ marginBottom: '14px', color: '#7a7e75', fontSize: '13px' }}>
            Edit category name and icon. Renaming will automatically update all associated products.
          </p>
          <form onSubmit={saveEditCategory} noValidate>
            <label style={{ display: 'block', marginBottom: '12px', fontSize: '12px', fontWeight: 600, color: '#444' }}>
              Category Name *
              <input
                type="text"
                autoFocus
                className={editNameError ? 'input-error' : ''}
                value={editName}
                onChange={(event) => {
                  setEditName(event.target.value)
                  if (editNameError) setEditNameError('')
                  if (editError) setEditError('')
                }}
                required
                style={{
                  display: 'block',
                  width: '100%',
                  marginTop: '6px',
                  padding: '8px 12px',
                  border: editNameError ? '1px solid #b83232' : '1px solid #d3d1c7',
                  borderRadius: '4px',
                  fontSize: '14px',
                  background: editNameError ? '#fffaf9' : '#fff',
                }}
              />
              {editNameError && <span className="field-error-text">{editNameError}</span>}
            </label>
            <label style={{ display: 'block', marginBottom: '12px', fontSize: '12px', fontWeight: 600, color: '#444' }}>
              Category Icon (Symbol)
              <input
                type="text"
                value={editIcon}
                onChange={(event) => setEditIcon(event.target.value)}
                placeholder="e.g. ⌂, ✿, ✳, ⌁, ◇"
                style={{
                  display: 'block',
                  width: '100%',
                  marginTop: '6px',
                  padding: '8px 12px',
                  border: '1px solid #d3d1c7',
                  borderRadius: '4px',
                  fontSize: '14px',
                  background: '#fff',
                }}
              />
            </label>
            <div style={{ marginBottom: '14px' }}>
              <span style={{ fontSize: '11px', color: '#888', display: 'block', marginBottom: '6px' }}>Icon presets:</span>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {['⌁', '◇', '◒', '✿', '⌂', '✳', '⚡', '☕', '👜', '👟', '🌿'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    className="button button-light"
                    style={{
                      padding: '2px 8px',
                      minHeight: '26px',
                      fontSize: '12px',
                      background: editIcon === preset ? '#374334' : undefined,
                      color: editIcon === preset ? '#fff' : undefined,
                    }}
                    onClick={() => setEditIcon(preset)}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
            {editError && <p className="form-error" style={{ color: '#b83232', fontSize: '12px', margin: '0 0 12px' }}>{editError}</p>}
            <div className="admin-order-confirm-actions">
              <button type="button" className="button button-light" onClick={cancelEditCategory} disabled={isSaving}>Cancel</button>
              <button type="submit" className="button button-dark" disabled={isSaving}>{isSaving ? 'Saving…' : 'Save changes'}</button>
            </div>
          </form>
        </section>
      </div>
    )}
    {pendingCategoryDelete && <div className="admin-order-confirm-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setPendingCategoryDelete(null) }}>
      <section className="admin-order-confirm" role="alertdialog" aria-modal="true" aria-labelledby="category-delete-title" aria-describedby="category-delete-description" onKeyDown={(event) => { if (event.key === 'Escape') setPendingCategoryDelete(null) }}>
        <span className="eyebrow">UPDATE YOUR COLLECTION</span>
        <h2 id="category-delete-title">{categoryIsUsed ? 'This category is in use' : 'Delete this category?'}</h2>
        <p id="category-delete-description">{deleteError || (categoryIsUsed
          ? `Move or remove products in ${pendingCategoryDelete.name} before deleting this category.`
          : `“${pendingCategoryDelete.name}” will be permanently removed from your categories.`)}</p>
        <div className="admin-order-confirm-actions">
          <button type="button" className="button button-light" autoFocus onClick={() => setPendingCategoryDelete(null)}>{categoryIsUsed ? 'Close' : 'Cancel'}</button>
          {!categoryIsUsed && <button type="button" className="button button-dark" onClick={confirmRemoveCategory}>Delete category</button>}
        </div>
      </section>
    </div>}
  </>
}

export function InventoryAdmin() {
  const dispatch = useDispatch()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [sortKey, setSortKey] = useState('name')
  const [sortDirection, setSortDirection] = useState('asc')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [catalog, setCatalog] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [reloadVersion, setReloadVersion] = useState(0)
  const [pendingStockDecrease, setPendingStockDecrease] = useState(null)
  const debouncedSearch = useDebouncedValue(search)

  const lastInventoryParamsRef = useRef('')

  useEffect(() => {
    const currentParams = {
      page,
      limit,
      q: debouncedSearch.trim(),
      status,
      sort: sortKey,
      order: sortDirection,
    }
    const signature = JSON.stringify({ ...currentParams, reloadVersion })
    if (lastInventoryParamsRef.current === signature) {
      return
    }
    lastInventoryParamsRef.current = signature

    const controller = new AbortController()
    setLoading(true)
    fetchInventoryApi(currentParams, { signal: controller.signal })
      .then((result) => {
        if (controller.signal.aborted) return
        setCatalog(result)
        setLoadError('')
        setLoading(false)
      })
      .catch((err) => {
        if (err.name !== 'AbortError' && !controller.signal.aborted) {
          setLoadError(err.message)
          setLoading(false)
        }
      })
    return () => controller.abort()
  }, [page, limit, debouncedSearch, status, sortKey, sortDirection, reloadVersion])

  const updateStock = async (id, value) => {
    const stock = Number(value)
    if (!Number.isInteger(stock) || stock < 0) return

    setCatalog((prev) => prev ? {
      ...prev,
      items: prev.items.map((item) => item.id === id ? { ...item, stock } : item),
    } : prev)

    dispatch(updateProductStock({ id, stock }))
    updateStore('products', (all) => all.map((item) => item.id === id ? { ...item, stock } : item))

    try {
      await updateInventoryStockApi(id, stock)
      setReloadVersion((v) => v + 1)
    } catch (err) {
      console.error('Failed to update stock via API:', err)
      setLoadError(`Stock update failed: ${err.message}`)
    }
  }

  const confirmStockDecrease = () => {
    if (!pendingStockDecrease) return
    updateStock(pendingStockDecrease.id, pendingStockDecrease.stock - 1)
    setPendingStockDecrease(null)
  }

  const sortBy = (key) => {
    setSortDirection(sortKey === key && sortDirection === 'asc' ? 'desc' : 'asc')
    setSortKey(key)
    setPage(1)
  }
  const sortIndicator = (key) => sortKey === key ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'

  const items = catalog?.items ?? []
  const total = catalog?.total ?? 0
  const totalPages = catalog?.totalPages ?? 1
  const lowCount = catalog?.lowStockCount ?? 0
  const outCount = catalog?.outOfStockCount ?? 0

  return (
    <>
      <PageHeading eyebrow="WHAT'S ON THE SHELF" title="Inventory" />
      <div className="inventory-notice">
        <div>
          <b>
            {lowCount || outCount
              ? `${lowCount} low stock, ${outCount} sold out product(s) need attention.`
              : 'Everything looking well stocked.'}
          </b>
          <p>Total inventory in warehouse: {catalog?.totalStock ?? 0} units across {total} products.</p>
        </div>
      </div>

      <section className="admin-panel admin-data-panel">
        <div className="table-toolbar" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="admin-search">
              <input
                value={search}
                onChange={(event) => { setSearch(event.target.value); setPage(1); }}
                placeholder="Find a product or SKU..."
                aria-label="Find a product"
              />
            </div>
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              {[
                ['all', 'All'],
                ['in-stock', 'In Stock'],
                ['low', 'Low Stock (≤10)'],
                ['out', 'Sold Out'],
              ].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  className={`button button-small ${status === key ? 'button-dark' : 'button-light'}`}
                  onClick={() => { setStatus(key); setPage(1); }}
                  style={{ fontSize: '11px', padding: '0.3rem 0.65rem' }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span>{total} products</span>
            <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              Show:
              <select
                value={limit}
                onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                style={{ padding: '0.2rem 0.4rem', borderRadius: '4px' }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </label>
          </div>
        </div>

        {loadError && <p role="alert" style={{ padding: '0.75rem', color: '#c00' }}>{loadError}</p>}

        <div className="admin-table-wrap">
          {loading && !catalog ? (
            <p style={{ padding: '2rem', textAlign: 'center' }}>Loading inventory from server…</p>
          ) : (
            <table>
              <thead>
                <tr>
                  {[
                    ['name', 'PRODUCT'],
                    ['sku', 'SKU'],
                    ['stock', 'IN STOCK'],
                    ['status', 'STATUS'],
                  ].map(([key, label]) => (
                    <th key={key}>
                      <button
                        className="admin-sort-button"
                        type="button"
                        onClick={() => sortBy(key)}
                        aria-label={`Sort by ${label.toLowerCase()}`}
                        aria-sort={sortKey === key ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                      >
                        {label}
                        <span aria-hidden="true">{sortIndicator(key)}</span>
                      </button>
                    </th>
                  ))}
                  <th>QUICK UPDATE</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>
                      No inventory items found.
                    </td>
                  </tr>
                ) : (
                  items.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <div className="admin-product-cell">
                          <img src={product.image} alt="" />
                          <div>
                            <b>{product.name}</b>
                            <small style={{ display: 'block', color: '#888' }}>{product.category}</small>
                          </div>
                        </div>
                      </td>
                      <td className="muted-cell">{product.id.slice(-7).toUpperCase()}</td>
                      <td><b>{product.stock}</b></td>
                      <td>
                        <span className={`inventory-tag ${product.stock === 0 ? 'out' : product.stock <= 10 ? 'low' : ''}`}>
                          <i />
                          {product.stock === 0 ? 'Sold out' : product.stock <= 10 ? 'Low stock' : 'In stock'}
                        </span>
                      </td>
                      <td>
                        <div className="stock-control">
                          <button
                            onClick={() => setPendingStockDecrease(product)}
                            disabled={product.stock === 0}
                            aria-label={`Remove one ${product.name} from stock`}
                          >
                            −
                          </button>
                          <input
                            aria-label={`${product.name} stock quantity`}
                            type="number"
                            min="0"
                            value={product.stock}
                            onChange={(event) => updateStock(product.id, event.target.value)}
                          />
                          <button
                            onClick={() => updateStock(product.id, product.stock + 1)}
                            aria-label={`Add one ${product.name} to stock`}
                          >
                            +
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {totalPages > 1 && (
          <nav className="pagination" aria-label="Inventory pages" style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '0.4rem' }}>
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              type="button"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
              <button
                key={num}
                className={page === num ? 'active' : ''}
                aria-current={page === num ? 'page' : undefined}
                onClick={() => setPage(num)}
                type="button"
              >
                {num}
              </button>
            ))}
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              type="button"
            >
              Next
            </button>
          </nav>
        )}
      </section>

      {pendingStockDecrease && (
        <div
          className="admin-order-confirm-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setPendingStockDecrease(null)
          }}
        >
          <section
            className="admin-order-confirm"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="stock-decrease-title"
            aria-describedby="stock-decrease-description"
            onKeyDown={(event) => {
              if (event.key === 'Escape') setPendingStockDecrease(null)
            }}
          >
            <span className="eyebrow">UPDATE INVENTORY</span>
            <h2 id="stock-decrease-title">Remove one from stock?</h2>
            <p id="stock-decrease-description">
              Reduce {pendingStockDecrease.name} inventory from {pendingStockDecrease.stock} to {pendingStockDecrease.stock - 1}?
            </p>
            <div className="admin-order-confirm-actions">
              <button
                type="button"
                className="button button-light"
                autoFocus
                onClick={() => setPendingStockDecrease(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="button button-dark"
                onClick={confirmStockDecrease}
              >
                Remove one
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  )
}

export function OrdersAdmin({ orders: storeOrders }) {
  const [liveOrders, setLiveOrders] = useState(storeOrders || [])
  useEffect(() => {
    let active = true
    const controller = new AbortController()
    fetchOrdersApi({}, { signal: controller.signal })
      .then((res) => {
        if (!active || controller.signal.aborted) return
        const items = Array.isArray(res?.items) ? res.items : Array.isArray(res) ? res : null
        if (items) setLiveOrders(items)
      })
      .catch((err) => {
        if (err.name !== 'AbortError' && !controller.signal.aborted) {
          console.error('Orders API fetch error:', err)
        }
      })
    return () => {
      active = false
      controller.abort()
    }
  }, [])

  const orders = liveOrders.length ? liveOrders : (storeOrders || [])

  const changeStatus = async (id, status) => {
    try {
      await updateOrderStatusApi(id, status)
    } catch (err) {
      console.error('Order status API update error:', err)
    }
    setLiveOrders((all) => all.map((order) => order.id === id ? { ...order, status } : order))
    updateStore('orders', (all) => all.map((order) => order.id === id ? { ...order, status } : order))
  }
  const [pendingStatus, setPendingStatus] = useState(null)
  const requestStatusChange = (order, status) => {
    if (status !== order.status) setPendingStatus({ orderId: order.id, status })
  }
  const confirmStatusChange = () => {
    if (!pendingStatus) return
    changeStatus(pendingStatus.orderId, pendingStatus.status)
    setPendingStatus(null)
  }
  const exportOrders = () => downloadCsv(
    'orders.csv',
    ['Order ID', 'Customer', 'Order Date', 'Total', 'Payment', 'Status'],
    orders.map((order) => [
      order.id,
      order.customer?.name || 'Guest',
      order.createdAt ? new Date(order.createdAt).toISOString() : '',
      order.total,
      order.payment === 'paypal' ? 'PayPal' : order.payment === 'card' ? 'Card' : order.payment ?? '',
      order.status,
    ]),
  )
  return <>
    <PageHeading
      eyebrow="EVERY GOOD THING, ON ITS WAY"
      title="Orders"
      action={<div className="admin-toolbar-actions"><span className="orders-total">{orders.length} total orders</span><button type="button" className="csv-export-button" onClick={exportOrders}>Export CSV</button></div>}
    />
    {orders.length ? (
      <section className="admin-panel admin-data-panel">
        <div className="admin-table-wrap">
          <table>
            <thead><tr><th>ORDER</th><th>CUSTOMER</th><th>DATE</th><th>ITEMS</th><th>TOTAL</th><th>STATUS</th></tr></thead>
            <tbody>{orders.map((order) => (
              <tr key={order.id}>
                <td><b>#{order.id.slice(-8)}</b><small className="table-sub">{order.customer?.email || ''}</small></td>
                <td>{order.customer?.name || 'Guest'}</td>
                <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                <td>{order.items.reduce((sum, item) => sum + item.quantity, 0)}</td>
                <td><b>{money(order.total)}</b></td>
                <td>
                  <select
                    className={`status-select status-${order.status.toLowerCase()}`}
                    value={order.status}
                    onChange={(event) => requestStatusChange(order, event.target.value)}
                    aria-label={`Update status for order ${order.id}`}
                  >
                    <option>Processing</option><option>Packed</option><option>Shipped</option><option>Delivered</option><option>Cancelled</option>
                  </select>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </section>
    ) : (
      <section className="admin-panel admin-blank"><span>✓</span><h2>Nothing on the books just yet.</h2><p>When your first order comes in, it’ll be here waiting.</p></section>
    )}
    {pendingStatus && <div className="admin-order-confirm-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setPendingStatus(null) }}>
      <section className="admin-order-confirm" role="alertdialog" aria-modal="true" aria-labelledby="order-status-confirm-title" aria-describedby="order-status-confirm-description" onKeyDown={(event) => { if (event.key === 'Escape') setPendingStatus(null) }}>
        <span className="eyebrow">CONFIRM ORDER UPDATE</span>
        <h2 id="order-status-confirm-title">Change this order’s status?</h2>
        <p id="order-status-confirm-description">Update order #{pendingStatus.orderId.slice(-8)} to {pendingStatus.status}?</p>
        <div className="admin-order-confirm-actions">
          <button type="button" className="button button-light" autoFocus onClick={() => setPendingStatus(null)}>Keep current status</button>
          <button type="button" className="button button-dark" onClick={confirmStatusChange}>Confirm update</button>
        </div>
      </section>
    </div>}
  </>
}

export function AdminOverview() {
  const products = useStore('products')
  const orders = useStore('orders')
  return <Overview products={products} orders={orders} />
}

export function AdminProducts() {
  return <ProductsAdmin products={useStore('products')} categories={useStore('categories')} />
}

export function AdminCategories() {
  return <CategoriesAdmin categories={useStore('categories')} products={useStore('products')} />
}

export function AdminInventory() {
  return <InventoryAdmin />
}

export function AdminOrders() {
  return <OrdersAdmin orders={useStore('orders')} />
}

export function AdminLayout() {
  return <AdminShell />
}
