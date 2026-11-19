import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore, setStore } from '../../../shared/store/store.js';
import {
  logoutApi,
  clearAuthToken,
  fetchAdminAccountDataApi,
} from './api/accountApi.js';

export default function AdminAccount() {
  const navigate = useNavigate();
  const currentAdmin = useStore('currentAdmin');
  const storeProducts = useStore('products') || [];
  const storeCategories = useStore('categories') || [];
  const storeOrders = useStore('orders') || [];

  const [liveInventoryAlerts, setLiveInventoryAlerts] = useState(0);
  const [liveProductCount, setLiveProductCount] = useState(null);
  const [liveCategoryCount, setLiveCategoryCount] = useState(null);
  const [liveOrders, setLiveOrders] = useState(null);

  // Strictly 1 API call for all Admin Account metrics
  useEffect(() => {
    let active = true;

    fetchAdminAccountDataApi()
      .then((res) => {
        if (!active || !res) return;
        const products = Array.isArray(res.products) ? res.products : [];
        const categories = Array.isArray(res.categories) ? res.categories : [];
        const orders = Array.isArray(res.orders) ? res.orders : [];

        setLiveProductCount(products.length);
        setLiveCategoryCount(categories.length);
        setLiveOrders(orders);
        setLiveInventoryAlerts(
          products.filter((p) => p.stock <= 10).length
        );
      })
      .catch((err) => {
        if (active) console.warn('Admin account data fetch warning:', err);
      });

    return () => {
      active = false;
    };
  }, []);

  const orders = liveOrders || storeOrders;
  const processingOrders = orders.filter((o) => o.status === 'Processing').length;
  const productCount = liveProductCount ?? storeProducts.length;
  const categoryCount = liveCategoryCount ?? storeCategories.length;
  const orderCount = liveOrders ? liveOrders.length : storeOrders.length;

  const handleAdminLogout = async () => {
    clearAuthToken();
    try {
      await logoutApi('admin');
    } catch (err) {
      console.warn('Admin logout API err:', err);
    }
    setStore('currentAdmin', null);
    navigate('/admin/login', { replace: true });
  };

  if (!currentAdmin) {
    return (
      <div style={{ padding: '60px 20px', maxWidth: '520px', margin: '40px auto' }}>
        <div className="admin-panel" style={{ padding: '36px 28px', textAlign: 'center' }}>
          <span className="eyebrow">RESTRICTED ACCESS</span>
          <h2 style={{ margin: '8px 0 12px' }}>Admin Authentication Required</h2>
          <p style={{ color: '#7a7e75', fontSize: '13px', marginBottom: '24px' }}>
            Please sign in with administrator credentials to view admin account details.
          </p>
          <Link to="/admin/login" className="button button-dark" style={{ justifyContent: 'center' }}>
            Sign in to Admin Panel
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="account-page-wrap" style={{ padding: '24px 0 60px' }}>
      {/* Page Heading */}
      <div className="admin-panel-head" style={{ marginBottom: '24px' }}>
        <div>
          <span className="eyebrow">SYSTEM ADMINISTRATOR</span>
          <h2>Admin Account & Permissions</h2>
        </div>
        <button type="button" onClick={handleAdminLogout} className="button button-light">
          ⎋ Admin Sign Out
        </button>
      </div>

      {/* Admin Identity Hero Card */}
      <div className="account-hero-card" style={{ borderColor: '#cadbee', background: '#f8fbfe' }}>
        <div className="account-hero-left">
          <div className="account-avatar admin-avatar">🛡️</div>
          <div className="account-hero-info">
            <h2>{currentAdmin.name || 'Admin Manager'}</h2>
            <p>{currentAdmin.email || 'admin@gmail.com'}</p>
            <div className="account-badges">
              <span className="account-badge admin-badge">🛡️ Super Administrator</span>
              <span className="account-badge id-badge">ID: {currentAdmin.id || 'admin-studio'}</span>
              <span className="account-badge verified">● Status: Active & Online</span>
            </div>
          </div>
        </div>
        <div className="account-hero-actions">
          <Link to="/admin" className="button button-dark">
            Open Dashboard →
          </Link>
        </div>
      </div>

      {/* Store Metrics Summary Grid */}
      <div className="account-stats-grid">
        <Link to="/admin/products" className="account-stat-card">
          <span className="account-stat-icon">▦</span>
          <span className="account-stat-num">{productCount}</span>
          <span className="account-stat-label">Catalog Products</span>
        </Link>

        <Link to="/admin/categories" className="account-stat-card">
          <span className="account-stat-icon">◫</span>
          <span className="account-stat-num">{categoryCount}</span>
          <span className="account-stat-label">Product Categories</span>
        </Link>

        <Link to="/admin/orders" className="account-stat-card">
          <span className="account-stat-icon">↗</span>
          <span className="account-stat-num">{orderCount}</span>
          <span className="account-stat-label">Customer Orders ({processingOrders} processing)</span>
        </Link>

        <Link to="/admin/inventory" className="account-stat-card">
          <span className="account-stat-icon">▥</span>
          <span className="account-stat-num">{liveInventoryAlerts}</span>
          <span className="account-stat-label">Inventory Alerts</span>
        </Link>
      </div>

      {/* Main Grid: Permissions & Admin Actions */}
      <div className="account-main-grid">
        <div className="account-left-col">
          {/* Permissions Matrix */}
          <div className="account-card">
            <div className="account-card-header">
              <h3><span>📋</span> Administrative Privileges</h3>
              <span className="card-subtitle">Assigned to {currentAdmin.role || 'Super Admin'}</span>
            </div>

            <div className="admin-perm-list">
              <div className="admin-perm-row">
                <span className="admin-perm-label">
                  <span>▦</span> Product Catalog Management
                </span>
                <span className="admin-perm-badge">Full Access (Create, Read, Update, Delete)</span>
              </div>

              <div className="admin-perm-row">
                <span className="admin-perm-label">
                  <span>◫</span> Taxonomy & Categories
                </span>
                <span className="admin-perm-badge">Full Access (Create, Rename, Icon presets)</span>
              </div>

              <div className="admin-perm-row">
                <span className="admin-perm-label">
                  <span>▥</span> Inventory Tracking
                </span>
                <span className="admin-perm-badge">Real-time Stock Increments & Decrements</span>
              </div>

              <div className="admin-perm-row">
                <span className="admin-perm-label">
                  <span>↗</span> Order Lifecycle Fulfillment
                </span>
                <span className="admin-perm-badge">Status Transitions (Processing, Shipped, Delivered)</span>
              </div>

              <div className="admin-perm-row">
                <span className="admin-perm-label">
                  <span>▤</span> Data Export & Reporting
                </span>
                <span className="admin-perm-badge">CSV Catalog Export & Analytics Access</span>
              </div>
            </div>
          </div>

          {/* System & Session Information */}
          <div className="account-card">
            <div className="account-card-header">
              <h3><span>⚙️</span> System & Environment Details</h3>
              <span className="card-subtitle">Active back-office connection</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '13px' }}>
              <div>
                <span style={{ display: 'block', color: '#888', fontSize: '11px', textTransform: 'uppercase' }}>
                  ADMIN USERNAME
                </span>
                <strong style={{ color: '#2b3528' }}>{currentAdmin.username || 'admin'}</strong>
              </div>
              <div>
                <span style={{ display: 'block', color: '#888', fontSize: '11px', textTransform: 'uppercase' }}>
                  SECURITY CLEARANCE
                </span>
                <strong style={{ color: '#174276' }}>Level 3 (Root Administrator)</strong>
              </div>
              <div>
                <span style={{ display: 'block', color: '#888', fontSize: '11px', textTransform: 'uppercase' }}>
                  JWT SESSION (1 HOUR)
                </span>
                <strong style={{ color: '#174276' }}>Active & Authenticated (1-Hour Limit)</strong>
              </div>
              <div>
                <span style={{ display: 'block', color: '#888', fontSize: '11px', textTransform: 'uppercase' }}>
                  BACKEND API STATUS
                </span>
                <strong style={{ color: '#2d6b3e' }}>Connected (Port 3000)</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Admin Navigation & Session Controls */}
        <div className="account-right-col">
          <div className="account-card">
            <div className="account-card-header">
              <h3><span>⚡</span> Quick Management</h3>
            </div>
            <div className="account-quick-links">
              <Link to="/admin" className="account-nav-btn">
                <span>▧ Dashboard Overview</span>
                <span>→</span>
              </Link>
              <Link to="/admin/products" className="account-nav-btn">
                <span>▦ Manage Products ({storeProducts.length})</span>
                <span>→</span>
              </Link>
              <Link to="/admin/categories" className="account-nav-btn">
                <span>◫ Manage Categories ({storeCategories.length})</span>
                <span>→</span>
              </Link>
              <Link to="/admin/inventory" className="account-nav-btn">
                <span>▥ Manage Inventory</span>
                <span>→</span>
              </Link>
              <Link to="/admin/orders" className="account-nav-btn">
                <span>↗ Manage Orders ({storeOrders.length})</span>
                <span>→</span>
              </Link>
              <Link to="/admin/account" className="account-nav-btn">
                <span>🛡️ Admin Account Details</span>
                <span>→</span>
              </Link>
            </div>
          </div>

          <div className="account-card">
            <div className="account-card-header">
              <h3><span>🔒</span> Admin Session</h3>
            </div>
            <p style={{ fontSize: '12px', color: '#7a7e75', margin: '0 0 14px' }}>
              You are authenticated as <strong>{currentAdmin.name || 'Admin'}</strong> with full system privileges.
            </p>
            <button
              type="button"
              onClick={handleAdminLogout}
              className="account-logout-btn"
            >
              ⎋ Admin Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
