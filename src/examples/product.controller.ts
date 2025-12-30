import type { Response } from "express"

import { processSingleUpload, processMultipleUploads } from "../services/upload.service"
import type { RequestWithFile } from "../types/upload.types"
import {uploadFactory} from "../middleware/upload.middleware";

// Example of how to use the upload system in a product controller

// Middleware setup for product images
export const productImageUpload = uploadFactory.single("image", {
    folder: "products",
    formats: ["jpg", "jpeg", "png", "webp"],
    maxSize: 5 * 1024 * 1024,
})

export const productGalleryUpload = uploadFactory.array("gallery", 5, {
    folder: "products/gallery",
    formats: ["jpg", "jpeg", "png", "webp"],
    maxSize: 5 * 1024 * 1024,
})

// Create product with image
export const createProduct = async (req: RequestWithFile, res: Response) => {
    try {
        // Process the uploaded image
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Product image is required",
            })
        }

        const imageData = processSingleUpload(req.file)

        // Create product with image data
        const product = {
            name: req.body.name,
            description: req.body.description,
            price: req.body.price,
            image: imageData.url,
            imagePublicId: imageData.publicId,
            // Other product fields...
        }

        // Here you would save the product to your database
        // const savedProduct = await ProductModel.create(product);

        res.status(201).json({
            success: true,
            message: "Product created successfully",
            data: product,
        })
    } catch (error: any) {
        console.error("Error creating product:", error)
        res.status(500).json({
            success: false,
            message: "Failed to create product",
            error: error.message,
        })
    }
}

// Update product with gallery images
export const updateProductGallery = async (req: RequestWithFile, res: Response) => {
    try {
        const { productId } = req.params

        // Process the uploaded gallery images
        if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Gallery images are required",
            })
        }

        const galleryData = processMultipleUploads(req.files)

        // Here you would update the product in your database
        // const product = await ProductModel.findById(productId);
        // if (!product) {
        //   return res.status(404).json({ message: 'Product not found' });
        // }
        // product.gallery = [...product.gallery, ...galleryData.map(img => ({ url: img.url, publicId: img.publicId }))];
        // await product.save();

        res.status(200).json({
            success: true,
            message: "Product gallery updated successfully",
            data: galleryData,
        })
    } catch (error: any) {
        console.error("Error updating product gallery:", error)
        res.status(500).json({
            success: false,
            message: "Failed to update product gallery",
            error: error.message,
        })
    }
}

// Example of how to use these in routes:
/*
import { Router } from 'express';
import { createProduct, updateProductGallery } from './product.controller';
import { handleUploadError } from '../middlewares/upload.middleware';

const router = Router();

router.post(
  '/',
  productImageUpload,
  handleUploadError,
  createProduct
);

router.put(
  '/:productId/gallery',
  productGalleryUpload,
  handleUploadError,
  updateProductGallery
);

export default router;
*/
