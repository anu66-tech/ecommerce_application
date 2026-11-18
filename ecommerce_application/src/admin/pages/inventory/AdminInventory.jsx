import { useState, useEffect, useRef } from 'react'
import { useDispatch } from 'react-redux'
import useDebouncedValue from '../../../shared/hooks/useDebouncedValue.js'
import { updateProductStock } from '../../../redux/ProductSlice.js'
import { updateStore } from '../../../shared/store/store.js'
import { fetchInventoryApi, updateInventoryStockApi } from './api/inventoryApi.js'
import PageHeading from '../../../shared/components/PageHeading.jsx'

export function AdminInventory() {
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
    updateStore('products', (all) => (all || []).map((item) => item.id === id ? { ...item, stock } : item))

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

export default AdminInventory
