import { S3Client } from "@aws-sdk/client-s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_KEY
    }
});

export const uploadToS3 = async (folder, file, imgname) => {

    const fileName = imgname;

    const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `cotravin_assets/${folder}/${fileName}`,
        Body: file.data,
        ContentType: file.mimetype
    };

    // console.log(params);

    await s3.send(new PutObjectCommand(params));

    return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/cotravin_assets/${folder}/${fileName}`;
};

// AWS_BUCKET
// AWS_REGION
// AWS_VERSION
// AWS_ACCESS_KEY
// AWS_SECRET_KEY