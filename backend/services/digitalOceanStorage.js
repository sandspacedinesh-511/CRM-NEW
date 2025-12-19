const AWS = require('aws-sdk');

class DigitalOceanStorageService {
  constructor() {
    // Check required environment variables
    const requiredVars = ['DO_SPACES_KEY', 'DO_SPACES_SECRET', 'DO_SPACES_BUCKET'];
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    // In production, require all environment variables
    if (process.env.NODE_ENV === 'production' && missingVars.length > 0) {
      const errorMessage = `Digital Ocean Spaces configuration missing in production: ${missingVars.join(', ')}`;
      throw new Error(errorMessage);
    }
    
    // Configure AWS SDK for DigitalOcean Spaces
    // Allow missing endpoint in development by falling back to a safe default
    const endpointUrl = process.env.DO_SPACES_ENDPOINT || 'nyc3.digitaloceanspaces.com';
    const spacesEndpoint = new AWS.Endpoint(endpointUrl);
    
    this.s3 = new AWS.S3({
      endpoint: spacesEndpoint,
      accessKeyId: process.env.DO_SPACES_KEY,
      secretAccessKey: process.env.DO_SPACES_SECRET,
      region: process.env.DO_SPACES_REGION
    });
    
    this.bucket = process.env.DO_SPACES_BUCKET;
    this.region = process.env.DO_SPACES_REGION;
    
    if (missingVars.length > 0) {
    } else {
    }
  }

  // Upload file to DigitalOcean Spaces
  async uploadFile(file, folder = 'documents') {
    try {
      if (!this.bucket) {
        throw new Error('DO_SPACES_BUCKET environment variable is not set');
      }

      if (!process.env.DO_SPACES_KEY) {
        throw new Error('DO_SPACES_KEY environment variable is not set');
      }

      if (!process.env.DO_SPACES_SECRET) {
        throw new Error('DO_SPACES_SECRET environment variable is not set');
      }

      const key = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}-${file.originalname}`;
      
      const uploadParams = {
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'private' // Keep files private for security
      };
      const result = await this.s3.upload(uploadParams).promise();
      return {
        url: result.Location,
        key: key,
        bucket: this.bucket,
        region: this.region
      };
    } catch (error) {
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  // Get presigned URL for private file access
  async getPresignedUrl(key, expiresIn = 3600) {
    try {
      if (!this.bucket) {
        throw new Error('DO_SPACES_BUCKET environment variable is not set');
      }

      const params = {
        Bucket: this.bucket,
        Key: key,
        Expires: expiresIn // URL expires in specified seconds
      };

      const url = await this.s3.getSignedUrlPromise('getObject', params);
      return url;
    } catch (error) {
      throw new Error(`Failed to generate file URL: ${error.message}`);
    }
  }

  // Delete file from Spaces
  async deleteFile(key) {
    try {
      if (!this.bucket) {
        throw new Error('DO_SPACES_BUCKET environment variable is not set');
      }

      const params = {
        Bucket: this.bucket,
        Key: key
      };

      await this.s3.deleteObject(params).promise();
      return true;
    } catch (error) {
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  // Check if file exists
  async fileExists(key) {
    try {
      if (!this.bucket) {
        throw new Error('DO_SPACES_BUCKET environment variable is not set');
      }

      const params = {
        Bucket: this.bucket,
        Key: key
      };

      await this.s3.headObject(params).promise();
      return true;
    } catch (error) {
      if (error.statusCode === 404) {
        return false;
      }
      throw error;
    }
  }

  // Get file metadata
  async getFileMetadata(key) {
    try {
      if (!this.bucket) {
        throw new Error('DO_SPACES_BUCKET environment variable is not set');
      }

      const params = {
        Bucket: this.bucket,
        Key: key
      };

      const result = await this.s3.headObject(params).promise();

      return {
        size: result.ContentLength,
        lastModified: result.LastModified,
        contentType: result.ContentType,
        etag: result.ETag
      };
    } catch (error) {
      if (error.statusCode === 404) {
        return null;
      }
      throw error;
    }
  }

  // List files in a folder
  async listFiles(folder = '', maxKeys = 1000) {
    try {
      if (!this.bucket) {
        throw new Error('DO_SPACES_BUCKET environment variable is not set');
      }

      const params = {
        Bucket: this.bucket,
        Prefix: folder,
        MaxKeys: maxKeys
      };

      const result = await this.s3.listObjects(params).promise();
      return result.Contents || [];
    } catch (error) {
      throw new Error(`Failed to list files: ${error.message}`);
    }
  }

  // Download file from Spaces
  async downloadFile(key) {
    try {
      if (!this.bucket) {
        throw new Error('DO_SPACES_BUCKET environment variable is not set');
      }

      const params = {
        Bucket: this.bucket,
        Key: key
      };

      const result = await this.s3.getObject(params).promise();
      return result.Body;
    } catch (error) {
      throw new Error(`Failed to download file: ${error.message}`);
    }
  }
}

module.exports = DigitalOceanStorageService;
