import { db } from "../../db/index.ts";
import { productCategories, products, stores } from "../../db/schema.ts";
import { eq, and, ilike, sql } from "drizzle-orm";
import { getPresignedUrl, extractS3Key } from "../upload/s3.ts";
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
  CreateProductInput,
  UpdateProductInput,
  GetProductsFilters,
  GetCategoriesFilters,
} from "./types.ts";

// --- Categories Service ---

export async function getCategories(filters?: GetCategoriesFilters) {
  const countConditions = [];
  if (filters?.isActive !== undefined) {
    countConditions.push(eq(productCategories.isActive, filters.isActive));
  }
  if (filters?.search) {
    countConditions.push(ilike(productCategories.name, `%${filters.search}%`));
  }

  // Count total matching categories
  const countQuery = db
    .select({ count: sql<number>`count(*)::int` })
    .from(productCategories);

  if (countConditions.length > 0) {
    countQuery.where(and(...countConditions));
  }
  const countResult = await countQuery;
  const totalItems = countResult[0]?.count ?? 0;

  // Build paginated selection query
  const query = db
    .select({
      id: productCategories.id,
      name: productCategories.name,
      description: productCategories.description,
      imageUrl: productCategories.imageUrl,
      isActive: productCategories.isActive,
      productCount: sql<number>`count(${products.id})::int`,
      createdAt: productCategories.createdAt,
      updatedAt: productCategories.updatedAt,
    })
    .from(productCategories)
    .leftJoin(products, eq(productCategories.id, products.categoryId))
    .groupBy(productCategories.id);

  if (countConditions.length > 0) {
    query.where(and(...countConditions));
  }

  // Sorting
  const order = filters?.sortBy === "createdAt"
    ? (filters.sortOrder === "desc" ? sql`${productCategories.createdAt} DESC` : sql`${productCategories.createdAt} ASC`)
    : (filters?.sortOrder === "desc" ? sql`${productCategories.name} DESC` : sql`${productCategories.name} ASC`);
  query.orderBy(order);

  // Pagination
  if (filters?.limit) {
    const page = filters.page ?? 1;
    const offset = (page - 1) * filters.limit;
    query.limit(filters.limit).offset(offset);
  }

  const list = await query;

  const signedList = await Promise.all(
    list.map(async (c) => ({
      ...c,
      imageUrl: await getPresignedUrl(c.imageUrl),
    }))
  );

  return { list: signedList, totalItems };
}

export async function getCategoryById(id: string) {
  const [category] = await db
    .select()
    .from(productCategories)
    .where(eq(productCategories.id, id))
    .limit(1);

  if (!category) return null;

  return {
    ...category,
    imageUrl: await getPresignedUrl(category.imageUrl),
  };
}

export async function createCategory(input: CreateCategoryInput) {
  const [category] = await db
    .insert(productCategories)
    .values({
      name: input.name,
      description: input.description ?? null,
      imageUrl: input.imageUrl ? extractS3Key(input.imageUrl) : null,
      isActive: input.isActive ?? true,
    })
    .returning();

  return {
    ...category,
    imageUrl: await getPresignedUrl(category.imageUrl),
  };
}

export async function updateCategory(id: string, input: UpdateCategoryInput) {
  const [category] = await db
    .update(productCategories)
    .set({
      ...input,
      imageUrl: input.imageUrl !== undefined ? extractS3Key(input.imageUrl) : undefined,
      updatedAt: new Date(),
    })
    .where(eq(productCategories.id, id))
    .returning();

  if (!category) return null;

  return {
    ...category,
    imageUrl: await getPresignedUrl(category.imageUrl),
  };
}

export async function deleteCategory(id: string) {
  const [linkedProduct] = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.categoryId, id))
    .limit(1);

  if (linkedProduct) {
    throw new Error("CATEGORY_HAS_PRODUCTS");
  }

  await db.delete(productCategories).where(eq(productCategories.id, id));
}

