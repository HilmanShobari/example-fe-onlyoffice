import React, { useState } from 'react';
import './App.css';
import FileUpload from './components/FileUpload';
import FileList from './components/FileList';
import OnlyOfficeEditor from './components/OnlyOfficeEditor';
import OnlyOfficeStatus from './components/OnlyOfficeStatus';

function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleUploadSuccess = (file) => {
    // Trigger refresh untuk FileList
    setRefreshTrigger(prev => prev + 1);
  };

  const handleFileSelect = (file) => {
    setSelectedFile(file);
  };

  const handleCloseEditor = () => {
    setSelectedFile(null);
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
        />
      </main>

      {selectedFile && (
        <OnlyOfficeEditor 
          file={selectedFile} 
          onClose={handleCloseEditor}
        />
      )}

      <footer className="App-footer">
        <p>Powered by OnlyOffice Document Server</p>
      </footer>
    </div>
  );
}

export default App;
