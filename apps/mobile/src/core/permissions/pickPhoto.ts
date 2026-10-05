import * as ImagePicker from 'expo-image-picker';

export type PickedPhoto = {
  uri: string;
  mimeType: string;
  sizeBytes: number | null;
};

export type PickPhoto = () => Promise<PickedPhoto | null>;

/**
 * Abre la galería para elegir una foto cuadrada y comprimida.
 * Elegir imágenes de la galería no requiere pedir permisos (Expo SDK 54).
 */
export const pickPhoto: PickPhoto = async () => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.5,
  });
  if (result.canceled || result.assets.length === 0) return null;

  const asset = result.assets[0];
  return {
    uri: asset.uri,
    mimeType: asset.mimeType ?? 'image/jpeg',
    sizeBytes: asset.fileSize ?? null,
  };
};
