import type { Context } from "hono";
import * as productService from "./service.ts";
import {
  createCategorySchema,
  updateCategorySchema,
  createProductSchema,
  updateProductSchema,
} from "./types.ts";

// Helper to format Zod validation errors
function formatValidationError(parsed: { error: any }) {
  const errors: Record<string, string> = {};
  for (const [key, value] of Object.entries(parsed.error.flatten().fieldErrors)) {
    if (value && Array.isArray(value) && value.length > 0) {
      errors[key] = value[0];
    }
  }
  return {
    success: false,
    message: "Validation Failed",
    errors,
  };
}

// --- Category Controllers ---

export async function getCategories(c: Context) {
  try {
    const pageQuery = c.req.query("page");
    const page = pageQuery ? parseInt(pageQuery) : 1;

    const limitQuery = c.req.query("limit");
    const limit = limitQuery ? parseInt(limitQuery) : 10;

    const search = c.req.query("search");
    const isActiveQuery = c.req.query("isActive");
    const isActive = isActiveQuery !== undefined ? isActiveQuery === "true" : undefined;

    const sortBy = c.req.query("sortBy");
    const sortOrder = c.req.query("sortOrder") as "asc" | "desc" | undefined;

    const { list, totalItems } = await productService.getCategories({
      isActive,
      search,
      page,
      limit,
      sortBy,
      sortOrder,
    });

    const totalPages = Math.ceil(totalItems / limit);

    return c.json({
      success: true,
      message: "Categories fetched successfully",
      data: list,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
    }, 200);
  } catch (err) {
    console.error("[getCategories] controller error:", err);
    return c.json({
      success: false,
      message: "Failed to fetch categories",
      error: { code: "INTERNAL_SERVER_ERROR" },
    }, 500);
  }
}

export async function getCategoryById(c: Context) {
  try {
    const id = c.req.param("id") as string;
    const category = await productService.getCategoryById(id);
    if (!category) {
      return c.json({
        success: false,
        message: "Category not found",
        error: { code: "NOT_FOUND" },
      }, 404);
    }
    return c.json({
      success: true,
      message: "Category fetched successfully",
      data: category,
    }, 200);
  } catch (err) {
    console.error("[getCategoryById] controller error:", err);
    return c.json({
      success: false,
      message: "Failed to fetch category",
      error: { code: "INTERNAL_SERVER_ERROR" },
    }, 500);
  }
}

export async function createCategory(c: Context) {
  try {
    const body = await c.req.json();
    const parsed = createCategorySchema.safeParse(body);
    if (!parsed.success) {
      return c.json(formatValidationError(parsed), 400);
    }
    const category = await productService.createCategory(parsed.data);
    return c.json({
      success: true,
      message: "Category created successfully",
      data: category,
    }, 201);
  } catch (err) {
    console.error("[createCategory] controller error:", err);
    return c.json({
      success: false,
      message: "Failed to create category",
      error: { code: "INTERNAL_SERVER_ERROR" },
    }, 500);
  }
}

export async function updateCategory(c: Context) {
  try {
    const id = c.req.param("id") as string;
    const body = await c.req.json();
    const parsed = updateCategorySchema.safeParse(body);
    if (!parsed.success) {
      return c.json(formatValidationError(parsed), 400);
    }
    const category = await productService.updateCategory(id, parsed.data);
    if (!category) {
      return c.json({
        success: false,
        message: "Category not found",
        error: { code: "NOT_FOUND" },
      }, 404);
    }
    return c.json({
      success: true,
      message: "Category updated successfully",
      data: category,
    }, 200);
  } catch (err) {
    console.error("[updateCategory] controller error:", err);
    return c.json({
      success: false,
      message: "Failed to update category",
      error: { code: "INTERNAL_SERVER_ERROR" },
    }, 500);
  }
}

export async function deleteCategory(c: Context) {
  try {
    const id = c.req.param("id") as string;
    await productService.deleteCategory(id);
    return c.json({
      success: true,
      message: "Category deleted successfully",
      data: null,
    }, 200);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "CATEGORY_HAS_PRODUCTS") {
      return c.json({
        success: false,
        message: "Cannot delete category as it is linked to active products. Delete or re-assign products first.",
        error: { code: "CONFLICT" },
      }, 409);
    }
    console.error("[deleteCategory] controller error:", err);
    return c.json({
      success: false,
      message: "Failed to delete category",
      error: { code: "INTERNAL_SERVER_ERROR" },
    }, 500);
  }
}

