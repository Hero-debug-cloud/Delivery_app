"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Store as StoreIcon,
  Trash2,
  Edit,
  ToggleLeft,
  ToggleRight,
  Leaf,
  Star,
  CheckCircle,
  XCircle,
  Loader2,
  Package,
  Layers,
} from "lucide-react";
import { useProducts, useCategories, useInfiniteStores, useInfiniteCategories } from "@/features/products/hooks/useProducts";
import { CategoryModal } from "@/features/products/components/CategoryModal";
import { ProductModal } from "@/features/products/components/ProductModal";
import { PaginationFooter } from "@/components/shared/PaginationFooter";
import { InfiniteSelect } from "@/components/shared/InfiniteSelect";
import type { Product, Category } from "@/features/products/types";

export default function ProductsPage() {
  const [activeTab, setActiveTab] = useState<"products" | "categories">("products");

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedStore, setSelectedStore] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [vegFilter, setVegFilter] = useState<"all" | "veg" | "non-veg">("all");
  const [stockFilter, setStockFilter] = useState<"all" | "instock" | "outstock">("all");

  // Debounce search query input to avoid duplicate API requests on every keypress
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchQuery(searchInput);
      setProductPage(1);
      setCategoryPage(1);
    }, 400); // 400ms delay

    return () => {
      clearTimeout(handler);
    };
  }, [searchInput]);

  // Pagination States
  const [productPage, setProductPage] = useState(1);
  const [categoryPage, setCategoryPage] = useState(1);
  const productsPerPage = 8;
  const categoriesPerPage = 6;

  // Modal States
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Hook Calls
  const {
    categories,
    pagination: categoriesPagination,
    isLoading: isLoadingCats,
    createCategory,
    updateCategory,
    deleteCategory,
    isCreating: isSavingCat,
    isUpdating: isUpdatingCat,
  } = useCategories({
    page: categoryPage,
    limit: categoriesPerPage,
    search: searchQuery || undefined,
  });

  const {
    items: infiniteStores,
    isLoading: isLoadingInfiniteStores,
    fetchNextPage: fetchNextStores,
    hasNextPage: hasNextStores,
    isFetchingNextPage: isFetchingNextStores,
  } = useInfiniteStores();

  const {
    items: infiniteCategories,
    isLoading: isLoadingInfiniteCategories,
    fetchNextPage: fetchNextCategories,
    hasNextPage: hasNextCategories,
    isFetchingNextPage: isFetchingNextCategories,
  } = useInfiniteCategories();
  
  // Build product filters object
  const productFilters = {
    storeId: selectedStore || undefined,
    categoryId: selectedCategory || undefined,
    search: searchQuery || undefined,
    inStock: stockFilter === "all" ? undefined : stockFilter === "instock",
    isVeg: vegFilter === "all" ? undefined : vegFilter === "veg",
    page: productPage,
    limit: productsPerPage,
  };

  const {
    products,
    pagination: productsPagination,
    isLoading: isLoadingProds,
    createProduct,
    updateProduct,
    deleteProduct,
    isCreating: isSavingProd,
    isUpdating: isUpdatingProd,
  } = useProducts(productFilters);

  // Lists are now backend-paginated and filtered directly
  const paginatedProducts = products;
  const paginatedCategories = categories;

  // Filter Reset Handlers
  const handleSearchChange = (val: string) => {
    setSearchInput(val);
  };

  const handleStoreChange = (val: string) => {
    setSelectedStore(val);
    setProductPage(1);
  };

  const handleCategoryChange = (val: string) => {
    setSelectedCategory(val);
    setProductPage(1);
  };

  const handleStockFilterChange = (val: "all" | "instock" | "outstock") => {
    setStockFilter(val);
    setProductPage(1);
  };

  const handleVegFilterChange = (val: "all" | "veg" | "non-veg") => {
    setVegFilter(val);
    setProductPage(1);
  };

  // Action Handlers
  const handleSaveCategory = async (values: any) => {
    if (editingCategory) {
      await updateCategory({ id: editingCategory.id, data: values });
    } else {
      await createCategory(values);
    }
  };

  const handleSaveProduct = async (values: any) => {
    if (editingProduct) {
      await updateProduct({ id: editingProduct.id, data: values });
    } else {
      await createProduct(values);
    }
  };

  const handleDeleteCategory = async (category: Category) => {
    if (category.productCount && category.productCount > 0) {
      alert(`Cannot delete "${category.name}" as it contains ${category.productCount} products. Move or delete products first.`);
      return;
    }
    if (confirm(`Are you sure you want to delete the category "${category.name}"?`)) {
      try {
        await deleteCategory(category.id);
      } catch (err: any) {
        alert(err.message || "Failed to delete category");
      }
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    if (confirm(`Are you sure you want to delete the product "${product.name}"?`)) {
      try {
        await deleteProduct(product.id);
      } catch (err: any) {
        alert(err.message || "Failed to delete product");
      }
    }
  };

  const toggleProductStock = async (product: Product) => {
    await updateProduct({
      id: product.id,
      data: { inStock: !product.inStock },
    });
  };

  const toggleProductFeatured = async (product: Product) => {
    await updateProduct({
      id: product.id,
      data: { isFeatured: !product.isFeatured },
    });
  };

  const toggleCategoryStatus = async (cat: Category) => {
    await updateCategory({
      id: cat.id,
      data: { isActive: !cat.isActive },
    });
  };

  const openEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setIsCategoryModalOpen(true);
  };

  const openEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setIsProductModalOpen(true);
  };

  const openAddCategory = () => {
    setEditingCategory(null);
    setIsCategoryModalOpen(true);
  };

  const openAddProduct = () => {
    setEditingProduct(null);
    setIsProductModalOpen(true);
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Title + Action */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-heading-32-bold text-neutral-900 tracking-tight">Catalog Management</h1>
          <p className="text-caption-14-regular text-neutral-500 mt-1">
            Configure items, categories, and inventory configurations just like Zepto and Blinkit.
          </p>
        </div>

        {activeTab === "products" ? (
          <button
            onClick={openAddProduct}
            className="bg-primary-600 hover:bg-primary-700 text-white font-semibold text-[14px] px-4 py-2.5 rounded-md flex items-center gap-2 shadow-button-primary transition-all cursor-pointer"
          >
            <Plus size={16} />
            <span>Add Product</span>
          </button>
        ) : (
          <button
            onClick={openAddCategory}
            className="bg-primary-600 hover:bg-primary-700 text-white font-semibold text-[14px] px-4 py-2.5 rounded-md flex items-center gap-2 shadow-button-primary transition-all cursor-pointer"
          >
            <Plus size={16} />
            <span>Add Category</span>
          </button>
        )}
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-neutral-200 gap-6">
        <button
          onClick={() => setActiveTab("products")}
          className={`pb-3 text-[14px] font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === "products"
              ? "border-primary-600 text-primary-600"
              : "border-transparent text-neutral-500 hover:text-neutral-800"
          }`}
        >
          <Package size={18} />
          <span>Products</span>
        </button>
        <button
          onClick={() => setActiveTab("categories")}
          className={`pb-3 text-[14px] font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === "categories"
              ? "border-primary-600 text-primary-600"
              : "border-transparent text-neutral-500 hover:text-neutral-800"
          }`}
        >
          <Layers size={18} />
          <span>Categories</span>
        </button>
      </div>

      {/* --- PRODUCTS TAB VIEW --- */}
      {activeTab === "products" && (
        <div className="flex flex-col gap-6">
          {/* Filters Bar */}
          <div className="bg-white border border-neutral-200 rounded-md p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 flex-1">
              {/* Search */}
              <div className="relative col-span-1 md:col-span-2">
                <Search className="absolute left-3 top-2.5 text-neutral-400" size={16} />
                <input
                  type="text"
                  placeholder="Search product name..."
                  value={searchInput}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-md text-[13px] focus:outline-none focus:border-primary-600 transition-all bg-white"
                />
              </div>

              {/* Store Filter (Infinite Scroll) */}
              <InfiniteSelect
                value={selectedStore}
                onChange={handleStoreChange}
                placeholder="All Stores"
                items={[{ id: "", name: "All Stores" }, ...infiniteStores]}
                fetchNextPage={fetchNextStores}
                hasNextPage={hasNextStores}
                isFetchingNextPage={isFetchingNextStores}
                isLoading={isLoadingInfiniteStores}
              />

              {/* Category Filter (Infinite Scroll) */}
              <InfiniteSelect
                value={selectedCategory}
                onChange={handleCategoryChange}
                placeholder="All Categories"
                items={[{ id: "", name: "All Categories" }, ...infiniteCategories]}
                fetchNextPage={fetchNextCategories}
                hasNextPage={hasNextCategories}
                isFetchingNextPage={isFetchingNextCategories}
                isLoading={isLoadingInfiniteCategories}
              />

              {/* Stock Filter */}
              <select
                value={stockFilter}
                onChange={(e) => handleStockFilterChange(e.target.value as any)}
                className="px-3 py-2 border border-neutral-200 rounded-md text-[13px] bg-white focus:outline-none focus:border-primary-600"
              >
                <option value="all">All Stocks</option>
                <option value="instock">In Stock Only</option>
                <option value="outstock">Out of Stock</option>
              </select>
            </div>

            {/* Veg / Non-Veg Toggle Group */}
            <div className="flex bg-neutral-100 p-0.5 rounded-md border border-neutral-200 self-start md:self-auto">
              <button
                onClick={() => handleVegFilterChange("all")}
                className={`px-3 py-1.5 rounded-md text-[12px] font-semibold transition-all cursor-pointer ${
                  vegFilter === "all" ? "bg-white text-neutral-800 shadow-sm" : "text-neutral-500 hover:text-neutral-800"
                }`}
              >
                All
              </button>
              <button
                onClick={() => handleVegFilterChange("veg")}
                className={`px-3 py-1.5 rounded-md text-[12px] font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                  vegFilter === "veg" ? "bg-white text-emerald-700 shadow-sm" : "text-neutral-500 hover:text-emerald-700"
                }`}
              >
                <Leaf size={12} className={vegFilter === "veg" ? "text-emerald-600" : "text-neutral-400"} />
                <span>Veg</span>
              </button>
              <button
                onClick={() => handleVegFilterChange("non-veg")}
                className={`px-3 py-1.5 rounded-md text-[12px] font-semibold transition-all cursor-pointer ${
                  vegFilter === "non-veg" ? "bg-white text-red-700 shadow-sm" : "text-neutral-500 hover:text-red-700"
                }`}
              >
                Non-Veg
              </button>
            </div>
          </div>

          {/* Products Grid / Table */}
          <div className="bg-white border border-neutral-200 rounded-md shadow-card overflow-hidden">
            <div className="p-4 border-b border-neutral-200 flex justify-between items-center bg-neutral-50">
              <span className="text-[12px] font-medium text-neutral-500">
                Showing {paginatedProducts.length} of {productsPagination?.totalItems ?? 0} products
              </span>
            </div>

            {isLoadingProds ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="animate-spin text-primary-600" size={32} />
                <span className="text-[14px] text-neutral-500 font-medium">Fetching catalog details...</span>
              </div>
            ) : paginatedProducts.length === 0 ? (
              <div className="text-center py-20 flex flex-col items-center justify-center p-6">
                <div className="w-12 h-12 rounded-full bg-neutral-100 text-neutral-400 flex items-center justify-center mb-4">
                  <Package size={24} />
                </div>
                <h3 className="text-[15px] font-bold text-neutral-800">No products found</h3>
                <p className="text-[13px] text-neutral-500 max-w-sm mt-1">
                  Adjust filters or create a new product to list it in this store.
                </p>
              </div>
            ) : (
              <>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-200 text-neutral-600 text-[12px] font-semibold bg-neutral-50/50 select-none">
                      <th className="p-4 pl-6">Product Details</th>
                      <th className="p-4">Store Hub</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Price</th>
                      <th className="p-4">Size</th>
                      <th className="p-4 text-center">Featured</th>
                      <th className="p-4 text-center">Status</th>
                      <th className="p-4 text-right pr-6">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 text-[13px]">
                    {paginatedProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-neutral-50/50 transition-all">
                        {/* Name + Image */}
                        <td className="p-4 pl-6">
                          <div className="flex items-center gap-3.5">
                            {product.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={product.imageUrl}
                                alt={product.name}
                                className="w-10 h-10 rounded object-cover border border-neutral-200 bg-neutral-50"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded bg-neutral-100 flex items-center justify-center text-neutral-400 border border-neutral-200">
                                <Package size={18} />
                              </div>
                            )}
                            <div className="flex flex-col">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-neutral-800 leading-tight">
                                  {product.name}
                                </span>
                                {product.isVeg ? (
                                  <span className="w-4 h-4 border border-emerald-500 flex items-center justify-center p-0.5" title="Veg">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  </span>
                                ) : (
                                  <span className="w-4 h-4 border border-red-500 flex items-center justify-center p-0.5" title="Non-Veg">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-neutral-400 mt-0.5 font-mono">
                                {product.id}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Store */}
                        <td className="p-4 text-neutral-700">
                          <div className="flex items-center gap-1.5 text-[12px]">
                            <StoreIcon size={14} className="text-neutral-400" />
                            <span className="truncate max-w-[130px] font-medium">
                              {product.storeName || "Unassigned"}
                            </span>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-neutral-100 border border-neutral-200 text-neutral-600">
                            {product.categoryName || "Uncategorized"}
                          </span>
                        </td>

                        {/* Price */}
                        <td className="p-4 font-bold text-neutral-900">
                          ₹{(product.price / 100).toFixed(2)}
                        </td>

                        {/* Unit Size */}
                        <td className="p-4 text-neutral-500 font-medium">{product.unitSize}</td>

                        {/* Featured */}
                        <td className="p-4 text-center">
                          <button
                            onClick={() => toggleProductFeatured(product)}
                            className="mx-auto block p-1.5 rounded hover:bg-neutral-100 transition-all cursor-pointer"
                          >
                            <Star
                              size={16}
                              className={
                                product.isFeatured
                                  ? "text-amber-500 fill-amber-500 animate-pulse"
                                  : "text-neutral-300 hover:text-neutral-400"
                              }
                            />
                          </button>
                        </td>

                        {/* Stock Switch */}
                        <td className="p-4 text-center">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                              product.inStock
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-red-50 text-red-700 border-red-200"
                            }`}
                          >
                            {product.inStock ? "In Stock" : "Out of Stock"}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="p-4 text-right pr-6">
                          <div className="flex justify-end items-center gap-1.5">
                            {/* Stock Switch Button */}
                            <button
                              onClick={() => toggleProductStock(product)}
                              className="text-neutral-600 hover:text-neutral-900 transition-all p-1 hover:bg-neutral-100 rounded"
                              title={product.inStock ? "Mark Out of Stock" : "Mark In Stock"}
                            >
                              {product.inStock ? (
                                <ToggleRight size={24} className="text-primary-600" />
                              ) : (
                                <ToggleLeft size={24} />
                              )}
                            </button>

                            <button
                              onClick={() => openEditProduct(product)}
                              className="text-primary-600 hover:text-primary-700 hover:bg-primary-50 p-1.5 rounded transition-all cursor-pointer"
                              title="Edit Product"
                            >
                              <Edit size={15} />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded transition-all cursor-pointer"
                              title="Delete Product"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {/* Reusable Pagination Footer */}
                <PaginationFooter
                  currentPage={productPage}
                  limit={productsPerPage}
                  totalItems={productsPagination?.totalItems ?? 0}
                  totalPages={productsPagination?.totalPages ?? 1}
                  hasNext={productsPagination?.hasNext ?? false}
                  hasPrevious={productsPagination?.hasPrevious ?? false}
                  onPageChange={setProductPage}
                  isLoading={isLoadingProds}
                />
              </>
            )}
          </div>
        </div>
      )}

      {/* --- CATEGORIES TAB VIEW --- */}
      {activeTab === "categories" && (
        <div className="flex flex-col gap-6">
          {/* Category Filters */}
          <div className="bg-white border border-neutral-200 rounded-md p-4 flex justify-between items-center shadow-sm">
            <div className="relative w-80">
              <Search className="absolute left-3 top-2.5 text-neutral-400" size={16} />
              <input
                type="text"
                placeholder="Search category name..."
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-md text-[13px] focus:outline-none focus:border-primary-600 transition-all bg-white"
              />
            </div>
            <span className="text-[12px] font-medium text-neutral-500">
              {categories.length} categories configured
            </span>
          </div>

          {isLoadingCats ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="animate-spin text-primary-600" size={32} />
              <span className="text-[14px] text-neutral-500 font-medium">Fetching categories...</span>
            </div>
          ) : categories.length === 0 ? (
            <div className="bg-white border border-neutral-200 rounded-md text-center py-20 flex flex-col items-center justify-center p-6">
              <div className="w-12 h-12 rounded-full bg-neutral-100 text-neutral-400 flex items-center justify-center mb-4">
                <Layers size={24} />
              </div>
              <h3 className="text-[15px] font-bold text-neutral-800">No categories found</h3>
              <p className="text-[13px] text-neutral-500 max-w-sm mt-1">
                Create a category to group products together like Zepto and Blinkit.
              </p>
            </div>
          ) : (
            /* Category Cards Grid Container with Pagination */
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {paginatedCategories.map((cat) => (
                  <div
                    key={cat.id}
                    className="bg-white border border-neutral-200 rounded-md p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4"
                  >
                    <div className="flex items-start gap-4">
                      {/* Category Banner Image */}
                      {cat.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={cat.imageUrl}
                          alt={cat.name}
                          className="w-14 h-14 rounded object-cover border border-neutral-200 bg-neutral-50"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded bg-primary-50 text-primary-600 flex items-center justify-center border border-primary-100">
                          <Layers size={22} />
                        </div>
                      )}

                      <div className="flex flex-col overflow-hidden">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-neutral-800 text-[15px] truncate">
                            {cat.name}
                          </h3>
                          {cat.isActive ? (
                            <span title="Active"><CheckCircle size={13} className="text-emerald-500" /></span>
                          ) : (
                            <span title="Inactive"><XCircle size={13} className="text-neutral-300" /></span>
                          )}
                        </div>
                        <p className="text-[12px] text-neutral-500 mt-1 line-clamp-2 leading-relaxed">
                          {cat.description || "No description provided."}
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center border-t border-neutral-100 pt-3.5 mt-1 select-none">
                      <span className="text-[12px] font-semibold text-neutral-500">
                        {cat.productCount ?? 0} Products
                      </span>

                      <div className="flex items-center gap-1.5">
                        {/* Toggle Status Switch */}
                        <button
                          onClick={() => toggleCategoryStatus(cat)}
                          className="text-neutral-600 hover:text-neutral-900 transition-all p-1 hover:bg-neutral-100 rounded cursor-pointer"
                          title={cat.isActive ? "Mark Inactive" : "Mark Active"}
                        >
                          {cat.isActive ? (
                            <ToggleRight size={24} className="text-primary-600" />
                          ) : (
                            <ToggleLeft size={24} />
                          )}
                        </button>

                        <button
                          onClick={() => openEditCategory(cat)}
                          className="text-primary-600 hover:text-primary-700 hover:bg-primary-50 p-1.5 rounded transition-all cursor-pointer"
                          title="Edit Category"
                        >
                          <Edit size={14} />
                        </button>

                        <button
                          onClick={() => handleDeleteCategory(cat)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded transition-all cursor-pointer"
                          title="Delete Category"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Pagination Footer */}
              <div className="bg-white border border-neutral-200 rounded-md overflow-hidden shadow-sm">
                <PaginationFooter
                  currentPage={categoryPage}
                  limit={categoriesPerPage}
                  totalItems={categoriesPagination?.totalItems ?? 0}
                  totalPages={categoriesPagination?.totalPages ?? 1}
                  hasNext={categoriesPagination?.hasNext ?? false}
                  hasPrevious={categoriesPagination?.hasPrevious ?? false}
                  onPageChange={setCategoryPage}
                  isLoading={isLoadingCats}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- FORM MODALS --- */}

      {/* Category Add/Edit Modal */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false);
          setEditingCategory(null);
        }}
        onSave={handleSaveCategory}
        category={editingCategory}
        isSaving={isSavingCat || isUpdatingCat}
      />

      {/* Product Add/Edit Modal */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setEditingProduct(null);
        }}
        onSave={handleSaveProduct}
        product={editingProduct}
        isSaving={isSavingProd || isUpdatingProd}
      />
    </div>
  );
}
