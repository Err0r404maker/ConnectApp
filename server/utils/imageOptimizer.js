import sharp from 'sharp';

export const optimizeImage = async (buffer, options = {}) => {
  const { maxWidth = 1920, quality = 80 } = options;
  
  return await sharp(buffer)
    .resize(maxWidth, null, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality, progressive: true })
    .toBuffer();
};

export const createThumbnail = async (buffer) => {
  return await sharp(buffer)
    .resize(300, 300, { fit: 'cover' })
    .jpeg({ quality: 70 })
    .toBuffer();
};
