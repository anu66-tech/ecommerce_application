import { useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { subscribeNewsletterApi } from '../../api/backend.js'
import Icon from '../../components/common/Icon.jsx'
import { ProductGrid } from './Storefront.jsx'

export function HeroBanner() {
  return (
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
  )
}

export function BrandStory() {
  return (
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
  )
}

export function CategoryPills({ categories = [] }) {
  const allowedCategories = [
    'Electronics',
    'Fashion',
    'Footwear',
    'Beauty',
    'Home',
    'Accessories',
  ]

  return (
    <section className="home-categories">
      <div className="section-heading">
        <div>
          <span className="eyebrow">A LITTLE BIT OF EVERYTHING</span>
          <h2>Shop by category.</h2>
        </div>
      </div>
      <div className="category-grid">
        {categories
          .filter((category) => allowedCategories.includes(category.name))
          .map((category) => (
            <Link
              className="category-tile"
              key={category.id}
              to={`/products?category=${encodeURIComponent(category.name)}`}
            >
              <span>{category.icon || '✳'}</span>
              <b>{category.name}</b>
              <small>Explore collection →</small>
            </Link>
          ))}
      </div>
    </section>
  )
}

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

export function NewsletterSection() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    const trimmed = email.trim()
    if (!trimmed) {
      setError('Please enter your email address.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Please enter a valid email address (e.g. name@domain.com).')
      return
    }
    setError('')
    try {
      await subscribeNewsletterApi(trimmed)
    } catch (err) {
      console.warn('Newsletter API subscribe:', err)
    }
    setSuccess(true)
  }

  return (
    <section className="newsletter">
      <span className="eyebrow">A NOTE FROM US, NOW AND THEN</span>
      <h2>A little good in your inbox.</h2>
      <p>New finds, slow-living notes, and 10% off your first order.</p>
      {success ? (
        <div style={{ color: '#276b38', fontWeight: 600, padding: '12px 0', fontSize: '12px' }}>
          ✓ You’re on the list — talk soon!
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="email"
              placeholder="Your email address"
              aria-label="Your email address"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (error) setError('')
              }}
              className={error ? 'input-error' : ''}
            />
            <button type="submit">
              Count me in <Icon name="arrow" size={16} />
            </button>
          </div>
          {error && <span className="field-error-text">{error}</span>}
        </form>
      )}
      <span className="newsletter-note">No noise. Just the good stuff.</span>
    </section>
  )
}

export function HomePage({
  products: propProducts,
  categories: propCategories,
  wishlist: propWishlist,
  onWish: propOnWish,
  onAdd: propOnAdd,
  onBuyNow: propOnBuyNow,
} = {}) {
  let outletCtx = {}
  try {
    outletCtx = useOutletContext() || {}
  } catch {
    outletCtx = {}
  }

  const products = propProducts ?? outletCtx.products ?? []
  const categories = propCategories ?? outletCtx.categories ?? []
  const wishlist = propWishlist ?? outletCtx.wishlist ?? []
  const onWish = propOnWish ?? outletCtx.onWish ?? (() => {})
  const onAdd = propOnAdd ?? outletCtx.onAdd ?? (() => {})
  const onBuyNow = propOnBuyNow ?? outletCtx.onBuyNow ?? (() => {})

  const featured = products.filter((product) => product.featured)
  const bestSellers = [...products]
    .filter((product) => product.bestSeller)
    .sort((a, b) => (b.reviews ?? 0) - (a.reviews ?? 0))
  const discounted = products.filter(
    (product) => product.oldPrice && product.oldPrice > product.price
  )

  return (
    <>
      <HeroBanner />
      <BrandStory />
      <CategoryPills categories={categories} />
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
            : [...products].sort((a, b) => (b.reviews ?? 0) - (a.reviews ?? 0))
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
      <NewsletterSection />
    </>
  )
}

export { HomePage as Home }
export default HomePage
