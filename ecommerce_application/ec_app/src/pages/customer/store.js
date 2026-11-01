import { useEffect, useState } from 'react'

export const FREE_SHIPPING_THRESHOLD = 4999
export const STANDARD_SHIPPING = 99
export const EXPRESS_SHIPPING = 199

export const seedProducts = [
  { id: 'p-1', name: 'Everyday Ceramic Mug', category: 'Home', brand: 'Goodthings', price: 1299, oldPrice: 1699, rating: 4.8, reviews: 128, stock: 42, featured: true, bestSeller: true, badge: 'Bestseller', color: 'sand', description: 'A small daily ritual, made special. Hand-finished stoneware with a soft matte glaze and a comfortable, generous handle.' },
  { id: 'p-2', name: 'Linen Weekend Tote', category: 'Accessories', brand: 'Morrow', price: 2499, oldPrice: null, rating: 4.9, reviews: 86, stock: 18, featured: true, bestSeller: true, badge: 'New arrival', color: 'blue', description: 'Your go-everywhere carryall, in sturdy natural linen with reinforced handles and a roomy inside pocket.' },
  { id: 'p-3', name: 'Sculpted Glass Vase', category: 'Home', brand: 'Goodthings', price: 2799, oldPrice: 3499, rating: 4.7, reviews: 94, stock: 9, featured: true, bestSeller: false, badge: 'Low stock', color: 'peach', description: 'A sculptural silhouette that looks beautiful with a single stem or simply catching the afternoon light.' },
  { id: 'p-4', name: 'Soft Knit Throw', category: 'Home', brand: 'Morrow', price: 4299, oldPrice: null, rating: 4.9, reviews: 72, stock: 26, featured: true, bestSeller: true, badge: '', color: 'cream', description: 'Woven from a cloud-soft recycled cotton blend. The extra-wide weave makes slow mornings even better.' },
  { id: 'p-5', name: 'Ribbed Glass Tumbler Set', category: 'Home', brand: 'Goodthings', price: 1899, oldPrice: 2299, rating: 4.6, reviews: 61, stock: 34, featured: false, bestSeller: false, badge: 'Sale', color: 'green', description: 'A set of four beautifully ribbed tumblers. Lightweight, durable, and just right for everyday entertaining.' },
  { id: 'p-6', name: 'Daily Ritual Candle', category: 'Beauty', brand: 'Morrow', price: 1599, oldPrice: null, rating: 4.8, reviews: 143, stock: 51, featured: false, bestSeller: true, badge: '', color: 'pink', description: 'A clean-burning soy wax candle with notes of cedar, bergamot, and a little bit of quiet.' },
  { id: 'p-7', name: 'Leather Card Holder', category: 'Accessories', brand: 'Morrow', price: 2199, oldPrice: null, rating: 4.7, reviews: 55, stock: 6, featured: false, bestSeller: false, badge: 'Low stock', color: 'tan', description: 'A slim, responsibly sourced leather wallet that keeps the essentials close and the bulk out of your pocket.' },
  { id: 'p-8', name: 'Pour-over Coffee Set', category: 'Home', brand: 'Goodthings', price: 3499, oldPrice: null, rating: 4.9, reviews: 108, stock: 14, featured: false, bestSeller: true, badge: 'Staff pick', color: 'lavender', description: 'A thoughtful little set for better mornings: ceramic dripper, reusable filter, and a matching server.' },
  { id: 'p-9', name: 'Studio Wireless Headphones', category: 'Electronics', brand: 'Northstar', price: 7999, oldPrice: 9999, rating: 4.7, reviews: 92, stock: 12, featured: true, bestSeller: true, badge: 'Save 20%', color: 'lavender', description: 'Rich, balanced sound and a comfortable fit for long listening sessions, with a battery that keeps up.' },
  { id: 'p-10', name: 'Everyday Running Shoes', category: 'Footwear', brand: 'Stride', price: 5499, oldPrice: null, rating: 4.5, reviews: 76, stock: 21, featured: true, bestSeller: true, badge: 'Bestseller', color: 'cream', description: 'Lightweight everyday trainers with cushioned support, a breathable upper, and a versatile low-profile shape.' },
  { id: 'p-11', name: 'Botanical Face Serum', category: 'Beauty', brand: 'Kindred', price: 1999, oldPrice: 2499, rating: 4.6, reviews: 118, stock: 27, featured: true, bestSeller: false, badge: 'Sale', color: 'green', description: 'A lightweight daily serum with a gentle botanical blend to leave skin feeling calm and comfortably hydrated.' },
  { id: 'p-12', name: 'Relaxed Cotton Shirt', category: 'Fashion', brand: 'Morrow', price: 2899, oldPrice: null, rating: 4.4, reviews: 47, stock: 15, featured: false, bestSeller: false, badge: 'New arrival', color: 'blue', description: 'An easy, breathable cotton shirt with a relaxed fit that works just as well tucked in as worn loose.' },
  { id: 'p-13', name: 'Compact Bluetooth Speaker', category: 'Electronics', brand: 'Northstar', price: 3999, oldPrice: 4799, rating: 4.3, reviews: 63, stock: 0, featured: false, bestSeller: false, badge: 'Sale', color: 'tan', description: 'A portable speaker with clear, room-filling sound, simple controls, and an all-day rechargeable battery.' },
  { id: 'p-14', name: 'Everyday Leather Slides', category: 'Footwear', brand: 'Stride', price: 3299, oldPrice: null, rating: 4.2, reviews: 38, stock: 8, featured: false, bestSeller: false, badge: '', color: 'tan', description: 'Easy slip-on sandals made with a soft leather upper and a flexible sole for everyday errands and escapes.' },
  { id: 'p-15', name: 'Canvas Everyday Backpack', category: 'Accessories', brand: 'Morrow', price: 3799, oldPrice: null, rating: 4.6, reviews: 81, stock: 19, featured: false, bestSeller: true, badge: 'Staff pick', color: 'sand', description: 'A thoughtfully organized canvas backpack with padded straps, a laptop sleeve, and room for daily essentials.' },
  { id: 'p-16', name: 'Soft Touch Hand Cream', category: 'Beauty', brand: 'Kindred', price: 899, oldPrice: 1199, rating: 4.1, reviews: 29, stock: 32, featured: false, bestSeller: false, badge: 'Sale', color: 'pink', description: 'A quick-absorbing hand cream with a soft botanical scent, made for pockets, desks, and bedside tables.' },
]

