// Generate a QR code image URL using a free API
export function generateQRCodeUrl(text: string, size: number = 200): string {
  const encoded = encodeURIComponent(text);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}`;
}
