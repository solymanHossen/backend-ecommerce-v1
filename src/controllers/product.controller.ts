import "dotenv/config";
import type { Request, Response } from "express";
import { ProductService } from "../services/product.service";
import sendResponse from "../utils/response";
import { processSingleUpload, processMultipleUploads, deleteImage } from "../services/upload.service";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";
import logger from "../utils/logger";

export const createProduct = asyncHandler(async (req: Request, res: Response) => {
    let imageData = null;
    if (req.file) {
      imageData = processSingleUpload(req.file);
    } else {
       throw new AppError("Product image is required", 400);
    }

    const productData = {
      ...req.body,
      ...(imageData && {
        imageUrl: imageData.url,
        imagePublicId: imageData.publicId,
      }),
    };

    const product = await ProductService.createProduct(productData);
    sendResponse(res, 201, true, "Product created successfully", product);
});

export const getProducts = asyncHandler(async (req: Request, res: Response) => {
    const products = await ProductService.getProducts(req.query);
    sendResponse(res, 200, true, "Products fetched successfully", products);
});

export const getProduct = asyncHandler(async (req: Request, res: Response) => {
    const product = await ProductService.getProductById(req.params.id);
    if (!product) {
      throw new AppError("Product not found", 404);
    }
    sendResponse(res, 200, true, "Product fetched successfully", product);
});

export const getProductBySlug = asyncHandler(async (req: Request, res: Response) => {
    const product = await ProductService.getProductBySlug(req.params.slug);
    if (!product) {
       throw new AppError("Product not found", 404);
    }
    sendResponse(res, 200, true, "Product fetched successfully", product);
});

export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
    const existingProduct = await ProductService.getProductById(req.params.id);
    if (!existingProduct) {
       throw new AppError("Product not found", 404);
    }

    let imageData = null;
    if (req.file) {
      imageData = processSingleUpload(req.file);

      if (existingProduct.imagePublicId) {
        try {
          await deleteImage(existingProduct.imagePublicId);
        } catch (error) {
          logger.error("Error deleting old image:", error);
        }
      }
    }

    const updateData = {
      ...req.body,
      ...(imageData && {
        image: imageData.url,
        imagePublicId: imageData.publicId,
      }),
    };

    const updatedProduct = await ProductService.updateProduct(req.params.id, updateData);
    sendResponse(res, 200, true, "Product updated successfully", updatedProduct);
});

export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
    const product = await ProductService.getProductById(req.params.id);
    if (!product) {
       throw new AppError("Product not found", 404);
    }

    if (product.imagePublicId) {
      try {
        await deleteImage(product.imagePublicId);
      } catch (error) {
        logger.error("Error deleting product image:", error);
      }
    }

    const deletedProduct = await ProductService.deleteProduct(req.params.id);
    sendResponse(res, 200, true, "Product deleted successfully", deletedProduct);
});

export const getProductsByCategory = asyncHandler(async (req: Request, res: Response) => {
    const products = await ProductService.getProductsByCategory(req.params.category);
    sendResponse(res, 200, true, "Products fetched successfully", products);
});

export const addProductGalleryImages = asyncHandler(async (req: Request, res: Response) => {
    const product = await ProductService.getProductById(req.params.id);
    if (!product) {
        throw new AppError("Product not found", 404);
    }

    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        throw new AppError("No gallery images uploaded", 400);
    }

    const galleryImages = processMultipleUploads(req.files as Express.Multer.File[]);
    const updatedProduct = await ProductService.addProductGalleryImages(req.params.id, galleryImages);
    sendResponse(res, 200, true, "Product gallery updated successfully", updatedProduct);
});

export const removeProductGalleryImage = asyncHandler(async (req: Request, res: Response) => {
    const { id, imageId } = req.params;

    const product = await ProductService.getProductById(id);
    if (!product) {
        throw new AppError("Product not found", 404);
    }

    const galleryImage = product.gallery?.find((img) => img._id.toString() === imageId);
    if (!galleryImage) {
        throw new AppError("Gallery image not found", 404);
    }

    if (galleryImage.publicId) {
      try {
        await deleteImage(galleryImage.publicId);
      } catch (error) {
        logger.error("Error deleting gallery image:", error);
      }
    }

    const updatedProduct = await ProductService.removeProductGalleryImage(id, imageId);
    sendResponse(res, 200, true, "Gallery image removed successfully", updatedProduct);
});
