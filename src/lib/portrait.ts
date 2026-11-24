// The graded portrait, encoded once per format: AVIF q64 and WebP q82 (the creative director's floors).
import { getImage } from 'astro:assets';
import portrait from '../assets/portrait/musa-portrait-graded.webp';

export const portraitWidths = [300, 420, 620, 860, 1240];
export const portraitSizes = '(max-width: 639px) 351px, min(620px, 43vw, 69svh)';
export async function portraitSources() {
  const [avif, webp, fallback] = await Promise.all([
    getImage({ src: portrait, format: 'avif', quality: 64, widths: portraitWidths }),
    getImage({ src: portrait, format: 'webp', quality: 82, widths: portraitWidths }),
    getImage({ src: portrait, format: 'webp', quality: 82, width: 620 }),
  ]);
  return { avif: avif.srcSet.attribute, webp: webp.srcSet.attribute, fallback: fallback.src, sizes: portraitSizes };
}
