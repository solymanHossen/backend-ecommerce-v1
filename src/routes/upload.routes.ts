import { Router } from "express"
import { uploadSingleFile, uploadMultipleFiles, uploadFieldFiles, deleteFile } from "../controllers/upload.controller"
import {handleUploadError, requireFiles, uploadFactory} from "../middleware/upload.middleware";
import { authMiddleware } from "../middleware/auth.middleware";


const router = Router()

// SECURITY FIX: All upload routes now require authentication

// Product image upload routes
const productImageOptions = {
    folder: "products",
    formats: ["jpg", "jpeg", "png", "webp"],
    maxSize: 5 * 1024 * 1024, // 5MB
    transformation: [{ width: 1000, height: 1000, crop: "limit" }],
}

// Single product image upload - PROTECTED
router.post(
    "/products/single",
    authMiddleware, // Authentication required
    uploadFactory.single("image", productImageOptions),
    handleUploadError,
    requireFiles("image"),
    uploadSingleFile,
)

// Multiple product images upload (max 5) - PROTECTED
router.post(
    "/products/multiple",
    authMiddleware, // Authentication required
    uploadFactory.array("images", 5, productImageOptions),
    handleUploadError,
    requireFiles("images"),
    uploadMultipleFiles,
)

// Product images with different fields - PROTECTED
router.post(
    "/products/fields",
    authMiddleware, // Authentication required
    uploadFactory.fields(
        [
            { name: "thumbnail", maxCount: 1 },
            { name: "gallery", maxCount: 5 },
        ],
        productImageOptions,
    ),
    handleUploadError,
    requireFiles(["thumbnail", "gallery"]),
    uploadFieldFiles,
)

// User avatar upload routes
const avatarOptions = {
    folder: "avatars",
    formats: ["jpg", "jpeg", "png", "webp"],
    maxSize: 2 * 1024 * 1024, // 2MB
    transformation: [{ width: 400, height: 400, crop: "fill", gravity: "face" }],
}

router.post(
    "/users/avatar",
    authMiddleware, // Authentication required
    uploadFactory.single("avatar", avatarOptions),
    handleUploadError,
    requireFiles("avatar"),
    uploadSingleFile,
)

// Delete file route - PROTECTED
router.delete("/:publicId", authMiddleware, deleteFile)

export default router
