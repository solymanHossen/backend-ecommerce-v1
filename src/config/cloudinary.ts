import { v2 as cloudinary, type ConfigOptions } from "cloudinary"
import { CloudinaryStorage } from "multer-storage-cloudinary"
import multer, { type FileFilterCallback, type Options } from "multer"
import type { Request, Express } from "express"
import type { UploadOptions } from "../types/upload.types"
import dotenv from "dotenv";
dotenv.config();
// Configure Cloudinary
const cloudinaryConfig: ConfigOptions = {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "",
    api_key: process.env.CLOUDINARY_API_KEY || "",
    api_secret: process.env.CLOUDINARY_API_SECRET || "",
}

cloudinary.config(cloudinaryConfig)

// Create storage factory function
const createCloudinaryStorage = (options: UploadOptions = {}) => {
    const {
        folder = "uploads",
        formats = ["jpg", "jpeg", "png", "gif", "webp"],
        transformation = [{ width: 1000, height: 1000, crop: "limit" }],
    } = options

    return new CloudinaryStorage({
        cloudinary,
        params: async (req: Request, file: Express.Multer.File) => {
            // Extract file extension
            const format = file.mimetype.split("/")[1]

            // You can customize the folder based on request parameters
            let customFolder = folder
            if (req.params.type) {
                customFolder = `${folder}/${req.params.type}`
            }

            return {
                folder: customFolder,
                format: format,
                transformation: transformation,
                // You can add more parameters like public_id, tags, etc.
            } as any
        },
    })
}

// File filter function
const fileFilter = (allowedFormats: string[] = []) => {
    return (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
        // If no formats specified, accept all image types
        if (allowedFormats.length === 0 && file.mimetype.startsWith("image/")) {
            return cb(null, true)
        }

        // Check if the file format is allowed
        const format = file.mimetype.split("/")[1]
        if (allowedFormats.includes(format)) {
            return cb(null, true)
        }

        cb(new Error(`Only ${allowedFormats.join(", ")} files are allowed!`))
    }
}

// Create multer upload factory
export const createUploader = (options: UploadOptions = {}) => {
    const {
        formats = ["jpg", "jpeg", "png", "gif", "webp"],
        maxSize = 5 * 1024 * 1024, // 5MB default
    } = options

    const storage = createCloudinaryStorage(options)

    const multerOptions: Options = {
        storage,
        limits: {
            fileSize: maxSize,
        },
        fileFilter: fileFilter(formats),
    }

    return multer(multerOptions)
}

export { cloudinary }
