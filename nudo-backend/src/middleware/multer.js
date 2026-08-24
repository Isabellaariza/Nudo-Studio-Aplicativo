import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Asegura que la carpeta de subidas exista
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuración de almacenamiento
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // Las imágenes se guardarán en la carpeta "uploads/"
  },
  filename: (req, file, cb) => {
    // Genera un nombre único: timestamp-nombreoriginal
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// Filtro para aceptar solo imágenes o PDFs
const fileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png|webp|pdf/;
  const mimetype = filetypes.test(file.mimetype);
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('Solo se permiten imágenes (jpeg, jpg, png, webp) o archivos PDF'));
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Límite de 5MB por archivo
  fileFilter: fileFilter
});

export default upload;