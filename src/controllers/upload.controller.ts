import type { Request, Response } from "express"
import {
    processSingleUpload,
    processMultipleUploads,
    processFieldUploads,
    deleteImage,
} from "../services/upload.service"
import type { RequestWithFile } from "../types/upload.types"
import sendResponse from "../utils/response";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";

/**
 * Handle single file upload
 */
export const uploadSingleFile = asyncHandler(async (req: RequestWithFile, res: Response) => {
    if (!req.file) {
        throw new AppError("No file uploaded", 400);
    }

    const result = processSingleUpload(req.file)
    sendResponse(res, 200, true, "File uploaded successfully", result);
});

/**
 * Handle multiple file uploads with the same field name
 */
export const uploadMultipleFiles = asyncHandler(async (req: RequestWithFile, res: Response) => {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        throw new AppError("No files uploaded", 400);
    }

    const results = processMultipleUploads(req.files)
    sendResponse(res, 200, true, "${results.length} files uploaded successfully", results);
});

/**
 * Handle multiple file uploads with different field names
 */
export const uploadFieldFiles = asyncHandler(async (req: RequestWithFile, res: Response) => {
    if (!req.files || Array.isArray(req.files) || Object.keys(req.files).length === 0) {
        throw new AppError("No files uploaded", 400);
    }

    const results = processFieldUploads(req.files as { [fieldname: string]: any[] })
    sendResponse(res, 200, true, "Files uploaded successfully", results);
});

/**
 * Delete a file from Cloudinary
 */
export const deleteFile = asyncHandler(async (req: Request, res: Response) => {
    const { publicId } = req.body;
    if (!publicId) {
        throw new AppError("Public ID is required", 400);
    }
    const result = await deleteImage(publicId);
    sendResponse(res, 200, true, "File deleted successfully", result);
});
