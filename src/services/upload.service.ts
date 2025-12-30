import type { UploadedFile, CloudinaryUploadResult } from "../types/upload.types"
import {cloudinary} from "../config/cloudinary";

/**
 * Process a single uploaded file
 */
export const processSingleUpload = (file: UploadedFile): CloudinaryUploadResult => {
    return {
        url: file.path,
        publicId: file.filename,
    }
}

/**
 * Process multiple uploaded files
 */
export const processMultipleUploads = (files: UploadedFile[]): CloudinaryUploadResult[] => {
    return files.map((file) => ({
        url: file.path,
        publicId: file.filename,
    }))
}

/**
 * Process files uploaded with fields
 */
export const processFieldUploads = (files: { [fieldname: string]: UploadedFile[] }): {
    [fieldname: string]: CloudinaryUploadResult[]
} => {
    const result: { [fieldname: string]: CloudinaryUploadResult[] } = {}

    for (const [field, fieldFiles] of Object.entries(files)) {
        result[field] = processMultipleUploads(fieldFiles)
    }

    return result
}

/**
 * Delete an image from Cloudinary by public ID
 */
export const deleteImage = async (publicId: string): Promise<any> => {
    try {
        const result = await cloudinary.uploader.destroy(publicId)
        return result
    } catch (error) {
        console.error("Error deleting image:", error)
        throw error
    }
}

/**
 * Delete multiple images from Cloudinary by public IDs
 */
export const deleteMultipleImages = async (publicIds: string[]): Promise<any[]> => {
    try {
        const deletePromises = publicIds.map((id) => cloudinary.uploader.destroy(id))
        return await Promise.all(deletePromises)
    } catch (error) {
        console.error("Error deleting multiple images:", error)
        throw error
    }
}

/**
 * Generate a signed URL for a Cloudinary image with transformations
 */
export const generateSignedUrl = (publicId: string, options: any = {}): string => {
    return cloudinary.url(publicId, {
        secure: true,
        sign_url: true,
        ...options,
    })
}
