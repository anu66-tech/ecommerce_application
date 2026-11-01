import { useState } from 'react'
import { Link, Outlet } from 'react-router-dom'
import { makeId, money, updateStore, useStore } from '../customer/store'
import Sidebar from '../../components/Sidebar/Sidebar'
import useDebouncedValue from '../../hooks/useDebouncedValue'
import { downloadCsv } from '../../utils/csvExport'
import { useDispatch } from "react-redux";
import { removeProductFromCart } from '../../redux/cartSlice.js'
import { removeFromWishlist } from '../../redux/wishlistSlice.js'
import {
  addProduct,
  removeProduct as removeProductFromCatalog,
  updateProduct,
  updateProductStock,
} from '../../redux/ProductSlice.js'
function AdminShell() {
  return <div className="app-shell admin-layout"><Sidebar /><main className="admin-main"><header className="admin-topbar"><div><span className="eyebrow">THURSDAY, OCTOBER 8, 2026</span><Link to="/">← View storefront</Link></div><span className="admin-online"><i /> Local demo mode</span></header><Outlet /></main></div>
}

function PageHeading({ eyebrow, title, action }) {
  return <div className="admin-page-heading"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1></div>{action}</div>
}

function Overview({ products, orders }) {
  const revenue = orders.reduce((sum, order) => sum + order.total, 0)
  const lowStock = products.filter((product) => product.stock > 0 && product.stock <= 10).length
  const metrics = [
    ['Total revenue', money(revenue), 'All-time order total'],
    ['Orders', orders.length.toString(), 'Placed in this browser'],
    ['Products', products.length.toString(), 'Across your collection'],
    ['Needs a restock', lowStock.toString(), '10 items or fewer'],
  ]
  return (
    <>
      <PageHeading
        eyebrow="YOUR LITTLE CORNER OF THE INTERNET"
        title="Good morning, studio."
        action={<Link className="button button-dark" to="/admin/products">Manage products </Link>}
      />
      <div className="metric-grid">
        {metrics.map(([label, value, icon, note]) => (
          <article key={label} className="metric-card">
            <span className={`metric-icon ${label === 'Needs a restock' ? 'metric-alert' : ''}`}>{icon}</span>
            <span>{label}</span><b>{value}</b><small>{note}</small>
          </article>
        ))}
      </div>
      <div className="admin-overview-grid">
        <section className="admin-panel">
          <div className="admin-panel-head">
            <div><span className="eyebrow">THE LATEST</span><h2>Recent orders</h2></div>
            <Link to="/admin/orders">All orders’</Link>
          </div>
          {orders.length ? (
            <div className="admin-table-wrap"><table>
              <thead><tr><th>ORDER</th><th>CUSTOMER</th><th>DATE</th><th>STATUS</th><th>TOTAL</th></tr></thead>
              <tbody>{orders.slice(0, 5).map((order) => (
                <tr key={order.id}>
                  <td><b>#{order.id.slice(-8)}</b></td><td>{order.customer?.name || 'Guest'}</td>
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
            <div><span className="eyebrow">YOUR COLLECTION</span><h2>Popular products</h2></div>
            <Link to="/admin/products">View all </Link>
          </div>
          {[...products].sort((a, b) => b.reviews - a.reviews).slice(0, 4).map((product, index) => (
            <div className="popular-row" key={product.id}>
              <span className="popular-rank">0{index + 1}</span>{product.image ? <img src={product.image} alt="" /> : <span className="admin-image-placeholder" aria-label="No product image">No image</span>}
              <span><b>{product.name}</b><small>{product.category}</small></span><strong>{money(product.price)}</strong>
            </div>
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
  const [error, setError] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [pendingDelete, setPendingDelete] = useState(null)
  const [pendingImageRemoval, setPendingImageRemoval] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loadingImage, setLoadingImage] = useState(false)
  const [form, setForm] = useState(null)
  const [imageInputKey, setImageInputKey] = useState(0)
  const filtered = products.filter((product) => `${product.name} ${product.category}`.toLowerCase().includes(debouncedSearch.toLowerCase()))
  const sortedProducts = [...filtered].sort((first, second) => {
    if (sortKey === 'newest') return products.indexOf(first) - products.indexOf(second)
    const valueFor = (product) => {
      if (sortKey === 'status') return product.stock === 0 ? 0 : product.stock <= 10 ? 1 : 2
      return product[sortKey]
    }
    const firstValue = valueFor(first)
    const secondValue = valueFor(second)
    const comparison = typeof firstValue === 'number'
      ? firstValue - secondValue
      : String(firstValue ?? '').localeCompare(String(secondValue ?? ''), undefined, { sensitivity: 'base' })
    return sortDirection === 'asc' ? comparison : -comparison
  })
  const pageCount = Math.ceil(sortedProducts.length / pageSize)
  const currentPage = Math.min(page, Math.max(pageCount, 1))
  const pageProducts = sortedProducts.slice((currentPage - 1) * pageSize, currentPage * pageSize)
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
  const exportProducts = () => downloadCsv(
    'products.csv',
    ['Product ID', 'Product Name', 'Category', 'Price', 'Stock', 'Status'],
    sortedProducts.map((product) => [
      product.id,
      product.name,
      product.category,
      product.price,
      product.stock,
      product.stock === 0 ? 'Out of stock' : product.stock <= 10 ? 'Low stock' : 'In stock',
    ]),
  )

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
  const confirmRemoveProduct = () => {
    if (!pendingDelete) return
    try {
      dispatch(removeProductFromCatalog(pendingDelete.id))
      dispatch(removeProductFromCart(pendingDelete.id));
      dispatch(removeFromWishlist(pendingDelete.id));
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
  const saveProduct = (event) => {
    event.preventDefault()
    const price = Number(form.price)
    const stock = Number(form.stock)
    if (!form.name.trim() || !form.category || !Number.isFinite(price) || price <= 0 || !Number.isInteger(stock) || stock < 0) {
      setError('Add a name, category, positive price, and whole-number stock quantity.')
      return
    }
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
      if (editing) {
        dispatch(updateProduct({ id: editing, ...productValues }))
      } else {
        const nextId = products.reduce((highestId, product) => {
          const match = /^p-(\d+)$/.exec(product.id)
          return Math.max(highestId, Number(match?.[1] ?? 0))
        }, 0) + 1
        const newProduct = {
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
        }
        dispatch(addProduct(newProduct))
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
      <label>Product name<input autoFocus={Boolean(editing)} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label>
      <label>Category<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} required>{categories.map((category) => <option key={category.id} value={category.name}>{category.name}</option>)}</select></label>
      <label>Brand<input value={form.brand} onChange={(event) => setForm({ ...form, brand: event.target.value })} placeholder="Independent" /></label>
      <label>Price (INR)<input type="number" min="0.01" step="0.01" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} required /></label>
      <label>Stock quantity<input type="number" min="0" step="1" value={form.stock} onChange={(event) => setForm({ ...form, stock: event.target.value })} required /></label>
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
      <div className="table-toolbar"><div className="admin-search"><span>⌕</span><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} placeholder="Search products" aria-label="Search products" /></div><div className="admin-toolbar-actions"><span>{filtered.length} products</span><button type="button" className="csv-export-button" onClick={exportProducts}>Export CSV</button></div></div>
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
      </table>{!filtered.length && <div className="admin-blank"><p>No products match that search.</p></div>}</div>
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
  const [error, setError] = useState('')
  const [pendingCategoryDelete, setPendingCategoryDelete] = useState(null)
  const [deleteError, setDeleteError] = useState('')
  const addCategory = (event) => {
    event.preventDefault()
    const normalized = name.trim()
    if (!normalized) return
    if (categories.some((item) => item.name.toLowerCase() === normalized.toLowerCase())) {
      setError('That category already exists.')
      return
    }
    updateStore('categories', (all) => [...all, { id: makeId('category'), name: normalized }])
    setName('')
    setError('')
  }
  const requestRemoveCategory = (category) => {
    setDeleteError('')
    setPendingCategoryDelete(category)
  }
  const confirmRemoveCategory = () => {
    if (!pendingCategoryDelete) return
    const used = products.some((product) => product.category === pendingCategoryDelete.name)
    if (used) {
      setDeleteError(`Move or remove products in ${pendingCategoryDelete.name} before deleting this category.`)
      return
    }
    try {
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
        {categories.map((category, index) => (
          <div className="category-admin-row" key={category.id}>
            <span className="category-index">0{index + 1}</span>
            <div><b>{category.name}</b><small>{products.filter((product) => product.category === category.name).length} products</small></div>
            <button type="button" className="table-action delete-action" onClick={() => requestRemoveCategory(category)}>Delete</button>
          </div>
        ))}
        {!categories.length && <div className="admin-blank"><p>No categories yet. Add your first one to start organizing.</p></div>}
      </section>
      <form className="admin-panel category-add" onSubmit={addCategory}>
        <span className="eyebrow">GROW YOUR COLLECTION</span>
        <h2>Add a category</h2>
        <p>Give your good things a home.</p>
        <label>Category name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Garden & Outdoors" required /></label>
        {error && <p className="form-error">{error}</p>}
        <button className="button button-dark">Add category </button>
      </form>
    </div>
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

export function InventoryAdmin({ products }) {
  const dispatch = useDispatch()
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState('name')
  const [sortDirection, setSortDirection] = useState('asc')
  const [pendingStockDecrease, setPendingStockDecrease] = useState(null)
  const debouncedSearch = useDebouncedValue(search)
  const updateStock = (id, value) => {
    const stock = Number(value)
    if (!Number.isInteger(stock) || stock < 0) return
    dispatch(updateProductStock({ id, stock }))
  }
  const filtered = products.filter((product) => `${product.name} ${product.category}`.toLowerCase().includes(debouncedSearch.toLowerCase()))
  const sortedProducts = [...filtered].sort((first, second) => {
    const valueFor = (product) => {
      if (sortKey === 'status') return product.stock === 0 ? 0 : product.stock <= 10 ? 1 : 2
      if (sortKey === 'sku') return product.id.slice(-7).toUpperCase()
      return product[sortKey]
    }
    const firstValue = valueFor(first)
    const secondValue = valueFor(second)
    const comparison = typeof firstValue === 'number'
      ? firstValue - secondValue
      : String(firstValue ?? '').localeCompare(String(secondValue ?? ''), undefined, { sensitivity: 'base' })
    return sortDirection === 'asc' ? comparison : -comparison
  })
  const sortBy = (key) => {
    setSortDirection(sortKey === key && sortDirection === 'asc' ? 'desc' : 'asc')
    setSortKey(key)
  }
  const sortIndicator = (key) => sortKey === key ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'
  const lowCount = products.filter((product) => product.stock <= 10).length
  const confirmStockDecrease = () => {
    if (!pendingStockDecrease) return
    updateStock(pendingStockDecrease.id, pendingStockDecrease.stock - 1)
    setPendingStockDecrease(null)
  }
  return <><PageHeading eyebrow="WHAT'S ON THE SHELF" title="Inventory" /><div className="inventory-notice"><div><b>{lowCount ? `${lowCount} ${lowCount === 1 ? 'product needs' : 'products need'} a little attention.` : 'Everything looking well stocked.'}</b><p>Keep stock numbers up to date so nobody misses out.</p></div></div><section className="admin-panel admin-data-panel"><div className="table-toolbar"><div className="admin-search"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find a product" aria-label="Find a product" /></div><span>{filtered.length} products</span></div><div className="admin-table-wrap">
    <table><thead><tr>{[['name', 'PRODUCT'], ['sku', 'SKU'], ['stock', 'IN STOCK'], ['status', 'STATUS']].map(([key, label]) => <th key={key}><button className="admin-sort-button" type="button" onClick={() => sortBy(key)} aria-label={`Sort by ${label.toLowerCase()}`} aria-sort={sortKey === key ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}>{label}<span aria-hidden="true">{sortIndicator(key)}</span></button></th>)}<th>QUICK UPDATE</th></tr></thead><tbody>{sortedProducts.map((product) => <tr key={product.id}><td><div className="admin-product-cell"><img src={product.image} alt="" /><b>{product.name}</b></div></td><td className="muted-cell">{product.id.slice(-7).toUpperCase()}</td><td><b>{product.stock}</b></td><td><span className={`inventory-tag ${product.stock === 0 ? 'out' : product.stock <= 10 ? 'low' : ''}`}><i />{product.stock === 0 ? 'Sold out' : product.stock <= 10 ? 'Low stock' : 'In stock'}</span></td><td><div className="stock-control"><button onClick={() => setPendingStockDecrease(product)} disabled={product.stock === 0} aria-label={`Remove one ${product.name} from stock`}>−</button><input aria-label={`${product.name} stock quantity`} type="number" min="0" value={product.stock} onChange={(event) => updateStock(product.id, event.target.value)} /><button onClick={() => updateStock(product.id, product.stock + 1)} aria-label={`Add one ${product.name} to stock`}>+</button></div></td></tr>)}</tbody></table></div></section>
    {pendingStockDecrease && <div className="admin-order-confirm-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setPendingStockDecrease(null) }}>
      <section className="admin-order-confirm" role="alertdialog" aria-modal="true" aria-labelledby="stock-decrease-title" aria-describedby="stock-decrease-description" onKeyDown={(event) => { if (event.key === 'Escape') setPendingStockDecrease(null) }}>
        <span className="eyebrow">UPDATE INVENTORY</span>
        <h2 id="stock-decrease-title">Remove one from stock?</h2>
        <p id="stock-decrease-description">Reduce {pendingStockDecrease.name} inventory from {pendingStockDecrease.stock} to {pendingStockDecrease.stock - 1}?</p>
        <div className="admin-order-confirm-actions">
          <button type="button" className="button button-light" autoFocus onClick={() => setPendingStockDecrease(null)}>Cancel</button>
          <button type="button" className="button button-dark" onClick={confirmStockDecrease}>Remove one</button>
        </div>
      </section>
    </div>}
  </>

}

export function OrdersAdmin({ orders }) {
  const changeStatus = (id, status) => updateStore('orders', (all) => all.map((order) => order.id === id ? { ...order, status } : order))
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
  return <InventoryAdmin products={useStore('products')} />
}

export function AdminOrders() {
  return <OrdersAdmin orders={useStore('orders')} />
}

export function AdminLayout() {
  return <AdminShell />
}
