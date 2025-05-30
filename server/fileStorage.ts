import { writeFile, mkdir, readFile, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { nanoid } from 'nanoid';

export class FileStorageService {
  private uploadDir: string;
  private baseUrl: string;

  constructor() {
    this.uploadDir = path.join(process.cwd(), 'uploads');
    this.baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    this.ensureUploadDir();
  }

  private async ensureUploadDir() {
    if (!existsSync(this.uploadDir)) {
      await mkdir(this.uploadDir, { recursive: true });
    }
  }

  async saveFile(buffer: Buffer, originalName: string, mimeType: string): Promise<{ url: string; filename: string }> {
    const extension = path.extname(originalName);
    const filename = `${nanoid()}-${Date.now()}${extension}`;
    const filePath = path.join(this.uploadDir, filename);
    
    await writeFile(filePath, buffer);
    
    return {
      filename,
      url: `${this.baseUrl}/uploads/${filename}`
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