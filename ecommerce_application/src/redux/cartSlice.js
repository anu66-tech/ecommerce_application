import { createSlice } from "@reduxjs/toolkit";
import { getStore } from "../shared/store/store.js";

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
      const { productId, stock, quantity = 1 } = action.payload;

      if (!productId || stock <= 0) return;

      const existingItem = state.items.find(
        (item) => item.productId === productId
      );

      const addAmount = Math.max(1, Number(quantity) || 1);

      if (existingItem) {
        const newQty = Math.min(stock, existingItem.quantity + addAmount);
        existingItem.quantity = newQty;
      } else {
        state.items.push({
          productId,
          quantity: Math.min(stock, addAmount),
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
