import React, { useState, useEffect } from 'react';
import axios from 'axios';
import mammoth from 'mammoth';
import './DocumentViewer.css';

const DocumentViewer = ({ file, onClose }) => {
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [viewMode, setViewMode] = useState('preview');
    const [viewerType, setViewerType] = useState('auto');

    useEffect(() => {
        if (file) {
            loadFileContent();
        }
    }, [file, viewerType]);

    const loadFileContent = async () => {
        try {
            setLoading(true);
            setError(null);

            const fileExtension = file.name.split('.').pop().toLowerCase();
            
            if (fileExtension === 'txt') {
                // For text files, load directly
                const response = await axios.get(file.url);
                setContent(response.data);
            } else if (fileExtension === 'pdf') {
                // For PDF files, use iframe
                setContent(file.url);
            } else if (['doc', 'docx'].includes(fileExtension)) {
                // For Word documents, use mammoth.js for local conversion
                await loadWordDocument();
            } else if (['xls', 'xlsx', 'ppt', 'pptx'].includes(fileExtension)) {
                // For other Office documents, try external viewers
                setContent(file.url);
            } else {
                setContent('Format file tidak didukung untuk preview');
            }
            
            setLoading(false);
        } catch (err) {
            console.error('Error loading file content:', err);
            setError('Gagal memuat konten file: ' + err.message);
            setLoading(false);
        }
    };

    const loadWordDocument = async () => {
        try {
            console.log('Loading Word document with mammoth.js...');
            
            // Fetch the file as ArrayBuffer
            const response = await fetch(file.url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const arrayBuffer = await response.arrayBuffer();
            
            // Convert .docx to HTML using mammoth
            const result = await mammoth.convertToHtml({ arrayBuffer });
            
            if (result.value) {
                setContent(result.value);
                
                // Log any warnings
                if (result.messages && result.messages.length > 0) {
                    console.warn('Mammoth conversion warnings:', result.messages);
                }
            } else {
                throw new Error('Failed to convert document');
            }
            
        } catch (err) {
            console.error('Error converting Word document:', err);
            // Fallback to external viewer
            setContent(createWordFallback());
        }
    };

    const createWordFallback = () => {
        return `
            <div class="word-fallback">
                <div class="fallback-header">
                    <h3>📄 Word Document Preview</h3>
                    <p>Konversi lokal gagal. Gunakan opsi di bawah untuk melihat dokumen:</p>
                </div>
                <div class="fallback-options-grid">
                    <div class="fallback-option">
                        <h4>🔗 Buka di Browser</h4>
                        <p>Download dan buka dengan aplikasi default</p>
                        <a href="${file.url}" target="_blank" class="fallback-btn primary">Buka File</a>
                    </div>
                    <div class="fallback-option">
                        <h4>💾 Download</h4>
                        <p>Download file untuk dibuka di Word/LibreOffice</p>
                        <a href="${file.url}" download class="fallback-btn secondary">Download</a>
                    </div>
                    <div class="fallback-option">
                        <h4>✏️ Edit dengan OnlyOffice</h4>
                        <p>Gunakan editor lengkap untuk melihat dan mengedit</p>
                        <button onclick="window.useOnlyOffice && window.useOnlyOffice()" class="fallback-btn editor">Buka Editor</button>
                    </div>
                </div>
            </div>
        `;
    };

    const getFileIcon = (extension) => {
        switch (extension) {
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

    const getFileType = (extension) => {
        switch (extension) {
            case 'doc':
            case 'docx':
                return 'Word';
            case 'xls':
            case 'xlsx':
                return 'Excel';
            case 'ppt':
            case 'pptx':
                return 'PowerPoint';
            case 'pdf':
                return 'PDF';
            case 'txt':
                return 'Text';
            default:
                return 'Document';
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const renderContent = () => {
        const fileExtension = file.name.split('.').pop().toLowerCase();
        
        if (fileExtension === 'txt') {
            return (
                <div className="text-content">
                    <div className="text-header">
                        <h3>📝 Text Document</h3>
                        <div className="text-meta">
                            <span>Size: {formatFileSize(file.size)}</span>
                            <span>Encoding: UTF-8</span>
                        </div>
                    </div>
                    <div className="text-body">
                        <pre>{content}</pre>
                    </div>
                </div>
            );
        } else if (fileExtension === 'pdf') {
            return (
                <div className="pdf-viewer">
                    <div className="pdf-header">
                        <h3>📕 PDF Document</h3>
                        <div className="pdf-controls">
                            <a href={file.url} target="_blank" rel="noopener noreferrer" className="control-btn">
                                🔗 Open in New Tab
                            </a>
                            <a href={file.url} download className="control-btn">
                                💾 Download
                            </a>
                        </div>
                    </div>
                    <iframe
                        src={`${content}#toolbar=1&navpanes=1&scrollbar=1`}
                        width="100%"
                        height="100%"
                        style={{ border: 'none', minHeight: '600px' }}
                        title={file.name}
                    />
                </div>
            );
        } else if (['doc', 'docx'].includes(fileExtension)) {
            return (
                <div className="word-viewer">
                    <div className="word-header">
                        <h3>📄 Word Document</h3>
                        <div className="word-controls">
                            <select 
                                className="viewer-select"
                                value={viewerType}
                                onChange={(e) => setViewerType(e.target.value)}
                            >
                                <option value="auto">Auto (Mammoth.js)</option>
                                <option value="download">Download & Open</option>
                                <option value="external">External Viewer</option>
                            </select>
                            <a href={file.url} target="_blank" rel="noopener noreferrer" className="control-btn">
                                🔗 Open Original
                            </a>
                            <a href={file.url} download className="control-btn">
                                💾 Download
                            </a>
                        </div>
                    </div>
                    <div className="word-content">
                        {viewerType === 'auto' ? (
                            <div 
                                className="word-html-content"
                                dangerouslySetInnerHTML={{ __html: content }}
                            />
                        ) : viewerType === 'external' ? (
                            <iframe
                                src={`https://docs.google.com/gview?url=${encodeURIComponent(file.url)}&embedded=true`}
                                width="100%"
                                height="600px"
                                style={{ border: 'none' }}
                                title={file.name}
                                onError={() => {
                                    setContent(createWordFallback());
                                }}
                            />
                        ) : (
                            <div 
                                className="word-html-content"
                                dangerouslySetInnerHTML={{ __html: createWordFallback() }}
                            />
                        )}
                    </div>
                </div>
            );
        } else if (['xls', 'xlsx', 'ppt', 'pptx'].includes(fileExtension)) {
            // Use external viewers for Excel and PowerPoint
            const googleDocsUrl = `https://docs.google.com/gview?url=${encodeURIComponent(file.url)}&embedded=true`;
            const officeOnlineUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(file.url)}`;
            
            return (
                <div className="office-viewer">
                    <div className="office-header">
                        <h3>{getFileIcon(fileExtension)} {getFileType(fileExtension)} Document</h3>
                        <div className="viewer-options">
                            <select 
                                className="viewer-select"
                                onChange={(e) => {
                                    const iframe = document.querySelector('.office-iframe');
                                    if (iframe) {
                                        iframe.src = e.target.value;
                                    }
                                }}
                                defaultValue={googleDocsUrl}
                            >
                                <option value={googleDocsUrl}>Google Docs Viewer</option>
                                <option value={officeOnlineUrl}>Office Online Viewer</option>
                                <option value={file.url}>Direct Download</option>
                            </select>
                            <a href={file.url} target="_blank" rel="noopener noreferrer" className="control-btn">
                                🔗 Open Original
                            </a>
                            <a href={file.url} download className="control-btn">
                                💾 Download
                            </a>
                        </div>
                    </div>
                    <div className="office-content">
                        <iframe
                            className="office-iframe"
                            src={googleDocsUrl}
                            width="100%"
                            height="100%"
                            style={{ border: 'none', minHeight: '600px' }}
                            title={file.name}
                            onError={(e) => {
                                console.log('Iframe error, trying alternative viewer');
                                e.target.src = officeOnlineUrl;
                            }}
                        />
                        <div className="fallback-message">
                            <p>Jika dokumen tidak tampil dengan baik, coba:</p>
                            <div className="fallback-options">
                                <a href={file.url} target="_blank" rel="noopener noreferrer" className="fallback-btn">
                                    🔗 Buka di Tab Baru
                                </a>
                                <a href={file.url} download className="fallback-btn">
                                    💾 Download File
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            );
        } else {
            return (
                <div className="unsupported-format">
                    <div className="unsupported-icon">❓</div>
                    <h3>Format Tidak Didukung</h3>
                    <p>Format file <strong>{fileExtension.toUpperCase()}</strong> belum didukung untuk preview.</p>
                    <div className="unsupported-actions">
                        <a href={file.url} target="_blank" rel="noopener noreferrer" className="action-btn">
                            🔗 Buka di Tab Baru
                        </a>
                        <a href={file.url} download className="action-btn">
                            💾 Download File
                        </a>
                    </div>
                </div>
            );
        }
    };

    if (!file) return null;

    return (
        <div className="document-viewer-modal">
            <div className="viewer-header">
                <div className="header-left">
                    <h3>👁️ {file.name}</h3>
                    <div className="viewer-controls">
                        <button 
                            onClick={() => setViewMode('preview')}
                            className={`mode-btn ${viewMode === 'preview' ? 'active' : ''}`}
                        >
                            📖 Content
                        </button>
                        <button 
                            onClick={() => setViewMode('info')}
                            className={`mode-btn ${viewMode === 'info' ? 'active' : ''}`}
                        >
                            ℹ️ Info
                        </button>
                    </div>
                </div>
                <button onClick={onClose} className="close-btn">✕</button>
            </div>

            <div className="viewer-content">
                {loading && (
                    <div className="viewer-loading">
                        <div className="loading-spinner"></div>
                        <div>Memuat dokumen...</div>
                        <div className="loading-subtitle">
                            {file.name.endsWith('.docx') ? 'Mengkonversi Word document...' : 'Mengakses konten asli file...'}
                        </div>
                    </div>
                )}

                {error && (
                    <div className="viewer-error">
                        <div className="error-icon">⚠️</div>
                        <div className="error-message">{error}</div>
                        <div className="error-help">
                            <p><strong>Alternatif untuk melihat dokumen:</strong></p>
                            <div className="error-actions">
                                <a href={file.url} download className="error-btn">
                                    💾 Download File
                                </a>
                                <a href={file.url} target="_blank" rel="noopener noreferrer" className="error-btn">
                                    🔗 Buka di Browser
                                </a>
                            </div>
                        </div>
                        <button onClick={loadFileContent} className="retry-btn">
                            🔄 Coba Lagi
                        </button>
                    </div>
                )}

                {!loading && !error && viewMode === 'preview' && (
                    <div className="content-container">
                        {renderContent()}
                    </div>
                )}

                {!loading && !error && viewMode === 'info' && (
                    <div className="file-info-panel">
                        <div className="info-card">
                            <div className="info-header">
                                <div className="file-icon-large">
                                    {getFileIcon(file.name.split('.').pop().toLowerCase())}
                                </div>
                                <div className="info-details">
                                    <h3>{file.name}</h3>
                                    <p className="file-type">
                                        {getFileType(file.name.split('.').pop().toLowerCase())} Document
                                    </p>
                                </div>
                            </div>
                            
                            <div className="info-section">
                                <h4>📊 File Properties</h4>
                                <div className="property-grid">
                                    <div className="property">
                                        <span className="label">Size:</span>
                                        <span className="value">{formatFileSize(file.size)}</span>
                                    </div>
                                    <div className="property">
                                        <span className="label">Upload Date:</span>
                                        <span className="value">{new Date(file.uploadDate).toLocaleString('id-ID')}</span>
                                    </div>
                                    <div className="property">
                                        <span className="label">Type:</span>
                                        <span className="value">{file.name.split('.').pop().toUpperCase()}</span>
                                    </div>
                                    <div className="property">
                                        <span className="label">Viewer:</span>
                                        <span className="value">
                                            {file.name.endsWith('.docx') ? 'Mammoth.js (Local)' : 'Native Browser'}
                                        </span>
                                    </div>
                                    <div className="property">
                                        <span className="label">URL:</span>
                                        <span className="value">
                                            <a href={file.url} target="_blank" rel="noopener noreferrer">
                                                Open in new tab
                                            </a>
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="info-section">
                                <h4>⚡ Quick Actions</h4>
                                <div className="action-buttons">
                                    <a href={file.url} download className="action-button download">
                                        💾 Download Original
                                    </a>
                                    <a href={file.url} target="_blank" rel="noopener noreferrer" className="action-button open">
                                        🔗 Open in Browser
                                    </a>
                                    {file.name.endsWith('.docx') && (
                                        <button 
                                            onClick={() => setViewerType(viewerType === 'auto' ? 'external' : 'auto')}
                                            className="action-button viewer"
                                        >
                                            🔄 Switch Viewer
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="info-section">
                                <h4>🔧 Viewer Technology</h4>
                                <p className="info-text">
                                    {file.name.endsWith('.docx') ? 
                                        'File Word ini dikonversi secara lokal menggunakan Mammoth.js untuk menampilkan konten tanpa memerlukan akses internet.' :
                                        'File ini ditampilkan menggunakan viewer bawaan browser atau layanan eksternal.'
                                    }
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DocumentViewer; 