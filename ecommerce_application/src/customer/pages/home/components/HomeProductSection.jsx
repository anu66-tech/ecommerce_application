import { Link } from 'react-router-dom'
import Icon from '../../../../shared/components/Icon.jsx'
import ProductGrid from '../../../../shared/components/ProductGrid.jsx'

export function HomeProductSection({
  eyebrow,
  title,
  products = [],
  wishlist = [],
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
  )
}

export default HomeProductSection
