import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './OnlyOfficeStatus.css';

const OnlyOfficeStatus = () => {
    const [status, setStatus] = useState('checking');
    const [serverInfo, setServerInfo] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        checkOnlyOfficeStatus();
    }, []);

    const checkOnlyOfficeStatus = async () => {
        setStatus('checking');
        setError(null);

        try {
            console.log('Checking OnlyOffice status via backend proxy...');
            
            // Test backend connection first
            const backendResponse = await axios.get('http://localhost:3001/api/health');
            console.log('Backend status:', backendResponse.status);

            // Test OnlyOffice Document Server via proxy
            const onlyOfficeResponse = await axios.get('http://localhost:3001/api/onlyoffice/healthcheck');

            if (onlyOfficeResponse.data.success) {
                setServerInfo({
                    server: onlyOfficeResponse.data.server,
                    status: onlyOfficeResponse.data.status,
                    data: onlyOfficeResponse.data.data
                });
                setStatus('connected');
                console.log('OnlyOffice server connected successfully');
            } else {
                throw new Error(onlyOfficeResponse.data.error || 'Unknown error');
            }
        } catch (err) {
            console.error('OnlyOffice status check failed:', err);
            
            let errorMessage = 'Gagal terhubung ke OnlyOffice Document Server';
            
            if (err.response) {
                // Server responded with error status
                const responseData = err.response.data;
                errorMessage = responseData.error || responseData.details || errorMessage;
            } else if (err.request) {
                // Request was made but no response
                errorMessage = 'Backend server tidak merespons';
            } else {
                // Other error
                errorMessage = err.message;
            }
            
            setError(errorMessage);
            setStatus('error');
        }
    };

    const getStatusIcon = () => {
        switch (status) {
            case 'checking':
                return '🔄';
            case 'connected':
                return '✅';
            case 'error':
                return '❌';
            default:
                return '❓';
        }
    };

    const getStatusMessage = () => {
        switch (status) {
            case 'checking':
                return 'Mengecek koneksi OnlyOffice...';
            case 'connected':
                return 'OnlyOffice Document Server terhubung';
            case 'error':
                return 'Gagal terhubung ke OnlyOffice Document Server';
            default:
                return 'Status tidak diketahui';
        }
    };

    return (
        <div className={`onlyoffice-status ${status}`}>
            <div className="status-content">
                <span className="status-icon">{getStatusIcon()}</span>
                <span className="status-message">{getStatusMessage()}</span>
                {status === 'error' && (
                    <button onClick={checkOnlyOfficeStatus} className="retry-status-btn">
                        🔄 Coba Lagi
                    </button>
                )}
            </div>
            
            {error && (
                <div className="status-error">
                    <strong>Error:</strong> {error}
                    <div className="status-help">
                        <p><strong>Troubleshooting:</strong></p>
                        <ul>
                            <li>Pastikan Docker container OnlyOffice berjalan: <code>docker ps | grep onlyoffice</code></li>
                            <li>Cek port 8888 tidak diblokir firewall</li>
                            <li>Test langsung: <a href="http://localhost:8888/healthcheck" target="_blank" rel="noopener noreferrer">http://localhost:8888/healthcheck</a></li>
                            <li>Restart container jika perlu: <code>docker restart &lt;container_id&gt;</code></li>
                        </ul>
                    </div>
                </div>
            )}
            
            {serverInfo && (
                <div className="status-info">
                    <div className="server-details">
                        <p><strong>Server:</strong> {serverInfo.server}</p>
                        <p><strong>Status:</strong> {serverInfo.status}</p>
                    </div>
                    {serverInfo.data && (
                        <details>
                            <summary>Server Response</summary>
                            <pre>{JSON.stringify(serverInfo.data, null, 2)}</pre>
                        </details>
                    )}
                </div>
            )}
        </div>
    );
};

export default OnlyOfficeStatus; 