// --- Products Service ---

export async function getProducts(filters: GetProductsFilters) {
  const conditions = [];

  if (filters.storeId) {
    conditions.push(eq(products.storeId, filters.storeId));
  }
  if (filters.categoryId) {
    conditions.push(eq(products.categoryId, filters.categoryId));
  }
  if (filters.inStock !== undefined) {
    conditions.push(eq(products.inStock, filters.inStock));
  }
  if (filters.isFeatured !== undefined) {
    conditions.push(eq(products.isFeatured, filters.isFeatured));
  }
  if (filters.isVeg !== undefined) {
    conditions.push(eq(products.isVeg, filters.isVeg));
  }
  if (filters.search) {
    conditions.push(ilike(products.name, `%${filters.search}%`));
  }

  // Count total matching products
  const countQuery = db
    .select({ count: sql<number>`count(*)::int` })
    .from(products);

  if (conditions.length > 0) {
    countQuery.where(and(...conditions));
  }
  const countResult = await countQuery;
  const totalItems = countResult[0]?.count ?? 0;

  // Build paginated query
  const query = db
    .select({
      id: products.id,
      storeId: products.storeId,
      storeName: stores.name,
      name: products.name,
      description: products.description,
      price: products.price,
      unitSize: products.unitSize,
      category: products.category,
      categoryId: products.categoryId,
      categoryName: productCategories.name,
      imageUrl: products.imageUrl,
      images: products.images,
      brand: products.brand,
      shelfLife: products.shelfLife,
      origin: products.origin,
      ingredients: products.ingredients,
      isFeatured: products.isFeatured,
      isVeg: products.isVeg,
      inStock: products.inStock,
      createdAt: products.createdAt,
      updatedAt: products.updatedAt,
    })
    .from(products)
    .innerJoin(stores, eq(products.storeId, stores.id))
    .leftJoin(productCategories, eq(products.categoryId, productCategories.id));

  if (conditions.length > 0) {
    query.where(and(...conditions));
  }

  // Sorting
  let order;
  if (filters.sortBy === "price") {
    order = filters.sortOrder === "desc" ? sql`${products.price} DESC` : sql`${products.price} ASC`;
  } else if (filters.sortBy === "createdAt") {
    order = filters.sortOrder === "desc" ? sql`${products.createdAt} DESC` : sql`${products.createdAt} ASC`;
  } else {
    order = filters.sortOrder === "desc" ? sql`${products.name} DESC` : sql`${products.name} ASC`;
  }
  query.orderBy(order);

  // Pagination
  if (filters.limit) {
    const page = filters.page ?? 1;
    const offset = (page - 1) * filters.limit;
    query.limit(filters.limit).offset(offset);
  }

  const list = await query;

  const signedList = await Promise.all(
    list.map(async (p) => {
      const imageUrl = await getPresignedUrl(p.imageUrl);
      const images = p.images && Array.isArray(p.images) && p.images.length > 0
        ? await Promise.all(p.images.map(img => getPresignedUrl(img)))
        : (imageUrl ? [imageUrl] : []);
      return {
        ...p,
        imageUrl,
        images: images.filter((img): img is string => img !== null),
      };
    })
  );

  return { list: signedList, totalItems };
}

