import { useOutletContext } from 'react-router-dom'
import HeroBanner from './components/HeroBanner.jsx'
import BrandStory from './components/BrandStory.jsx'
import CategoryPills from './components/CategoryPills.jsx'
import HomeProductSection from './components/HomeProductSection.jsx'
import NewsletterSection from './components/NewsletterSection.jsx'

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
