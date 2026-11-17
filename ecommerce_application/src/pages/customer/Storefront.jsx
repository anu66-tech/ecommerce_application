import { useDispatch, useSelector } from "react-redux";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  checkBackendHealth,
  subscribeNewsletterApi,
  fetchProducts,
  fetchCategoriesApi,
  fetchOrdersApi,
  fetchOrderByIdApi,
  createOrderApi,
  fetchCartApi,
  addToCartApi,
  removeFromCartApi,
  updateCartQuantityApi,
  clearCartApi,
  fetchWishlistApi,
  addToWishlistApi,
  removeFromWishlistApi,
} from "../../api/backend.js";
import {
  addToCart,
  clearCart,
  removeCartItem,
  replaceCart,
  setCartQuantity,
} from "../../redux/cartSlice.js";
import {
  addToWishlist,
  removeFromWishlist,
} from "../../redux/wishlistSlice.js";
import { replaceProducts } from "../../redux/ProductSlice.js";
import {
  Form,
  Link,
  Outlet,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import {
  EXPRESS_SHIPPING,
  FREE_SHIPPING_THRESHOLD,
  getStore,
  makeId,
  money,
  setStore,
  STANDARD_SHIPPING,
  updateStore,
  useStore,
} from "./store";
import Sidebar from "../../components/Sidebar/Sidebar";
import useDebouncedValue from "../../hooks/useDebouncedValue";
import Icon from "../../components/common/Icon.jsx";

export { Icon };

const steps = [
  ["address", "Address"],
  ["delivery", "Delivery"],
  ["payment", "Payment"],
  ["review", "Review"],
];

function checkoutUrl(productId, quantity = 1, fromCart = false) {
  const params = new URLSearchParams({
    buyNow: productId,
    quantity: String(quantity),
  });
  if (fromCart) params.set("fromCart", "1");
  return `/checkout/address?${params.toString()}`;
}



function Header({ count, wishlistCount, onAccount }) {
  const currentUser = useStore("currentUser");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [backendStatus, setBackendStatus] = useState("connecting");
  const currentQuery = searchParams.get("q") ?? "";
  const [search, setSearch] = useState(currentQuery);
  const [shouldSearch, setShouldSearch] = useState(false);
  const debouncedSearch = useDebouncedValue(search);

  useEffect(() => setSearch(currentQuery), [currentQuery]);

  useEffect(() => {
    const controller = new AbortController();
    checkBackendHealth({ signal: controller.signal })
      .then(() => setBackendStatus("connected"))
      .catch((error) => {
        if (error.name !== "AbortError") {
          console.error("Could not connect to the backend.", error);
          setBackendStatus("disconnected");
        }
      });
    return () => controller.abort();
  }, []);
  
  useEffect(() => {
    if (!shouldSearch || search !== debouncedSearch) return;
    const query = debouncedSearch.trim();
    navigate(query ? `/products?q=${encodeURIComponent(query)}` : "/products", {
      replace: true,
    });
    setShouldSearch(false);
  }, [debouncedSearch, navigate, search, shouldSearch]);

  return (
    <>
      <div className="flex min-h-8.75 items-center justify-center bg-green px-4 py-1.75 text-center text-[10px] tracking-[.12em] text-[#fffdf6] max-[760px]:min-h-7.75 max-[760px]:text-[8px]">
        A little something extra — free shipping on orders over ₹4,999
      </div>
      <header className="site-header">
        <Link className="brand" to="/home">
          goodthings<span>.</span>
        </Link>
        <Form className="header-search" action="/products" method="get">
          <Icon name="search" size={17} />
          <input
            name="q"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setShouldSearch(true);
            }}
            placeholder="Search products"
            aria-label="Search products"
          />
          <button type="submit" aria-label="Search">
            ↵
          </button>
        </Form>
        <nav className="main-nav" aria-label="Main navigation">
          <Link to="/products">Products</Link>
        </nav>
        <div className="header-actions">
          <span
            className={`backend-status backend-status-${backendStatus}`}
            role="status"
            aria-live="polite"
          >
            <i aria-hidden="true" />
            <span>
              {backendStatus === "connected"
                ? "API connected"
                : backendStatus === "disconnected"
                  ? "API offline"
                  : "Connecting API"}
            </span>
          </span>
          <Link className="header-text-link" to="/wishlist">
            Wishlist{wishlistCount > 0 && <span>{wishlistCount}</span>}
          </Link>
          <Link className="header-text-link" to="/cart">
            Cart{count > 0 && <span>{count}</span>}
          </Link>
          <Link
            className="header-text-link header-user-link"
            to={currentUser ? "/account" : "/login"}
            aria-label={currentUser ? `Account: ${currentUser.name}` : "Sign In"}
            title={currentUser ? `Signed in as ${currentUser.name} - View Account Details` : "Sign In"}
            style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}
          >
            <Icon name="user" size={16} />
            <span>{currentUser ? currentUser.name.split(" ")[0] : "Sign In"}</span>
          </Link>
        </div>
      </header>
    </>
  );
}

export function ProductCard({ product, wished, onWish, onAdd, onBuyNow }) {
  return (
    <article className="product-card">
      <div className={`product-photo photo-${product.color}`}>
        <Link
          to={`/products/${product.id}`}
          aria-label={`View ${product.name}`}
        >
          {product.image ? (
            <img src={product.image} alt={product.name} loading="lazy" />
          ) : (
            <span className="product-image-placeholder">
              Image added by admin
            </span>
          )}
        </Link>
        {product.badge && (
          <span className="product-badge">{product.badge}</span>
        )}
        <button
          className={`wish-button ${wished ? "is-wished" : ""}`}
          onClick={() => onWish(product.id)}
          aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Icon name="heart" size={18} />
        </button>
      </div>
      <div className="product-meta">
        <span>{product.brand || product.category}</span>
        <span className="product-rating">
          ★ {(product.rating ?? 0).toFixed(1)}
        </span>
      </div>
      <Link className="product-name" to={`/products/${product.id}`}>
        {product.name}
      </Link>
      <div className="product-price">
        {money(product.price)}
        {product.oldPrice && <del>{money(product.oldPrice)}</del>}
      </div>
      <div className="product-card-actions">
        <Link to={`/products/${product.id}`}>View</Link>
        <button disabled={!product.stock} onClick={() => onAdd(product.id)}>
          Add to bag <span>+</span>
        </button>
      </div>
      <button
        className="product-buy-now"
        type="button"
        disabled={!product.stock}
        onClick={() => onBuyNow(product.id)}
      >
        Buy now
      </button>
    </article>
  );
}

export function ProductGrid({ products, wishlist, onWish, onAdd, onBuyNow }) {
  if (!products.length)
    return (
      <div className="empty-state">
        <span className="empty-icon">⌕</span>
        <h3>No good things found</h3>
        <p>Try a different search or category.</p>
        <Link className="button button-dark" to="/products">
          Clear filters
        </Link>
      </div>
    );
  return (
    <div className="product-grid">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          wished={wishlist.includes(product.id)}
          onWish={onWish}
          onAdd={onAdd}
          onBuyNow={onBuyNow}
        />
      ))}
    </div>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-top">
        <Link className="brand" to="/home">
          goodthings<span>.</span>
        </Link>
        <p>Thoughtful things for everyday living.</p>
      </div>
      <div className="footer-bottom">
        <span>© 2026 goodthings studio</span>
        <span>Made for slower, better days.</span>
      </div>
    </footer>
  );
}

function CustomerLogin({ onClose, onSave }) {
  const currentUser = useStore("currentUser");
  const [name, setName] = useState(currentUser?.name ?? "");
  const [email, setEmail] = useState(currentUser?.email ?? "");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const handleNameChange = (event) => {
    setName(event.target.value);
    if (fieldErrors.name) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.name;
        return next;
      });
    }
    if (error) setError("");
  };

  const handleEmailChange = (event) => {
    setEmail(event.target.value);
    if (fieldErrors.email) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.email;
        return next;
      });
    }
    if (error) setError("");
  };

  const submit = (event) => {
    event.preventDefault();
    const newErrors = {};
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      newErrors.name = "Your name is required.";
    } else if (trimmedName.length < 2) {
      newErrors.name = "Name must be at least 2 characters.";
    }

    if (!trimmedEmail) {
      newErrors.email = "Email address is required.";
    } else if (!/^[^s@]+@[^s@]+\.[^s@]+$/.test(trimmedEmail)) {
      newErrors.email = "Please enter a valid email address.";
    }

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      setError("Please fix the highlighted fields to continue.");
      return;
    }

    const users = getStore("users") ?? [];
    const user = users.find(
      (item) => item.email.toLowerCase() === trimmedEmail.toLowerCase(),
    ) ?? { id: makeId("user"), name: trimmedName, email: trimmedEmail, role: "customer" };
    setStore(
      "users",
      users.some((item) => item.id === user.id) ? users : [...users, user],
    );
    setStore("currentUser", user);
    onSave();
  };
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
  );
}

