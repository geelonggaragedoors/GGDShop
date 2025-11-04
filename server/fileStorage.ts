import { writeFile, mkdir, readFile, unlink } from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';
import { nanoid } from 'nanoid';

export class FileStorageService {
  private uploadDir: string;
  private baseUrl: string;

  constructor() {
    this.uploadDir = path.join(process.cwd(), 'uploads');
    // Use relative URLs for better compatibility
    this.baseUrl = '';
    this.ensureUploadDir();
  }

  private ensureUploadDir() {
    try {
      if (!existsSync(this.uploadDir)) {
        mkdirSync(this.uploadDir, { recursive: true });
        console.log('✅ Created uploads directory:', this.uploadDir);
      } else {
        console.log('✅ Uploads directory exists:', this.uploadDir);
      }
    } catch (error) {
      console.error('❌ Error creating uploads directory:', error);
    }
  }

  async saveFile(buffer: Buffer, originalName: string, mimeType: string): Promise<{ url: string; filename: string }> {
    const extension = path.extname(originalName);
    const filename = `${nanoid()}-${Date.now()}${extension}`;
    const filePath = path.join(this.uploadDir, filename);
    
    await writeFile(filePath, buffer);
    
    return {
      filename,
      url: `/uploads/${filename}`
    };
  }

  async deleteFile(filename: string): Promise<boolean> {
    try {
      const filePath = path.join(this.uploadDir, filename);
      await unlink(filePath);
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  getFilePath(filename: string): string {
    return path.join(this.uploadDir, filename);
  }
}

export const fileStorage = new FileStorageService();