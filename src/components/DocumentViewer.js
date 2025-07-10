import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import mammoth from 'mammoth';
import { renderAsync } from 'docx-preview';
import DocViewer, { DocViewerRenderers } from 'react-doc-viewer';
import './DocumentViewer.css';

const DocumentViewer = ({ file, onClose }) => {
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [viewMode, setViewMode] = useState('preview');
    const [viewerType, setViewerType] = useState('auto');
    const docxPreviewRef = useRef(null);

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
                const token = localStorage.getItem('token');
                const response = await axios.get(file.url, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });
                setContent(response.data);
            } else if (fileExtension === 'pdf') {
                // For PDF files, use iframe
                setContent(file.url);
            } else if (['doc', 'docx'].includes(fileExtension)) {
                // For Word documents, use selected viewer
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
            console.log(`Loading Word document with ${viewerType} viewer...`);
            
            // Fetch the file as ArrayBuffer
            const response = await fetch(file.url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const arrayBuffer = await response.arrayBuffer();
            
            if (viewerType === 'mammoth') {
                // Use Mammoth.js
                const result = await mammoth.convertToHtml({ arrayBuffer });
                if (result.value) {
                    setContent(result.value);
                    if (result.messages && result.messages.length > 0) {
                        console.warn('Mammoth conversion warnings:', result.messages);
                    }
                } else {
                    throw new Error('Failed to convert document with Mammoth');
                }
            } else if (viewerType === 'docx-preview') {
                // Use docx-preview
                if (docxPreviewRef.current) {
                    // Clear previous content
                    docxPreviewRef.current.innerHTML = '';
                    
                    // Render with docx-preview
                    await renderAsync(arrayBuffer, docxPreviewRef.current, null, {
                        className: 'docx-preview-container',
                        inWrapper: true,
                        ignoreWidth: false,
                        ignoreHeight: false,
                        ignoreFonts: false,
                        breakPages: true,
                        ignoreLastRenderedPageBreak: true,
                        experimental: true,
                        trimXmlDeclaration: true,
                        useBase64URL: false,
                        useMathMLPolyfill: true,
                        showChanges: false,
                        debug: false
                    });
                    
                    setContent('docx-preview-rendered');
                }
            } else if (viewerType === 'react-doc-viewer') {
                // Use react-doc-viewer (will be handled in render)
                setContent(file.url);
            } else {
                // Auto mode - try Mammoth first
                const result = await mammoth.convertToHtml({ arrayBuffer });
                if (result.value) {
                    setContent(result.value);
                    if (result.messages && result.messages.length > 0) {
                        console.warn('Mammoth conversion warnings:', result.messages);
                    }
                } else {
                    throw new Error('Failed to convert document');
                }
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
                    <p>Konversi dengan ${viewerType} gagal. Gunakan opsi di bawah untuk melihat dokumen:</p>
                </div>
                <div class="fallback-options-grid">
                    <div class="fallback-option">
                        <h4>🔄 Coba Viewer Lain</h4>
                        <p>Gunakan viewer yang berbeda untuk konversi</p>
                        <button onclick="window.switchViewer && window.switchViewer()" class="fallback-btn primary">Switch Viewer</button>
                    </div>
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

    // Add window function for fallback buttons
    useEffect(() => {
        window.switchViewer = () => {
            const viewers = ['mammoth', 'docx-preview', 'react-doc-viewer', 'external'];
            const currentIndex = viewers.indexOf(viewerType);
            const nextIndex = (currentIndex + 1) % viewers.length;
            setViewerType(viewers[nextIndex]);
        };
        
        window.useOnlyOffice = () => {
            // This would trigger OnlyOffice editor - implement as needed
            console.log('Opening OnlyOffice editor...');
        };
        
        return () => {
            delete window.switchViewer;
            delete window.useOnlyOffice;
        };
    }, [viewerType]);

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

    const getViewerName = (type) => {
        switch (type) {
            case 'mammoth':
                return 'Mammoth.js';
            case 'docx-preview':
                return 'DOCX Preview';
            case 'react-doc-viewer':
                return 'React Doc Viewer';
            case 'external':
                return 'External Viewer';
            default:
                return 'Auto';
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
                                <option value="auto">🔄 Auto (Mammoth.js)</option>
                                <option value="mammoth">🔤 Mammoth.js</option>
                                <option value="docx-preview">📖 DOCX Preview</option>
                                <option value="react-doc-viewer">⚛️ React Doc Viewer</option>
                                <option value="external">🌐 External Viewer</option>
                                <option value="download">💾 Download & Open</option>
                            </select>
                            <span className="viewer-info">
                                Using: {getViewerName(viewerType)}
                            </span>
                            <a href={file.url} target="_blank" rel="noopener noreferrer" className="control-btn">
                                🔗 Open Original
                            </a>
                            <a href={file.url} download className="control-btn">
                                💾 Download
                            </a>
                        </div>
                    </div>
                    <div className="word-content">
                        {viewerType === 'mammoth' || viewerType === 'auto' ? (
                            <div 
                                className="word-html-content mammoth-viewer"
                                dangerouslySetInnerHTML={{ __html: content }}
                            />
                        ) : viewerType === 'docx-preview' ? (
                            <div className="docx-preview-wrapper">
                                <div 
                                    ref={docxPreviewRef}
                                    className="docx-preview-container"
                                />
                            </div>
                        ) : viewerType === 'react-doc-viewer' ? (
                            <div className="react-doc-viewer-wrapper">
                                <DocViewer
                                    documents={[{ 
                                        uri: file.url,
                                        fileName: file.name,
                                        fileType: fileExtension
                                    }]}
                                    pluginRenderers={DocViewerRenderers}
                                    config={{
                                        header: {
                                            disableHeader: false,
                                            disableFileName: false,
                                            retainURLParams: false
                                        },
                                        csvDelimiter: ",",
                                        pdfZoom: {
                                            defaultZoom: 1.1,
                                            zoomJump: 0.2
                                        },
                                        pdfVerticalScrollByDefault: true
                                    }}
                                    style={{
                                        width: '100%',
                                        height: '600px'
                                    }}
                                />
                            </div>
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
                            {file.name.endsWith('.docx') ? 
                                `Mengkonversi dengan ${getViewerName(viewerType)}...` : 
                                'Mengakses konten asli file...'
                            }
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
                                <button 
                                    onClick={() => {
                                        const viewers = ['mammoth', 'docx-preview', 'react-doc-viewer', 'external'];
                                        const currentIndex = viewers.indexOf(viewerType);
                                        const nextIndex = (currentIndex + 1) % viewers.length;
                                        setViewerType(viewers[nextIndex]);
                                    }}
                                    className="error-btn"
                                >
                                    🔄 Coba Viewer Lain
                                </button>
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
                                        <span className="label">Current Viewer:</span>
                                        <span className="value viewer-name">
                                            {getViewerName(viewerType)}
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
                                            onClick={() => {
                                                const viewers = ['mammoth', 'docx-preview', 'react-doc-viewer', 'external'];
                                                const currentIndex = viewers.indexOf(viewerType);
                                                const nextIndex = (currentIndex + 1) % viewers.length;
                                                setViewerType(viewers[nextIndex]);
                                            }}
                                            className="action-button viewer"
                                        >
                                            🔄 Switch Viewer ({getViewerName(viewerType)})
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="info-section">
                                <h4>🔧 Available Viewers</h4>
                                {file.name.endsWith('.docx') ? (
                                    <div className="viewer-comparison">
                                        <div className="viewer-option">
                                            <h5>🔤 Mammoth.js</h5>
                                            <p>Konversi HTML lokal, formatting baik, cepat</p>
                                        </div>
                                        <div className="viewer-option">
                                            <h5>📖 DOCX Preview</h5>
                                            <p>Rendering native, layout akurat, styling lengkap</p>
                                        </div>
                                        <div className="viewer-option">
                                            <h5>⚛️ React Doc Viewer</h5>
                                            <p>Multi-format support, interactive UI, zoom controls</p>
                                        </div>
                                        <div className="viewer-option">
                                            <h5>🌐 External Viewer</h5>
                                            <p>Google Docs integration, cloud processing</p>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="info-text">
                                        File ini menggunakan viewer bawaan browser atau layanan eksternal.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DocumentViewer; 