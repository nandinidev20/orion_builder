import React, { useState, useEffect } from 'react';

const DocumentViewer = ({ fileUrl, fileName, fileType, containerStyle = {} }) => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadDocument = async () => {
      try {
        setLoading(true);
        setError(null);

        if (fileType === 'txt' || fileType === 'text/plain') {
          await loadTextFile(fileUrl);
        } else if (fileType === 'pdf' || fileType === 'application/pdf') {
          setError('PDF format is not supported in browser preview. Please convert to text format for preview.');
        } else if (
          fileType === 'docx' ||
          fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
          fileName?.endsWith('.docx')
        ) {
          setError('DOCX format is not supported in browser preview. Please convert to PDF or text format for preview.');
        } else if (
          fileType === 'doc' ||
          fileType === 'application/msword' ||
          fileName?.endsWith('.doc')
        ) {
          setError('MS Word .doc format is not supported. Please convert to text format for preview.');
        } else if (fileType === 'rtf' || fileType === 'text/rtf') {
          setError('RTF format is not supported. Please convert to text format for preview.');
        } else {
          setError(`File type not supported: ${fileType}`);
        }
      } catch (err) {
        console.error('Error loading document:', err);
        setError(err.message || 'Failed to load document');
      } finally {
        setLoading(false);
      }
    };

    if (fileUrl) {
      loadDocument();
    }
  }, [fileUrl, fileType, fileName]);

  const loadTextFile = async (url) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to load text file');
      const text = await response.text();
      setContent(text);
    } catch (err) {
      throw new Error('Unable to read text file: ' + err.message);
    }
  };

  // Render text content
  if ((fileType === 'txt' || fileType === 'text/plain' || fileType === 'docx' || fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') && content) {
    return (
      <div style={containerStyle}>
        <div
          style={{
            backgroundColor: '#fff',
            borderRadius: '8px',
            padding: '32px',
            marginBottom: '40px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
            lineHeight: '1.8',
            fontSize: '15px',
            color: '#374151',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            border: '1px solid #e5e7eb',
            maxHeight: '600px',
            overflowY: 'auto'
          }}
        >
          {content}
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div style={containerStyle}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '48px 32px',
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            color: '#6b7280',
            fontSize: '15px'
          }}
        >
          <div
            style={{
              animation: 'spin 2s linear infinite',
              marginRight: '12px',
              fontSize: '20px'
            }}
          >
            ⭐
          </div>
          Loading document...
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={containerStyle}>
        <div
          style={{
            padding: '32px',
            backgroundColor: '#fee2e2',
            borderRadius: '8px',
            border: '1px solid #fca5a5',
            marginBottom: '24px'
          }}
        >
          <p
            style={{
              color: '#dc2626',
              fontSize: '15px',
              margin: '0 0 16px 0',
              fontWeight: '500'
            }}
          >
            ⚠️ {error}
          </p>
          <a
            href={fileUrl}
            download={fileName}
            style={{
              display: 'inline-block',
              padding: '10px 20px',
              backgroundColor: '#3b82f6',
              color: '#ffffff',
              borderRadius: '6px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => (e.target.style.backgroundColor = '#2563eb')}
            onMouseLeave={(e) => (e.target.style.backgroundColor = '#3b82f6')}
          >
            Download Document
          </a>
        </div>
      </div>
    );
  }

  // No content
  return (
    <div style={containerStyle}>
      <div
        style={{
          padding: '32px',
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          textAlign: 'center',
          color: '#6b7280'
        }}
      >
        <p style={{ margin: 0, fontSize: '15px' }}>Unable to display document content</p>
        <a
          href={fileUrl}
          download={fileName}
          style={{
            display: 'inline-block',
            marginTop: '16px',
            padding: '10px 20px',
            backgroundColor: '#3b82f6',
            color: '#ffffff',
            borderRadius: '6px',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => (e.target.style.backgroundColor = '#2563eb')}
          onMouseLeave={(e) => (e.target.style.backgroundColor = '#3b82f6')}
        >
          Download
        </a>
      </div>
    </div>
  );
};

export default DocumentViewer;
