import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { clearCart } from '../../../redux/cartSlice.js';
import { createOrderApi, clearCartApi } from '../../../api/backend.js';
import { getStore, setStore, useStore } from '../../../shared/store/store.js';
import { money } from '../../../shared/utils/format.js';
import { STANDARD_SHIPPING, EXPRESS_SHIPPING, FREE_SHIPPING_THRESHOLD } from '../../../shared/utils/constants.js';
import Icon from '../../../shared/components/Icon.jsx';

const steps = [
  ["address", "Address"],
  ["delivery", "Delivery"],
  ["payment", "Payment"],
  ["review", "Review"],
];

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

export { CheckoutPage as Checkout };
export default CheckoutPage;