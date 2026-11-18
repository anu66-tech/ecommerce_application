import { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import useDebouncedValue from "../../../shared/hooks/useDebouncedValue.js";
import Icon from "../../../shared/components/Icon.jsx";
import ProductGrid from "../../../shared/components/ProductGrid.jsx";
import { fetchProducts } from "./api/productApi.js";

export function ProductsPage({
  products,
  categories,
  wishlist,
  onWish,
  onAdd,
  onBuyNow,
  initialSearch = "",
  initialCategory = "All",
  initialBrand = "All",
  initialMinPrice = "",
  initialMaxPrice = "",
  initialMinimumRating = "0",
  initialInStockOnly = false,
  initialSort = "featured",
  initialPage = "1",
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(initialSearch);
  const debouncedSearch = useDebouncedValue(search);
  const [category, setCategory] = useState(initialCategory);
  const [brand, setBrand] = useState(initialBrand);
  const [minPrice, setMinPrice] = useState(initialMinPrice);
  const [maxPrice, setMaxPrice] = useState(initialMaxPrice);
  const [minimumRating, setMinimumRating] = useState(initialMinimumRating);
  const [inStockOnly, setInStockOnly] = useState(initialInStockOnly);
  const [sort, setSort] = useState(initialSort);
  const [page, setPage] = useState(() => {
    const parsedPage = Number(initialPage);
    return Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  });

  const urlQ = searchParams.get("q") ?? "";
  const urlCategory = searchParams.get("category") ?? "All";
  const urlBrand = searchParams.get("brand") ?? "All";
  const urlMinPrice = searchParams.get("minPrice") ?? "";
  const urlMaxPrice = searchParams.get("maxPrice") ?? "";
  const urlRating = searchParams.get("rating") ?? "0";
  const urlInStock = searchParams.get("inStock") === "1";
  const urlSort = searchParams.get("sort") ?? "featured";
  const urlPage = Number(searchParams.get("page") ?? 1);

  useEffect(() => {
    if (urlQ !== search && debouncedSearch === search) {
      setSearch(urlQ);
    }
  }, [urlQ]);

  useEffect(() => {
    setCategory(urlCategory);
  }, [urlCategory]);

  useEffect(() => {
    setBrand(urlBrand);
  }, [urlBrand]);

  useEffect(() => {
    setMinPrice(urlMinPrice);
  }, [urlMinPrice]);

  useEffect(() => {
    setMaxPrice(urlMaxPrice);
  }, [urlMaxPrice]);

  useEffect(() => {
    setMinimumRating(urlRating);
  }, [urlRating]);

  useEffect(() => {
    setInStockOnly(urlInStock);
  }, [urlInStock]);

  useEffect(() => {
    setSort(urlSort);
  }, [urlSort]);

  useEffect(() => {
    const parsed = Number.isInteger(urlPage) && urlPage > 0 ? urlPage : 1;
    setPage(parsed);
  }, [urlPage]);
  const pageSize = 8;
  const [catalog, setCatalog] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const brands = useMemo(
    () => [...new Set(products.map((product) => product.brand).filter(Boolean))].sort(),
    [products],
  );
  const productQuery = useMemo(
    () => ({
      page,
      limit: pageSize,
      q: debouncedSearch.trim(),
      category: category === "All" ? "" : category,
      brand: brand === "All" ? "" : brand,
      minPrice,
      maxPrice,
      rating: minimumRating === "0" ? "" : minimumRating,
      inStock: inStockOnly ? "true" : "",
      sort,
      orderBy: sort === 'featured' || sort === 'updatedAt' ? 'updatedAt' : undefined,
    }),
    [
      page,
      pageSize,
      debouncedSearch,
      category,
      brand,
      minPrice,
      maxPrice,
      minimumRating,
      inStockOnly,
      sort,
    ],
  );
  const requestKey = JSON.stringify(productQuery);
  const lastRequestKeyRef = useRef('');

  useEffect(() => {
    if (lastRequestKeyRef.current === requestKey) {
      return;
    }
    lastRequestKeyRef.current = requestKey;

    const controller = new AbortController();
    fetchProducts(productQuery, { signal: controller.signal })
      .then((result) => {
        if (controller.signal.aborted) return;
        setCatalog({ ...result, requestKey });
        setLoadError(null);
        if (result.page !== page) {
          setPage(result.page);
        }
      })
      .catch((error) => {
        if (error.name !== 'AbortError' && !controller.signal.aborted) {
          setLoadError({ requestKey, message: error.message });
        }
      });

    return () => controller.abort();
  }, [requestKey]);

  useEffect(() => {
    const query = debouncedSearch.trim();
    const currentQ = searchParams.get("q") ?? "";
    const currentSort = searchParams.get("sort") ?? "featured";
    const queryChanged = currentQ !== query;
    const sortChanged = currentSort !== sort;

    if (!queryChanged && !sortChanged) return;

    setSearchParams((params) => {
      if (query) params.set("q", query);
      else params.delete("q");
      if (sort === "featured") params.delete("sort");
      else params.set("sort", sort);
      if (queryChanged || sortChanged) params.delete("page");
      return params;
    }, { replace: true });
  }, [debouncedSearch, sort, searchParams, setSearchParams]);
  const hasCurrentCatalog = catalog?.requestKey === requestKey;
  const currentError = loadError?.requestKey === requestKey ? loadError.message : "";
  const loading = !hasCurrentCatalog && !currentError;
  const pageCount = hasCurrentCatalog ? catalog.totalPages : 0;
  const currentPage = hasCurrentCatalog ? catalog.page : page;
  const visibleProducts = hasCurrentCatalog ? catalog.items : [];
  const clearFilters = () => {
    setSearch("");
    setCategory("All");
    setBrand("All");
    setMinPrice("");
    setMaxPrice("");
    setMinimumRating("0");
    setInStockOnly(false);
    setSort("featured");
    setPage(1);
    setSearchParams((params) => {
      ["q", "category", "brand", "minPrice", "maxPrice", "rating", "inStock", "sort", "page"]
        .forEach((key) => params.delete(key));
      return params;
    });
  };
  const changeFilter = (setter) => (value) => {
    setter(value);
    setPage(1);
  };
  const changeFacet = (setter, key) => (value) => {
    changeFilter(setter)(value);
    setSearchParams((params) => {
      if (value === "All") params.delete(key);
      else params.set(key, value);
      params.delete("page");
      return params;
    });
  };
  const changeQueryFilter = (setter, key, isActive) => (value) => {
    changeFilter(setter)(value);
    setSearchParams((params) => {
      if (isActive(value)) params.set(key, String(value));
      else params.delete(key);
      params.delete("page");
      return params;
    });
  };
  const changePriceFilter = (setter, key) =>
    changeQueryFilter(
      setter,
      key,
      (value) => value !== "" && Number.isFinite(Number(value)) && Number(value) >= 0,
    );
  const changeRatingFilter = changeQueryFilter(
    setMinimumRating,
    "rating",
    (value) => value !== "0",
  );
  const changeAvailabilityFilter = changeQueryFilter(
    setInStockOnly,
    "inStock",
    Boolean,
  );
  return (
    <section className="catalog-page">
      <div className="catalog-breadcrumb">
        <a href="/">Home</a>
        <span>›</span>
        <span>Products</span>
      </div>
      <div className="catalog-banner">
        <span className="eyebrow">THE SHOP</span>
        <h1>
          Find your <em>good thing.</em>
        </h1>
        <p>Little upgrades, lovely rituals, and forever favorites.</p>
      </div>
      <div className="catalog-search">
        <Icon name="search" size={19} />
        <input
          value={search}
          onChange={(event) => changeFilter(setSearch)(event.target.value)}
          placeholder="Search products..."
          aria-label="Search products"
        />
        {search && (
          <button
            onClick={() => changeFilter(setSearch)("")}
            aria-label="Clear search"
          >
            <Icon name="close" size={16} />
          </button>
        )}
      </div>
      <div className="catalog-layout">
        <aside className="catalog-sidebar">
          <div className="filter-heading">
            <h2>Filters</h2>
            <button onClick={clearFilters}>Clear all</button>
          </div>
          <label className="filter-group">
            <span>Category</span>
            <select
              value={category}
              onChange={(event) =>
                changeFacet(setCategory, "category")(event.target.value)
              }
            >
              <option value="All">All categories</option>
              {categories.map((item) => (
                <option key={item.id} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className="filter-group">
            <span>Brand</span>
            <select
              value={brand}
              onChange={(event) => changeFacet(setBrand, "brand")(event.target.value)}
            >
              <option value="All">All brands</option>
              {brands.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <fieldset className="filter-group">
            <legend>Price</legend>
            <div className="price-inputs">
              <label>
                <span className="sr-only">Minimum price</span>
                <input
                  type="number"
                  min="0"
                  placeholder="Min ₹"
                  value={minPrice}
                  onChange={(event) =>
                    changePriceFilter(setMinPrice, "minPrice")(event.target.value)
                  }
                />
              </label>
              <span>—</span>
              <label>
                <span className="sr-only">Maximum price</span>
                <input
                  type="number"
                  min="0"
                  placeholder="Max ₹"
                  value={maxPrice}
                  onChange={(event) =>
                    changePriceFilter(setMaxPrice, "maxPrice")(event.target.value)
                  }
                />
              </label>
            </div>
          </fieldset>
          <label className="filter-group">
            <span>Customer rating</span>
            <select
              value={minimumRating}
              onChange={(event) =>
                changeRatingFilter(event.target.value)
              }
            >
              <option value="0">Any rating</option>
              <option value="4">4★ & above</option>
              <option value="4.5">4.5★ & above</option>
            </select>
          </label>
          <label className="availability-filter">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(event) =>
                changeAvailabilityFilter(event.target.checked)
              }
            />
            <span>In stock only</span>
          </label>
        </aside>
        <div className="catalog-results">
          <div className="catalog-results-head">
            <span>{hasCurrentCatalog ? catalog.total : 0} products</span>
            <label>
              Sort by
              <select
                value={sort}
                onChange={(event) => changeFilter(setSort)(event.target.value)}
              >
                <option value="featured">Featured / Recently Updated</option>
                <option value="updatedAt">Recently Updated</option>
                <option value="price-low">Price: low to high</option>
                <option value="price-high">Price: high to low</option>
                <option value="rating">Top rated</option>
              </select>
            </label>
          </div>
          {currentError ? (
            <p role="alert">Could not load products: {currentError}</p>
          ) : loading ? (
            <p role="status">Loading products…</p>
          ) : (
            <ProductGrid
              products={visibleProducts}
              wishlist={wishlist}
              onWish={onWish}
              onAdd={onAdd}
              onBuyNow={onBuyNow}
            />
          )}
          {pageCount > 1 && (
            <nav className="pagination" aria-label="Product pages">
              <button
                disabled={currentPage === 1}
                onClick={() => {
                  setPage(currentPage - 1);
                  setSearchParams((params) => {
                    params.set("page", String(currentPage - 1));
                    return params;
                  });
                }}
              >
                Previous
              </button>
              {Array.from({ length: pageCount }, (_, index) => index + 1).map(
                (number) => (
                  <button
                    key={number}
                    className={currentPage === number ? "active" : ""}
                    aria-current={currentPage === number ? "page" : undefined}
                    onClick={() => {
                      setPage(number);
                      setSearchParams((params) => {
                        params.set("page", String(number));
                        return params;
                      });
                    }}
                  >
                    {number}
                  </button>
                ),
              )}
              <button
                disabled={currentPage === pageCount}
                onClick={() => {
                  setPage(currentPage + 1);
                  setSearchParams((params) => {
                    params.set("page", String(currentPage + 1));
                    return params;
                  });
                }}
              >
                Next
              </button>
            </nav>
          )}
        </div>
      </div>
    </section>
  );
}

export default ProductsPage;