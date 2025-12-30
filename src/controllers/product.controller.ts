import "dotenv/config"
import type { Request, Response } from "express"
import { ProductService } from "../services/product.service"
import logger from "../utils/logger"
import sendResponse from "../utils/response"
import { processSingleUpload, processMultipleUploads, deleteImage } from "../services/upload.service"
import {RequestWithFile} from "../types/upload.types";

export const createProduct = async (req: Request, res: Response):Promise<void> => {
  try {
    // Process uploaded image if present
    let imageData = null
    if (req.file) {
      imageData = processSingleUpload(req.file)
    } else {
      sendResponse(res, 400, false, "Product image is required")
    }

    // Add image data to product if available
    const productData = {
      ...req.body,
      ...(imageData && {
        imageUrl: imageData.url,
        imagePublicId: imageData.publicId,
      }),
    }

    const product = await ProductService.createProduct(productData)
    sendResponse(res, 201, true, "Product created successfully", product)
  } catch (error) {
    logger.error(error)
    sendResponse(res, 500, false, "Error creating product", error)
  }
}

export const getProducts = async (req: Request, res: Response) => {
  try {
    const products = await ProductService.getProducts(req.query)
    sendResponse(res, 200, true, "Products fetched successfully", products)
  } catch (error) {
    logger.error(error)
    sendResponse(res, 500, false, "Error fetching products", error)
  }
}

export const getProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await ProductService.getProductById(req.params.id)
    if (!product) {
      sendResponse(res, 404, false, "Product not found")
      return
    }
    sendResponse(res, 200, true, "Product fetched successfully", product)
  } catch (error) {
    logger.error(error)
    sendResponse(res, 500, false, "Error fetching product", error)
  }
}
export const getProductBySlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await ProductService.getProductBySlug(req.params.slug)
    if (!product) {
      sendResponse(res, 404, false, "Product not found")
      return
    }
    sendResponse(res, 200, true, "Product fetched successfully", product)
  } catch (error) {
    logger.error(error)
    sendResponse(res, 500, false, "Error fetching product", error)
  }
}
export const updateProduct = async (req: RequestWithFile, res: Response): Promise<void> => {
  try {

    const existingProduct = await ProductService.getProductById(req.params.id);
    if (!existingProduct) {
      sendResponse(res, 404, false, "Product not found")
      return
    }

    // Process uploaded image if present
    let imageData = null
    if (req.file) {
      imageData = processSingleUpload(req.file)

      // Delete old image if it exists and a new one is uploaded
      if (existingProduct.imagePublicId) {
        try {
          await deleteImage(existingProduct.imagePublicId)
        } catch (error) {
          logger.error("Error deleting old image:", error)
          // Continue with update even if image deletion fails
        }
      }
    }

    // Add image data to product if available
    const updateData = {
      ...req.body,
      ...(imageData && {
        image: imageData.url,
        imagePublicId: imageData.publicId,
      }),
    }

    const updatedProduct = await ProductService.updateProduct(req.params.id, updateData)
    sendResponse(res, 200, true, "Product updated successfully", updatedProduct)
  } catch (error) {
    logger.error(error)
    sendResponse(res, 500, false, "Error updating product", error)
  }
};

export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await ProductService.getProductById(req.params.id)
    if (!product) {
      sendResponse(res, 404, false, "Product not found")
      return
    }

    // Delete product image if it exists
    if (product.imagePublicId) {
      try {
        await deleteImage(product.imagePublicId)
      } catch (error) {
        logger.error("Error deleting product image:", error)
        // Continue with deletion even if image deletion fails
      }
    }

    const deletedProduct = await ProductService.deleteProduct(req.params.id)
    sendResponse(res, 200, true, "Product deleted successfully", deletedProduct)
  } catch (error) {
    logger.error(error)
    sendResponse(res, 500, false, "Error deleting product", error)
  }
}

export const getProductsByCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const products = await ProductService.getProductsByCategory(req.params.category)
    sendResponse(res, 200, true, "Products fetched successfully", products)
  } catch (error) {
    logger.error(error)
    sendResponse(res, 500, false, "Error fetching products by category", error)
  }
}

// New controller methods for product gallery management
export const addProductGalleryImages = async (req: RequestWithFile, res: Response): Promise<void> => {
  try {
    const product = await ProductService.getProductById(req.params.id)
    if (!product) {
      sendResponse(res, 404, false, "Product not found")
      return
    }
    console.log("Gallery Images:", req.files)
    // Process uploaded gallery images
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      sendResponse(res, 400, false, "No gallery images uploaded")
      return
    }

    const galleryImages = processMultipleUploads(req.files)


    // Add gallery images to product
    const updatedProduct = await ProductService.addProductGalleryImages(req.params.id, galleryImages)
    sendResponse(res, 200, true, "Product gallery updated successfully", updatedProduct)
  } catch (error) {
    logger.error(error)
    sendResponse(res, 500, false, "Error updating product gallery", error)
  }
}

export const removeProductGalleryImage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, imageId } = req.params

    const product = await ProductService.getProductById(id)
    if (!product) {
      sendResponse(res, 404, false, "Product not found")
      return
    }

    // Find the gallery image
    const galleryImage = product.gallery?.find((img) => img._id.toString() === imageId)
    if (!galleryImage) {
      sendResponse(res, 404, false, "Gallery image not found")
      return
    }

    // Delete image from Cloudinary
    if (galleryImage.publicId) {
      try {
        await deleteImage(galleryImage.publicId)
      } catch (error) {
        logger.error("Error deleting gallery image:", error)
        // Continue with removal even if image deletion fails
      }
    }

    // Remove gallery image from product
    const updatedProduct = await ProductService.removeProductGalleryImage(id, imageId)
    sendResponse(res, 200, true, "Gallery image removed successfully", updatedProduct)
  } catch (error) {
    logger.error(error)
    sendResponse(res, 500, false, "Error removing gallery image", error)
  }
}
