import { useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useStore, setStore, updateStore } from '../store/store.js';
import { customerLoginApi, customerRegisterApi } from '@/customer/pages/account/api/accountApi.js';
import { adminLoginApi, logoutApi } from '@/admin/pages/account/api/accountApi.js';
import { setAuthToken, clearAuthToken } from '@/shared/api/client.js';

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const currentUser = useStore('currentUser');
  const currentAdmin = useStore('currentAdmin');

  // Initial portal role selection: admin if on /admin/login or ?role=admin, otherwise customer
  const initialRole =
    location.pathname === '/admin/login' ||
    searchParams.get('role') === 'admin' ||
    searchParams.get('tab') === 'admin'
      ? 'admin'
      : 'customer';

  const [role, setRole] = useState(initialRole); // 'customer' | 'admin'
  const [mode, setMode] = useState('signin'); // 'signin' | 'register'
  const [showSwitchForm, setShowSwitchForm] = useState(false);

  // Unified Sign In Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Customer Register Form State
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  // Status & Validation
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Handle email change with smart auto-detection
  const handleEmailChange = (e) => {
    const val = e.target.value;
    setEmail(val);
    const trimmed = val.trim().toLowerCase();

    // Auto-detect role by email
    if (trimmed === 'admin@gmail.com') {
      setRole('admin');
    } else if (trimmed === 'customer@gmail.com') {
      setRole('customer');
    }

    if (fieldErrors.email) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.email;
        return next;
      });
    }
    if (error) setError('');
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (fieldErrors.password) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.password;
        return next;
      });
    }
    if (error) setError('');
  };

  // Unified form validation
  const validateSignIn = () => {
    const errors = {};
    const trimmedEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!trimmedEmail) {
      errors.email = 'Email address is required.';
    } else if (!emailRegex.test(trimmedEmail)) {
      errors.email = 'Please enter a valid email address (e.g. customer@gmail.com or admin@gmail.com).';
    }

    if (!password) {
      errors.password = 'Password is required.';
    } else if (password.length < 4) {
      errors.password = 'Password must be at least 4 characters.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateRegister = () => {
    const errors = {};
    const trimmedName = registerName.trim();
    const trimmedEmail = registerEmail.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!trimmedName) {
      errors.registerName = 'Full name is required.';
    } else if (trimmedName.length < 2) {
      errors.registerName = 'Name must be at least 2 characters.';
    }

    if (!trimmedEmail) {
      errors.registerEmail = 'Email address is required.';
    } else if (!emailRegex.test(trimmedEmail)) {
      errors.registerEmail = 'Please enter a valid email address.';
    }

    if (!registerPassword) {
      errors.registerPassword = 'Password is required.';
    } else if (registerPassword.length < 6) {
      errors.registerPassword = 'Password must be at least 6 characters.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle Unified Login Submission
  const handleSignInSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateSignIn()) {
      return;
    }

    setLoading(true);
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    // Determine target role: if role is admin OR typed email is admin@gmail.com
    const isAdminTarget = role === 'admin' || trimmedEmail === 'admin@gmail.com';

    try {
      if (isAdminTarget) {
        // Authenticate with Administrator endpoint
        const res = await adminLoginApi({
          email: trimmedEmail,
          username: trimmedEmail,
          password: trimmedPassword,
        });

        const loggedAdmin = res?.admin;
        if (!loggedAdmin || loggedAdmin.role !== 'admin') {
          throw new Error('The server did not return a valid admin session.');
        }

        // Enforce strict mutual exclusivity: clear customer session
        setStore('currentUser', null);
        setStore('currentAdmin', loggedAdmin);
        if (res?.token) {
          setAuthToken(res.token, res.expiresIn || 3600);
        }

        setSuccess(`Administrator authorized! Access granted to ${loggedAdmin.name || 'Admin'}.`);
        const targetRedirect = searchParams.get('redirect') || '/admin';
        setTimeout(() => {
          navigate(targetRedirect, { replace: true });
        }, 350);
      } else {
        // Authenticate with Customer endpoint
        const res = await customerLoginApi({
          email: trimmedEmail,
          password: trimmedPassword,
        });

        const loggedUser = res?.user;
        if (!loggedUser || loggedUser.role !== 'customer') {
          throw new Error('The server did not return a valid customer session.');
        }

        // Enforce strict mutual exclusivity: clear admin session
        setStore('currentAdmin', null);
        setStore('currentUser', loggedUser);
        if (res?.token) {
          setAuthToken(res.token, res.expiresIn || 3600);
        }

        updateStore('users', (all = []) => {
          const exists = all.some((u) => u.id === loggedUser.id);
          return exists ? all : [...all, loggedUser];
        }, { skipSave: true });

        setSuccess(`Welcome back, ${loggedUser.name || 'Customer'}! Access granted.`);
        const targetRedirect = searchParams.get('redirect') || '/home';
        setTimeout(() => {
          navigate(targetRedirect, { replace: true });
        }, 350);
      }
    } catch (err) {
      const msg = err.message || 'Login failed. Please verify your email and password.';
      setError(msg);
      if (msg.toLowerCase().includes('password')) {
        setFieldErrors((prev) => ({ ...prev, password: msg }));
      } else {
        setFieldErrors((prev) => ({ ...prev, email: msg }));
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Customer Registration
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateRegister()) {
      return;
    }

    setLoading(true);

    try {
      const res = await customerRegisterApi({
        name: registerName.trim(),
        email: registerEmail.trim(),
        password: registerPassword.trim(),
      });

      if (!res?.user || res.user.role !== 'customer') {
        throw new Error('The server did not return the registered customer.');
      }

      setEmail(res.user.email);
      setRole('customer');
      setMode('signin');
      setSuccess('Account created! Sign in with your new email and password.');
    } catch (err) {
      const msg = err.message || 'Registration failed. Please try again.';
      setError(msg);
      if (msg.toLowerCase().includes('name')) {
        setFieldErrors((prev) => ({ ...prev, registerName: msg }));
      } else if (
        msg.toLowerCase().includes('email') ||
        msg.toLowerCase().includes('mail') ||
        msg.toLowerCase().includes('exists')
      ) {
        setFieldErrors((prev) => ({ ...prev, registerEmail: msg }));
      } else if (msg.toLowerCase().includes('password')) {
        setFieldErrors((prev) => ({ ...prev, registerPassword: msg }));
      }
    } finally {
      setLoading(false);
    }
  };

  // Sign out handlers
  const handleSignOutCustomer = async () => {
    clearAuthToken();
    try {
      await logoutApi('customer');
    } catch (err) {
      console.warn('Customer logout API error:', err);
    }
    setStore('currentUser', null);
    setShowSwitchForm(false);
    setSuccess('Signed out of Customer session.');
  };

  const handleSignOutAdmin = async () => {
    clearAuthToken();
    try {
      await logoutApi('admin');
    } catch (err) {
      console.warn('Admin logout API error:', err);
    }
    setStore('currentAdmin', null);
    setShowSwitchForm(false);
    setSuccess('Signed out of Admin session.');
  };

  const activeSession = currentUser || currentAdmin;
  const isCustomerSession = Boolean(currentUser);
  const isAdminSession = Boolean(currentAdmin);

  return (
    <div className="login-page-wrap">
      {/* Brand Header */}
      <div className="login-standalone-brand">
        <Link
          to="/"
          className="brand"
          style={{ fontSize: '34px', fontWeight: 700, color: '#374334', textDecoration: 'none' }}
        >
          goodthings<span style={{ color: '#8b9c7d' }}>.</span>
        </Link>
        <span className="login-brand-tagline">
          Sign in with your Customer or Admin mail ID to continue
        </span>
      </div>

      <div className="login-card">
        {/* Active Session Card (if user is currently signed in and not explicitly switching) */}
        {activeSession && !showSwitchForm && (
          <div className="login-active-session">
            <span
              className="login-session-badge"
              style={
                isAdminSession
                  ? { background: '#dce8f7', color: '#1a4e8a' }
                  : { background: '#e3ebd8', color: '#2c5922' }
              }
            >
              {isAdminSession ? '🛡️ Administrator Authorized' : '✓ Verified Customer Session'}
            </span>
            <h3 className="login-session-name">{activeSession.name || 'Authorized User'}</h3>
            <p className="login-session-email">{activeSession.email}</p>
            <div style={{ fontSize: '11.5px', color: '#687063', margin: '4px 0 16px' }}>
              Authenticated via <strong>JWT 1-Hour Session</strong> · Role:{' '}
              <code>{isAdminSession ? 'admin' : 'customer'}</code>
            </div>

            <div className="login-session-actions" style={{ flexDirection: 'column', gap: '8px' }}>
              {isCustomerSession ? (
                <>
                  <Link
                    to="/home"
                    className="login-session-btn primary"
                    style={{ textAlign: 'center', justifyContent: 'center' }}
                  >
                    Continue to Storefront →
                  </Link>
                  <Link
                    to="/account"
                    className="login-session-btn"
                    style={{
                      textAlign: 'center',
                      justifyContent: 'center',
                      background: '#eceae2',
                      color: '#374334',
                    }}
                  >
                    View My Account Details
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/admin"
                    className="login-session-btn primary"
                    style={{
                      textAlign: 'center',
                      justifyContent: 'center',
                      background: '#253549',
                    }}
                  >
                    Open Admin Dashboard →
                  </Link>
                  <Link
                    to="/admin/account"
                    className="login-session-btn"
                    style={{
                      textAlign: 'center',
                      justifyContent: 'center',
                      background: '#eceae2',
                      color: '#374334',
                    }}
                  >
                    View Admin Account Details
                  </Link>
                </>
              )}

              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setShowSwitchForm(true)}
                  className="login-session-btn secondary"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Switch / Sign In Other Account
                </button>
                <button
                  type="button"
                  onClick={isCustomerSession ? handleSignOutCustomer : handleSignOutAdmin}
                  className="login-session-btn danger"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Unified Login Card Content */}
        {(!activeSession || showSwitchForm) && (
          <>
            {/* Header Text */}
            <div className="login-header">
              <span className="eyebrow">UNIFIED AUTHENTICATION</span>
              <h1>{mode === 'signin' ? 'Sign In to Your Account' : 'Create Customer Account'}</h1>
              <p>
                {mode === 'signin'
                  ? 'Sign in as Customer or Administrator using your respective mail ID.'
                  : 'Register a new customer account to start shopping.'}
              </p>
            </div>

            {/* Feedback Alerts */}
            {error && <div className="login-alert-error" role="alert">{error}</div>}
            {success && <div className="login-alert-success" role="status">{success}</div>}

            {/* ==================== SIGN IN FORM ==================== */}
            {mode === 'signin' ? (
              <form className="login-form" onSubmit={handleSignInSubmit} noValidate>
                <label>
                  <span>
                    {role === 'admin' ? 'Administrator Mail Address' : 'Mail Address'}
                  </span>
                  <input
                    type="email"
                    name="email"
                    value={email}
                    onChange={handleEmailChange}
                    placeholder="customer@gmail.com or admin@gmail.com"
                    autoComplete="email"
                    className={fieldErrors.email ? 'input-error' : ''}
                  />
                  {fieldErrors.email && (
                    <span className="login-field-error">{fieldErrors.email}</span>
                  )}
                </label>

                <label>
                  <span>
                    {role === 'admin' ? 'Administrator Password' : 'Password'}
                  </span>
                  <div className={`password-input-wrap ${fieldErrors.password ? 'has-error' : ''}`}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={password}
                      onChange={handlePasswordChange}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      className={fieldErrors.password ? 'input-error' : ''}
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <span className="login-field-error">{fieldErrors.password}</span>
                  )}
                </label>

                <button
                  type="submit"
                  className="login-submit-btn"
                  style={
                    role === 'admin'
                      ? { background: '#253549' }
                      : { background: '#374334' }
                  }
                  disabled={loading}
                >
                  {loading
                    ? 'Signing in…'
                    : role === 'admin'
                    ? 'Sign In to Admin Portal →'
                    : 'Sign In as Customer →'}
                </button>

                <div className="login-switch-mode">
                  Don’t have a customer account?{' '}
                  <button
                    type="button"
                    className="login-switch-btn"
                    onClick={() => {
                      setMode('register');
                      setFieldErrors({});
                      setError('');
                    }}
                  >
                    Create an account
                  </button>
                </div>

                {activeSession && showSwitchForm && (
                  <div style={{ textAlign: 'center', marginTop: '14px' }}>
                    <button
                      type="button"
                      onClick={() => setShowSwitchForm(false)}
                      style={{
                        background: 'transparent',
                        border: 0,
                        color: '#687262',
                        fontSize: '12px',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                      }}
                    >
                      ← Return to active session
                    </button>
                  </div>
                )}
              </form>
            ) : (
              /* ==================== CUSTOMER REGISTRATION ==================== */
              <form className="login-form" onSubmit={handleRegisterSubmit} noValidate>
                <label>
                  <span>Full Name</span>
                  <input
                    type="text"
                    name="name"
                    value={registerName}
                    onChange={(e) => {
                      setRegisterName(e.target.value);
                      if (fieldErrors.registerName) {
                        setFieldErrors((prev) => {
                          const next = { ...prev };
                          delete next.registerName;
                          return next;
                        });
                      }
                    }}
                    placeholder="e.g. Alex Morgan"
                    autoComplete="name"
                    className={fieldErrors.registerName ? 'input-error' : ''}
                  />
                  {fieldErrors.registerName && (
                    <span className="login-field-error">{fieldErrors.registerName}</span>
                  )}
                </label>

                <label>
                  <span>Mail Address</span>
                  <input
                    type="email"
                    name="email"
                    value={registerEmail}
                    onChange={(e) => {
                      setRegisterEmail(e.target.value);
                      if (fieldErrors.registerEmail) {
                        setFieldErrors((prev) => {
                          const next = { ...prev };
                          delete next.registerEmail;
                          return next;
                        });
                      }
                    }}
                    placeholder="e.g. alex@gmail.com"
                    autoComplete="email"
                    className={fieldErrors.registerEmail ? 'input-error' : ''}
                  />
                  {fieldErrors.registerEmail && (
                    <span className="login-field-error">{fieldErrors.registerEmail}</span>
                  )}
                </label>

                <label>
                  <span>Password (min 6 characters)</span>
                  <div
                    className={`password-input-wrap ${
                      fieldErrors.registerPassword ? 'has-error' : ''
                    }`}
                  >
                    <input
                      type={showRegisterPassword ? 'text' : 'password'}
                      name="password"
                      value={registerPassword}
                      onChange={(e) => {
                        setRegisterPassword(e.target.value);
                        if (fieldErrors.registerPassword) {
                          setFieldErrors((prev) => {
                            const next = { ...prev };
                            delete next.registerPassword;
                            return next;
                          });
                        }
                      }}
                      placeholder="Create a strong password"
                      autoComplete="new-password"
                      className={fieldErrors.registerPassword ? 'input-error' : ''}
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowRegisterPassword((v) => !v)}
                      aria-label={showRegisterPassword ? 'Hide password' : 'Show password'}
                    >
                      {showRegisterPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  {fieldErrors.registerPassword && (
                    <span className="login-field-error">{fieldErrors.registerPassword}</span>
                  )}
                </label>

                <button type="submit" className="login-submit-btn" disabled={loading}>
                  {loading ? 'Creating account…' : 'Create Customer Account'}
                </button>

                <div className="login-switch-mode">
                  Already have an account?{' '}
                  <button
                    type="button"
                    className="login-switch-btn"
                    onClick={() => {
                      setMode('signin');
                      setFieldErrors({});
                      setError('');
                    }}
                  >
                    Sign in with existing mail
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>

      <div className="login-standalone-footer">
        <span>© 2026 goodthings studio · 1-Hour JWT Session Enforcement</span>
      </div>
    </div>
  );
}
