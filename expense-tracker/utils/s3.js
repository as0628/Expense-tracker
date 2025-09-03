const { S3Client, PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Upload to S3 and return a signed GET URL
async function uploadToS3(fileBuffer, key, contentType) {
  //fileBuffer → the actual file data (like a PDF or image in memory).
    //key → filename in S3 (can include folders, e.g., uploads/receipt1.pdf).
    //contentType → MIME type (application/pdf, image/png, etc.).
  // 1 Upload the file
  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,//which S3 bucket to upload to.
      Key: key,//the file name/path.
      Body: fileBuffer,//the actual file content.
      ContentType: contentType,//tells S3 what type of file it is (helps browsers render/download correctly).
    })
  );

  // 2️ Create a signed GET URL (valid 1 hour)
  const command = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: key,
  });
  const url = await getSignedUrl(s3, command, { expiresIn: 3600 });

  return url;
}

module.exports = { uploadToS3 };
