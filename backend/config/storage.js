const AWS = require('aws-sdk');

// DigitalOcean Spaces configuration
const spacesEndpoint = new AWS.Endpoint(process.env.DO_SPACES_ENDPOINT);
const s3 = new AWS.S3({
  endpoint: spacesEndpoint,
  accessKeyId: process.env.DO_SPACES_KEY,
  secretAccessKey: process.env.DO_SPACES_SECRET,
  region: process.env.DO_SPACES_REGION
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
        ACL: 'private', // Keep files private
        ContentType: file.mimetype,
        Metadata: {
          originalName: file.originalname,
          uploadedAt: new Date().toISOString()
        }
      };

      const result = await s3.upload(uploadParams).promise();
      
      return {
        url: result.Location,
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
      const params = {
        Bucket: BUCKET_NAME,
        Key: key,
        Expires: expiresIn // URL expires in 1 hour by default
      };

      return await s3.getSignedUrlPromise('getObject', params);
    } catch (error) {
      throw new Error('Failed to generate file URL');
    }
  }

  // Delete file from Spaces
  static async deleteFile(key) {
    try {
      const params = {
        Bucket: BUCKET_NAME,
        Key: key
      };

      await s3.deleteObject(params).promise();
      return true;
    } catch (error) {
      throw new Error('Failed to delete file');
    }
  }

  // Check if file exists
  static async fileExists(key) {
    try {
      const params = {
        Bucket: BUCKET_NAME,
        Key: key
      };

      await s3.headObject(params).promise();
      return true;
    } catch (error) {
      if (error.statusCode === 404) {
        return false;
      }
      throw error;
    }
  }
}

module.exports = StorageService;
