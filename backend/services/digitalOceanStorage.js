const { S3Client, DeleteObjectCommand, HeadObjectCommand, GetObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { Upload } = require('@aws-sdk/lib-storage');

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
    
    // Configure AWS SDK v3 for DigitalOcean Spaces
    // Allow missing endpoint in development by falling back to a safe default
    // Ensure endpoint has https:// protocol
    const rawEndpoint = process.env.DO_SPACES_ENDPOINT || 'nyc3.digitaloceanspaces.com';
    const endpointUrl = rawEndpoint.startsWith('http') ? rawEndpoint : `https://${rawEndpoint}`;
    
    this.endpointUrl = endpointUrl;
    this.s3Client = new S3Client({
      endpoint: endpointUrl,
      region: process.env.DO_SPACES_REGION || 'us-east-1',
      forcePathStyle: false, // DigitalOcean Spaces uses virtual-hosted-style
      credentials: {
        accessKeyId: process.env.DO_SPACES_KEY,
        secretAccessKey: process.env.DO_SPACES_SECRET
      }
    });
    
    this.bucket = process.env.DO_SPACES_BUCKET;
    this.region = process.env.DO_SPACES_REGION || 'us-east-1';
    
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
        ContentType: file.mimetype
      };

      // Use Upload from @aws-sdk/lib-storage for multipart uploads
      const upload = new Upload({
        client: this.s3Client,
        params: uploadParams
      });

      await upload.done();
      
      // Construct URL manually for DigitalOcean Spaces
      const url = `${this.endpointUrl}/${this.bucket}/${key}`;
      
      return {
        url: url,
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

      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key
      });

      const url = await getSignedUrl(this.s3Client, command, { expiresIn });
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

      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key
      });

      await this.s3Client.send(command);
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

      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key
      });

      await this.s3Client.send(command);
      return true;
    } catch (error) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
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

      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key
      });

      const result = await this.s3Client.send(command);

      return {
        size: result.ContentLength,
        lastModified: result.LastModified,
        contentType: result.ContentType,
        etag: result.ETag
      };
    } catch (error) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
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

      const command = new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: folder,
        MaxKeys: maxKeys
      });

      const result = await this.s3Client.send(command);
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

      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key
      });

      const result = await this.s3Client.send(command);
      // Convert stream to buffer for consistency with v2 API
      const chunks = [];
      for await (const chunk of result.Body) {
        chunks.push(chunk);
      }
      return Buffer.concat(chunks);
    } catch (error) {
      throw new Error(`Failed to download file: ${error.message}`);
    }
  }
}

module.exports = DigitalOceanStorageService;
