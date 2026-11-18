import { useMemo, useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  fetchProducts,
  fetchCategoriesApi,
} from '@/customer/pages/products/api/productApi.js'
import {
  fetchCartApi,
  addToCartApi,
  removeFromCartApi,
  updateCartQuantityApi,
} from '@/customer/pages/cart/api/cartApi.js'
import {
  fetchWishlistApi,
  addToWishlistApi,
  removeFromWishlistApi,
} from '@/customer/pages/wishlist/api/wishlistApi.js'
import {
  addToCart,
  removeCartItem,
  replaceCart,
  setCartQuantity,
} from '../../redux/cartSlice.js'
import {
  addToWishlist,
  removeFromWishlist,
  replaceWishlist,
} from '../../redux/wishlistSlice.js'
import { replaceProducts } from '../../redux/ProductSlice.js'
import { getStore, useStore } from '../../shared/store/store.js'
import { checkoutUrl } from '../../shared/utils/helpers.js'
import Sidebar from '../../shared/components/Sidebar.jsx'
import Header from '../../shared/components/Header.jsx'
import Footer from '../../shared/components/Footer.jsx'
import CustomerLoginModal from '../../shared/components/CustomerLoginModal.jsx'
import ConfirmationDialog from '../../shared/components/ConfirmationDialog.jsx'
import AddToBagDialog from '../../shared/components/AddToBagDialog.jsx'
import BuyNowDialog from '../../shared/components/BuyNowDialog.jsx'