function ConfirmationDialog({ title, description, confirmLabel, onCancel, onConfirm }) {
  return (
    <div
      className="confirmation-dialog-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <section
        className="confirmation-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="remove-confirmation-title"
        aria-describedby="remove-confirmation-description"
        onKeyDown={(event) => {
          if (event.key === "Escape") onCancel();
        }}
      >
        <span className="eyebrow">PLEASE CONFIRM</span>
        <h2 id="remove-confirmation-title">{title}</h2>
        <p id="remove-confirmation-description">{description}</p>
        <div className="confirmation-dialog-actions">
          <button
            type="button"
            className="button button-light"
            autoFocus
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="button button-dark"
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}

function AddToBagDialog({ product, cartQuantity, onCancel, onConfirm }) {
  const availableStock = Math.max(0, (product.stock || 0) - cartQuantity);
  const [quantity, setQuantity] = useState(1);

  return (
    <div
      className="confirmation-dialog-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <section
        className="confirmation-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="add-bag-title"
        aria-describedby="add-bag-desc"
        onKeyDown={(event) => {
          if (event.key === "Escape") onCancel();
        }}
        style={{ width: "min(460px, 100%)" }}
      >
        <span className="eyebrow">CONFIRM SELECTION</span>
        <h2 id="add-bag-title">Add to Bag?</h2>
        <p id="add-bag-desc" style={{ marginBottom: "1rem" }}>
          Please confirm you would like to add this item to your shopping bag.
        </p>

        <div
          style={{
            display: "flex",
            gap: "1rem",
            padding: "0.85rem",
            background: "#f9f8f4",
            borderRadius: "6px",
            alignItems: "center",
            marginBottom: "1rem",
          }}
        >
          {product.image && (
            <img
              src={product.image}
              alt=""
              style={{
                width: "70px",
                height: "70px",
                objectFit: "cover",
                borderRadius: "4px",
                border: "1px solid #e7e5dc",
              }}
            />
          )}
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: "0 0 0.2rem", fontSize: "1rem", color: "#252b22" }}>
              {product.name}
            </h3>
            <span style={{ fontSize: "0.8rem", color: "#777", display: "block" }}>
              {product.brand} · {product.category}
            </span>
            <strong style={{ fontSize: "0.95rem", color: "#384633" }}>
              {money(product.price)}
            </strong>
          </div>
        </div>

        {availableStock > 0 ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "1.25rem",
              padding: "0.5rem 0.85rem",
              border: "1px solid #e7e5dc",
              borderRadius: "4px",
            }}
          >
            <div>
              <span style={{ fontSize: "0.85rem", fontWeight: 600, display: "block" }}>Quantity</span>
              <small style={{ color: availableStock <= 5 ? "#b83232" : "#2e6f40", fontSize: "0.75rem" }}>
                {availableStock} available in stock
              </small>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <button
                type="button"
                className="button button-light"
                style={{ minHeight: "32px", padding: "0 10px", fontSize: "14px" }}
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span style={{ minWidth: "24px", textAlign: "center", fontWeight: 600, fontSize: "0.95rem" }}>
                {quantity}
              </span>
              <button
                type="button"
                className="button button-light"
                style={{ minHeight: "32px", padding: "0 10px", fontSize: "14px" }}
                onClick={() => setQuantity((q) => Math.min(availableStock, q + 1))}
                disabled={quantity >= availableStock}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
            <div style={{ textAlign: "right" }}>
              <small style={{ display: "block", color: "#777", fontSize: "0.75rem" }}>Total</small>
              <strong style={{ fontSize: "0.95rem", color: "#384633" }}>
                {money(product.price * quantity)}
              </strong>
            </div>
          </div>
        ) : (
          <p style={{ color: "#b83232", fontSize: "0.85rem", margin: "1rem 0" }}>
            You already have all available units of this item in your shopping bag.
          </p>
        )}

        <div className="confirmation-dialog-actions">
          <button
            type="button"
            className="button button-light"
            autoFocus
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="button button-dark"
            disabled={availableStock <= 0}
            onClick={() => onConfirm(quantity)}
          >
            Confirm & Add to Bag
          </button>
        </div>
      </section>
    </div>
  );
}

function BuyNowDialog({ product, initialQuantity = 1, onCancel, onConfirm }) {
  const availableStock = Math.max(0, product.stock || 0);
  const [quantity, setQuantity] = useState(() =>
    Math.max(1, Math.min(Number(initialQuantity) || 1, availableStock || 1))
  );

  return (
    <div
      className="confirmation-dialog-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <section
        className="confirmation-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="buy-now-title"
        aria-describedby="buy-now-desc"
        onKeyDown={(event) => {
          if (event.key === "Escape") onCancel();
        }}
        style={{ width: "min(460px, 100%)" }}
      >
        <span className="eyebrow">EXPRESS CHECKOUT</span>
        <h2 id="buy-now-title">Buy Now?</h2>
        <p id="buy-now-desc" style={{ marginBottom: "1rem" }}>
          Please confirm you would like to proceed directly to checkout with this item.
        </p>

        <div
          style={{
            display: "flex",
            gap: "1rem",
            padding: "0.85rem",
            background: "#f9f8f4",
            borderRadius: "6px",
            alignItems: "center",
            marginBottom: "1rem",
          }}
        >
          {product.image && (
            <img
              src={product.image}
              alt=""
              style={{
                width: "70px",
                height: "70px",
                objectFit: "cover",
                borderRadius: "4px",
                border: "1px solid #e7e5dc",
              }}
            />
          )}
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: "0 0 0.2rem", fontSize: "1rem", color: "#252b22" }}>
              {product.name}
            </h3>
            <span style={{ fontSize: "0.8rem", color: "#777", display: "block" }}>
              {product.brand} · {product.category}
            </span>
            <strong style={{ fontSize: "0.95rem", color: "#384633" }}>
              {money(product.price)}
            </strong>
          </div>
        </div>

        {availableStock > 0 ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "1.25rem",
              padding: "0.5rem 0.85rem",
              border: "1px solid #e7e5dc",
              borderRadius: "4px",
            }}
          >
            <div>
              <span style={{ fontSize: "0.85rem", fontWeight: 600, display: "block" }}>Quantity</span>
              <small style={{ color: availableStock <= 5 ? "#b83232" : "#2e6f40", fontSize: "0.75rem" }}>
                {availableStock} available in stock
              </small>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <button
                type="button"
                className="button button-light"
                style={{ minHeight: "32px", padding: "0 10px", fontSize: "14px" }}
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span style={{ minWidth: "24px", textAlign: "center", fontWeight: 600, fontSize: "0.95rem" }}>
                {quantity}
              </span>
              <button
                type="button"
                className="button button-light"
                style={{ minHeight: "32px", padding: "0 10px", fontSize: "14px" }}
                onClick={() => setQuantity((q) => Math.min(availableStock, q + 1))}
                disabled={quantity >= availableStock}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
            <div style={{ textAlign: "right" }}>
              <small style={{ display: "block", color: "#777", fontSize: "0.75rem" }}>Total</small>
              <strong style={{ fontSize: "0.95rem", color: "#384633" }}>
                {money(product.price * quantity)}
              </strong>
            </div>
          </div>
        ) : (
          <p style={{ color: "#b83232", fontSize: "0.85rem", margin: "1rem 0" }}>
            This product is currently out of stock.
          </p>
        )}

        <div className="confirmation-dialog-actions">
          <button
            type="button"
            className="button button-light"
            autoFocus
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="button button-dark"
            disabled={availableStock <= 0}
            onClick={() => onConfirm(quantity)}
          >
            Confirm & Checkout · {money(product.price * Math.min(quantity, availableStock || 1))}
          </button>
        </div>
      </section>
    </div>
  );
}

export { HomePage, HomeProductSection, NewsletterSection } from "./Home.jsx";

