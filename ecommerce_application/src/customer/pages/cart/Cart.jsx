import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getStore } from '../../../shared/store/store.js';
import { checkoutUrl } from '../../../shared/utils/helpers.js';
import { money } from '../../../shared/utils/format.js';
import { FREE_SHIPPING_THRESHOLD, STANDARD_SHIPPING } from '../../../shared/utils/constants.js';
import Icon from '../../../shared/components/Icon.jsx';
import ConfirmationDialog from '../../../shared/components/ConfirmationDialog.jsx';
import BuyNowDialog from '../../../shared/components/BuyNowDialog.jsx';

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

export { CartPage as Cart };
export default CartPage;