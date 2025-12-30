import type { Request } from "express"
import type { Multer } from "multer"
export interface UploadedFile {
    fieldname: string
    originalname: string
    encoding: string
    mimetype: string
    path: string
    size: number
    filename: string
}

export interface CloudinaryUploadResult {
    _id?: any;
    url: string | undefined;
    publicId: string | undefined;
}

export interface UploadOptions {
    folder?: string
    formats?: string[]
    maxSize?: number // in bytes
    transformation?: any[]
}

export interface UploadField {
    name: string
    maxCount: number
}

// Extended Express Request with file(s)
// export interface RequestWithFile extends Request {
//     file?: UploadedFile
//     files?:
//         | {
//         [fieldname: string]: UploadedFile[]
//     }
//         | UploadedFile[]
// }

// export interface RequestWithFile extends Request {
//     file?: UploadedFile
//     files?: UploadedFile[] | { [fieldname: string]: UploadedFile[] }
// }
export interface RequestWithFile extends Request {
    file?: Express.Multer.File
    files?: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] }
}