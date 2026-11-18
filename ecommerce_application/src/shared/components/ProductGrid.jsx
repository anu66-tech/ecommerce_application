import { Link } from 'react-router-dom'
import ProductCard from './ProductCard.jsx'

export function ProductGrid({ products, wishlist, onWish, onAdd, onBuyNow }) {
  if (!products || !products.length) {
    return (
      <div className="empty-state">
        <span className="empty-icon">⌕</span>
        <h3>No good things found</h3>
        <p>Try a different search or category.</p>
        <Link className="button button-dark" to="/products">
          Clear filters
        </Link>
      </div>
    )
  }

  return (
    <div className="product-grid">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          wished={wishlist?.includes(product.id)}
          onWish={onWish}
          onAdd={onAdd}
          onBuyNow={onBuyNow}
        />
      ))}
    </div>
  )
}

export default ProductGrid
