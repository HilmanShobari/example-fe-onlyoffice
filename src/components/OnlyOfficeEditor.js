import React, { useState, useEffect, useCallback } from 'react';
import { DocumentEditor } from "@onlyoffice/document-editor-react";
import axios from 'axios';
import './OnlyOfficeEditor.css';

const OnlyOfficeEditor = ({ file, onClose }) => {
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editorMode, setEditorMode] = useState('edit');
    const [saving, setSaving] = useState(false);

    // Load file configuration from backend
    const loadFileConfig = useCallback(async () => {
        if (!file?.id) return;

        try {
            setLoading(true);
            setError(null);

            console.log('Loading config for file:', file.id);
            
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/file/${file.id}`, {
                timeout: 10000,
                headers: {
                    'ngrok-skip-browser-warning': 'true',
                },
            });

            if (response.data.success) {
                const fileConfig = response.data.config;
                
                // Update mode in config
                const updatedConfig = {
                    ...fileConfig,
                    editorConfig: {
                        ...fileConfig.editorConfig,
                        mode: editorMode
                    }
                };
                
                setConfig(updatedConfig);
                setLoading(false);
                console.log('Config loaded successfully:', updatedConfig);
            } else {
                throw new Error('Failed to load file configuration');
            }
        } catch (err) {
            console.error('Error loading config:', err);
            setError('Gagal memuat konfigurasi file: ' + (err.response?.data?.error || err.message));
            setLoading(false);
        }
    }, [file?.id, editorMode]);

    // Load config when component mounts or file/mode changes
    useEffect(() => {
        loadFileConfig();
    }, [loadFileConfig]);

    // Event handlers for OnlyOffice editor
    const onDocumentReady = useCallback((event) => {
        console.log("Document is loaded and ready");
        setLoading(false);
    }, []);

    const onLoadComponentError = useCallback((errorCode, errorDescription) => {
        console.error("OnlyOffice component error:", errorCode, errorDescription);
        let errorMessage = "Error loading OnlyOffice editor";
        
        switch (errorCode) {
            case -1: // Unknown error loading component
                errorMessage = "Unknown error loading component: " + errorDescription;
                break;
            case -2: // Error load DocsAPI from document server
                errorMessage = "Error loading DocsAPI from document server. Please check if OnlyOffice is running on " + process.env.REACT_APP_ONLYOFFICE_URL;
                break;
            case -3: // DocsAPI is not defined
                errorMessage = "DocsAPI is not defined. Document server may not be accessible.";
                break;
            default:
                errorMessage = errorDescription || "Unknown error occurred";
        }
        
        setError(errorMessage);
        setLoading(false);
    }, []);

    const onDocumentStateChange = useCallback((event) => {
        console.log("Document state changed:", event);
    }, []);

    const onInfo = useCallback((event) => {
        console.log("OnlyOffice info:", event);
    }, []);

    const onWarning = useCallback((event) => {
        console.warn("OnlyOffice warning:", event);
    }, []);

    const onError = useCallback((event) => {
        console.error("OnlyOffice editor error:", event);
        setError("Editor error: " + (event.data || "Unknown error"));
    }, []);

    // Handle mode change
    const handleModeChange = useCallback((newMode) => {
        if (newMode !== editorMode) {
            setEditorMode(newMode);
            setLoading(true);
        }
    }, [editorMode]);

    // Handle retry
    const handleRetry = useCallback(() => {
        setError(null);
        setLoading(true);
        loadFileConfig();
    }, [loadFileConfig]);

    // Handle save changes
    const handleSaveChanges = useCallback(async () => {
        if (!file?.id || saving) return;

        try {
            setSaving(true);
            console.log('Saving changes for file:', file.id);
            
            const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/save-changes`, {
                fileId: file.id,
                fileName: file.name,
                documentKey: config?.document?.key || ''
            }, {
                timeout: 10000,
                headers: {
                    'ngrok-skip-browser-warning': 'true',
                },
            });

            if (response.data.success) {
                console.log('Save changes successful');
                // Close the editor modal
                onClose();
            } else {
                throw new Error('Failed to save changes');
            }
        } catch (err) {
            console.error('Error saving changes:', err);
            setError('Gagal menyimpan perubahan: ' + (err.response?.data?.error || err.message));
        } finally {
            setSaving(false);
        }
    }, [file?.id, file?.name, config?.document?.key, saving, onClose]);

    if (!file) {
        return null;
    }

    return (
        <div className="onlyoffice-modal">
            <div className="onlyoffice-header">
                <div className="header-left">
                    <h3>📄 {file.name}</h3>
                    <div className="editor-controls">
                        <button 
                            onClick={() => handleModeChange('edit')}
                            className={`mode-btn ${editorMode === 'edit' ? 'active' : ''}`}
                            disabled={loading || error}
                        >
                            ✏️ Edit
                        </button>
                        <button 
                            onClick={() => handleModeChange('view')}
                            className={`mode-btn ${editorMode === 'view' ? 'active' : ''}`}
                            disabled={loading || error}
                        >
                            👁️ View
                        </button>
                    </div>
                </div>
                <div className="header-right">
                    <button 
                        onClick={handleSaveChanges}
                        className={`save-btn ${saving ? 'saving' : ''}`}
                        disabled={saving || loading || error || editorMode === 'view'}
                        title="Simpan perubahan dan tutup editor"
                    >
                        {saving ? '💾 Menyimpan...' : '💾 Save Changes'}
                    </button>
                    <button onClick={onClose} className="close-btn">✕</button>
                </div>
            </div>

            <div className="onlyoffice-content">
                {loading && (
                    <div className="editor-loading">
                        <div className="loading-spinner"></div>
                        <div>Memuat editor...</div>
                        <div className="loading-subtitle">
                            Menghubungkan ke OnlyOffice Document Server...
                        </div>
                    </div>
                )}

                {error && (
                    <div className="editor-error">
                        <div className="error-icon">⚠️</div>
                        <div className="error-message">{error}</div>
                        <div className="error-help">
                            <p><strong>Troubleshooting:</strong></p>
                            <ul>
                                <li>Pastikan OnlyOffice Document Server berjalan di port 8888</li>
                                <li>Coba akses <a href={process.env.REACT_APP_ONLYOFFICE_URL} target="_blank" rel="noopener noreferrer">{process.env.REACT_APP_ONLYOFFICE_URL}</a></li>
                                <li>Periksa console browser untuk error detail</li>
                                <li>Coba refresh halaman</li>
                            </ul>
                        </div>
                        <button onClick={handleRetry} className="retry-btn">
                            🔄 Coba Lagi
                        </button>
                    </div>
                )}

                {config && !error && (
                    <div 
                        className="editor-container"
                        style={{ 
                            display: loading ? 'none' : 'block',
                            width: '100%',
                            height: '100%'
                        }}
                    >
                        <DocumentEditor
                            id={`onlyoffice-editor-${file.id}`}
                            documentServerUrl={process.env.REACT_APP_ONLYOFFICE_URL}
                            config={config}
                            events_onDocumentReady={onDocumentReady}
                            events_onDocumentStateChange={onDocumentStateChange}
                            events_onInfo={onInfo}
                            events_onWarning={onWarning}
                            events_onError={onError}
                            onLoadComponentError={onLoadComponentError}
                            height="100%"
                            width="100%"
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default OnlyOfficeEditor; 