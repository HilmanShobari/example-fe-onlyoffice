# OnlyOffice Document Manager - React Integration

Aplikasi React untuk mengelola dan mengedit dokumen menggunakan OnlyOffice Document Server dengan komponen resmi `@onlyoffice/document-editor-react`.

## Features

- ✅ **Upload dokumen** dengan drag & drop support
- ✅ **View/Edit dokumen** menggunakan OnlyOffice Document Server
- ✅ **Support multiple format**: Word (.doc/.docx), Excel (.xls/.xlsx), PowerPoint (.ppt/.pptx), PDF, dan text files
- ✅ **Real-time editing** dan collaboration
- ✅ **File management** (upload, delete, list)
- ✅ **Responsive design** dengan modern UI
- ✅ **Error handling** dan troubleshooting guide

## Architecture

- **Frontend**: React app (localhost:3000) dengan `@onlyoffice/document-editor-react`
- **Backend**: Express server (localhost:3001) dengan API endpoints
- **OnlyOffice**: Document Server (localhost:8888) dalam Docker container

## Installation & Setup

### 1. Prerequisites

- Node.js (14+ recommended)
- Docker (untuk OnlyOffice Document Server)
- Git

### 2. Clone Repository

```bash
git clone <repository-url>
cd example-fe
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Setup OnlyOffice Document Server

Jalankan OnlyOffice Document Server menggunakan Docker:

```bash
docker run -i -t -d -p 8888:80 --restart=always onlyoffice/documentserver
```

### 5. Configure OnlyOffice

Buka OnlyOffice Management interface di `http://localhost:8888/Management.aspx?type=17` dan set:

- **Document Editing Service Address**: `http://localhost:8888/`
- **Document Service address for requests from Community Server**: `http://localhost:8888/`
- **Community Server address for requests from Document Service**: `http://localhost:3001/`

### 6. Run Application

```bash
npm run dev
```

Ini akan menjalankan:

- Backend server di `http://localhost:3001`
- React app di `http://localhost:3000`

## Component Architecture

### OnlyOfficeEditor Component

Menggunakan komponen resmi `@onlyoffice/document-editor-react` dengan features:

```javascript
import { DocumentEditor } from '@onlyoffice/document-editor-react';

<DocumentEditor id={`onlyoffice-editor-${file.id}`} documentServerUrl="http://localhost:8888/" config={config} events_onDocumentReady={onDocumentReady} events_onDocumentStateChange={onDocumentStateChange} events_onError={onError} onLoadComponentError={onLoadComponentError} height="100%" width="100%" />;
```

### Key Features:

1. **Automatic script loading**: Komponen official menangani loading OnlyOffice API secara otomatis
2. **Event handling**: Built-in event handlers untuk document ready, state changes, dan errors
3. **Error management**: Proper error handling dengan user-friendly messages
4. **Mode switching**: Support untuk Edit/View mode switching
5. **Responsive design**: Full width/height dengan responsive layout

## API Endpoints

### Backend (localhost:3001)

- `GET /api/health` - Health check
- `GET /api/files` - List uploaded files
- `POST /api/upload` - Upload file
- `GET /api/file/:id` - Get file configuration for OnlyOffice
- `POST /api/callback/:id` - OnlyOffice callback untuk saving
- `DELETE /api/file/:id` - Delete file
- `GET /api/onlyoffice/healthcheck` - OnlyOffice server health check

### OnlyOffice Document Server (localhost:8888)

- `/healthcheck` - Health check
- `/web-apps/apps/api/documents/api.js` - OnlyOffice API script
- File serving dan document processing

## File Configuration

OnlyOffice configuration yang digunakan:

```javascript
{
    document: {
        fileType: "docx",           // File extension
        key: "unique-document-key", // MD5 hash untuk versioning
        title: "document.docx",     // Display name
        url: "http://localhost:3001/uploads/document.docx"
    },
    documentType: "text",           // text/spreadsheet/presentation
    editorConfig: {
        mode: "edit",               // edit/view
        lang: "id",                 // Language
        callbackUrl: "http://localhost:3001/api/callback/document.docx",
        user: {
            id: "user-1",
            name: "User"
        }
    },
    height: "100%",
    width: "100%"
}
```

## Troubleshooting

### Common Issues:

1. **OnlyOffice tidak load**:

   - Pastikan Docker container berjalan di port 8888
   - Check `http://localhost:8888/healthcheck` harus return `true`
   - Periksa OnlyOffice configuration di Management panel

2. **CORS Errors**:

   - Backend sudah menggunakan proxy untuk OnlyOffice requests
   - Pastikan CORS settings di backend sudah benar

3. **File tidak bisa dibuka**:

   - Check format file yang didukung
   - Pastikan file size tidak melebihi 50MB limit
   - Periksa logs di browser console dan backend

4. **Infinite loop requests**:
   - Sudah diatasi dengan penggunaan komponen official
   - Rate limiting di backend mencegah spam requests

### Development

```bash
# Jalankan backend saja
npm run server

# Jalankan frontend saja
npm start

# Jalankan keduanya
npm run dev
```

### Production Build

```bash
npm run build
```

## Dependencies

### Main Dependencies:

- `@onlyoffice/document-editor-react` - Official OnlyOffice React component
- `react` - React framework
- `axios` - HTTP client
- `express` - Backend server
- `multer` - File upload handling
- `cors` - CORS middleware

### Key Benefits dari Official Component:

1. **Maintenance**: Officially maintained oleh OnlyOffice team
2. **Documentation**: [Complete API documentation](https://api.onlyoffice.com/docs/docs-api/get-started/frontend-frameworks/react/)
3. **Stability**: Tested dan stable untuk production use
4. **Features**: Built-in error handling, event management, dan lifecycle control
5. **Updates**: Regular updates dengan OnlyOffice Document Server

## References

- [OnlyOffice React Component Documentation](https://api.onlyoffice.com/docs/docs-api/get-started/frontend-frameworks/react/)
- [OnlyOffice Docs API](https://api.onlyoffice.com/docs/docs-api/)
- [OnlyOffice Docker Installation](https://github.com/ONLYOFFICE/Docker-DocumentServer)
