/**
 * Membaca dan mengompres file bukti pembayaran di browser menjadi format WebP hemat ukuran (~50-80 KB).
 * Mendukung foto langsung dari kamera HP beresolusi tinggi tanpa membebani penyimpanan/database.
 */
export async function fileToDataUrl(file: File, maxWidth = 800, quality = 0.75): Promise<string> {
  // Batas toleransi file asli sebelum kompresi (maksimal 15 MB)
  const MAX_ORIGINAL_BYTES = 15 * 1024 * 1024;
  if (file.size > MAX_ORIGINAL_BYTES) {
    throw new Error("Ukuran foto maksimal 15 MB.");
  }

  // Jika bukan gambar (misal dokumen/PDF), kembalikan Data URL biasa
  if (!file.type.startsWith("image/")) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("Gagal membaca file bukti."));
      reader.readAsDataURL(file);
    });
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Resize proporsional dengan batas maksimal lebar/tinggi 800px
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxWidth) {
            width = Math.round((width * maxWidth) / height);
            height = maxWidth;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          // Fallback jika canvas context gagal
          resolve(String(e.target?.result));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Kompres ke WebP (fallback ke JPEG jika browser lama)
        try {
          const webpDataUrl = canvas.toDataURL("image/webp", quality);
          if (webpDataUrl.startsWith("data:image/webp")) {
            resolve(webpDataUrl);
            return;
          }
        } catch {
          // Abaikan jika WebP tidak didukung
        }

        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => reject(new Error("Gagal memproses gambar bukti bayar."));
      img.src = String(e.target?.result);
    };
    reader.onerror = () => reject(new Error("Gagal membaca file bukti."));
    reader.readAsDataURL(file);
  });
}