export const seedCategories = [
  { id: 'c-1', name: 'Electronics', icon: '⌁' },
  { id: 'c-2', name: 'Fashion', icon: '◇' },
  { id: 'c-3', name: 'Footwear', icon: '◒' },
  { id: 'c-4', name: 'Beauty', icon: '✿' },
  { id: 'c-5', name: 'Home', icon: '⌂' },
  { id: 'c-6', name: 'Accessories', icon: '✳' },
]
const defaults = {
  users: [],
  currentUser: null,
  products: seedProducts,
  categories: seedCategories,
  cart: [],
  wishlist: [],
  orders: [],
  checkoutDraft: {},
}

export function initializeStore() {
  Object.entries(defaults).forEach(([key, value]) => {
    if (localStorage.getItem(key) === null) {
      localStorage.setItem(key, JSON.stringify(value))
    }
  })
  if (localStorage.getItem('catalogVersion') !== '"4"') {
    const legacyCategories = { 'Home & Living': 'Home', Kitchen: 'Home', Wellness: 'Beauty' }
    const products = getStore('products') ?? []
    const categories = getStore('categories') ?? []
    localStorage.setItem('products', JSON.stringify(products.map((product) => ({
      ...product,
      category: legacyCategories[product.category] ?? product.category,
      brand: product.brand ?? 'Independent',
      featured: product.featured ?? false,
      bestSeller: product.bestSeller ?? false,
    }))))
    localStorage.setItem('categories', JSON.stringify(categories.map((category) => ({
      ...category,
      name: legacyCategories[category.name] ?? category.name,
    }))))
    localStorage.setItem('catalogVersion', '"4"')
  }
}

export function getStore(key) {
  const value = localStorage.getItem(key)
  if (value === null) return defaults[key]
  try {
    return JSON.parse(value)
  } catch (error) {
    console.error(`Could not read "${key}" from localStorage.`, error)
    return defaults[key]
  }
}

export function setStore(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
  window.dispatchEvent(new CustomEvent('store-update', { detail: { key } }))
}

export function updateStore(key, updater) {
  setStore(key, updater(getStore(key)))
}

export function useStore(key) {
  const [value, setValue] = useState(() => getStore(key))

  useEffect(() => {
    const refresh = (event) => {
      if (!event.detail || event.detail.key === key) setValue(getStore(key))
    }
    const refreshStorage = (event) => {
      if (event.key === key || event.key === null) setValue(getStore(key))
    }
    window.addEventListener('store-update', refresh)
    window.addEventListener('storage', refreshStorage)
    return () => {
      window.removeEventListener('store-update', refresh)
      window.removeEventListener('storage', refreshStorage)
    }
  }, [key])

  return value
}

export function money(value) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value)
}

export function makeId(prefix = 'id') {
  return `${prefix}-${globalThis.crypto?.randomUUID?.() ?? Date.now().toString(36)}`
}