// --- Product Controllers ---

export async function getProducts(c: Context) {
  try {
    const pageQuery = c.req.query("page");
    const page = pageQuery ? parseInt(pageQuery) : 1;

    const limitQuery = c.req.query("limit");
    const limit = limitQuery ? parseInt(limitQuery) : 10;

    const storeId = c.req.query("storeId");
    const categoryId = c.req.query("categoryId");
    const search = c.req.query("search");

    const inStockQuery = c.req.query("inStock");
    const inStock = inStockQuery !== undefined ? inStockQuery === "true" : undefined;

    const isFeaturedQuery = c.req.query("isFeatured");
    const isFeatured = isFeaturedQuery !== undefined ? isFeaturedQuery === "true" : undefined;

    const isVegQuery = c.req.query("isVeg");
    const isVeg = isVegQuery !== undefined ? isVegQuery === "true" : undefined;

    const sortBy = c.req.query("sortBy");
    const sortOrder = c.req.query("sortOrder") as "asc" | "desc" | undefined;

    const { list, totalItems } = await productService.getProducts({
      storeId,
      categoryId,
      search,
      inStock,
      isFeatured,
      isVeg,
      page,
      limit,
      sortBy,
      sortOrder,
    });

    const totalPages = Math.ceil(totalItems / limit);

    return c.json({
      success: true,
      message: "Products fetched successfully",
      data: list,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
    }, 200);
  } catch (err) {
    console.error("[getProducts] controller error:", err);
    return c.json({
      success: false,
      message: "Failed to fetch products",
      error: { code: "INTERNAL_SERVER_ERROR" },
    }, 500);
  }
}

export async function getProductById(c: Context) {
  try {
    const id = c.req.param("id") as string;
    const product = await productService.getProductById(id);
    if (!product) {
      return c.json({
        success: false,
        message: "Product not found",
        error: { code: "NOT_FOUND" },
      }, 404);
    }
    return c.json({
      success: true,
      message: "Product fetched successfully",
      data: product,
    }, 200);
  } catch (err) {
    console.error("[getProductById] controller error:", err);
    return c.json({
      success: false,
      message: "Failed to fetch product",
      error: { code: "INTERNAL_SERVER_ERROR" },
    }, 500);
  }
}

export async function createProduct(c: Context) {
  try {
    const body = await c.req.json();
    const parsed = createProductSchema.safeParse(body);
    if (!parsed.success) {
      return c.json(formatValidationError(parsed), 400);
    }
    const product = await productService.createProduct(parsed.data);
    return c.json({
      success: true,
      message: "Product created successfully",
      data: product,
    }, 201);
  } catch (err) {
    console.error("[createProduct] controller error:", err);
    return c.json({
      success: false,
      message: "Failed to create product",
      error: { code: "INTERNAL_SERVER_ERROR" },
    }, 500);
  }
}

export async function updateProduct(c: Context) {
  try {
    const id = c.req.param("id") as string;
    const body = await c.req.json();
    const parsed = updateProductSchema.safeParse(body);
    if (!parsed.success) {
      return c.json(formatValidationError(parsed), 400);
    }
    const product = await productService.updateProduct(id, parsed.data);
    if (!product) {
      return c.json({
        success: false,
        message: "Product not found",
        error: { code: "NOT_FOUND" },
      }, 404);
    }
    return c.json({
      success: true,
      message: "Product updated successfully",
      data: product,
    }, 200);
  } catch (err) {
    console.error("[updateProduct] controller error:", err);
    return c.json({
      success: false,
      message: "Failed to update product",
      error: { code: "INTERNAL_SERVER_ERROR" },
    }, 500);
  }
}

export async function deleteProduct(c: Context) {
  try {
    const id = c.req.param("id") as string;
    await productService.deleteProduct(id);
    return c.json({
      success: true,
      message: "Product deleted successfully",
      data: null,
    }, 200);
  } catch (err) {
    console.error("[deleteProduct] controller error:", err);
    return c.json({
      success: false,
      message: "Failed to delete product",
      error: { code: "INTERNAL_SERVER_ERROR" },
    }, 500);
  }
}