export function ProductsPage({
  products,
  categories,
  wishlist,
  onWish,
  onAdd,
  onBuyNow,
  initialSearch = "",
  initialCategory = "All",
  initialBrand = "All",
  initialMinPrice = "",
  initialMaxPrice = "",
  initialMinimumRating = "0",
  initialInStockOnly = false,
  initialSort = "featured",
  initialPage = "1",
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(initialSearch);
  const debouncedSearch = useDebouncedValue(search);
  const [category, setCategory] = useState(initialCategory);
  const [brand, setBrand] = useState(initialBrand);
  const [minPrice, setMinPrice] = useState(initialMinPrice);
  const [maxPrice, setMaxPrice] = useState(initialMaxPrice);
  const [minimumRating, setMinimumRating] = useState(initialMinimumRating);
  const [inStockOnly, setInStockOnly] = useState(initialInStockOnly);
  const [sort, setSort] = useState(initialSort);
  const [page, setPage] = useState(() => {
    const parsedPage = Number(initialPage);
    return Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  });

  const urlQ = searchParams.get("q") ?? "";
  const urlCategory = searchParams.get("category") ?? "All";
  const urlBrand = searchParams.get("brand") ?? "All";
  const urlMinPrice = searchParams.get("minPrice") ?? "";
  const urlMaxPrice = searchParams.get("maxPrice") ?? "";
  const urlRating = searchParams.get("rating") ?? "0";
  const urlInStock = searchParams.get("inStock") === "1";
  const urlSort = searchParams.get("sort") ?? "featured";
  const urlPage = Number(searchParams.get("page") ?? 1);

  useEffect(() => {
    if (urlQ !== search && debouncedSearch === search) {
      setSearch(urlQ);
    }
  }, [urlQ]);

  useEffect(() => {
    setCategory(urlCategory);
  }, [urlCategory]);

  useEffect(() => {
    setBrand(urlBrand);
  }, [urlBrand]);

  useEffect(() => {
    setMinPrice(urlMinPrice);
  }, [urlMinPrice]);

  useEffect(() => {
    setMaxPrice(urlMaxPrice);
  }, [urlMaxPrice]);

  useEffect(() => {
    setMinimumRating(urlRating);
  }, [urlRating]);

  useEffect(() => {
    setInStockOnly(urlInStock);
  }, [urlInStock]);

  useEffect(() => {
    setSort(urlSort);
  }, [urlSort]);

  useEffect(() => {
    const parsed = Number.isInteger(urlPage) && urlPage > 0 ? urlPage : 1;
    setPage(parsed);
  }, [urlPage]);
  const pageSize = 8;
  const [catalog, setCatalog] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const brands = useMemo(
    () => [...new Set(products.map((product) => product.brand).filter(Boolean))].sort(),
    [products],
  );
  const productQuery = useMemo(
    () => ({
      page,
      limit: pageSize,
      q: debouncedSearch.trim(),
      category: category === "All" ? "" : category,
      brand: brand === "All" ? "" : brand,
      minPrice,
      maxPrice,
      rating: minimumRating === "0" ? "" : minimumRating,
      inStock: inStockOnly ? "true" : "",
      sort,
      orderBy: sort === 'featured' || sort === 'updatedAt' ? 'updatedAt' : undefined,
    }),
    [
      page,
      pageSize,
      debouncedSearch,
      category,
      brand,
      minPrice,
      maxPrice,
      minimumRating,
      inStockOnly,
      sort,
    ],
  );
  const requestKey = JSON.stringify(productQuery);
  const lastRequestKeyRef = useRef('');

  useEffect(() => {
    if (lastRequestKeyRef.current === requestKey) {
      return;
    }
    lastRequestKeyRef.current = requestKey;

    const controller = new AbortController();
    fetchProducts(productQuery, { signal: controller.signal })
      .then((result) => {
        if (controller.signal.aborted) return;
        setCatalog({ ...result, requestKey });
        setLoadError(null);
        if (result.page !== page) {
          setPage(result.page);
        }
      })
      .catch((error) => {
        if (error.name !== 'AbortError' && !controller.signal.aborted) {
          setLoadError({ requestKey, message: error.message });
        }
      });

    return () => controller.abort();
  }, [requestKey]);

  useEffect(() => {
    const query = debouncedSearch.trim();
    const currentQ = searchParams.get("q") ?? "";
    const currentSort = searchParams.get("sort") ?? "featured";
    const queryChanged = currentQ !== query;
    const sortChanged = currentSort !== sort;

    if (!queryChanged && !sortChanged) return;

    setSearchParams((params) => {
      if (query) params.set("q", query);
      else params.delete("q");
      if (sort === "featured") params.delete("sort");
      else params.set("sort", sort);
      if (queryChanged || sortChanged) params.delete("page");
      return params;
    }, { replace: true });
  }, [debouncedSearch, sort, searchParams, setSearchParams]);
  const hasCurrentCatalog = catalog?.requestKey === requestKey;
  const currentError = loadError?.requestKey === requestKey ? loadError.message : "";
  const loading = !hasCurrentCatalog && !currentError;
  const pageCount = hasCurrentCatalog ? catalog.totalPages : 0;
  const currentPage = hasCurrentCatalog ? catalog.page : page;
  const visibleProducts = hasCurrentCatalog ? catalog.items : [];
  const clearFilters = () => {
    setSearch("");
    setCategory("All");
    setBrand("All");
    setMinPrice("");
    setMaxPrice("");
    setMinimumRating("0");
    setInStockOnly(false);
    setSort("featured");
    setPage(1);
    setSearchParams((params) => {
      ["q", "category", "brand", "minPrice", "maxPrice", "rating", "inStock", "sort", "page"]
        .forEach((key) => params.delete(key));
      return params;
    });
  };
  const changeFilter = (setter) => (value) => {
    setter(value);
    setPage(1);
  };
  const changeFacet = (setter, key) => (value) => {
    changeFilter(setter)(value);
    setSearchParams((params) => {
      if (value === "All") params.delete(key);
      else params.set(key, value);
      params.delete("page");
      return params;
    });
  };
  const changeQueryFilter = (setter, key, isActive) => (value) => {
    changeFilter(setter)(value);
    setSearchParams((params) => {
      if (isActive(value)) params.set(key, String(value));
      else params.delete(key);
      params.delete("page");
      return params;
    });
  };
  const changePriceFilter = (setter, key) =>
    changeQueryFilter(
      setter,
      key,
      (value) => value !== "" && Number.isFinite(Number(value)) && Number(value) >= 0,
    );
  const changeRatingFilter = changeQueryFilter(
    setMinimumRating,
    "rating",
    (value) => value !== "0",
  );
  const changeAvailabilityFilter = changeQueryFilter(
    setInStockOnly,
    "inStock",
    Boolean,
  );
  return (
    <section className="catalog-page">
      <div className="catalog-breadcrumb">
        <a href="/">Home</a>
        <span>›</span>
        <span>Products</span>
      </div>
      <div className="catalog-banner">
        <span className="eyebrow">THE SHOP</span>
        <h1>
          Find your <em>good thing.</em>
        </h1>
        <p>Little upgrades, lovely rituals, and forever favorites.</p>
      </div>
      <div className="catalog-search">
        <Icon name="search" size={19} />
        <input
          value={search}
          onChange={(event) => changeFilter(setSearch)(event.target.value)}
          placeholder="Search products..."
          aria-label="Search products"
        />
        {search && (
          <button
            onClick={() => changeFilter(setSearch)("")}
            aria-label="Clear search"
          >
            <Icon name="close" size={16} />
          </button>
        )}
      </div>
      <div className="catalog-layout">
        <aside className="catalog-sidebar">
          <div className="filter-heading">
            <h2>Filters</h2>
            <button onClick={clearFilters}>Clear all</button>
          </div>
          <label className="filter-group">
            <span>Category</span>
            <select
              value={category}
              onChange={(event) =>
                changeFacet(setCategory, "category")(event.target.value)
              }
            >
              <option value="All">All categories</option>
              {categories.map((item) => (
                <option key={item.id} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className="filter-group">
            <span>Brand</span>
            <select
              value={brand}
              onChange={(event) => changeFacet(setBrand, "brand")(event.target.value)}
            >
              <option value="All">All brands</option>
              {brands.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <fieldset className="filter-group">
            <legend>Price</legend>
            <div className="price-inputs">
              <label>
                <span className="sr-only">Minimum price</span>
                <input
                  type="number"
                  min="0"
                  placeholder="Min ₹"
                  value={minPrice}
                  onChange={(event) =>
                    changePriceFilter(setMinPrice, "minPrice")(event.target.value)
                  }
                />
              </label>
              <span>—</span>
              <label>
                <span className="sr-only">Maximum price</span>
                <input
                  type="number"
                  min="0"
                  placeholder="Max ₹"
                  value={maxPrice}
                  onChange={(event) =>
                    changePriceFilter(setMaxPrice, "maxPrice")(event.target.value)
                  }
                />
              </label>
            </div>
          </fieldset>
          <label className="filter-group">
            <span>Customer rating</span>
            <select
              value={minimumRating}
              onChange={(event) =>
                changeRatingFilter(event.target.value)
              }
            >
              <option value="0">Any rating</option>
              <option value="4">4★ & above</option>
              <option value="4.5">4.5★ & above</option>
            </select>
          </label>
          <label className="availability-filter">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(event) =>
                changeAvailabilityFilter(event.target.checked)
              }
            />
            <span>In stock only</span>
          </label>
        </aside>
        <div className="catalog-results">
          <div className="catalog-results-head">
            <span>{hasCurrentCatalog ? catalog.total : 0} products</span>
            <label>
              Sort by
              <select
                value={sort}
                onChange={(event) => changeFilter(setSort)(event.target.value)}
              >
                <option value="featured">Featured / Recently Updated</option>
                <option value="updatedAt">Recently Updated</option>
                <option value="price-low">Price: low to high</option>
                <option value="price-high">Price: high to low</option>
                <option value="rating">Top rated</option>
              </select>
            </label>
          </div>
          {currentError ? (
            <p role="alert">Could not load products: {currentError}</p>
          ) : loading ? (
            <p role="status">Loading products…</p>
          ) : (
            <ProductGrid
              products={visibleProducts}
              wishlist={wishlist}
              onWish={onWish}
              onAdd={onAdd}
              onBuyNow={onBuyNow}
            />
          )}
          {pageCount > 1 && (
            <nav className="pagination" aria-label="Product pages">
              <button
                disabled={currentPage === 1}
                onClick={() => {
                  setPage(currentPage - 1);
                  setSearchParams((params) => {
                    params.set("page", String(currentPage - 1));
                    return params;
                  });
                }}
              >
                Previous
              </button>
              {Array.from({ length: pageCount }, (_, index) => index + 1).map(
                (number) => (
                  <button
                    key={number}
                    className={currentPage === number ? "active" : ""}
                    aria-current={currentPage === number ? "page" : undefined}
                    onClick={() => {
                      setPage(number);
                      setSearchParams((params) => {
                        params.set("page", String(number));
                        return params;
                      });
                    }}
                  >
                    {number}
                  </button>
                ),
              )}
              <button
                disabled={currentPage === pageCount}
                onClick={() => {
                  setPage(currentPage + 1);
                  setSearchParams((params) => {
                    params.set("page", String(currentPage + 1));
                    return params;
                  });
                }}
              >
                Next
              </button>
            </nav>
          )}
        </div>
      </div>
    </section>
  );
}

export function ProductDetail({ product, wishlist, onWish, onAdd, onBuyNow }) {
  if (!product)
    return (
      <div className="empty-state page-empty">
        <h2>That good thing went missing.</h2>
        <a className="button button-dark" href="/products">
          Back to the shop
        </a>
      </div>
    );
  return (
    <section className="detail-page">
      <div className={`detail-photo photo-${product.color}`}>
        {product.image ? (
          <img src={product.image} alt={product.name} />
        ) : (
          <span className="product-image-placeholder">
            Image added by admin
          </span>
        )}
      </div>
      <div className="detail-copy">
        <div className="breadcrumbs">
          <a href="/">Home</a>
          <span>/</span>
          <a href="/products">Products</a>
          <span>/</span>
          {product.category}
        </div>
        <span className="eyebrow">
          {product.category.toUpperCase()} · {product.brand || "INDEPENDENT"}
        </span>
        <h1>{product.name}</h1>
        <div className="detail-rating">
          <span>★★★★★</span> {product.rating}{" "}
          <a href="#reviews">({product.reviews} reviews)</a>
        </div>
        <div className="detail-price">
          {money(product.price)}{" "}
          {product.oldPrice && <del>{money(product.oldPrice)}</del>}
        </div>
        <p className="detail-description">{product.description}</p>
        <p className="stock-message">
          <span>✳</span>{" "}
          {product.stock > 0
            ? `${product.stock} in stock — ready to make your day`
            : "Currently out of stock"}
        </p>
        <div className="detail-actions">
          <button
            disabled={!product.stock}
            className="button button-dark"
            onClick={() => onAdd(product.id)}
          >
            Add to bag — {money(product.price)} <Icon name="arrow" size={17} />
          </button>
          <button
            disabled={!product.stock}
            className="button button-light"
            onClick={() => onBuyNow(product.id)}
          >
            Buy now
          </button>
          <button
            className={`detail-wish ${wishlist.includes(product.id) ? "is-wished" : ""}`}
            onClick={() => onWish(product.id)}
            aria-label="Toggle wishlist"
          >
            <Icon name="heart" />
          </button>
        </div>
        <div className="detail-perks">
          <span>↗ Free shipping over {money(FREE_SHIPPING_THRESHOLD)}</span>
          <span>↺ 30-day easy returns</span>
          <span>♡ Thoughtfully made</span>
        </div>
        <div className="detail-accordion" id="reviews">
          <details>
            <summary>Details & materials</summary>
            <p>
              Designed to bring a little joy to the everyday. Thoughtfully
              selected materials, made to last, and packed with care.
            </p>
          </details>
          <details>
            <summary>Shipping & returns</summary>
            <p>
              Free shipping on orders over {money(FREE_SHIPPING_THRESHOLD)}. Not
              quite right? Send it back within 30 days for an easy return.
            </p>
          </details>
          <details>
            <summary>Customer reviews ({product.reviews})</summary>
            <p>
              Customers love this piece — rated {product.rating} out of 5 stars.
            </p>
          </details>
        </div>
      </div>
    </section>
  );
}

export function CartPage({ products, cart, onQuantity, onRemove }) {
  const [pendingRemoval, setPendingRemoval] = useState(null);
  const [pendingBuyNowItem, setPendingBuyNowItem] = useState(null);
  const [pendingCartCheckout, setPendingCartCheckout] = useState(false);
  const [buyError, setBuyError] = useState("");
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const lines = [...cart]
    .reverse()
    .map((item) => ({
      ...item,
      product: products.find((product) => product.id === item.productId),
    }))
    .filter((item) => item.product);
  const pageSize = 8;
  const pageCount = Math.ceil(lines.length / pageSize);
  const currentPage = Math.min(page, Math.max(pageCount, 1));
  const visibleLines = lines.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const buyNow = (productId, quantity) => {
    const latestProducts = getStore("products") ?? [];
    const latestCart = getStore("cart") ?? [];
    const product = latestProducts.find((item) => item.id === productId) || products.find((item) => item.id === productId);
    const cartItem = latestCart.find((item) => item.productId === productId) || cart.find((item) => item.productId === productId);
    const purchaseQuantity = quantity ?? cartItem?.quantity ?? 1;
    if (!product || product.stock <= 0 || product.stock < purchaseQuantity) {
      setBuyError(
        !product || product.stock <= 0
          ? `${product?.name ?? "This product"} is out of stock.`
          : `${product.name} has only ${product.stock} in stock. Reduce the quantity before buying.`,
      );
      return;
    }
    setBuyError("");
    setPendingBuyNowItem({ product, quantity: purchaseQuantity });
  };
  const confirmBuyNow = (quantity) => {
    if (!pendingBuyNowItem?.product) return;
    const finalQty = quantity ?? pendingBuyNowItem.quantity ?? 1;
    navigate(checkoutUrl(pendingBuyNowItem.product.id, finalQty, true));
    setPendingBuyNowItem(null);
  };
  const subtotal = lines.reduce(
    (sum, { product, quantity }) =>
      sum + Math.max(product.oldPrice ?? product.price, product.price) * quantity,
    0,
  );
  const shipping = subtotal === 0 ? 0 : subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING;
  const total = subtotal + shipping;
  const handleWholeCartCheckout = () => {
    const latestProducts = getStore("products") ?? [];
    const latestCart = getStore("cart") ?? [];
    const issue = latestCart.find((item) => {
      const product = latestProducts.find((entry) => entry.id === item.productId);
      return !product || product.stock <= 0 || product.stock < item.quantity;
    });
    if (issue) {
      const product = latestProducts.find((entry) => entry.id === issue.productId);
      setBuyError(
        !product || product.stock <= 0
          ? `${product?.name ?? "This product"} is out of stock.`
          : `${product.name} has only ${product.stock} in stock. Reduce the quantity before checking out.`,
      );
      return;
    }
    setBuyError("");
    setPendingCartCheckout(true);
  };
  const confirmWholeCartCheckout = () => {
    setPendingCartCheckout(false);
    navigate("/checkout/address");
  };
  return (
    <>
    <section className="cart-page">
      <div className="page-title">
        <span className="eyebrow">YOUR LITTLE COLLECTION</span>
        <h1>
          Your bag<span>.</span>
        </h1>
        <a className="text-link" href="/products">
          Keep exploring <Icon name="arrow" size={16} />
        </a>
      </div>
      {lines.length ? (
        <div className="cart-layout">
          <div className="cart-content">
            <div className="cart-table-wrap">
              <table className="shopping-table"> 
                <thead>
                  <tr>
                    <th>PRODUCT</th>
                    <th>PRICE</th>
                    <th>QUANTITY</th>
                    <th>TOTAL</th>
                    <th>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleLines.map(({ product, quantity }) => (
                    <tr key={product.id}>
                      <td>
                        <div className="shopping-product">
                          <a
                            className={`cart-thumb photo-${product.color}`}
                            href={`/products/${product.id}`}
                          >
                            {product.image ? (
                              <img src={product.image} alt={product.name} />
                            ) : (
                              <span className="product-image-placeholder">
                                No image
                              </span>
                            )}
                          </a>
                          <div className="cart-product-details">
                            <a href={`/products/${product.id}`}>{product.name}</a>
                            {product.stock <= 0 && (
                              <small className="stock-status unavailable">
                                Out of stock
                              </small>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span>
                          {money(
                            Math.max(
                              product.oldPrice ?? product.price,
                              product.price,
                            ),
                          )}
                        </span>
                        {product.oldPrice > product.price && (
                          <small className="cart-sale-price">
                            Sale price {money(product.price)}
                          </small>
                        )}
                      </td>
                      <td>
                        <div className="cart-quantity-control">
                          <button
                            type="button"
                            aria-label={`Decrease ${product.name} quantity`}
                            disabled={!product.stock || quantity <= 1}
                            onClick={() => onQuantity(product.id, quantity - 1)}
                          >
                            −
                          </button>
                          <input
                            className="cart-quantity-input"
                            aria-label={`Quantity of ${product.name}`}
                            type="number"
                            min="1"
                            max={Math.max(1, product.stock)}
                            value={quantity}
                            disabled={!product.stock}
                            onChange={(event) =>
                              onQuantity(product.id, Number(event.target.value))
                            }
                          />
                          <button
                            type="button"
                            aria-label={`Increase ${product.name} quantity`}
                            disabled={!product.stock || quantity >= product.stock}
                            onClick={() => onQuantity(product.id, quantity + 1)}
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td>
                        <b>
                          {money(
                            Math.max(
                              product.oldPrice ?? product.price,
                              product.price,
                            ) * quantity,
                          )}
                        </b>
                      </td>
                      <td>
                        <div className="cart-item-actions">
                          <button
                            type="button"
                            className="cart-item-buy"
                            disabled={!product.stock}
                            onClick={() => buyNow(product.id, quantity)}
                          >
                            Buy now
                          </button>
                          <button
                            type="button"
                            className="remove-link"
                            onClick={() => setPendingRemoval(product)}
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {pageCount > 1 && (
              <nav className="cart-pagination" aria-label="Cart pages">
                <button
                  type="button"
                  onClick={() => setPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                {Array.from({ length: pageCount }, (_, index) => index + 1).map(
                  (number) => (
                    <button
                      key={number}
                      type="button"
                      className={currentPage === number ? "active" : ""}
                      aria-current={currentPage === number ? "page" : undefined}
                      onClick={() => setPage(number)}
                    >
                      {number}
                    </button>
                  ),
                )}
                <span>
                  Page {currentPage} of {pageCount}
                </span>
                <button
                  type="button"
                  onClick={() => setPage(currentPage + 1)}
                  disabled={currentPage === pageCount}
                >
                  Next
                </button>
              </nav>
            )}
            <div className="cart-buy-actions">
              <span>{lines.length} {lines.length === 1 ? "item" : "items"} in your bag</span>
              <a className="button button-light cart-continue" href="/products">
                Continue Shopping
              </a>
            </div>
            {buyError && <p className="cart-stock-error" role="alert">{buyError}</p>}
          </div>
          <aside className="order-summary">
            <h2>Order summary</h2>
            {lines.map(({ product, quantity }) => (
              <div key={product.id}>
                <span>
                  {product.name} × {quantity}
                </span>
                <b>
                  {money(
                    Math.max(product.oldPrice ?? product.price, product.price) *
                      quantity,
                  )}
                </b>
              </div>
            ))}
            <div>
              <span>Subtotal</span>
              <b>{money(subtotal)}</b>
            </div>
            <div>
              <span>Shipping</span>
              <b>{shipping === 0 ? "Free" : money(shipping)}</b>
            </div>
            <div className="summary-total">
              <span>Total</span>
              <b>{money(total)}</b>
            </div>
            <p>A little love, packed into every order.</p>
            <button
              type="button"
              className="button button-dark"
              onClick={handleWholeCartCheckout}
            >
              Buy now <Icon name="arrow" size={17} />
            </button>
          </aside>
        </div>
      ) : (
        <div className="empty-state">
          <span className="empty-icon">♡</span>
          <h3>Your bag is taking a little breather.</h3>
          <p>There’s nothing in here just yet — let’s change that.</p>
          <a className="button button-dark" href="/products">
            Find your good thing <Icon name="arrow" size={17} />
          </a>
        </div>
      )}
    </section>
    {pendingRemoval && (
      <ConfirmationDialog
        title="Remove this item from your bag?"
        description={`${pendingRemoval.name} will be removed from your bag.`}
        confirmLabel="Remove item"
        onCancel={() => setPendingRemoval(null)}
        onConfirm={() => {
          onRemove(pendingRemoval.id);
          setPendingRemoval(null);
        }}
      />
    )}
    {pendingBuyNowItem && (
      <BuyNowDialog
        product={pendingBuyNowItem.product}
        initialQuantity={pendingBuyNowItem.quantity}
        onCancel={() => setPendingBuyNowItem(null)}
        onConfirm={confirmBuyNow}
      />
    )}
    {pendingCartCheckout && (
      <ConfirmationDialog
        title="Proceed to checkout?"
        description={`Confirm your order for ${lines.length} ${lines.length === 1 ? "item" : "items"} totaling ${money(total)}.`}
        confirmLabel="Confirm & Checkout"
        onCancel={() => setPendingCartCheckout(false)}
        onConfirm={confirmWholeCartCheckout}
      />
    )}
    </>
  );
}

export function WishlistPage({ products, wishlist, onWish, onAdd, onBuyNow }) {
  const saved = [...wishlist]
    .reverse()
    .map((id) => products.find((product) => product.id === id))
    .filter(Boolean);
  return (
    <section className="cart-page wishlist-page">
      <div className="page-title">
        <span className="eyebrow">WISHLIST</span>
        <h1>
          My Wishlist<span>.</span>
        </h1>
        <a className="text-link" href="/products">
          Continue Shopping <Icon name="arrow" size={16} />
        </a>
      </div>
      {saved.length ? (
        <div className="cart-table-wrap">
          <table className="shopping-table wishlist-table">
            <thead>
              <tr>
                <th>PRODUCT</th>
                <th>PRICE</th>
                <th>STOCK STATUS</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {saved.map((product) => (
                <tr key={product.id}>
                  <td>
                    <div className="shopping-product">
                      <a
                        className={`cart-thumb photo-${product.color}`}
                        href={`/products/${product.id}`}
                      >
                        {product.image ? (
                          <img src={product.image} alt={product.name} />
                        ) : (
                          <span className="product-image-placeholder">
                            No image
                          </span>
                        )}
                      </a>
                      <a href={`/products/${product.id}`}>{product.name}</a>
                    </div>
                  </td>
                  <td>
                    <b>{money(product.price)}</b>
                  </td>
                  <td>
                    <span
                      className={`stock-status ${product.stock > 0 ? "available" : "unavailable"}`}
                    >
                      {product.stock > 0
                        ? `In Stock (${product.stock})`
                        : "Out of Stock"}
                    </span>
                  </td>
                  <td>
                    <div className="wishlist-actions">
                      {product.stock > 0 && (
                        <button
                          className="button button-dark"
                          onClick={() => onAdd(product.id)}
                        >
                          Add to Cart
                        </button>
                      )}
                      <button
                        type="button"
                        className="button button-light"
                        disabled={!product.stock}
                        onClick={() => onBuyNow(product.id)}
                      >
                        Buy now
                      </button>
                      <button
                        className="remove-link"
                        onClick={() => onWish(product.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <span className="empty-icon">♡</span>
          <h3>Your wishlist is waiting for something lovely.</h3>
          <p>Save products with the heart button and they’ll be here.</p>
          <a className="button button-dark" href="/products">
            Explore the shop <Icon name="arrow" size={17} />
          </a>
        </div>
      )}
    </section>
  );
}

export function CheckoutPage({ products, cart }) {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const buyNowId = searchParams.get("buyNow");
  const buyNowQuantity = Number(searchParams.get("quantity") ?? 1);
  const isCartPurchase =
    buyNowId !== null && searchParams.get("fromCart") === "1";
  const step =
    location.pathname.split("/").filter(Boolean).at(-1) === "checkout"
      ? "address"
      : location.pathname.split("/").at(-1);
  const activeIndex = Math.max(
    0,
    steps.findIndex(([id]) => id === step),
  );
  const [draft, setDraft] = useState(() => getStore("checkoutDraft") ?? {});
  const [error, setError] = useState("");
  const [checkoutErrors, setCheckoutErrors] = useState({});

  const updateDraft = (field, value) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
    if (checkoutErrors[field]) {
      setCheckoutErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validateAddressStep = () => {
    const errs = {};
    const nameVal = (draft.name ?? "").trim();
    const emailVal = (draft.email ?? "").trim();
    const addressVal = (draft.address ?? "").trim();
    const cityVal = (draft.city ?? "").trim();
    const postalVal = (draft.postal ?? "").trim();
    const countryVal = (draft.country ?? "").trim();

    if (!nameVal) {
      errs.name = "Full name is required.";
    } else if (nameVal.length < 2) {
      errs.name = "Name must be at least 2 characters.";
    }

    if (!emailVal) {
      errs.email = "Email address is required.";
    } else if (!/^[^s@]+@[^s@]+\.[^s@]+$/.test(emailVal)) {
      errs.email = "Please enter a valid email address.";
    }

    if (!addressVal) {
      errs.address = "Street address is required.";
    } else if (addressVal.length < 4) {
      errs.address = "Please enter a complete street address.";
    }

    if (!cityVal) {
      errs.city = "City is required.";
    }

    if (!postalVal) {
      errs.postal = "Postal code is required.";
    } else if (postalVal.length < 3) {
      errs.postal = "Enter a valid postal code.";
    }

    if (!countryVal) {
      errs.country = "Country is required.";
    }

    setCheckoutErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validatePaymentStep = () => {
    if (draft.payment === "paypal") return true;

    const errs = {};
    const cardName = ((draft.cardName ?? draft.name) ?? "").trim();
    const cleanNumber = (draft.cardNumber ?? "").replace(/\s+/g, "");
    const expiry = (draft.expiry ?? "").trim();
    const cvv = (draft.cvv ?? "").trim();

    if (!cardName) {
      errs.cardName = "Name on card is required.";
    }

    if (!cleanNumber) {
      errs.cardNumber = "Card number is required.";
    } else if (!/^\d{12,19}$/.test(cleanNumber)) {
      errs.cardNumber = "Card number must be 12 to 19 digits.";
    }

    if (!expiry) {
      errs.expiry = "Expiry date is required.";
    } else if (!/^(0[1-9]|1[0-2])\/?([0-9]{2})$/.test(expiry)) {
      errs.expiry = "Use MM/YY format (e.g. 12/28).";
    }

    if (!cvv) {
      errs.cvv = "Security code is required.";
    } else if (!/^\d{3,4}$/.test(cvv)) {
      errs.cvv = "CVV must be 3 or 4 digits.";
    }

    setCheckoutErrors(errs);
    return Object.keys(errs).length === 0;
  };
  const lines = buyNowId
    ? products
        .filter((product) => product.id === buyNowId)
        .map((product) => ({
          productId: product.id,
          quantity:
            Number.isInteger(buyNowQuantity) && buyNowQuantity > 0
              ? buyNowQuantity
              : 1,
          product,
        }))
    : cart
        .map((item) => ({
          ...item,
          product: products.find((product) => product.id === item.productId),
        }))
        .filter((item) => item.product);
  const subtotal = lines.reduce(
    (sum, { product, quantity }) =>
      sum +
      Math.max(product.oldPrice ?? product.price, product.price) * quantity,
    0,
  );
  const discount = lines.reduce(
    (sum, { product, quantity }) =>
      sum +
      Math.max(0, (product.oldPrice ?? product.price) - product.price) *
        quantity,
    0,
  );
  const shipping =
    draft.delivery === "express"
      ? EXPRESS_SHIPPING
      : subtotal >= FREE_SHIPPING_THRESHOLD
        ? 0
        : STANDARD_SHIPPING;
  const total = subtotal - discount + shipping;
  const saveAndGo = (event) => {
    event.preventDefault();
    if (step === "address" && !validateAddressStep()) {
      return;
    }
    if (step === "payment" && !validatePaymentStep()) {
      return;
    }
    const next = steps[activeIndex + 1];
    const savedDraft = { ...draft };
    if (savedDraft.cardNumber) {
      savedDraft.demoCardLast4 = savedDraft.cardNumber
        .replace(/\D/g, "")
        .slice(-4);
    }
    delete savedDraft.cardName;
    delete savedDraft.cardNumber;
    delete savedDraft.expiry;
    delete savedDraft.cvv;
    setStore("checkoutDraft", savedDraft);
    if (next) navigate(`/checkout/${next[0]}${location.search}`);
  };
  const placeOrder = () => {
    const latestProducts = getStore("products") ?? [];
    const latestCart = getStore("cart") ?? [];
    const latestLines = buyNowId
      ? latestProducts
          .filter((product) => product.id === buyNowId)
          .map((product) => ({
            productId: product.id,
            quantity:
              Number.isInteger(buyNowQuantity) && buyNowQuantity > 0
                ? buyNowQuantity
                : 1,
            product,
          }))
      : latestCart.map((item) => ({
          ...item,
          product: latestProducts.find(
            (product) => product.id === item.productId,
          ),
        }));
    if (!latestLines.length) {
      setError(
        "Your bag is empty. Add something lovely before placing an order.",
      );
      return;
    }
    const unavailable = latestLines.find(
      ({ product, quantity }) =>
        !product || product.stock <= 0 || product.stock < quantity,
    );
    if (unavailable) {
      setError(
        !unavailable.product || unavailable.product.stock <= 0
          ? `${unavailable.product?.name ?? "A product in your bag"} is out of stock. Remove it from your bag before placing this order.`
          : `${unavailable.product.name} only has ${unavailable.product.stock} left. Update your bag before placing this order.`,
      );
      return;
    }
    const currentSubtotal = latestLines.reduce(
      (sum, { product, quantity }) =>
        sum +
        Math.max(product.oldPrice ?? product.price, product.price) * quantity,
      0,
    );
    const currentDiscount = latestLines.reduce(
      (sum, { product, quantity }) =>
        sum +
        Math.max(0, (product.oldPrice ?? product.price) - product.price) *
          quantity,
      0,
    );
    const currentShipping =
      draft.delivery === "express"
        ? EXPRESS_SHIPPING
        : currentSubtotal >= FREE_SHIPPING_THRESHOLD
          ? 0
          : STANDARD_SHIPPING;
    const order = {
      id: makeId("GT"),
      createdAt: new Date().toISOString(),
      status: "Processing",
      items: latestLines.map(({ product, quantity }) => ({
        productId: product.id,
        name: product.name,
        image: product.image,
        price: product.price,
        quantity,
      })),
      subtotal: currentSubtotal,
      discount: currentDiscount,
      shipping: currentShipping,
      total: currentSubtotal - currentDiscount + currentShipping,
      customer: {
        name: draft.name ?? "",
        email: draft.email ?? "",
        address: draft.address ?? "",
        city: draft.city ?? "",
        postal: draft.postal ?? "",
        country: draft.country ?? "",
      },
      payment: draft.payment ?? "card",
    };
    setStore("orders", [order, ...(getStore("orders") ?? [])]);
    createOrderApi(order).catch((err) => console.error("Order API create failed:", err));
    dispatch(
      replaceProducts(
        latestProducts.map((product) => {
        const ordered = latestLines.find(
          (line) => line.product?.id === product.id,
        );
        return ordered
          ? { ...product, stock: Math.max(0, product.stock - ordered.quantity) }
          : product;
        }),
      ),
    );
    if (isCartPurchase) {
      dispatch(
        replaceCart(
          latestCart
          .map((item) =>
            item.productId === buyNowId
              ? {
                  ...item,
                  quantity: item.quantity - latestLines[0].quantity,
                }
              : item,
          )
          .filter((item) => item.quantity > 0),
        ),
      );
    } else if (!buyNowId) {
      dispatch(clearCart());
      clearCartApi().catch((err) => console.warn("Cart clear API:", err));
    }
    setStore("checkoutDraft", {});
    navigate(`/order-success?id=${encodeURIComponent(order.id)}`);
  };
  if (!lines.length && step !== "review")
    return (
      <div className="empty-state page-empty">
        <h2>Your bag is empty.</h2>
        <p>Find a little something lovely before checking out.</p>
        <a className="button button-dark" href="/products">
          Shop the collection
        </a>
      </div>
    );
  return (
    <section className="checkout-page">
      <div className="checkout-top">
        <a className="brand" href="/">
          goodthings<span>.</span>
        </a>
        <span>Thoughtful things, on their way to you.</span>
        <a href="/cart">← Back to bag</a>
      </div>
      <div className="checkout-layout">
        <div className="checkout-main">
          <div className="checkout-steps">
            {steps.map(([id, label], index) => (
              <a
                key={id}
                className={`${index === activeIndex ? "active" : ""} ${index < activeIndex ? "completed" : ""}`}
                href={
                  index <= activeIndex
                    ? `/checkout/${id}${location.search}`
                    : undefined
                }
              >
                <span>
                  {index < activeIndex ? (
                    <Icon name="check" size={13} />
                  ) : (
                    index + 1
                  )}
                </span>
                {label}
              </a>
            ))}
          </div>
          {step === "address" && (
            <form onSubmit={saveAndGo} className="checkout-form" noValidate>
              <span className="eyebrow">STEP 01 — WHERE TO?</span>
              <h1>Delivery address</h1>
              <p>Where should we send your good things?</p>
              <div className="form-grid">
                <label className="form-wide">
                  Full name
                  <input
                    autoComplete="name"
                    value={draft.name ?? ""}
                    onChange={(event) => updateDraft("name", event.target.value)}
                    className={checkoutErrors.name ? "input-error" : ""}
                  />
                  {checkoutErrors.name && (
                    <span className="field-error-text">{checkoutErrors.name}</span>
                  )}
                </label>
                <label className="form-wide">
                  Email address
                  <input
                    type="email"
                    autoComplete="email"
                    value={draft.email ?? ""}
                    onChange={(event) => updateDraft("email", event.target.value)}
                    className={checkoutErrors.email ? "input-error" : ""}
                  />
                  {checkoutErrors.email && (
                    <span className="field-error-text">{checkoutErrors.email}</span>
                  )}
                </label>
                <label className="form-wide">
                  Street address
                  <input
                    autoComplete="street-address"
                    value={draft.address ?? ""}
                    onChange={(event) => updateDraft("address", event.target.value)}
                    className={checkoutErrors.address ? "input-error" : ""}
                  />
                  {checkoutErrors.address && (
                    <span className="field-error-text">{checkoutErrors.address}</span>
                  )}
                </label>
                <label>
                  City
                  <input
                    autoComplete="address-level2"
                    value={draft.city ?? ""}
                    onChange={(event) => updateDraft("city", event.target.value)}
                    className={checkoutErrors.city ? "input-error" : ""}
                  />
                  {checkoutErrors.city && (
                    <span className="field-error-text">{checkoutErrors.city}</span>
                  )}
                </label>
                <label>
                  Postal code
                  <input
                    autoComplete="postal-code"
                    value={draft.postal ?? ""}
                    onChange={(event) => updateDraft("postal", event.target.value)}
                    className={checkoutErrors.postal ? "input-error" : ""}
                  />
                  {checkoutErrors.postal && (
                    <span className="field-error-text">{checkoutErrors.postal}</span>
                  )}
                </label>
                <label className="form-wide">
                  Country
                  <input
                    autoComplete="country-name"
                    value={draft.country ?? ""}
                    onChange={(event) => updateDraft("country", event.target.value)}
                    className={checkoutErrors.country ? "input-error" : ""}
                  />
                  {checkoutErrors.country && (
                    <span className="field-error-text">{checkoutErrors.country}</span>
                  )}
                </label>
              </div>
              <button className="button button-dark" type="submit">
                Continue to delivery <Icon name="arrow" size={17} />
              </button>
            </form>
          )}
          {step === "delivery" && (
            <form onSubmit={saveAndGo} className="checkout-form">
              <span className="eyebrow">STEP 02 — ON THE WAY</span>
              <h1>Choose delivery</h1>
              <p>Carefully packed, headed your way.</p>
              <label
                className={`choice-card ${draft.delivery !== "express" ? "selected" : ""}`}
              >
                <input
                  type="radio"
                  name="delivery"
                  value="standard"
                  checked={draft.delivery !== "express"}
                  onChange={() => setDraft({ ...draft, delivery: "standard" })}
                />
                <span>
                  <b>Standard delivery</b>
                  <small>3–5 business days</small>
                </span>
                <strong>
                  {subtotal >= FREE_SHIPPING_THRESHOLD
                    ? "FREE"
                    : money(STANDARD_SHIPPING)}
                </strong>
              </label>
              <label
                className={`choice-card ${draft.delivery === "express" ? "selected" : ""}`}
              >
                <input
                  type="radio"
                  name="delivery"
                  value="express"
                  checked={draft.delivery === "express"}
                  onChange={() => setDraft({ ...draft, delivery: "express" })}
                />
                <span>
                  <b>Express delivery</b>
                  <small>1–2 business days</small>
                </span>
                <strong>{money(EXPRESS_SHIPPING)}</strong>
              </label>
              <button className="button button-dark" type="submit">
                Continue to payment <Icon name="arrow" size={17} />
              </button>
            </form>
          )}
          {step === "payment" && (
            <form onSubmit={saveAndGo} className="checkout-form">
              <span className="eyebrow">STEP 03 — THE EASY PART</span>
              <h1>Payment details</h1>
              <p>
                This demo checkout stores your order locally. No payment is
                collected.
              </p>
              <label
                className={`choice-card ${draft.payment !== "paypal" ? "selected" : ""}`}
              >
                <input
                  type="radio"
                  name="payment"
                  value="card"
                  checked={draft.payment !== "paypal"}
                  onChange={() => setDraft({ ...draft, payment: "card" })}
                />
                <span>
                  <b>Credit or debit card</b>
                  <small>
                    Demo only — no card details are charged or saved
                  </small>
                </span>
                <span className="payment-marks">DEMO</span>
              </label>
              {draft.payment !== "paypal" && (
                <div className="form-grid card-fields">
                  <label className="form-wide">
                    Name on card
                    <input
                      value={draft.cardName ?? draft.name ?? ""}
                      onChange={(event) => updateDraft("cardName", event.target.value)}
                      className={checkoutErrors.cardName ? "input-error" : ""}
                    />
                    {checkoutErrors.cardName && (
                      <span className="field-error-text">{checkoutErrors.cardName}</span>
                    )}
                  </label>
                  <label className="form-wide">
                    Card number
                    <input
                      inputMode="numeric"
                      placeholder="4242 4242 4242 4242"
                      value={draft.cardNumber ?? ""}
                      onChange={(event) => updateDraft("cardNumber", event.target.value)}
                      className={checkoutErrors.cardNumber ? "input-error" : ""}
                    />
                    {checkoutErrors.cardNumber && (
                      <span className="field-error-text">{checkoutErrors.cardNumber}</span>
                    )}
                  </label>
                  <label>
                    Expiry date
                    <input
                      placeholder="MM / YY"
                      value={draft.expiry ?? ""}
                      onChange={(event) => updateDraft("expiry", event.target.value)}
                      className={checkoutErrors.expiry ? "input-error" : ""}
                    />
                    {checkoutErrors.expiry && (
                      <span className="field-error-text">{checkoutErrors.expiry}</span>
                    )}
                  </label>
                  <label>
                    Security code
                    <input
                      inputMode="numeric"
                      maxLength="4"
                      placeholder="123"
                      value={draft.cvv ?? ""}
                      onChange={(event) => updateDraft("cvv", event.target.value)}
                      className={checkoutErrors.cvv ? "input-error" : ""}
                    />
                    {checkoutErrors.cvv && (
                      <span className="field-error-text">{checkoutErrors.cvv}</span>
                    )}
                  </label>
                </div>
              )}
              <label
                className={`choice-card ${draft.payment === "paypal" ? "selected" : ""}`}
              >
                <input
                  type="radio"
                  name="payment"
                  value="paypal"
                  checked={draft.payment === "paypal"}
                  onChange={() => setDraft({ ...draft, payment: "paypal" })}
                />
                <span>
                  <b>PayPal</b>
                  <small>Demo checkout — no payment is processed</small>
                </span>
                <span className="payment-marks">PayPal</span>
              </label>
              <button className="button button-dark" type="submit">
                Review your order <Icon name="arrow" size={17} />
              </button>
            </form>
          )}
          {step === "review" && (
            <div className="checkout-form">
              <span className="eyebrow">STEP 04 — ALMOST THERE</span>
              <h1>One last look.</h1>
              <p>Make sure everything looks just right.</p>
              <div className="review-card">
                <h3>Delivering to</h3>
                <p>
                  {draft.name}
                  <br />
                  {draft.address}
                  <br />
                  {draft.city}, {draft.postal}
                  <br />
                  {draft.country}
                  <br />
                  {draft.email}
                </p>
                <a href="/checkout/address">Edit</a>
              </div>
              <div className="review-card">
                <h3>Delivery & payment</h3>
                <p>
                  {draft.delivery === "express"
                    ? "Express delivery · 1–2 business days"
                    : "Standard delivery · 3–5 business days"}
                  <br />
                  {draft.payment === "paypal"
                    ? "PayPal"
                    : `Demo card ending in ${draft.demoCardLast4 || "4242"}`}
                </p>
                <a href="/checkout/delivery">Edit</a>
              </div>
              <div className="review-items">
                {lines.map(({ product, quantity }) => (
                  <div key={product.id}>
                    <span>
                      {product.name} × {quantity}
                    </span>
                    <b>
                      {money(
                        Math.max(
                          product.oldPrice ?? product.price,
                          product.price,
                        ) * quantity,
                      )}
                    </b>
                  </div>
                ))}
              </div>
              {error && <p className="form-error">{error}</p>}
              <button className="button button-dark" onClick={placeOrder}>
                Place your order · {money(total)}{" "}
                <Icon name="arrow" size={17} />
              </button>
              <span className="secure-note">
                This is a demo store — no real payment will be taken.
              </span>
            </div>
          )}
        </div>
        <aside className="checkout-summary">
          <h2>A little recap</h2>
          {lines.map(({ product, quantity }) => (
            <div className="checkout-item" key={product.id}>
              <span className="checkout-thumb">
                <img src={product.image} alt="" />
                <i>{quantity}</i>
              </span>
              <span>{product.name}</span>
              <b>
                {money(
                  Math.max(product.oldPrice ?? product.price, product.price) *
                    quantity,
                )}
              </b>
            </div>
          ))}
          <div className="checkout-math">
            <span>Subtotal</span>
            <b>{money(subtotal)}</b>
            <span>Discount</span>
            <b>−{money(discount)}</b>
            <span>Shipping</span>
            <b>{shipping === 0 ? "On us" : money(shipping)}</b>
          </div>
          <div className="summary-total">
            <span>Total</span>
            <b>{money(total)}</b>
          </div>
          <p>A little love, packed into every order.</p>
        </aside>
      </div>
    </section>
  );
}

export function OrderSuccess() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id");
  const [remoteOrder, setRemoteOrder] = useState(null);

  useEffect(() => {
    if (id) {
      let active = true;
      fetchOrderByIdApi(id)
        .then((res) => {
          if (active && res) setRemoteOrder(res);
        })
        .catch((err) => console.warn("Order by ID API error:", err));
      return () => { active = false; };
    }
  }, [id]);

  const order =
    remoteOrder ??
    (getStore("orders") ?? []).find((item) => item.id === id) ??
    (getStore("orders") ?? [])[0];
  return (
    <section className="success-page">
      <div className="success-mark">
        <Icon name="check" size={32} />
      </div>
      <span className="eyebrow">WELL, THIS IS LOVELY</span>
      <h1>
        Your good things
        <br />
        <em>are on their way.</em>
      </h1>
      <p>
        Thanks for making room for something good. We’ve got your order and
        we’re packing it with care.
      </p>
      {order && (
        <div className="success-order">
          <span>Order number</span>
          <b>{order.id}</b>
          <span>Order total</span>
          <b>{money(order.total)}</b>
        </div>
      )}
      <div className="success-actions">
        <a className="button button-dark" href="/orders">
          View your orders <Icon name="arrow" size={17} />
        </a>
        <a className="text-link" href="/products">
          Keep looking around
        </a>
      </div>
      <span className="success-note">
        A confirmation is ready in your local order history.
      </span>
    </section>
  );
}

export function OrdersPage({ orders: storeOrders }) {
  const [apiOrders, setApiOrders] = useState(null);
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    fetchOrdersApi({}, { signal: controller.signal })
      .then((res) => {
        if (!active || controller.signal.aborted) return;
        const items = Array.isArray(res?.items) ? res.items : Array.isArray(res) ? res : null;
        if (items) setApiOrders(items);
      })
      .catch((err) => {
        if (err.name !== "AbortError" && !controller.signal.aborted) {
          console.error("Orders API fetch failed:", err);
        }
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  const orders = apiOrders || storeOrders || [];

  return (
    <section className="cart-page orders-page">
      <div className="page-title">
        <span className="eyebrow">A HISTORY OF GOOD THINGS</span>
        <h1>
          Your orders<span>.</span>
        </h1>
        <a className="text-link" href="/products">
          Back to the shop <Icon name="arrow" size={16} />
        </a>
      </div>
      {orders.length ? (
        <div className="orders-list">
          {orders.map((order) => (
            <article className="order-card" key={order.id}>
              <div className="order-head">
                <div>
                  <span className="eyebrow">ORDER PLACED</span>
                  <b>{new Date(order.createdAt).toLocaleDateString()}</b>
                </div>
                <div>
                  <span className="eyebrow">ORDER NUMBER</span>
                  <b>{order.id}</b>
                </div>
                <div>
                  <span className="eyebrow">TOTAL</span>
                  <b>{money(order.total)}</b>
                </div>
                <span
                  className={`status-pill status-${order.status.toLowerCase()}`}
                >
                  {order.status}
                </span>
              </div>
              <div className="order-products">
                {order.items.map((item, index) => (
                  <div key={`${item.productId}-${index}`}>
                    <img src={item.image} alt={item.name} />
                    <span>
                      {item.name} <small>Qty {item.quantity}</small>
                    </span>
                    <b>{money(item.price * item.quantity)}</b>
                  </div>
                ))}
              </div>
              <div className="order-delivery">
                Shipping to {order.customer.name} · {order.customer.city},{" "}
                {order.customer.country}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <span className="empty-icon">✳</span>
          <h3>No orders yet — but there's always a first.</h3>
          <p>Find something lovely to bring home.</p>
          <a className="button button-dark" href="/products">
            Explore the shop
          </a>
        </div>
      )}
    </section>
  );
}

export default function CustomerLayout() {
  const rawProducts = useStore("products");
  const products = useMemo(() => {
    return [...(rawProducts ?? [])].sort((a, b) => {
      const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
      if (timeA && timeB && timeA !== timeB) return timeB - timeA;
      return (rawProducts ?? []).indexOf(a) - (rawProducts ?? []).indexOf(b);
    });
  }, [rawProducts]);
  const categories = useStore("categories");
  const cart = useSelector((state) => state.cart.items);
  const wishlist = useSelector((state) => state.wishlist.items);
  const orders = useStore("orders");
  const dispatch = useDispatch();
  const [accountOpen, setAccountOpen] = useState(false);
  const [pendingWishlistRemoval, setPendingWishlistRemoval] = useState(null);
  const [pendingAddToBag, setPendingAddToBag] = useState(null);

  const count = cart.reduce((sum, item) => sum + item.quantity, 0);

  const onAdd = (id) => {
    const latestProducts = getStore("products") ?? [];
    const product = latestProducts.find((item) => item.id === id) || products.find((item) => item.id === id);
    if (!product) {
      window.alert("This product is no longer available.");
      return;
    }
    const existing = cart.find((item) => (item.productId || item.id) === id);
    if (product.stock <= (existing?.quantity ?? 0)) {
      window.alert("That’s all the stock we have right now.");
      return;
    }
    setPendingAddToBag(product);
  };

  const confirmAddToBag = async (quantity = 1) => {
    if (!pendingAddToBag) return;
    const product = pendingAddToBag;
    dispatch(addToCart({ productId: product.id, stock: product.stock, quantity }));
    try {
      const res = await addToCartApi(product.id, quantity);
      if (res?.items) {
        dispatch(replaceCart(res.items));
      }
    } catch (err) {
      console.error("Cart API update failed:", err);
    }
    setPendingAddToBag(null);
  };

  const [pendingBuyNow, setPendingBuyNow] = useState(null);

  const onBuyNow = (id) => {
    const product =
      (getStore("products") ?? []).find((item) => item.id === id) ||
      products.find((item) => item.id === id);

    if (!product || product.stock <= 0) {
      window.alert(`${product?.name ?? "This product"} is out of stock.`);
      return;
    }
    setPendingBuyNow(product);
  };

  const confirmBuyNow = (quantity = 1) => {
    if (!pendingBuyNow) return;
    const product = pendingBuyNow;
    setPendingBuyNow(null);
    navigate(checkoutUrl(product.id, quantity));
  };

  const onWish = async (id) => {
    if (wishlist.includes(id)) {
      const product = products.find((item) => item.id === id);
      if (product) {
        setPendingWishlistRemoval(product);
        return;
      }
    }
    dispatch(addToWishlist(id));
    try {
      const res = await addToWishlistApi(id);
      if (res?.items) {
        dispatch(replaceWishlist(res.items));
      }
    } catch (err) {
      console.error("Wishlist API call failed:", err);
    }
  };

  const confirmWishlistRemoval = async () => {
    if (!pendingWishlistRemoval) return;
    const id = pendingWishlistRemoval.id;
    dispatch(removeFromWishlist(id));
    try {
      const res = await removeFromWishlistApi(id);
      if (res?.items) {
        dispatch(replaceWishlist(res.items));
      }
    } catch (err) {
      console.error("Wishlist remove API failed:", err);
    }
    setPendingWishlistRemoval(null);
  };

  const onQuantity = async (id, quantity) => {
    const stock = products.find((product) => product.id === id)?.stock ?? 0;
    dispatch(setCartQuantity({ productId: id, quantity, stock }));
    try {
      const res = await updateCartQuantityApi(id, quantity);
      if (res?.items) {
        dispatch(replaceCart(res.items));
      }
    } catch (err) {
      console.error("Cart quantity update failed:", err);
    }
  };

  const onRemove = async (id) => {
    dispatch(removeCartItem(id));
    try {
      const res = await removeFromCartApi(id);
      if (res?.items) {
        dispatch(replaceCart(res.items));
      }
    } catch (err) {
      console.error("Cart remove API failed:", err);
    }
  };

  const location = useLocation();
  const navigate = useNavigate();
  const isCheckout = location.pathname.startsWith("/checkout");
  const customerData = {
    products,
    categories,
    cart,
    wishlist,
    orders,
    onWish,
    onAdd,
    onBuyNow,
    onQuantity,
    onRemove,
  };
  return (
    <div className="app-shell storefront-shell">
      <Sidebar />
      <div className="app-main">
        <Header
          count={count}
          wishlistCount={wishlist.length}
          onAccount={() => setAccountOpen(true)}
        />
        {isCheckout ? (
          <Outlet context={customerData} />
        ) : (
          <div className="mx-auto max-w-360 px-[7.1%] max-[1050px]:px-[5%] max-[760px]:px-5">
            <Outlet context={customerData} />
          </div>
        )}
        {!isCheckout && <Footer />}
        {accountOpen && (
          <CustomerLogin
            onClose={() => setAccountOpen(false)}
            onSave={() => setAccountOpen(false)}
          />
        )}
        {pendingWishlistRemoval && (
          <ConfirmationDialog
            title="Remove this item from your wishlist?"
            description={`${pendingWishlistRemoval.name} will be removed from your wishlist.`}
            confirmLabel="Remove item"
            onCancel={() => setPendingWishlistRemoval(null)}
            onConfirm={confirmWishlistRemoval}
          />
        )}
        {pendingAddToBag && (
          <AddToBagDialog
            product={pendingAddToBag}
            cartQuantity={cart.find((item) => (item.productId || item.id) === pendingAddToBag.id)?.quantity ?? 0}
            onCancel={() => setPendingAddToBag(null)}
            onConfirm={confirmAddToBag}
          />
        )}
        {pendingBuyNow && (
          <BuyNowDialog
            product={pendingBuyNow}
            onCancel={() => setPendingBuyNow(null)}
            onConfirm={confirmBuyNow}
          />
        )}
      </div>
    </div>
  );
}
