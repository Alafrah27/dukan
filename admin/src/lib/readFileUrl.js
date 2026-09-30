/**
 * Converts a File object to a base64 data URL string.
 * Reusable across the app for any file/image upload.
 *
 * @param {File} file - The file to convert
 * @returns {Promise<string>} - Base64 data URL
 */
export const readFileAsDataUrl = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error("No file provided"));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
};

export default readFileAsDataUrl;
