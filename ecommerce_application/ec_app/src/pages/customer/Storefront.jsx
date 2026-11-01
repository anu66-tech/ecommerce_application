import { useEffect, useMemo, useState } from "react";
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
import { useDispatch } from "react-redux";
import { addProduct } from "../../redux/ProductSlice.js";
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

function Icon({ name, size = 20 }) {
  const paths = {
    bag: (
      <>
        <path d="M5 8h14l1 13H4L5 8Z" />
        <path d="M9 8a3 3 0 0 1 6 0" />
      </>
    ),
    heart: (
      <path d="M20.8 8.7c0 4.2-8.8 10-8.8 10s-8.8-5.8-8.8-10A4.7 4.7 0 0 1 12 6.5a4.7 4.7 0 0 1 8.8 2.2Z" />
    ),
    search: (
      <>
        <circle cx="10.8" cy="10.8" r="6.8" />
        <path d="m16 16 4 4" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 20c.4-3.2 3-5 7-5s6.6 1.8 7 5" />
      </>
    ),
    arrow: (
      <>
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    close: (
      <>
        <path d="m6 6 12 12" />
        <path d="M18 6 6 18" />
      </>
    ),
  };
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}

function Header({ count, wishlistCount, onAccount }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const currentQuery = searchParams.get("q") ?? "";
  const [search, setSearch] = useState(currentQuery);
  const [shouldSearch, setShouldSearch] = useState(false);
  const debouncedSearch = useDebouncedValue(search);

  useEffect(() => setSearch(currentQuery), [currentQuery]);

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
        <Link className="brand" to="/">
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
          <Link className="header-text-link" to="/wishlist">
            Wishlist{wishlistCount > 0 && <span>{wishlistCount}</span>}
          </Link>
          <Link className="header-text-link" to="/cart">
            Cart{count > 0 && <span>{count}</span>}
          </Link>
          <button
            className="icon-link"
            onClick={onAccount}
            aria-label="Your account"
          >
            <Icon name="user" />
          </button>
        </div>
      </header>
    </>
  );
}

