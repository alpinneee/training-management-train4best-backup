/**
 * File ini menggantikan Prisma dengan koneksi ke API Laravel
 * 
 * Catatan: File ini dibuat untuk mempertahankan kompatibilitas dengan kode yang ada
 * yang mungkin masih mengimpor dari @/lib/utils/prisma
 */

import prisma from '../prisma';

// Re-export prisma client dari ../prisma.ts
export default prisma; 