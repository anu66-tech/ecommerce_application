import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useStore, setStore, updateStore, getStore, money } from '../../../shared/store/store.js';
import {
  logoutApi,
  fetchAuthSessionApi,
  updateCustomerProfileApi,
  clearAuthToken,
} from './api/accountApi.js';
import { fetchOrdersApi } from '../orders/api/orderApi.js';

export default function AccountPage() {
  const navigate = useNavigate();
  const currentUser = useStore('currentUser');
  const allOrders = useStore('orders') || [];
  const checkoutDraft = useStore('checkoutDraft') || {};
  const wishlist = useSelector((state) => state.wishlist.items) || [];
  const cart = useSelector((state) => state.cart.items) || [];

  // Local state for orders fetched from backend
  const [remoteOrders, setRemoteOrders] = useState(null);

  // Filter orders for the current user
  const effectiveOrders = remoteOrders || allOrders;
  const userOrders = effectiveOrders.filter(
    (order) =>
      order.customer?.email?.toLowerCase() === currentUser?.email?.toLowerCase() ||
      !order.customer?.email // default fallback in demo
  );

  const totalSpent = userOrders.reduce((sum, order) => sum + (Number(order.total) || 0), 0);
  const cartCount = cart.reduce((total, item) => total + (item.quantity || 1), 0);

  // Profile Edit State
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileErrors, setProfileErrors] = useState({});

  // Shipping Address State
  const defaultAddress = checkoutDraft.address || userOrders[0]?.customer?.address || '';
  const defaultCity = checkoutDraft.city || userOrders[0]?.customer?.city || '';
  const defaultPostal = checkoutDraft.postal || userOrders[0]?.customer?.postal || '';
  const defaultCountry = checkoutDraft.country || userOrders[0]?.customer?.country || 'India';

  const [address, setAddress] = useState(defaultAddress);
  const [city, setCity] = useState(defaultCity);
  const [postal, setPostal] = useState(defaultPostal);
  const [country, setCountry] = useState(defaultCountry);
  const [addressSuccess, setAddressSuccess] = useState('');

  // Initial load effect: runs strictly ONCE on mount to fetch session & orders
  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    fetchAuthSessionApi({ signal: controller.signal })
      .then((session) => {
        if (!active || controller.signal.aborted || !session) return;
        if (session.user) {
          const current = getStore('currentUser');
          if (current && (current.name !== session.user.name || current.email !== session.user.email)) {
            setStore('currentUser', { ...current, ...session.user }, { skipSave: true });
          }
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError' && !controller.signal.aborted) {
          console.warn('Session API load warning:', err);
        }
      });

    // Fetch user orders once on mount
    fetchOrdersApi({}, { signal: controller.signal })
      .then((res) => {
        if (!active || controller.signal.aborted) return;
        const items = Array.isArray(res?.items) ? res.items : Array.isArray(res) ? res : null;
        if (items) {
          setRemoteOrders(items);
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError' && !controller.signal.aborted) {
          console.warn('Orders API load warning:', err);
        }
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileSuccess('');
    setProfileError('');
    const errors = {};

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      errors.name = 'Full name is required.';
    } else if (trimmedName.length < 2) {
      errors.name = 'Name must be at least 2 characters.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail) {
      errors.email = 'Mail address is required.';
    } else if (!emailRegex.test(trimmedEmail)) {
      errors.email = 'Please enter a valid email format.';
    }

    if (Object.keys(errors).length > 0) {
      setProfileErrors(errors);
      setProfileError('Please resolve the errors highlighted below.');
      return;
    }

    setProfileErrors({});
    const updatedUser = {
      ...currentUser,
      name: trimmedName,
      email: trimmedEmail,
    };

    setStore('currentUser', updatedUser);
    updateStore('users', (all = []) =>
      all.map((u) => (u.id === currentUser?.id ? { ...u, ...updatedUser } : u))
    );

    try {
      await updateCustomerProfileApi({
        id: currentUser?.id,
        name: trimmedName,
        email: trimmedEmail,
      });
    } catch (apiErr) {
      console.warn('Profile update API warning:', apiErr);
    }

    setProfileSuccess('Account details updated successfully!');
    setTimeout(() => setProfileSuccess(''), 4000);
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    const updatedDraft = {
      ...checkoutDraft,
      address: address.trim(),
      city: city.trim(),
      postal: postal.trim(),
      country: country.trim(),
    };
    setStore('checkoutDraft', updatedDraft);
    try {
      await updateCustomerProfileApi({
        id: currentUser?.id,
        name: currentUser?.name || name,
        email: currentUser?.email || email,
        address: address.trim(),
        city: city.trim(),
        postal: postal.trim(),
        country: country.trim(),
      });
    } catch (apiErr) {
      console.warn('Address update API warning:', apiErr);
    }
    setAddressSuccess('Shipping address preferences saved successfully!');
    setTimeout(() => setAddressSuccess(''), 4000);
  };

  const handleLogout = async () => {
    clearAuthToken();
    try {
      await logoutApi('customer');
    } catch (err) {
      console.warn('Customer logout API error:', err);
    }
    setStore('currentUser', null);
    navigate('/login', { replace: true });
  };

  if (!currentUser) {
    return (
      <div className="account-page-wrap" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <h2 style={{ fontFamily: 'var(--serif)' }}>Sign In to View Your Account</h2>
        <p style={{ color: '#7a7e75', marginBottom: '24px' }}>
          Please sign in to access your order history, saved addresses, and profile details.
        </p>
        <Link to="/login" className="button button-dark" style={{ display: 'inline-flex' }}>
          Sign In as Customer
        </Link>
      </div>
    );
  }

  const initials = currentUser.name
    ? currentUser.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'CU';

  return (
    <div className="account-page-wrap">
      {/* Page Header */}
      <div className="account-header">
        <span className="eyebrow">YOUR SHOPPING PROFILE</span>
        <h1>My Account<span>.</span></h1>
        <p>Review and update your personal details, default shipping address, and order history.</p>
      </div>

      {/* Hero Identity Card */}
      <div className="account-hero-card">
        <div className="account-hero-left">
          <div className="account-avatar">{initials}</div>
          <div className="account-hero-info">
            <h2>{currentUser.name}</h2>
            <p>{currentUser.email}</p>
            <div className="account-badges">
              <span className="account-badge verified">✓ Verified Customer</span>
              <span className="account-badge id-badge">ID: {currentUser.id || 'user-customer'}</span>
              <span className="account-badge">Member since 2026</span>
            </div>
          </div>
        </div>
        <div className="account-hero-actions">
          <button type="button" onClick={handleLogout} className="button button-light">
            ⎋ Sign Out
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="account-stats-grid">
        <Link to="/orders" className="account-stat-card">
          <span className="account-stat-icon">↗</span>
          <span className="account-stat-num">{userOrders.length}</span>
          <span className="account-stat-label">Orders Placed</span>
        </Link>

        <Link to="/wishlist" className="account-stat-card">
          <span className="account-stat-icon">♡</span>
          <span className="account-stat-num">{wishlist.length}</span>
          <span className="account-stat-label">Wishlist Items</span>
        </Link>

        <Link to="/cart" className="account-stat-card">
          <span className="account-stat-icon">▤</span>
          <span className="account-stat-num">{cartCount}</span>
          <span className="account-stat-label">Items in Bag</span>
        </Link>

        <div className="account-stat-card">
          <span className="account-stat-icon">✳</span>
          <span className="account-stat-num">{money(totalSpent)}</span>
          <span className="account-stat-label">Total Spent</span>
        </div>
      </div>

      {/* Main Grid: Forms & Activity */}
      <div className="account-main-grid">
        {/* Left Column: Editable Details */}
        <div className="account-left-col">
          {/* Personal Info Card */}
          <div className="account-card">
            <div className="account-card-header">
              <h3><span>👤</span> Personal Information</h3>
              <span className="card-subtitle">Keep your profile details current</span>
            </div>

            {profileSuccess && (
              <div className="account-alert-success" role="status">
                <span>✓</span> {profileSuccess}
              </div>
            )}
            {profileError && (
              <div className="account-alert-error" role="alert">
                <span>⚠</span> {profileError}
              </div>
            )}

            <form onSubmit={handleProfileSubmit} noValidate>
              <div className="account-form-grid">
                <label className="account-form-label">
                  Full Name
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (profileErrors.name) setProfileErrors((p) => ({ ...p, name: '' }));
                    }}
                    className={`account-form-input ${profileErrors.name ? 'input-error' : ''}`}
                    placeholder="Your Name"
                    required
                  />
                  {profileErrors.name && (
                    <span className="field-error-text">{profileErrors.name}</span>
                  )}
                </label>

                <label className="account-form-label">
                  Email Address
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (profileErrors.email) setProfileErrors((p) => ({ ...p, email: '' }));
                    }}
                    className={`account-form-input ${profileErrors.email ? 'input-error' : ''}`}
                    placeholder="your.email@example.com"
                    required
                  />
                  {profileErrors.email && (
                    <span className="field-error-text">{profileErrors.email}</span>
                  )}
                </label>
              </div>

              <button type="submit" className="button button-dark">
                Save Profile Changes
              </button>
            </form>
          </div>

          {/* Shipping Address Card */}
          <div className="account-card">
            <div className="account-card-header">
              <h3><span>📍</span> Default Delivery Address</h3>
              <span className="card-subtitle">Used for quick order checkout</span>
            </div>

            {addressSuccess && (
              <div className="account-alert-success" role="status">
                <span>✓</span> {addressSuccess}
              </div>
            )}

            <form onSubmit={handleAddressSubmit}>
              <div className="account-form-grid">
                <label className="account-form-label account-form-full">
                  Street Address
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="account-form-input"
                    placeholder="e.g. 14 Bloom Street, Flat 2"
                  />
                </label>

                <label className="account-form-label">
                  City
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="account-form-input"
                    placeholder="e.g. Mumbai"
                  />
                </label>

                <label className="account-form-label">
                  Postal Code
                  <input
                    type="text"
                    value={postal}
                    onChange={(e) => setPostal(e.target.value)}
                    className="account-form-input"
                    placeholder="e.g. 400001"
                  />
                </label>

                <label className="account-form-label account-form-full">
                  Country
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="account-form-input"
                    placeholder="e.g. India"
                  />
                </label>
              </div>

              <button type="submit" className="button button-dark">
                Save Shipping Address
              </button>
            </form>
          </div>

          {/* Recent Orders Card */}
          <div className="account-card">
            <div className="account-card-header">
              <h3><span>📦</span> Recent Orders</h3>
              <Link to="/orders" className="text-link" style={{ fontSize: '13px' }}>
                View all orders ({userOrders.length}) →
              </Link>
            </div>

            {userOrders.length > 0 ? (
              <div className="account-orders-preview">
                {userOrders.slice(0, 3).map((order) => (
                  <div key={order.id} className="account-order-item">
                    <div className="account-order-meta">
                      <span className="account-order-id">Order {order.id}</span>
                      <span className="account-order-date">
                        Placed on {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="account-order-thumbs">
                      {order.items?.slice(0, 3).map((item, idx) => (
                        <img
                          key={idx}
                          src={item.image || 'https://via.placeholder.com/40'}
                          alt={item.name}
                          title={`${item.name} (x${item.quantity})`}
                        />
                      ))}
                      {(order.items?.length || 0) > 3 && (
                        <span style={{ fontSize: '11px', color: '#7a7e75' }}>
                          +{order.items.length - 3} more
                        </span>
                      )}
                    </div>

                    <span className={`status-pill status-${order.status?.toLowerCase()}`}>
                      {order.status}
                    </span>

                    <span className="account-order-total">{money(order.total)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px 10px', color: '#7a7e75' }}>
                <p style={{ margin: '0 0 12px', fontSize: '13px' }}>
                  You haven’t placed any orders yet.
                </p>
                <Link to="/products" className="button button-dark" style={{ display: 'inline-flex' }}>
                  Explore the Shop
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Quick Links & Actions */}
        <div className="account-right-col">
          <div className="account-card">
            <div className="account-card-header">
              <h3><span>⚡</span> Quick Links</h3>
            </div>
            <div className="account-quick-links">
              <Link to="/products" className="account-nav-btn">
                <span>▦ Browse Products</span>
                <span>→</span>
              </Link>
              <Link to="/wishlist" className="account-nav-btn">
                <span>♡ My Wishlist ({wishlist.length})</span>
                <span>→</span>
              </Link>
              <Link to="/cart" className="account-nav-btn">
                <span>▤ Shopping Bag ({cartCount})</span>
                <span>→</span>
              </Link>
              <Link to="/orders" className="account-nav-btn">
                <span>↗ Full Order History</span>
                <span>→</span>
              </Link>
            </div>
          </div>

          <div className="account-card">
            <div className="account-card-header">
              <h3><span>🔒</span> Account Security</h3>
            </div>
            <div style={{ fontSize: '12.5px', color: '#5a6154', lineHeight: 1.6 }}>
              <p style={{ margin: '0 0 10px' }}>
                <strong>Role:</strong> Customer Account
              </p>
              <p style={{ margin: '0 0 10px' }}>
                <strong>Session:</strong> Active & Authenticated
              </p>
              <p style={{ margin: '0 0 10px' }}>
                <strong>Auth Token:</strong> JWT (1-Hour Session)
              </p>
              <p style={{ margin: '0 0 10px', color: '#2d6b3e', fontWeight: 600 }}>
                <strong>Session Status:</strong> Active & Authenticated (1-Hour Limit)
              </p>
              <p style={{ margin: '0 0 14px' }}>
                <strong>Email:</strong> {currentUser.email}
              </p>
            </div>
            <button type="button" onClick={handleLogout} className="account-logout-btn">
              ⎋ Sign Out from Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
