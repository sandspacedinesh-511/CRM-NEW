const { S3Client, DeleteObjectCommand, HeadObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { Upload } = require('@aws-sdk/lib-storage');

// DigitalOcean Spaces configuration using AWS SDK v3
// Ensure endpoint has https:// protocol
const endpointUrl = process.env.DO_SPACES_ENDPOINT 
  ? (process.env.DO_SPACES_ENDPOINT.startsWith('http') ? process.env.DO_SPACES_ENDPOINT : `https://${process.env.DO_SPACES_ENDPOINT}`)
  : 'https://nyc3.digitaloceanspaces.com';

const s3Client = new S3Client({
  endpoint: endpointUrl,
  region: process.env.DO_SPACES_REGION || 'us-east-1',
  forcePathStyle: false, // DigitalOcean Spaces uses virtual-hosted-style
  credentials: {
    accessKeyId: process.env.DO_SPACES_KEY,
    secretAccessKey: process.env.DO_SPACES_SECRET
  }
});

const BUCKET_NAME = process.env.DO_SPACES_BUCKET;

class StorageService {
  // Upload file to DigitalOcean Spaces
  static async uploadFile(file, folder = 'documents') {
    try {
      const key = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}-${file.originalname}`;
      
      const uploadParams = {
        Bucket: BUCKET_NAME,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        Metadata: {
          originalName: file.originalname,
          uploadedAt: new Date().toISOString()
        }
      };

      // Use Upload from @aws-sdk/lib-storage for multipart uploads
      const upload = new Upload({
        client: s3Client,
        params: uploadParams
      });

      await upload.done();
      
      // Construct URL manually for DigitalOcean Spaces
      const url = `${endpointUrl}/${BUCKET_NAME}/${key}`;
      
      return {
        url: url,
        key: key,
        bucket: BUCKET_NAME
      };
    } catch (error) {
      throw new Error('Failed to upload file');
    }
  }

  // Get signed URL for private file access
  static async getSignedUrl(key, expiresIn = 3600) {
    try {
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key
      });

      return await getSignedUrl(s3Client, command, { expiresIn });
    } catch (error) {
      throw new Error('Failed to generate file URL');
    }
  }

  // Delete file from Spaces
  static async deleteFile(key) {
    try {
      const command = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key
      });

      await s3Client.send(command);
      return true;
    } catch (error) {
      throw new Error('Failed to delete file');
    }
  }

  // Check if file exists
  static async fileExists(key) {
    try {
      const command = new HeadObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key
      });

      await s3Client.send(command);
      return true;
    } catch (error) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        return false;
      }
      throw error;
    }
  }
}

module.exports = StorageService;
