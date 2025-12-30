import type { Request, Response } from "express"
import {
    processSingleUpload,
    processMultipleUploads,
    processFieldUploads,
    deleteImage,
} from "../services/upload.service"
import type { RequestWithFile } from "../types/upload.types"

/**
 * Handle single file upload
 */
export const uploadSingleFile = async (req: RequestWithFile, res: Response): Promise<any> => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No file uploaded",
            })
        }

        const result = processSingleUpload(req.file)

        res.status(200).json({
            success: true,
            data: result,
            message: "File uploaded successfully",
        })
    } catch (error: any) {
        console.error("Error uploading file:", error)
        res.status(500).json({
            success: false,
            message: "Failed to upload file",
            error: error.message,
        })
    }
}

/**
 * Handle multiple file uploads with the same field name
 */
export const uploadMultipleFiles = async (req: RequestWithFile, res: Response): Promise<any> => {
    try {
        if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No files uploaded",
            })
        }

        const results = processMultipleUploads(req.files)

        res.status(200).json({
            success: true,
            data: results,
            message: `${results.length} files uploaded successfully`,
        })
    } catch (error: any) {
        console.error("Error uploading files:", error)
        res.status(500).json({
            success: false,
            message: "Failed to upload files",
            error: error.message,
        })
    }
}

/**
 * Handle multiple file uploads with different field names
 */
export const uploadFieldFiles = async (req: RequestWithFile, res: Response): Promise<any> => {
    try {
        if (!req.files || Array.isArray(req.files) || Object.keys(req.files).length === 0) {
            return res.status(400).json({
                success: false,
                message: "No files uploaded",
            })
        }

        const results = processFieldUploads(req.files as { [fieldname: string]: any[] })

        res.status(200).json({
            success: true,
            data: results,
            message: "Files uploaded successfully",
        })
    } catch (error: any) {
        console.error("Error uploading field files:", error)
        res.status(500).json({
            success: false,
            message: "Failed to upload files",
            error: error.message,
        })
    }
}

/**
 * Delete a file from Cloudinary
 */
export const deleteFile = async (req: Request, res: Response): Promise<any> => {
    try {
        const { publicId } = req.params

        if (!publicId) {
            return res.status(400).json({
                success: false,
                message: "Public ID is required",
            })
        }

        const result = await deleteImage(publicId)

        if (result.result === "ok") {
            return res.status(200).json({
                success: true,
                message: "File deleted successfully",
            })
        } else {
            return res.status(400).json({
                success: false,
                message: "Failed to delete file",
                result,
            })
        }
    } catch (error: any) {
        console.error("Error deleting file:", error)
        res.status(500).json({
            success: false,
            message: "Failed to delete file",
            error: error.message,
        })
    }
}
