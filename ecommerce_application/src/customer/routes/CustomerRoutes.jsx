import { useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { useOutletContext, useParams, useSearchParams } from 'react-router-dom'
import { fetchProducts } from '@/customer/pages/products/api/productApi.js'
import { fetchProductByIdApi } from '@/customer/pages/product-details/api/productDetailsApi.js'
import { fetchWishlistApi } from '@/customer/pages/wishlist/api/wishlistApi.js'
import { fetchCartApi } from '@/customer/pages/cart/api/cartApi.js'
import { replaceCart } from '../../redux/cartSlice.js'
import { replaceWishlist } from '../../redux/wishlistSlice.js'
import { replaceProducts } from '../../redux/ProductSlice.js'
import HomePage from '../pages/home/Home.jsx'
import ProductsPage from '../pages/products/Products.jsx'
import ProductDetail from '../pages/product-details/ProductDetails.jsx'
import WishlistPage from '../pages/wishlist/Wishlist.jsx'
import CartPage from '../pages/cart/Cart.jsx'
import CheckoutPage from '../pages/checkout/Checkout.jsx'
import OrderSuccess from '../pages/checkout/OrderSuccess.jsx'
import OrdersPage from '../pages/orders/Orders.jsx'
import AccountPage from '../pages/account/Account.jsx'
import LoginPage from '../../shared/auth/LoginPage.jsx'

export function CustomerHomeRoute() {
  const { products, categories, wishlist, onWish, onAdd, onBuyNow } = useOutletContext()
  const dispatch = useDispatch()
  const [searchParams] = useSearchParams()
  const category = searchParams.get('category')

  useEffect(() => {
    if (products && products.length > 0) return
    let active = true
    const controller = new AbortController()
    fetchProducts({ limit: 50 }, { signal: controller.signal })
      .then((res) => {
        if (!active || controller.signal.aborted) return
        const items = Array.isArray(res?.items) ? res.items : Array.isArray(res) ? res : null
        if (items) dispatch(replaceProducts(items))
      })
      .catch((err) => {
        if (err.name !== 'AbortError' && !controller.signal.aborted) {
          console.warn('Home products API error:', err)
        }
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [dispatch, products])

  const visibleProducts = category ? (products || []).filter((product) => product.category === category) : products
  return <HomePage products={visibleProducts} categories={categories} wishlist={wishlist} onWish={onWish} onAdd={onAdd} onBuyNow={onBuyNow} />
}

export function CustomerProductsRoute() {
  const { products, categories, wishlist, onWish, onAdd, onBuyNow } = useOutletContext()
  const [searchParams] = useSearchParams()

  return (
    <ProductsPage
      products={products}
      categories={categories}
      wishlist={wishlist}
      onWish={onWish}
      onAdd={onAdd}
      onBuyNow={onBuyNow}
      initialSearch={searchParams.get('q') ?? ''}
      initialCategory={searchParams.get('category') ?? 'All'}
      initialBrand={searchParams.get('brand') ?? 'All'}
      initialMinPrice={searchParams.get('minPrice') ?? ''}
      initialMaxPrice={searchParams.get('maxPrice') ?? ''}
      initialMinimumRating={searchParams.get('rating') ?? '0'}
      initialInStockOnly={searchParams.get('inStock') === '1'}
      initialSort={searchParams.get('sort') ?? 'featured'}
      initialPage={searchParams.get('page') ?? '1'}
    />
  )
}

export function CustomerProductRoute() {
  const { id } = useParams()
  const { products, wishlist, onWish, onAdd, onBuyNow } = useOutletContext()
  const [remoteProduct, setRemoteProduct] = useState(null)

  useEffect(() => {
    let active = true
    const controller = new AbortController()
    fetchProductByIdApi(id, { signal: controller.signal })
      .then((res) => {
        if (active && !controller.signal.aborted && res) setRemoteProduct(res)
      })
      .catch((err) => {
        if (err.name !== 'AbortError' && !controller.signal.aborted) {
          console.warn('Product by ID fetch warning:', err)
        }
      })
    return () => {
      active = false
      controller.abort()
    }
  }, [id])

  const product = remoteProduct || (products || []).find((item) => item.id === id)
  return <ProductDetail product={product} wishlist={wishlist} onWish={onWish} onAdd={onAdd} onBuyNow={onBuyNow} />
}

export function CustomerWishlistRoute() {
  const { products, wishlist, onWish, onAdd, onBuyNow } = useOutletContext()
  const dispatch = useDispatch()

  useEffect(() => {
    let active = true
    const controller = new AbortController()
    fetchWishlistApi({ signal: controller.signal })
      .then((res) => {
        if (!active || controller.signal.aborted) return
        const items = Array.isArray(res?.items) ? res.items : Array.isArray(res) ? res : []
        if (JSON.stringify(items) !== JSON.stringify(wishlist)) {
          dispatch(replaceWishlist(items))
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError' && !controller.signal.aborted) {
          console.warn('Wishlist API error:', err)
        }
      })
    return () => {
      active = false
      controller.abort()
    }
  }, [dispatch])

  return <WishlistPage products={products} wishlist={wishlist} onWish={onWish} onAdd={onAdd} onBuyNow={onBuyNow} />
}

export function CustomerCartRoute() {
  const { products, cart, onQuantity, onRemove } = useOutletContext()
  const dispatch = useDispatch()

  useEffect(() => {
    let active = true
    const controller = new AbortController()
    fetchCartApi({ signal: controller.signal })
      .then((res) => {
        if (!active || controller.signal.aborted) return
        const items = Array.isArray(res?.items) ? res.items : Array.isArray(res) ? res : []
        if (JSON.stringify(items) !== JSON.stringify(cart)) {
          dispatch(replaceCart(items))
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError' && !controller.signal.aborted) {
          console.warn('Cart API error:', err)
        }
      })
    return () => {
      active = false
      controller.abort()
    }
  }, [dispatch])

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

export function CustomerLoginRoute() {
  return <LoginPage />
}

export { OrderSuccess as CustomerOrderSuccessRoute }

export function CustomerAccountRoute() {
  return <AccountPage />
}
