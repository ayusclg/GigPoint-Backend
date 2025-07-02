import multer from "multer";
import cloudinary from 'cloudinary'

cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
    api_key: process.env.CLOUDINARY_API_KEY!,
    api_secret: process.env.CLOUDINARY_API_SECRET!
  })

const storage = multer.memoryStorage()

export const Upload = multer({
    storage: storage,
    
    limits: { fileSize: 5 * 1024 * 1024 },

    fileFilter: (req, file, cb) => {
        const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"]
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true)
        }
        else {
            cb(new Error("File Type Not Allowed") as unknown as null, false)
        }
    
    }
})

 export const uploadImageOnCloud = async (file: Express.Multer.File) => {
    const b64 = Buffer.from(file.buffer).toString("base64")
    const fileUri = `data:${file.mimetype};base64,${b64}`

    try {
        const response = await cloudinary.v2.uploader.upload(fileUri, {
            folder:"gigPoint",resource_type:"image"
        })
        return response.secure_url
    } catch (error) {
        console.log("Error in Cloudinary", error)
        throw error;
    }
}