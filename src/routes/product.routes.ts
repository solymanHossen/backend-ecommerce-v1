import express from "express";
import { authMiddleware, adminMiddleware } from "../middleware/auth.middleware";
import {
    createProduct,
    getProducts,
    getProductBySlug,
    updateProduct,
    deleteProduct,
    getProduct,
    addProductGalleryImages,
    removeProductGalleryImage,
} from "../controllers/product.controller";
import { validateCreateProduct, validateUpdateProduct, validateListProducts } from "../validators/product.validator";
import { handleUploadError, uploadFactory } from "../middleware/upload.middleware";

const router = express.Router();

// Configure product image upload options
const productImageOptions = {
    folder: "products",
    formats: ["jpg", "jpeg", "png", "webp"],
    maxSize: 5 * 1024 * 1024, // 5MB
    transformation: [{ width: 1000, height: 1000, crop: "limit" }],
};

// Public Routes
router.get("/", validateListProducts, getProducts);
router.get("/:slug", getProductBySlug); // Assuming slug lookup is public

// Admin Protected Routes
router.post(
    "/",
    authMiddleware,
    adminMiddleware,
    uploadFactory.single("image", productImageOptions),
    handleUploadError,
    validateCreateProduct,
    createProduct
);

router.put(
    "/:id",
    authMiddleware,
    adminMiddleware,
    uploadFactory.single("image", productImageOptions),
    handleUploadError,
    validateUpdateProduct,
    updateProduct
);

router.delete("/:id", authMiddleware, adminMiddleware, deleteProduct);

router.post(
    "/:id/gallery",
    authMiddleware,
    adminMiddleware,
    uploadFactory.array("images", 5),
    handleUploadError,
    addProductGalleryImages
);

router.delete(
    "/:id/gallery/:imageId",
    authMiddleware,
    adminMiddleware,
    removeProductGalleryImage
);

export default router;
