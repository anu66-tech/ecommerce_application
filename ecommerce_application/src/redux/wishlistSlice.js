import { createSlice } from "@reduxjs/toolkit";
import { getStore } from "../pages/customer/store.js";

const initialItems =
  typeof window !== "undefined"
    ? getStore("wishlist") ?? []
    : [];

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState: {
    items: initialItems,
  },
  reducers: {
    addToWishlist: (state, action) => {
      const productId = action.payload;
      if (productId && !state.items.includes(productId)) {
        state.items.push(productId);
      }
    },
    removeFromWishlist: (state, action) => {
      state.items = state.items.filter((productId) => productId !== action.payload);
    },
    replaceWishlist: (state, action) => {
      state.items = action.payload;
    },
    clearWishlist: (state) => {
      state.items = [];
    },
  },
});

export const {
  addToWishlist,
  removeFromWishlist,
  replaceWishlist,
  clearWishlist,
} = wishlistSlice.actions;

export default wishlistSlice.reducer;