function ProductCard({ product, wished, onWish, onAdd, onBuyNow }) {
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

function ProductGrid({ products, wishlist, onWish, onAdd, onBuyNow }) {
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
        <Link className="brand" to="/">
          goodthings<span>.</span>
        </Link>
        <p>Thoughtful things for everyday living.</p>
        <Link to="/admin/login">
          Store admin <span>↗</span>
        </Link>
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
  const submit = (event) => {
    event.preventDefault();
    if (!name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Add your name and a valid email address to continue.");
      return;
    }
    const users = getStore("users") ?? [];
    const user = users.find(
      (item) => item.email.toLowerCase() === email.trim().toLowerCase(),
    ) ?? { id: makeId("user"), name: name.trim(), email: email.trim() };
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
        <form onSubmit={submit}>
          <label>
            Your name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="name"
              required
            />
          </label>
          <label>
            Email address
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
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

function HomeProductSection({
  eyebrow,
  title,
  products,
  wishlist,
  onWish,
  onAdd,
  onBuyNow,
}) {
  return (
    <section className="section-block home-products">
      <div className="section-heading">
        <div>
          <span className="eyebrow">{eyebrow}</span>
          <h2>{title}</h2>
        </div>
        <Link className="text-link" to="/products">
          Shop all <Icon name="arrow" size={16} />
        </Link>
      </div>
      <ProductGrid
        products={products.slice(0, 4)}
        wishlist={wishlist}
        onWish={onWish}
        onAdd={onAdd}
        onBuyNow={onBuyNow}
      />
    </section>
  );
}

export function HomePage({ products, categories, wishlist, onWish, onAdd, onBuyNow }) {
  const featured = products.filter((product) => product.featured);
  const bestSellers = [...products]
    .filter((product) => product.bestSeller)
    .sort((a, b) => b.reviews - a.reviews);
  const discounted = products.filter(
    (product) => product.oldPrice && product.oldPrice > product.price,
  );
  return (
    <>
      <section className="home-hero">
        <div className="hero-copy">
          <span className="eyebrow">THE GOODTHINGS EVERYDAY EDIT</span>
          <h1>
            Find your next
            <br />
            <em>favorite thing.</em>
          </h1>
          <p>Thoughtful picks for everyday living, all in one happy place.</p>
          <Link className="button button-dark" to="/products">
            Shop now <Icon name="arrow" size={17} />
          </Link>
          <div className="hero-note">
            <span className="note-stars">★★★★★</span>
            <span>Loved by 2,400+ happy homes</span>
          </div>
        </div>
        <div className="hero-image">
          <img
            src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1400&q=90"
            alt="A warm, sunlit home with thoughtfully chosen everyday things"
          />
          <div className="hero-image-label">
            <span>GOOD THINGS, EVERY DAY</span>
            <b>A little joy goes a long way.</b>
          </div>
          <span className="hero-stamp">
            made
            <br />
            with care
          </span>
        </div>
      </section>
      <section className="trust-strip">
        <span>
          <b>✳</b> Thoughtfully sourced
        </span>
        <span>
          <b>✳</b> Made to be kept
        </span>
        <span>
          <b>✳</b> Packed with care
        </span>
        <span>
          <b>✳</b> Free shipping over ₹4,999
        </span>
      </section>
      <section className="home-categories">
        <div className="section-heading">
          <div>
            <span className="eyebrow">A LITTLE BIT OF EVERYTHING</span>
            <h2>Shop by category.</h2>
          </div>
        </div>
        <div className="category-grid">
          {categories
            .filter((category) =>
              [
                "Electronics",
                "Fashion",
                "Footwear",
                "Beauty",
                "Home",
                "Accessories",
              ].includes(category.name),
            )
            .map((category) => (
              <Link
                className="category-tile"
                key={category.id}
                to={`/products?category=${encodeURIComponent(category.name)}`}
              >
                <span>{category.icon || "✳"}</span>
                <b>{category.name}</b>
                <small>Explore collection →</small>
              </Link>
            ))}
        </div>
      </section>
      <HomeProductSection
        eyebrow="HANDPICKED FOR YOU"
        title="Featured products."
        products={featured.length ? featured : products}
        wishlist={wishlist}
        onWish={onWish}
        onAdd={onAdd}
        onBuyNow={onBuyNow}
      />
      <HomeProductSection
        eyebrow="THE CROWD FAVORITES"
        title="Best sellers."
        products={
          bestSellers.length
            ? bestSellers
            : [...products].sort((a, b) => b.reviews - a.reviews)
        }
        wishlist={wishlist}
        onWish={onWish}
        onAdd={onAdd}
        onBuyNow={onBuyNow}
      />
      <HomeProductSection
        eyebrow="A LITTLE SOMETHING OFF"
        title="Discounts worth a look."
        products={discounted}
        wishlist={wishlist}
        onWish={onWish}
        onAdd={onAdd}
        onBuyNow={onBuyNow}
      />
      <section className="newsletter">
        <span className="eyebrow">A NOTE FROM US, NOW AND THEN</span>
        <h2>A little good in your inbox.</h2>
        <p>New finds, slow-living notes, and 10% off your first order.</p>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            window.alert("You’re on the list — talk soon!");
          }}
        >
          <input
            type="email"
            placeholder="Your email address"
            aria-label="Your email address"
            required
          />
          <button type="submit">
            Count me in <Icon name="arrow" size={16} />
          </button>
        </form>
        <span className="newsletter-note">No noise. Just the good stuff.</span>
      </section>
    </>
  );
}

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
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(initialSearch);
  const debouncedSearch = useDebouncedValue(search);
  const [category, setCategory] = useState(initialCategory);
  const [brand, setBrand] = useState(initialBrand);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minimumRating, setMinimumRating] = useState("0");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sort, setSort] = useState("featured");
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const brands = useMemo(
    () =>
      [
        ...new Set(products.map((product) => product.brand).filter(Boolean)),
      ].sort(),
    [products],
  );
  const filtered = useMemo(() => {
    let result = products.filter((product) => {
      const matchesSearch =
        `${product.name} ${product.category} ${product.brand ?? ""}`
          .toLowerCase()
          .includes(debouncedSearch.trim().toLowerCase());
      const matchesCategory =
        category === "All" || product.category === category;
      const matchesBrand = brand === "All" || product.brand === brand;
      const matchesMinPrice =
        minPrice === "" || product.price >= Number(minPrice);
      const matchesMaxPrice =
        maxPrice === "" || product.price <= Number(maxPrice);
      const matchesRating = product.rating >= Number(minimumRating);
      const matchesAvailability = !inStockOnly || product.stock > 0;
      return (
        matchesSearch &&
        matchesCategory &&
        matchesBrand &&
        matchesMinPrice &&
        matchesMaxPrice &&
        matchesRating &&
        matchesAvailability
      );
    });
    if (sort === "price-low")
      result = [...result].sort((a, b) => a.price - b.price);
    if (sort === "price-high")
      result = [...result].sort((a, b) => b.price - a.price);
    if (sort === "rating")
      result = [...result].sort((a, b) => b.rating - a.rating);
    return result;
  }, [
    products,
    debouncedSearch,
    category,
    brand,
    minPrice,
    maxPrice,
    minimumRating,
    inStockOnly,
    sort,
  ]);
  const pageCount = Math.ceil(filtered.length / pageSize);
  const currentPage = Math.min(page, Math.max(pageCount, 1));
  const visibleProducts = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
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
      params.delete("category");
      params.delete("brand");
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
      return params;
    });
  };
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
                    changeFilter(setMinPrice)(event.target.value)
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
                    changeFilter(setMaxPrice)(event.target.value)
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
                changeFilter(setMinimumRating)(event.target.value)
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
                changeFilter(setInStockOnly)(event.target.checked)
              }
            />
            <span>In stock only</span>
          </label>
        </aside>
        <div className="catalog-results">
          <div className="catalog-results-head">
            <span>{filtered.length} products</span>
            <label>
              Sort by
              <select
                value={sort}
                onChange={(event) => changeFilter(setSort)(event.target.value)}
              >
                <option value="featured">Featured</option>
                <option value="price-low">Price: low to high</option>
                <option value="price-high">Price: high to low</option>
                <option value="rating">Top rated</option>
              </select>
            </label>
          </div>
          <ProductGrid
            products={visibleProducts}
            wishlist={wishlist}
            onWish={onWish}
            onAdd={onAdd}
            onBuyNow={onBuyNow}
          />
          {pageCount > 1 && (
            <nav className="pagination" aria-label="Product pages">
              <button
                disabled={currentPage === 1}
                onClick={() => setPage(currentPage - 1)}
              >
                Previous
              </button>
              {Array.from({ length: pageCount }, (_, index) => index + 1).map(
                (number) => (
                  <button
                    key={number}
                    className={currentPage === number ? "active" : ""}
                    aria-current={currentPage === number ? "page" : undefined}
                    onClick={() => setPage(number)}
                  >
                    {number}
                  </button>
                ),
              )}
              <button
                disabled={currentPage === pageCount}
                onClick={() => setPage(currentPage + 1)}
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
    const product = latestProducts.find((item) => item.id === productId);
    const cartItem = latestCart.find((item) => item.productId === productId);
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
    navigate(checkoutUrl(productId, purchaseQuantity, true));
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
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
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
    dispatch(clearCart());
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
    updateStore("products", (all) =>
      all.map((product) => {
        const ordered = latestLines.find(
          (line) => line.product?.id === product.id,
        );
        return ordered
          ? { ...product, stock: Math.max(0, product.stock - ordered.quantity) }
          : product;
      }),
    );
    if (isCartPurchase) {
      setStore(
        "cart",
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
      );
    } else if (!buyNowId) {
      setStore("cart", []);
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
            <form onSubmit={saveAndGo} className="checkout-form">
              <span className="eyebrow">STEP 01 — WHERE TO?</span>
              <h1>Delivery address</h1>
              <p>Where should we send your good things?</p>
              <div className="form-grid">
                <label className="form-wide">
                  Full name
                  <input
                    required
                    autoComplete="name"
                    value={draft.name ?? ""}
                    onChange={(event) =>
                      setDraft({ ...draft, name: event.target.value })
                    }
                  />
                </label>
                <label className="form-wide">
                  Email address
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={draft.email ?? ""}
                    onChange={(event) =>
                      setDraft({ ...draft, email: event.target.value })
                    }
                  />
                </label>
                <label className="form-wide">
                  Street address
                  <input
                    required
                    autoComplete="street-address"
                    value={draft.address ?? ""}
                    onChange={(event) =>
                      setDraft({ ...draft, address: event.target.value })
                    }
                  />
                </label>
                <label>
                  City
                  <input
                    required
                    autoComplete="address-level2"
                    value={draft.city ?? ""}
                    onChange={(event) =>
                      setDraft({ ...draft, city: event.target.value })
                    }
                  />
                </label>
                <label>
                  Postal code
                  <input
                    required
                    autoComplete="postal-code"
                    value={draft.postal ?? ""}
                    onChange={(event) =>
                      setDraft({ ...draft, postal: event.target.value })
                    }
                  />
                </label>
                <label className="form-wide">
                  Country
                  <input
                    required
                    autoComplete="country-name"
                    value={draft.country ?? ""}
                    onChange={(event) =>
                      setDraft({ ...draft, country: event.target.value })
                    }
                  />
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
                      required
                      value={draft.cardName ?? draft.name ?? ""}
                      onChange={(event) =>
                        setDraft({ ...draft, cardName: event.target.value })
                      }
                    />
                  </label>
                  <label className="form-wide">
                    Card number
                    <input
                      inputMode="numeric"
                      pattern="[0-9 ]{12,23}"
                      maxLength="23"
                      placeholder="4242 4242 4242 4242"
                      required
                      value={draft.cardNumber ?? ""}
                      onChange={(event) =>
                        setDraft({ ...draft, cardNumber: event.target.value })
                      }
                    />
                  </label>
                  <label>
                    Expiry date
                    <input
                      placeholder="MM / YY"
                      required
                      value={draft.expiry ?? ""}
                      onChange={(event) =>
                        setDraft({ ...draft, expiry: event.target.value })
                      }
                    />
                  </label>
                  <label>
                    Security code
                    <input
                      inputMode="numeric"
                      maxLength="4"
                      required
                      value={draft.cvv ?? ""}
                      onChange={(event) =>
                        setDraft({ ...draft, cvv: event.target.value })
                      }
                    />
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
  const order =
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

export function OrdersPage({ orders }) {
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
  const products = useStore("products");
  const categories = useStore("categories");
  const dispatch = useStoreDispatch();
  const cart = useSelector((state) => state.cart);
  const wishlist = useStore("wishlist");
  const orders = useStore("orders");
  const [accountOpen, setAccountOpen] = useState(false);
  const [pendingWishlistRemoval, setPendingWishlistRemoval] = useState(null);
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  const onAdd = (id) => {
    const latestProducts = getStore("products") ?? [];
    const latestCart = getStore("cart") ?? [];
    const product = latestProducts.find((item) => item.id === id);
    const existing = latestCart.find((item) => item.productId === id);
    if (!product || product.stock < (existing?.quantity ?? 0) + 1) {
      window.alert(
        product
          ? "That’s all the stock we have right now."
          : "This product is no longer available.",
      );
      return;
    }
     dispatch(
    addToCart({
      productId: id,
      stock: product.stock,
    })
  );
};
    updateStore("cart", (items) => {
      const match = items.find((item) => item.productId === id);
      const updatedItems = match
        ? items
            .filter((item) => item.productId !== id)
            .concat({ ...match, quantity: match.quantity + 1 })
        : [...items, { productId: id, quantity: 1 }];
      return updatedItems;
    });
  };
  const onBuyNow = (id) => {
    const product = (getStore("products") ?? []).find(
        (item) => item.id === id,
    );
    if (!product || product.stock <= 0) {
        window.alert(`${product?.name ?? "This product"} is out of stock.`);
        return;
    }
    navigate(checkoutUrl(id));
  };
  const onWish = (id) => {
    if (wishlist.includes(id)) {
      const product = products.find((item) => item.id === id);
      if (product) {
        setPendingWishlistRemoval(product);
        return;
      }
    }
    updateStore("wishlist", (items) =>
      items.includes(id) ? items : [...items, id],
    );
  };
  const confirmWishlistRemoval = () => {
    if (!pendingWishlistRemoval) return;
    updateStore("wishlist", (items) =>
      items.filter((id) => id !== pendingWishlistRemoval.id),
    );
    setPendingWishlistRemoval(null);
  };
  const onQuantity = (id, quantity) =>
    updateStore("cart", (items) =>
      items.map((item) => {
        if (item.productId !== id) return item;
        const stock = products.find((product) => product.id === id)?.stock ?? 0;
        return stock > 0
          ? { ...item, quantity: Math.max(1, Math.min(quantity, stock)) }
          : item;
      }),
    );
  const onRemove = (id) =>
    updateStore("cart", (items) =>
      items.filter((item) => item.productId !== id),
    );
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
        {pendingWishlistAdd && (
          <ConfirmationDialog
            title="Add this item to your wishlist?"
            description={`${pendingWishlistAdd.name} will be added to your wishlist.`}
            confirmLabel="Add item"
            onCancel={() => setPendingWishlistAdd(null)}
            onConfirm={confirmWishlistAdd}
          />
        )}
      </div>
    </div>
  );

