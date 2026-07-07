// ForgeERP File Service 1.0
// Şimdilik LocalStorage tabanlı.
// İleride backend'e geçince sadece bu dosya değişecek.

const FILE_KEY = "forgeerp_files";

export function getFiles() {
  try {
    return JSON.parse(localStorage.getItem(FILE_KEY)) || [];
  } catch {
    return [];
  }
}

export function saveFiles(files) {
  localStorage.setItem(FILE_KEY, JSON.stringify(files));
  window.dispatchEvent(new Event("forgeerp:files-updated"));
}

export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve({
        id: crypto.randomUUID(),
        name: file.name,
        type: file.type || "unknown",
        size: file.size,
        extension: file.name.split(".").pop()?.toLowerCase() || "",
        dataUrl: reader.result,
        createdAt: new Date().toISOString(),
      });
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function addFiles({ ownerType, ownerId, files }) {
  const storedFiles = getFiles();

  const converted = await Promise.all(
    Array.from(files).map(async (file) => {
      const data = await fileToBase64(file);

      return {
        ...data,
        ownerType,
        ownerId,
      };
    })
  );

  const updated = [...converted, ...storedFiles];
  saveFiles(updated);

  return updated;
}

export function getFilesByOwner(ownerType, ownerId) {
  return getFiles().filter(
    (file) => file.ownerType === ownerType && file.ownerId === ownerId
  );
}

export function deleteFile(fileId) {
  const updated = getFiles().filter((file) => file.id !== fileId);
  saveFiles(updated);
  return updated;
}

export function formatFileSize(size) {
  const kb = size / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

export function isImageFile(file) {
  return ["jpg", "jpeg", "png", "webp", "gif"].includes(file.extension);
}