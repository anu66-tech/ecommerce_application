import { useOutletContext, useParams, useSearchParams } from 'react-router-dom'
import {
  CartPage,
  CheckoutPage,
  HomePage,
  OrderSuccess,
  OrdersPage,
  ProductDetail,
  ProductsPage,
  WishlistPage,
} from './Storefront'

export function CustomerHomeRoute() {
  const { products, categories, wishlist, onWish, onAdd, onBuyNow } = useOutletContext()
  const [searchParams] = useSearchParams()
  const category = searchParams.get('category')
  const visibleProducts = category ? products.filter((product) => product.category === category) : products
  return <HomePage products={visibleProducts} categories={categories} wishlist={wishlist} onWish={onWish} onAdd={onAdd} onBuyNow={onBuyNow} />
}

export function CustomerProductsRoute() {
  const { products, categories, wishlist, onWish, onAdd, onBuyNow } = useOutletContext()
  const [searchParams] = useSearchParams()
  return <ProductsPage key={searchParams.toString()} products={products} categories={categories} wishlist={wishlist} onWish={onWish} onAdd={onAdd} onBuyNow={onBuyNow} initialSearch={searchParams.get('q') ?? ''} initialCategory={searchParams.get('category') ?? 'All'} initialBrand={searchParams.get('brand') ?? 'All'} />
}

export function CustomerProductRoute() {
  const { id } = useParams()
  const { products, wishlist, onWish, onAdd, onBuyNow } = useOutletContext()
  const product = products.find((item) => item.id === id)
  return <ProductDetail product={product} wishlist={wishlist} onWish={onWish} onAdd={onAdd} onBuyNow={onBuyNow} />
}

export function CustomerWishlistRoute() {
  const { products, wishlist, onWish, onAdd, onBuyNow } = useOutletContext()
  return <WishlistPage products={products} wishlist={wishlist} onWish={onWish} onAdd={onAdd} onBuyNow={onBuyNow} />
}

export function CustomerCartRoute() {
  const { products, cart, onQuantity, onRemove } = useOutletContext()
  return <CartPage products={products} cart={cart} onQuantity={onQuantity} onRemove={onRemove} />
}

export function CustomerCheckoutRoute() {
  const { products, cart } = useOutletContext()
  return <CheckoutPage products={products} cart={cart} />
}

export function CustomerOrdersRoute() {
  const { orders } = useOutletContext()
  return <OrdersPage orders={orders} />
}

export { OrderSuccess as CustomerOrderSuccessRoute }