export default function CustomerLayout() {
  const [liveProducts, setLiveProducts] = useState(null)
  const [liveCategories, setLiveCategories] = useState([])
  const storeRaw = useStore("products") || []
  const rawProducts = liveProducts ?? storeRaw
  const products = useMemo(() => {
    return [...(rawProducts ?? [])].sort((a, b) => {
      const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime()
      const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime()
      if (timeA && timeB && timeA !== timeB) return timeB - timeA
      return (rawProducts ?? []).indexOf(a) - (rawProducts ?? []).indexOf(b)
    })
  }, [rawProducts])

  const storeCategories = useStore("categories") || []
  const categories = liveCategories.length ? liveCategories : storeCategories
  const cart = useSelector((state) => state.cart.items)
  const wishlist = useSelector((state) => state.wishlist.items)
  const orders = useStore("orders")
  const dispatch = useDispatch()
  const [accountOpen, setAccountOpen] = useState(false)
  const [pendingWishlistRemoval, setPendingWishlistRemoval] = useState(null)
  const [pendingAddToBag, setPendingAddToBag] = useState(null)
  const [pendingBuyNow, setPendingBuyNow] = useState(null)

  useEffect(() => {
    let active = true
    const controller = new AbortController()

    // 1. Fetch live products from backend
    fetchProducts({ limit: 100 }, { signal: controller.signal })
      .then((res) => {
        if (!active || controller.signal.aborted) return
        const items = Array.isArray(res?.items) ? res.items : Array.isArray(res) ? res : null
        if (items) {
          setLiveProducts(items)
          dispatch(replaceProducts(items))
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError' && !controller.signal.aborted) {
          console.warn('CustomerLayout products fetch failed:', err)
        }
      })

    // 2. Fetch live categories from backend
    fetchCategoriesApi({ signal: controller.signal })
      .then((cats) => {
        if (!active || controller.signal.aborted) return
        if (Array.isArray(cats) && cats.length) {
          setLiveCategories(cats)
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError' && !controller.signal.aborted) {
          console.warn('CustomerLayout categories fetch failed:', err)
        }
      })

    // 3. Fetch live cart
    fetchCartApi({ signal: controller.signal })
      .then((res) => {
        if (!active || controller.signal.aborted) return
        const items = Array.isArray(res?.items) ? res.items : Array.isArray(res) ? res : []
        dispatch(replaceCart(items))
      })
      .catch((err) => {
        if (err.name !== 'AbortError' && !controller.signal.aborted) {
          console.warn('CustomerLayout cart fetch failed:', err)
        }
      })

    // 4. Fetch live wishlist
    fetchWishlistApi({ signal: controller.signal })
      .then((res) => {
        if (!active || controller.signal.aborted) return
        const items = Array.isArray(res?.items) ? res.items : Array.isArray(res) ? res : []
        dispatch(replaceWishlist(items))
      })
      .catch((err) => {
        if (err.name !== 'AbortError' && !controller.signal.aborted) {
          console.warn('CustomerLayout wishlist fetch failed:', err)
        }
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [dispatch])

  const count = cart.reduce((sum, item) => sum + item.quantity, 0)

  const onAdd = (id) => {
    const latestProducts = getStore("products") ?? []
    const product = latestProducts.find((item) => item.id === id) || products.find((item) => item.id === id)
    if (!product) {
      window.alert("This product is no longer available.")
      return
    }
    const existing = cart.find((item) => (item.productId || item.id) === id)
    if (product.stock <= (existing?.quantity ?? 0)) {
      window.alert("That’s all the stock we have right now.")
      return
    }
    setPendingAddToBag(product)
  }

  const confirmAddToBag = async (quantity = 1) => {
    if (!pendingAddToBag) return
    const product = pendingAddToBag
    dispatch(addToCart({ productId: product.id, stock: product.stock, quantity }))
    try {
      const res = await addToCartApi(product.id, quantity)
      if (res?.items) {
        dispatch(replaceCart(res.items))
      }
    } catch (err) {
      console.error("Cart API update failed:", err)
    }
    setPendingAddToBag(null)
  }

  const onBuyNow = (id) => {
    const product =
      (getStore("products") ?? []).find((item) => item.id === id) ||
      products.find((item) => item.id === id)

    if (!product || product.stock <= 0) {
      window.alert(`${product?.name ?? "This product"} is out of stock.`)
      return
    }
    setPendingBuyNow(product)
  }

  const confirmBuyNow = (quantity = 1) => {
    if (!pendingBuyNow) return
    const product = pendingBuyNow
    setPendingBuyNow(null)
    navigate(checkoutUrl(product.id, quantity))
  }

  const onWish = async (id) => {
    if (wishlist.includes(id)) {
      const product = products.find((item) => item.id === id)
      if (product) {
        setPendingWishlistRemoval(product)
        return
      }
    }
    dispatch(addToWishlist(id))
    try {
      const res = await addToWishlistApi(id)
      if (res?.items) {
        dispatch(replaceWishlist(res.items))
      }
    } catch (err) {
      console.error("Wishlist API call failed:", err)
    }
  }

  const confirmWishlistRemoval = async () => {
    if (!pendingWishlistRemoval) return
    const id = pendingWishlistRemoval.id
    dispatch(removeFromWishlist(id))
    try {
      const res = await removeFromWishlistApi(id)
      if (res?.items) {
        dispatch(replaceWishlist(res.items))
      }
    } catch (err) {
      console.error("Wishlist remove API failed:", err)
    }
    setPendingWishlistRemoval(null)
  }

  const onQuantity = async (id, quantity) => {
    const stock = products.find((product) => product.id === id)?.stock ?? 0
    dispatch(setCartQuantity({ productId: id, quantity, stock }))
    try {
      const res = await updateCartQuantityApi(id, quantity)
      if (res?.items) {
        dispatch(replaceCart(res.items))
      }
    } catch (err) {
      console.error("Cart quantity update failed:", err)
    }
  }

  const onRemove = async (id) => {
    dispatch(removeCartItem(id))
    try {
      const res = await removeFromCartApi(id)
      if (res?.items) {
        dispatch(replaceCart(res.items))
      }
    } catch (err) {
      console.error("Cart remove API failed:", err)
    }
  }

  const location = useLocation()
  const navigate = useNavigate()
  const isCheckout = location.pathname.startsWith("/checkout")
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
  }

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
          <CustomerLoginModal
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
        {pendingAddToBag && (
          <AddToBagDialog
            product={pendingAddToBag}
            cartQuantity={cart.find((item) => (item.productId || item.id) === pendingAddToBag.id)?.quantity ?? 0}
            onCancel={() => setPendingAddToBag(null)}
            onConfirm={confirmAddToBag}
          />
        )}
        {pendingBuyNow && (
          <BuyNowDialog
            product={pendingBuyNow}
            onCancel={() => setPendingBuyNow(null)}
            onConfirm={confirmBuyNow}
          />
        )}
      </div>
    </div>
  )
}
