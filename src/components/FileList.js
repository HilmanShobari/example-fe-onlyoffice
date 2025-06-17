import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './FileList.css';

const FileList = ({ refreshTrigger, onFileSelect }) => {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchFiles();
    }, [refreshTrigger]);

    const fetchFiles = async () => {
        try {
            setLoading(true);
            const response = await axios.get('http://localhost:3001/api/files');
            if (response.data.success) {
                setFiles(response.data.files);
            }
        } catch (err) {
            setError('Gagal memuat daftar file');
            console.error('Error fetching files:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (fileId) => {
        if (window.confirm('Apakah Anda yakin ingin menghapus file ini?')) {
            try {
                const response = await axios.delete(`http://localhost:3001/api/file/${fileId}`);
                if (response.data.success) {
                    setFiles(files.filter(file => file.id !== fileId));
                    alert('File berhasil dihapus');
                }
            } catch (err) {
                alert('Gagal menghapus file');
                console.error('Error deleting file:', err);
            }
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getFileIcon = (filename) => {
        const ext = filename.split('.').pop().toLowerCase();
        switch (ext) {
            case 'doc':
            case 'docx':
                return '📄';
            case 'xls':
            case 'xlsx':
                return '📊';
            case 'ppt':
            case 'pptx':
                return '📋';
            case 'pdf':
                return '📕';
            case 'txt':
                return '📝';
            default:
                return '📄';
        }
    };

    if (loading) {
        return (
            <div className="file-list-container">
                <h3>Daftar File</h3>
                <div className="loading">Memuat file...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="file-list-container">
                <h3>Daftar File</h3>
                <div className="error">{error}</div>
                <button onClick={fetchFiles} className="retry-btn">Coba Lagi</button>
            </div>
        );
    }

    return (
        <div className="file-list-container">
            <div className="file-list-header">
                <h3>Daftar File ({files.length})</h3>
                <button onClick={fetchFiles} className="refresh-btn">🔄 Refresh</button>
            </div>
            
            {files.length === 0 ? (
                <div className="no-files">
                    <div className="no-files-icon">📁</div>
                    <div className="no-files-text">Belum ada file yang diupload</div>
                </div>
            ) : (
                <div className="file-grid">
                    {files.map((file) => (
                        <div key={file.id} className="file-card">
                            <div className="file-icon">
                                {getFileIcon(file.name)}
                            </div>
                            <div className="file-details">
                                <div className="file-name" title={file.name}>
                                    {file.name}
                                </div>
                                <div className="file-meta">
                                    <span className="file-size">{formatFileSize(file.size)}</span>
                                    <span className="file-date">{formatDate(file.uploadDate)}</span>
                                </div>
                            </div>
                            <div className="file-actions">
                                <button
                                    onClick={() => onFileSelect(file)}
                                    className="action-btn edit-btn"
                                    title="Edit/View"
                                >
                                    ✏️
                                </button>
                                <a
                                    href={file.url}
                                    download
                                    className="action-btn download-btn"
                                    title="Download"
                                >
                                    💾
                                </a>
                                <button
                                    onClick={() => handleDelete(file.id)}
                                    className="action-btn delete-btn"
                                    title="Delete"
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default FileList; 