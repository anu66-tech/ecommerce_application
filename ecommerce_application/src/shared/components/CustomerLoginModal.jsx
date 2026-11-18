import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getStore, setStore, useStore } from '../store/store.js'
import { makeId } from '../utils/helpers.js'
import Icon from './Icon.jsx'

export function CustomerLoginModal({ onClose, onSave }) {
  const currentUser = useStore("currentUser")
  const [name, setName] = useState(currentUser?.name ?? "")
  const [email, setEmail] = useState(currentUser?.email ?? "")
  const [error, setError] = useState("")
  const [fieldErrors, setFieldErrors] = useState({})

  const handleNameChange = (event) => {
    setName(event.target.value)
    if (fieldErrors.name) {
      setFieldErrors((prev) => {
        const next = { ...prev }
        delete next.name
        return next
      })
    }
    if (error) setError("")
  }

  const handleEmailChange = (event) => {
    setEmail(event.target.value)
    if (fieldErrors.email) {
      setFieldErrors((prev) => {
        const next = { ...prev }
        delete next.email
        return next
      })
    }
    if (error) setError("")
  }

  const submit = (event) => {
    event.preventDefault()
    const newErrors = {}
    const trimmedName = name.trim()
    const trimmedEmail = email.trim()

    if (!trimmedName) {
      newErrors.name = "Your name is required."
    } else if (trimmedName.length < 2) {
      newErrors.name = "Name must be at least 2 characters."
    }

    if (!trimmedEmail) {
      newErrors.email = "Email address is required."
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      newErrors.email = "Please enter a valid email address."
    }

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors)
      setError("Please fix the highlighted fields to continue.")
      return
    }

    const users = getStore("users") ?? []
    const user = users.find(
      (item) => item.email.toLowerCase() === trimmedEmail.toLowerCase(),
    ) ?? { id: makeId("user"), name: trimmedName, email: trimmedEmail, role: "customer" }
    setStore(
      "users",
      users.some((item) => item.id === user.id) ? users : [...users, user],
    )
    setStore("currentUser", user)
    onSave()
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section
        className="account-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose} aria-label="Close">
          <Icon name="close" />
        </button>
        <span className="eyebrow">A GOOD PLACE TO START</span>
        <h2>Welcome to goodthings.</h2>
        <p>Save your details and keep track of your orders.</p>
        <form onSubmit={submit} noValidate>
          <label>
            Your name
            <input
              value={name}
              onChange={handleNameChange}
              autoComplete="name"
              className={fieldErrors.name ? "input-error" : ""}
            />
            {fieldErrors.name && (
              <span className="field-error-text">{fieldErrors.name}</span>
            )}
          </label>
          <label>
            Email address
            <input
              type="email"
              value={email}
              onChange={handleEmailChange}
              autoComplete="email"
              className={fieldErrors.email ? "input-error" : ""}
            />
            {fieldErrors.email && (
              <span className="field-error-text">{fieldErrors.email}</span>
            )}
          </label>
          {error && <p className="form-error">{error}</p>}
          <button className="button button-dark" type="submit">
            {currentUser ? "Update details" : "Continue"}{" "}
            <Icon name="arrow" size={17} />
          </button>
        </form>
        {currentUser && (
          <Link className="modal-orders" to="/orders">
            View your orders <Icon name="arrow" size={15} />
          </Link>
        )}
      </section>
    </div>
  )
}

export default CustomerLoginModal
