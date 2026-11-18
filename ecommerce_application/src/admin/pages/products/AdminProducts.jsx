import { useState, useEffect, useRef } from 'react'
import { useDispatch } from 'react-redux'
import useDebouncedValue from '../../../shared/hooks/useDebouncedValue.js'
import { useStore, updateStore } from '../../../shared/store/store.js'
import { money } from '../../../shared/utils/format.js'
import { downloadCsv } from '../../../utils/csvExport.js'
import { addProduct, updateProduct, removeProduct as removeProductFromCatalog } from '../../../redux/ProductSlice.js'
import { removeProductFromCart } from '../../../redux/cartSlice.js'
import { removeFromWishlist } from '../../../redux/wishlistSlice.js'
import { fetchProducts, fetchCategoriesApi, createProductApi, updateProductApi, deleteProductApi } from './api/productApi.js'
import PageHeading from '../../../shared/components/PageHeading.jsx'

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

export function AdminProducts({ products: propProducts, categories: propCategories }) {
  const [liveCategories, setLiveCategories] = useState(null)
  const storeProducts = useStore('products') || []
  const storeCategories = useStore('categories') || []
  const products = propProducts || storeProducts
  const categories = liveCategories || propCategories || storeCategories

  useEffect(() => {
    let active = true
    const controller = new AbortController()
    fetchCategoriesApi({ signal: controller.signal })
      .then((cats) => {
        if (!active || controller.signal.aborted) return
        if (Array.isArray(cats) && cats.length) setLiveCategories(cats)
      })
      .catch((err) => {
        if (err.name !== 'AbortError' && !controller.signal.aborted) {
          console.warn('Admin categories load warning:', err)
        }
      })
    return () => {
      active = false
      controller.abort()
    }
  }, [])

  const [editing, setEditing] = useState(null)
  const [search, setSearch] = useState('')
  const dispatch = useDispatch()
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
  useEffect(() => {
    let active = true

    fetchProducts({
      page,
      limit: pageSize,
      q: debouncedSearch.trim(),
      orderBy,
      order,
    }).then((result) => {
      if (!active) return
      setCatalog({ ...result, requestKey })
      setLoadError('')
      if (result.page !== page) {
        setPage(result.page)
      }
    }).catch((requestError) => {
      if (!active) return
      setLoadError(requestError.message)
    })
    return () => {
      active = false
    }
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
      dispatch(removeProductFromCart(idToDelete))
      dispatch(removeFromWishlist(idToDelete))
      updateStore('products', (all) => (all || []).filter((product) => product.id !== idToDelete))
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
        updateStore('products', (all) => (all || []).map((product) => product.id === editing ? updated : product))
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
          ...(all || []).filter((product) => product.id !== newProduct.id),
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

export default AdminProducts
