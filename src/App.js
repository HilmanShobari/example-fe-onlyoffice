import React, { useState } from 'react';
import './App.css';
import FileUpload from './components/FileUpload';
import FileList from './components/FileList';
import OnlyOfficeEditor from './components/OnlyOfficeEditor';
import DocumentViewer from './components/DocumentViewer';
import OnlyOfficeStatus from './components/OnlyOfficeStatus';

function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [viewedFile, setViewedFile] = useState(null);

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

  return (
    <div className="App">
      <header className="App-header">
        <h1>📄 OnlyOffice Document Manager</h1>
        <p>Upload, edit, dan view dokumen menggunakan OnlyOffice</p>
      </header>

      <main className="App-main">
        <OnlyOfficeStatus />
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
