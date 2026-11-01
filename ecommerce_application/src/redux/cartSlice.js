import { createSlice } from "@reduxjs/toolkit";
import { getStore } from "../pages/customer/store.js";

const initialItems =
  typeof window !== "undefined"
    ? getStore("cart") ?? []
    : [];

const cartSlice = createSlice({
  name: "cart",

  initialState: {
    items: initialItems,
  },

  reducers: {
    addToCart: (state, action) => {
      const { productId, stock } = action.payload;

      if (!productId || stock <= 0) return;

      const existingItem = state.items.find(
        (item) => item.productId === productId
      );

      if (existingItem) {
        if (existingItem.quantity < stock) {
          state.items = state.items
            .filter((item) => item.productId !== productId)
            .concat({ ...existingItem, quantity: existingItem.quantity + 1 });
        }
      } else {
        state.items.push({
          productId,
          quantity: 1,
        });
      }
    },

    setCartQuantity: (state, action) => {
      const { productId, quantity, stock } = action.payload;

      const item = state.items.find(
        (item) => item.productId === productId
      );

      if (!item || stock <= 0) return;

      item.quantity = Math.max(
        1,
        Math.min(quantity, stock)
      );
    },

    removeCartItem: (state, action) => {
      state.items = state.items.filter(
        (item) => item.productId !== action.payload
      );
    },

    removeProductFromCart: (state, action) => {
      state.items = state.items.filter(
        (item) => item.productId !== action.payload
      );
    },

    replaceCart: (state, action) => {
      state.items = action.payload;
    },

    clearCart: (state) => {
      state.items = [];
    },
  },
});

export const {
  addToCart,
  setCartQuantity,
  removeCartItem,
  removeProductFromCart,
  replaceCart,
  clearCart,
} = cartSlice.actions;

export default cartSlice.reducer;
