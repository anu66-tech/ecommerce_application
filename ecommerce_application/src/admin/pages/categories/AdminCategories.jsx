import { useState, useEffect } from 'react'
import {
  createCategoryApi,
  updateCategoryApi,
  deleteCategoryApi,
  fetchCategoriesApi,
} from '../../../api/backend.js'
import { useStore, updateStore } from '../../../shared/store/store.js'
import { makeId } from '../../../shared/utils/helpers.js'
import PageHeading from '../../../shared/components/PageHeading.jsx'

export function AdminCategories({ categories: propCategories, products: propProducts }) {
  const storeCategories = useStore('categories') || []
  const storeProducts = useStore('products') || []
  const categories = propCategories || storeCategories
  const products = propProducts || storeProducts

  const [name, setName] = useState('')
  const [newIcon, setNewIcon] = useState('')
  const [error, setError] = useState('')
  const [nameError, setNameError] = useState('')
  const [pendingCategoryDelete, setPendingCategoryDelete] = useState(null)
  const [deleteError, setDeleteError] = useState('')

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
        ...(all || []),
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
        (all || []).map((item) =>
          item.id === editingCategory.id ? { ...item, name: finalName, icon: finalIcon } : item
        )
      )

      if (oldName !== finalName) {
        updateStore('products', (all) =>
          (all || []).map((product) =>
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
      updateStore('categories', (all) => (all || []).filter((item) => item.id !== pendingCategoryDelete.id))
      setPendingCategoryDelete(null)
    } catch (removeError) {
      setDeleteError(`Could not delete this category: ${removeError.message}`)
    }
  }

  const categoryIsUsed = pendingCategoryDelete && products.some((product) => product.category === pendingCategoryDelete.name)

  return (
    <>
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
      {pendingCategoryDelete && (
        <div
          className="admin-order-confirm-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setPendingCategoryDelete(null)
          }}
        >
          <section
            className="admin-order-confirm"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="category-delete-title"
            aria-describedby="category-delete-description"
            onKeyDown={(event) => {
              if (event.key === 'Escape') setPendingCategoryDelete(null)
            }}
          >
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
        </div>
      )}
    </>
  )
}

export default AdminCategories
