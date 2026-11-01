import { createSlice } from "@reduxjs/toolkit";
import { getStore } from "../pages/customer/store.js";

const initialProducts =
  typeof window !== "undefined"
    ? getStore("products") ?? []
    : [];

const productSlice = createSlice({
  name: "products",
  initialState: {
    items: initialProducts,
  },
  reducers: {
    addProduct: (state, action) => {
      const newProduct = action.payload;
      state.items = [
        newProduct,
        ...state.items.filter((product) => product.id !== newProduct.id),
      ];
    },
    removeProduct: (state, action) => {
      const productIdToRemove = action.payload;
      state.items = state.items.filter(
        (product) => product.id !== productIdToRemove
      );
    },
    replaceProducts: (state, action) => {
      state.items = action.payload;
    },
    updateProduct: (state, action) => {
      const updatedProduct = action.payload;
      const index = state.items.findIndex(
        (product) => product.id === updatedProduct.id
      );
      if (index !== -1) {
        state.items[index] = { ...state.items[index], ...updatedProduct };
      }
    },
    updateProductStock: (state, action) => {
      const { id, stock } = action.payload;
      const product = state.items.find((item) => item.id === id);
      if (product) product.stock = stock;
    },
  },
});

export const {
  addProduct,
  removeProduct,
  replaceProducts,
  updateProduct,
  updateProductStock,
} = productSlice.actions;
export default productSlice.reducer;
