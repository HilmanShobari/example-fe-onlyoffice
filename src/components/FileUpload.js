import React, { useState } from 'react';
import axios from 'axios';
import './FileUpload.css';

const FileUpload = ({ onUploadSuccess }) => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (file) {
            // Check file size (max 50MB)
            if (file.size > 50 * 1024 * 1024) {
                alert('File terlalu besar. Maksimal 50MB.');
                return;
            }
            
            // Check file type
            const allowedTypes = ['application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-word',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                'application/vnd.ms-powerpoint',
                'application/pdf',
                'text/plain'];
            
            if (!allowedTypes.includes(file.type)) {
                alert('Tipe file tidak didukung. Hanya mendukung Word, Excel, PowerPoint, PDF, dan text files.');
                return;
            }
            
            setSelectedFile(file);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            alert('Pilih file terlebih dahulu');
            return;
        }

        setUploading(true);
        setUploadProgress(0);

        const formData = new FormData();
        formData.append('document', selectedFile);

        try {
            const response = await axios.post('https://example-be-onlyoffice.vercel.app/api/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                onUploadProgress: (progressEvent) => {
                    const progress = Math.round(
                        (progressEvent.loaded * 100) / progressEvent.total
                    );
                    setUploadProgress(progress);
                }
            });

            if (response.data.success) {
                alert('File berhasil diupload!');
                setSelectedFile(null);
                setUploadProgress(0);
                if (onUploadSuccess) {
                    onUploadSuccess(response.data.file);
                }
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('Gagal mengupload file: ' + (error.response?.data?.error || error.message));
        } finally {
            setUploading(false);
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="file-upload">
            <div className="upload-area">
                <input
                    type="file"
                    id="file-input"
                    onChange={handleFileSelect}
                    accept=".doc,.docx,.xls,.xlsx,.ppt,.pptx,.pdf,.txt"
                    style={{ display: 'none' }}
                />
                <label htmlFor="file-input" className="file-input-label">
                    <div className="upload-icon">📁</div>
                    <div className="upload-text">
                        Klik untuk memilih file atau drag & drop
                    </div>
                    <div className="upload-subtitle">
                        Mendukung: Word, Excel, PowerPoint, PDF, Text (Maks. 50MB)
                    </div>
                </label>
            </div>

            {selectedFile && (
                <div className="selected-file">
                    <div className="file-info">
                        <div className="file-name">📄 {selectedFile.name}</div>
                        <div className="file-size">{formatFileSize(selectedFile.size)}</div>
                    </div>
                    <button 
                        className="upload-btn"
                        onClick={handleUpload}
                        disabled={uploading}
                    >
                        {uploading ? 'Mengupload...' : 'Upload'}
                    </button>
                </div>
            )}

            {uploading && (
                <div className="upload-progress">
                    <div className="progress-bar">
                        <div 
                            className="progress-fill"
                            style={{ width: `${uploadProgress}%` }}
                        ></div>
                    </div>
                    <div className="progress-text">{uploadProgress}%</div>
                </div>
            )}
        </div>
    );
};

export default FileUpload; 