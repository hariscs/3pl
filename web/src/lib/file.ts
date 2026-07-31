// Small, colocated file helpers for the profile-photo picker. Centralized
// here rather than inlined in a component, per project convention: a data
// URL is the frontend-safe stand-in for a real upload — trivially swappable
// for a CDN url later since profilePhotoUrl is just a string either way.

export const SUPPORTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
] as const;

export const MAX_PHOTO_SIZE = 5 * 1024 * 1024; // 5 MB

export function isSupportedImageType(file: File): boolean {
  return (SUPPORTED_IMAGE_TYPES as readonly string[]).includes(file.type);
}

export function validatePhotoFile(file: File): string | null {
  if (!isSupportedImageType(file)) {
    return "Unsupported file type. Use JPG, PNG, or WebP.";
  }
  if (file.size > MAX_PHOTO_SIZE) {
    return `File too large (max ${Math.round(MAX_PHOTO_SIZE / (1024 * 1024))} MB).`;
  }
  return null;
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
