import { Hono } from "hono";
import * as productController from "./controller.ts";
import { requireAuth } from "../auth/middleware.ts";

export const productsRouter = new Hono();

// Categories routing
productsRouter.get("/categories", productController.getCategories);
productsRouter.get("/categories/:id", productController.getCategoryById);
productsRouter.post("/categories", requireAuth(["super_admin", "store_manager"]), productController.createCategory);
productsRouter.patch("/categories/:id", requireAuth(["super_admin", "store_manager"]), productController.updateCategory);
productsRouter.delete("/categories/:id", requireAuth(["super_admin", "store_manager"]), productController.deleteCategory);

// Products routing
productsRouter.get("/products", productController.getProducts);
productsRouter.get("/products/:id", productController.getProductById);
productsRouter.post("/products", requireAuth(["super_admin", "store_manager"]), productController.createProduct);
productsRouter.patch("/products/:id", requireAuth(["super_admin", "store_manager"]), productController.updateProduct);
productsRouter.delete("/products/:id", requireAuth(["super_admin", "store_manager"]), productController.deleteProduct);
