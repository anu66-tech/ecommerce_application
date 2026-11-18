import { Link } from 'react-router-dom';
import Icon from '../../../shared/components/Icon.jsx';
import { money } from '../../../shared/utils/format.js';

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

export { WishlistPage as Wishlist };
export default WishlistPage;