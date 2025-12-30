
import express from "express"
import { authMiddleware } from "../middleware/auth.middleware"
import {
    createProduct,
    getProducts,
    getProduct,
    updateProduct,
    deleteProduct,
    getProductsByCategory,
    addProductGalleryImages,
    removeProductGalleryImage, getProductBySlug,
} from "../controllers/product.controller"
import { validateCreateProduct, validateUpdateProduct } from "../validators/product.validator"
import {handleUploadError, uploadFactory} from "../middleware/upload.middleware";


const router = express.Router()

// Configure product image upload options
const productImageOptions = {
    folder: "products",
    formats: ["jpg", "jpeg", "png", "webp"],
    maxSize: 5 * 1024 * 1024, // 5MB
    transformation: [{ width: 1000, height: 1000, crop: "limit" }],
}

const productGalleryOptions = {
    folder: "products/gallery",
    formats: ["jpg", "jpeg", "png", "webp"],
    maxSize: 5 * 1024 * 1024, // 5MB
    transformation: [{ width: 1200, height: 1200, crop: "limit" }],
}

// Create product with optional image upload
router.post(
    "/",
    authMiddleware,
    uploadFactory.single("image", productImageOptions),
    handleUploadError,
    validateCreateProduct,
    createProduct,
)



// Update product with optional image upload
router.put(
    "/:id",
    authMiddleware,
    uploadFactory.single("image", productImageOptions),
    handleUploadError,
    validateUpdateProduct,
    updateProduct,
)

// Add gallery images to product
router.post(
    "/:id/gallery",
    authMiddleware,
    uploadFactory.array("gallery", 5, productGalleryOptions),
    handleUploadError,
    addProductGalleryImages,
)

// Remove gallery image from product
router.delete("/:id/gallery/:imageId", authMiddleware, removeProductGalleryImage)

// Standard routes without file upload
router.get("/", getProducts)
// create slug for product
router.get("/slug/:slug", getProductBySlug)
router.get("/:id", getProduct)
router.delete("/:id", authMiddleware, deleteProduct)
router.get("/category/:category", getProductsByCategory)

export default router
