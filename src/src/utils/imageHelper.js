// Helper function to get proper image source from article/editorial board data
export const getImageSrc = (item, placeholder = 'https://placehold.co/800x600') => {
  if (!item) return placeholder;
  
  // Check for image_url field (articles) or image field (editorial boards)
  const imageData = item.image_url || item.image;
  
  if (!imageData) return placeholder;
  if (typeof imageData !== 'string') {
    // Handle Buffer-like objects from backend (e.g., { type: 'Buffer', data: [...] })
    if (imageData.type === 'Buffer' && Array.isArray(imageData.data)) {
      const bytes = new Uint8Array(imageData.data);
      let binary = '';
      for (let i = 0; i < bytes.length; i += 1) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);
      const mime = item.image_mime || 'image/png';
      return `data:${mime};base64,${base64}`;
    }
    return placeholder;
  }
  
  // If it's already a full URL, use it
  if (imageData.startsWith('http')) {
    return imageData;
  }
  
  // If it's already a data URL, use it
  if (imageData.startsWith('data:')) {
    return imageData;
  }
  
  // Construct data URL from base64 and mime type
  if (item.image_mime) {
    // Check if it's raw base64 or includes data URL prefix
    const base64Data = imageData.includes('base64,') 
      ? imageData.split('base64,')[1] 
      : imageData;
    return `data:${item.image_mime};base64,${base64Data}`;
  }
  
  // If we have base64 without mime, try to detect or use generic
  if (imageData.length > 100) {
    return `data:image/jpeg;base64,${imageData}`;
  }
  
  // Fallback placeholder
  return placeholder;
};
