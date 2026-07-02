import cloudinary from "../utils/cloudinary.js";
import { prisma } from "../utils/prismaClient.js";

// Upload a new video
export const uploadVideo = async (
    req,
    res
) => {
    try {
        // If image is uploaded
        if (req?.file) {
            cloudinary.uploader.upload(req.file.path, { resource_type: "video" }, async function (err, result) {
                if (err) {
                    console.log(err);
                    return res.status(500).json({
                        message: "Something went wrong! Please try again.",
                    });
                }
                // If image upload was successful
                else {
                    // Get user from request.
                    const dbUserId = JSON.parse(req.body?.userId);


                    const created_file = await prisma.file.create({
                        data: {
                            userId: dbUserId,
                            fileName: file?.originalname,
                            assetId: result.asset_id,
                            publicId: result.public_id,
                            fileURL: result.secure_url,
                            format: result.format,
                            base64size: base64size,
                            userId: user.id,
                        }
                    })

                    res.status(200).send({ data: created_file })
                }
            });
        }
    } catch (err) {
        console.log(err);
        res.status(500).send({ data: "Something went wrong." });
        return;
    }
};


