import { supabase } from './supabase';

/** Bucket público para logos, portadas, galería y avatares. Cada usuario escribe solo en su carpeta ({id}/...). */
const BUCKET = 'imagenes';

/** Redimensiona y comprime la imagen en el navegador antes de subirla */
export function comprimirImagen(file: File, maxLado: number, calidad = 0.85): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('El archivo no es una imagen válida.'));
    };
    img.onload = () => {
      URL.revokeObjectURL(url);
      const escala = Math.min(1, maxLado / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * escala);
      canvas.height = Math.round(img.height * escala);
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      // PNG conserva la transparencia (logos); el resto se convierte a JPEG
      const tipo = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      canvas.toBlob(blob => (blob ? resolve(blob) : reject(new Error('No se pudo procesar la imagen.'))), tipo, calidad);
    };
    img.src = url;
  });
}

/**
 * Comprime y sube una imagen a la carpeta del dueño (fundación o voluntario) y devuelve su URL pública.
 * En la base de datos solo se guarda esa URL, no la imagen.
 */
export async function subirImagen(duenoId: string, prefijo: string, file: File, maxLado: number, calidad = 0.85): Promise<string> {
  const blob = await comprimirImagen(file, maxLado, calidad);
  const extension = blob.type === 'image/png' ? 'png' : 'jpg';
  const ruta = `${duenoId}/${prefijo}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${extension}`;

  const { error } = await supabase.storage.from(BUCKET).upload(ruta, blob, { contentType: blob.type, cacheControl: '31536000' });
  if (error) throw error;
  return supabase.storage.from(BUCKET).getPublicUrl(ruta).data.publicUrl;
}

/** Elimina del bucket una imagen subida por la app (ignora URLs externas o imágenes antiguas en base64) */
export async function eliminarImagen(url: string | null | undefined) {
  const marcador = `/storage/v1/object/public/${BUCKET}/`;
  if (!url || !url.includes(marcador)) return;
  const ruta = decodeURIComponent(url.split(marcador)[1].split('?')[0]);
  await supabase.storage.from(BUCKET).remove([ruta]);
}
