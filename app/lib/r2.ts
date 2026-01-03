import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function getSignedImageUrl(key: string) {
  const command = new GetObjectCommand({
    Bucket: process.env.R2_BUCKET!,
    Key: key,
  });

  const url = await getSignedUrl(client, command, {
    expiresIn: parseInt(process.env.SIGNED_URL_EXPIRES!),
  });

  return url;
}
