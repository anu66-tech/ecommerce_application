
import { configureStore } from "@reduxjs/toolkit";
import cartReducer from "./cartSlice.js";
import wishlistReducer from "./wishlistSlice.js";
import productReducer from "./ProductSlice.js";
import { setStore } from "../pages/customer/store.js";

export const store = configureStore({
  reducer: {
    cart: cartReducer,
    wishlist: wishlistReducer,
    products: productReducer,
  },
});


let previousCart = store.getState().cart.items;
let previousWishlist = store.getState().wishlist.items;
let previousProducts = store.getState().products.items;
store.subscribe(() => {
  const currentCart = store.getState().cart.items;
  const currentWishlist = store.getState().wishlist.items;
  const currentProducts = store.getState().products.items;

  if (currentCart !== previousCart) {
    previousCart = currentCart;
    setStore("cart", currentCart);
  }
  if (currentWishlist !== previousWishlist) {
    previousWishlist = currentWishlist;
    setStore("wishlist", currentWishlist);
  }
  if (currentProducts !== previousProducts) {
    previousProducts = currentProducts;
    setStore("products", currentProducts);
  }
});
