import multer from 'multer';

const storage = multer.memoryStorage();

const PDF_MIME_TYPES = new Set([
  'application/pdf',
  'application/x-pdf',
  'application/acrobat',
  'application/vnd.pdf',
  'text/pdf',
]);

export const hasPdfSignature = (buffer) => (
  Buffer.isBuffer(buffer) && buffer.subarray(0, 1024).includes(Buffer.from('%PDF-'))
);

const fileFilter = (req, file, cb) => {
  const extension = file.originalname?.toLowerCase().match(/\.[^.]+$/)?.[0];
  const mimeType = file.mimetype?.toLowerCase();
  const isPdfExtension = extension === '.pdf';
  const isPdfMime = PDF_MIME_TYPES.has(mimeType) || mimeType === 'application/octet-stream';

  // The signature is checked after Multer has read the in-memory buffer.
  // This metadata check blocks obvious accidental non-PDF submissions first.
  if (isPdfExtension && isPdfMime) {
    cb(null, true);
  } else {
    const error = new Error('Only PDF files are allowed (.pdf)');
    error.statusCode = 400;
    cb(error, false);
  }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } });

const IMPORT_MIME_TYPES = new Set([
  'application/pdf',
  'application/x-pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'application/json',
  'text/json',
]);
const IMPORT_EXTENSIONS = new Set(['.pdf', '.docx', '.txt', '.json']);

const importFileFilter = (req, file, cb) => {
  const extension = file.originalname?.toLowerCase().match(/\.[^.]+$/)?.[0];
  if (IMPORT_MIME_TYPES.has(file.mimetype) || IMPORT_EXTENSIONS.has(extension)) {
    cb(null, true);
  } else {
    const error = new Error('Unsupported file type. Upload a PDF, DOCX, TXT, or JSON file.');
    error.statusCode = 400;
    cb(error, false);
  }
};

export const importUpload = multer({
  storage,
  fileFilter: importFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

export default upload;
