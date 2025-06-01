class ImagePreloader {
  private cache = new Set<string>();
  private loading = new Set<string>();

  preload(src: string): Promise<void> {
    if (this.cache.has(src) || this.loading.has(src)) {
      return Promise.resolve();
    }

    this.loading.add(src);

    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        this.cache.add(src);
        this.loading.delete(src);
        resolve();
      };
      
      img.onerror = () => {
        this.loading.delete(src);
        reject(new Error(`Failed to load image: ${src}`));
      };
      
      img.src = src;
    });
  }

  preloadMultiple(sources: string[]): Promise<void[]> {
    return Promise.all(sources.map(src => this.preload(src)));
  }

  isInCache(src: string): boolean {
    return this.cache.has(src);
  }

  clearCache(): void {
    this.cache.clear();
    this.loading.clear();
  }
}

export const imagePreloader = new ImagePreloader();