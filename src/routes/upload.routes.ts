import { Router } from "express"
import { uploadSingleFile, uploadMultipleFiles, uploadFieldFiles, deleteFile } from "../controllers/upload.controller"
import {handleUploadError, requireFiles, uploadFactory} from "../middleware/upload.middleware";


const router = Router()

// Product image upload routes
const productImageOptions = {
    folder: "products",
    formats: ["jpg", "jpeg", "png", "webp"],
    maxSize: 5 * 1024 * 1024, // 5MB
    transformation: [{ width: 1000, height: 1000, crop: "limit" }],
}

// Single product image upload
router.post(
    "/products/single",
    uploadFactory.single("image", productImageOptions),
    handleUploadError,
    requireFiles("image"),
    uploadSingleFile,
)

// Multiple product images upload (max 5)
router.post(
    "/products/multiple",
    uploadFactory.array("images", 5, productImageOptions),
    handleUploadError,
    requireFiles("images"),
    uploadMultipleFiles,
)

// Product images with different fields
router.post(
    "/products/fields",
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
    uploadFactory.single("avatar", avatarOptions),
    handleUploadError,
    requireFiles("avatar"),
    uploadSingleFile,
)

// Delete file route
router.delete("/:publicId", deleteFile)

export default router