export async function getProductById(id: string) {
  const [product] = await db
    .select({
      id: products.id,
      storeId: products.storeId,
      storeName: stores.name,
      name: products.name,
      description: products.description,
      price: products.price,
      unitSize: products.unitSize,
      category: products.category,
      categoryId: products.categoryId,
      categoryName: productCategories.name,
      imageUrl: products.imageUrl,
      images: products.images,
      brand: products.brand,
      shelfLife: products.shelfLife,
      origin: products.origin,
      ingredients: products.ingredients,
      isFeatured: products.isFeatured,
      isVeg: products.isVeg,
      inStock: products.inStock,
      createdAt: products.createdAt,
      updatedAt: products.updatedAt,
    })
    .from(products)
    .innerJoin(stores, eq(products.storeId, stores.id))
    .leftJoin(productCategories, eq(products.categoryId, productCategories.id))
    .where(eq(products.id, id))
    .limit(1);

  if (!product) return null;

  const imageUrl = await getPresignedUrl(product.imageUrl);
  const images = product.images && Array.isArray(product.images) && product.images.length > 0
    ? await Promise.all(product.images.map(img => getPresignedUrl(img)))
    : (imageUrl ? [imageUrl] : []);

  return {
    ...product,
    imageUrl,
    images: images.filter((img): img is string => img !== null),
  };
}

export async function createProduct(input: CreateProductInput) {
  let categoryName: string | null = null;
  if (input.categoryId) {
    const [cat] = await db
      .select({ name: productCategories.name })
      .from(productCategories)
      .where(eq(productCategories.id, input.categoryId))
      .limit(1);
    if (cat) {
      categoryName = cat.name;
    }
  }

  let imageKeys: string[] = [];
  if (input.images && Array.isArray(input.images)) {
    imageKeys = input.images
      .map(img => extractS3Key(img))
      .filter((img): img is string => img !== null);
  }
  const imageUrlKey = imageKeys.length > 0 ? imageKeys[0] : (input.imageUrl ? extractS3Key(input.imageUrl) : null);
  if (imageKeys.length === 0 && imageUrlKey) {
    imageKeys = [imageUrlKey];
  }

  const [product] = await db
    .insert(products)
    .values({
      storeId: input.storeId,
      name: input.name,
      description: input.description ?? null,
      price: input.price,
      unitSize: input.unitSize,
      category: categoryName,
      categoryId: input.categoryId ?? null,
      imageUrl: imageUrlKey,
      images: imageKeys,
      brand: input.brand ?? null,
      shelfLife: input.shelfLife ?? null,
      origin: input.origin ?? null,
      ingredients: input.ingredients ?? null,
      isFeatured: input.isFeatured ?? false,
      isVeg: input.isVeg ?? true,
      inStock: input.inStock ?? true,
    })
    .returning();

  return getProductById(product.id);
}

export async function updateProduct(id: string, input: UpdateProductInput) {
  let categoryName: string | null | undefined = undefined;
  if (input.categoryId !== undefined) {
    if (input.categoryId === null) {
      categoryName = null;
    } else {
      const [cat] = await db
        .select({ name: productCategories.name })
        .from(productCategories)
        .where(eq(productCategories.id, input.categoryId))
        .limit(1);
      if (cat) {
        categoryName = cat.name;
      }
    }
  }

  let imageKeys: string[] | undefined = undefined;
  if (input.images !== undefined) {
    if (input.images === null) {
      imageKeys = [];
    } else if (Array.isArray(input.images)) {
      imageKeys = input.images
        .map(img => extractS3Key(img))
        .filter((img): img is string => img !== null);
    }
  }

  const updateValues: any = {
    ...input,
    updatedAt: new Date(),
  };

  if (imageKeys !== undefined) {
    updateValues.images = imageKeys;
    updateValues.imageUrl = imageKeys.length > 0 ? imageKeys[0] : null;
  } else if (input.imageUrl !== undefined) {
    updateValues.imageUrl = input.imageUrl ? extractS3Key(input.imageUrl) : null;
    if (updateValues.imageUrl) {
      updateValues.images = [updateValues.imageUrl];
    } else {
      updateValues.images = [];
    }
  }

  if (categoryName !== undefined) {
    updateValues.category = categoryName;
  }

  const [updated] = await db
    .update(products)
    .set(updateValues)
    .where(eq(products.id, id))
    .returning();

  if (!updated) return null;

  return getProductById(updated.id);
}

export async function deleteProduct(id: string) {
  await db.delete(products).where(eq(products.id, id));
}
