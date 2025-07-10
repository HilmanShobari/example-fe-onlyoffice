import React, { useState, useEffect } from 'react';
import './App.css';
import FileUpload from './components/FileUpload';
import FileList from './components/FileList';
import OnlyOfficeEditor from './components/OnlyOfficeEditor';
import DocumentViewer from './components/DocumentViewer';
import Login from './components/Login';

function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [viewedFile, setViewedFile] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check for existing authentication on component mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    console.log('token:', token);
    
    if (token) {
      try {
        setIsAuthenticated(true);
        console.log('User already authenticated');
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    console.log('Login successful, user authenticated');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setSelectedFile(null);
    setViewedFile(null);
    console.log('User logged out');
  };

  const handleUploadSuccess = (file) => {
    // Trigger refresh untuk FileList
    setRefreshTrigger(prev => prev + 1);
  };

  const handleFileSelect = (file) => {
    setSelectedFile(file);
    setViewedFile(null); // Close viewer if open
  };

  const handleFileView = (file) => {
    setViewedFile(file);
    setSelectedFile(null); // Close editor if open
  };

  const handleCloseEditor = () => {
    setSelectedFile(null);
  };

  const handleCloseViewer = () => {
    setViewedFile(null);
  };

  // Show loading screen while checking authentication
  if (loading) {
    return (
      <div className="App">
        <div className="loading-container">
          <div className="loading-spinner">🔄</div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Show main application when authenticated
  return (
    <div className="App">
      <header className="App-header">
        <div className="header-content">
          <div>
            <h1>📄 OnlyOffice Document Manager</h1>
            <p>Upload, edit, dan view dokumen menggunakan OnlyOffice</p>
          </div>
          <div className="header-actions">
            <span className="user-info">Welcome!</span>
            <button onClick={handleLogout} className="logout-btn">
              🚪 Logout
            </button>
          </div>
        </div>
      </header>

      <main className="App-main">
        <FileUpload onUploadSuccess={handleUploadSuccess} />
        <FileList 
          refreshTrigger={refreshTrigger} 
          onFileSelect={handleFileSelect}
          onFileView={handleFileView}
        />
      </main>

      {selectedFile && (
        <OnlyOfficeEditor 
          file={selectedFile} 
          onClose={handleCloseEditor}
        />
      )}

      {viewedFile && (
        <DocumentViewer 
          file={viewedFile} 
          onClose={handleCloseViewer}
        />
      )}

      <footer className="App-footer">
        <p>Powered by OnlyOffice Document Server</p>
      </footer>
    </div>
  );
}

export default App;
