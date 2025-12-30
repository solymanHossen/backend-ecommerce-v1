import type { Request, Response, NextFunction } from "express"

import type { UploadOptions, UploadField } from "../types/upload.types"
import {createUploader} from "../config/cloudinary";
import logger from "../utils/logger";
import sendResponse from "../utils/response";

// Error handler middleware
export const handleUploadError = (err: any, req: Request, res: Response, next: NextFunction) => {
    if (!err) {
        return next()
    }
    console.log("Upload error:", err)
    console.log("Upload error details:", req.file)

    if (err.code === "LIMIT_FILE_SIZE") {
        res.status(400).json({
            success: false,
            message: "File size too large",
        })
        return
    }

    if (err.message.includes("Only")) {
        sendResponse(res, 400, false, "File type not allowed", {error: err.message})
        return
    }

    logger.error("Upload error:", err)
    sendResponse(res, 500, false, "File upload failed", {error: err.message})
    return
}

// Factory functions for different upload scenarios
export const uploadFactory = {
    // Single file upload
    single: (fieldName: string, options: UploadOptions = {}) => {
        const uploader = createUploader(options)
        return uploader.single(fieldName)
    },

    // Multiple files with the same field name
    array: (fieldName: string, maxCount: number, options: UploadOptions = {}) => {
        const uploader = createUploader(options)
        return uploader.array(fieldName, maxCount)
    },

    // Multiple files with different field names
    fields: (fields: UploadField[], options: UploadOptions = {}) => {
        const uploader = createUploader(options)
        return uploader.fields(fields)
    },

    // Create custom uploader with specific options
    custom: (options: UploadOptions = {}) => {
        return createUploader(options)
    },
}

// Middleware to validate required files
export const requireFiles = (fieldNames: string | string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const fields = Array.isArray(fieldNames) ? fieldNames : [fieldNames]

        for (const field of fields) {
            if (
                (!req.file && fields.length === 1) ||
                (!req.files && fields.length > 1) ||
                (req.files && Array.isArray(req.files) && req.files.length === 0) ||
                (req.files && !Array.isArray(req.files) && !Object.keys(req.files).some((key) => fields.includes(key)))
            ) {
                sendResponse(res, 400, false, `Required file${fields.length > 1 ? "s" : ""} missing: ${fields.join(", ")}`, {error: "Required file missing"})
                return

            }
        }

        next()
    }
}
