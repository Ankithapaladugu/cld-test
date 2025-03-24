import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Layout from './Layout';
import './Documents.css';

// Initialize Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const FinancialDocuments = () => {
  const [yearFolders, setYearFolders] = useState(['2023', '2024', '2025']);
  const [selectedYear, setSelectedYear] = useState('2025'); // Default to current year
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [documentType, setDocumentType] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [fileToUpload, setFileToUpload] = useState(null);
  const [showDeleteAllConfirmation, setShowDeleteAllConfirmation] = useState(false);
  const [deleteInProgress, setDeleteInProgress] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState(null);

  // Document categories with their corresponding types
  const documentCategories = {
    'all': {
      name: 'All Documents',
      types: []
    },
    'financial_statements': {
      name: 'Financial Statements',
      types: [
        'Profit & Loss Statement',
        'Balance Sheet',
        'Cash Flow Statement',
        'Audited Financial Report'
      ]
    },
    'tax_compliance': {
      name: 'Tax & Compliance',
      types: [
        'Business Tax Return',
        'GST/VAT Return',
        'Withholding Tax Statement',
        'Tax Clearance Certificate'
      ]
    },
    'banking_investment': {
      name: 'Banking & Investment',
      types: [
        'Business Bank Statement',
        'Fixed Deposit Certificate',
        'Investment Portfolio',
        'Loan & Credit Agreement'
      ]
    },
    'accounts': {
      name: 'Accounts Payable & Receivable',
      types: [
        'Outstanding Invoice',
        'Payment Record',
        'Accounts Receivable Report',
        'Accounts Payable Report'
      ]
    },
    'valuation': {
      name: 'Company Valuation & Shareholding',
      types: [
        'Shareholder Agreement',
        'Company Valuation Report',
        'Business Ownership Document',
        'Share Certificate'
      ]
    },
    'debt_loan': {
      name: 'Debt & Loan Documentation',
      types: [
        'Loan Agreement',
        'Repayment Schedule',
        'Collateral Documentation',
        'Debt Restructuring Agreement'
      ]
    },
    'general': {
      name: 'General Financial Documents',
      types: [
        'Annual Report',
        'Quarterly Statement',
        'Tax Return',
        'Audit Report',
        'Bank Statement',
        'Invoice',
        'Receipt',
        'Budget',
        'Other'
      ]
    }
  };
  
  // Create a list of all document types for our dropdown
  const getAllDocumentTypes = () => {
    if (selectedCategory === 'all') {
      return Object.values(documentCategories)
        .flatMap(category => category.types)
        .filter((value, index, self) => self.indexOf(value) === index); // Remove duplicates
    }
    
    return documentCategories[selectedCategory]?.types || [];
  };

  useEffect(() => {
    fetchFinancialDocuments(selectedYear, selectedCategory);
  }, [selectedYear, selectedCategory]);

  const fetchFinancialDocuments = async (year, category) => {
    try {
      setLoading(true);
      
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData?.session) {
        console.error('No user logged in:', sessionError);
        setLoading(false);
        return;
      }

      const userId = sessionData.session.user.id;

      // List all documents in the selected year folder
      const { data, error } = await supabase
        .storage
        .from('financial-documents')
        .list(`${userId}/${year}/`, {
          sortBy: { column: 'created_at', order: 'desc' },
        });

      if (error) {
        console.error(`Error fetching documents for ${year}:`, error);
        // If no documents exist yet, show empty state
        setDocuments([]);
      } else if (data && data.length > 0) {
        // Filter out any folders, we only want files
        const fileDocuments = data.filter(item => !item.id.endsWith('/'));
        
        // Create an array to hold document details with URLs
        const documentDetails = [];
        
        // Get details for each document
        for (const doc of fileDocuments) {
          // Get the URL for the document
          const { data: urlData } = await supabase
            .storage
            .from('financial-documents')
            .createSignedUrl(`${userId}/${year}/${doc.name}`, 3600);
            
          // Extract document type from filename or guess based on name
          const docType = getDocumentType(doc.name);
          const docCategory = getCategoryForType(docType);
          
          // Skip if filtering by category and document doesn't match
          if (category !== 'all' && docCategory !== category) {
            continue;
          }
          
          documentDetails.push({
            name: doc.name,
            type: docType,
            category: docCategory,
            year: year,
            created_at: doc.created_at || doc.lastModified,
            size: doc.metadata?.size || 0,
            url: urlData?.signedUrl || null
          });
        }
        
        setDocuments(documentDetails);
      } else {
        // No documents found in this year folder
        setDocuments([]);
      }
    } catch (error) {
      console.error('Error in fetchFinancialDocuments:', error);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  // Find the category a document type belongs to
  const getCategoryForType = (docType) => {
    for (const [key, category] of Object.entries(documentCategories)) {
      if (category.types.includes(docType)) {
        return key;
      }
    }
    return 'general'; // Default to general category
  };

  // Get document type from filename, using the new categories
  const getDocumentType = (filename) => {
    const lowerName = filename.toLowerCase();
    
    // Try to extract from filename first (for files uploaded with our system)
    const nameParts = filename.split('_');
    if (nameParts.length > 1) {
      const possibleType = nameParts[0].replace(/_/g, ' ');
      const allTypes = Object.values(documentCategories).flatMap(category => category.types);
      const matchedType = allTypes.find(type => 
        type.toLowerCase() === possibleType.toLowerCase()
      );
      
      if (matchedType) return matchedType;
    }
    
    // If that fails, try to guess based on keywords
    if (lowerName.includes('profit') || lowerName.includes('p&l')) return 'Profit & Loss Statement';
    if (lowerName.includes('balance')) return 'Balance Sheet';
    if (lowerName.includes('cash flow')) return 'Cash Flow Statement';
    if (lowerName.includes('audit')) return 'Audited Financial Report';
    if (lowerName.includes('tax') && lowerName.includes('return')) return 'Business Tax Return';
    if (lowerName.includes('gst') || lowerName.includes('vat')) return 'GST/VAT Return';
    if (lowerName.includes('withholding')) return 'Withholding Tax Statement';
    if (lowerName.includes('tax') && lowerName.includes('clearance')) return 'Tax Clearance Certificate';
    if (lowerName.includes('bank') && lowerName.includes('statement')) return 'Business Bank Statement';
    if (lowerName.includes('fixed') && lowerName.includes('deposit')) return 'Fixed Deposit Certificate';
    if (lowerName.includes('investment')) return 'Investment Portfolio';
    if (lowerName.includes('loan') && lowerName.includes('agreement')) return 'Loan Agreement';
    if (lowerName.includes('invoice')) return 'Outstanding Invoice';
    if (lowerName.includes('payment') && lowerName.includes('record')) return 'Payment Record';
    if (lowerName.includes('receivable')) return 'Accounts Receivable Report';
    if (lowerName.includes('payable')) return 'Accounts Payable Report';
    if (lowerName.includes('shareholder')) return 'Shareholder Agreement';
    if (lowerName.includes('valuation')) return 'Company Valuation Report';
    if (lowerName.includes('ownership')) return 'Business Ownership Document';
    if (lowerName.includes('share') && lowerName.includes('certificate')) return 'Share Certificate';
    if (lowerName.includes('repayment')) return 'Repayment Schedule';
    if (lowerName.includes('collateral')) return 'Collateral Documentation';
    if (lowerName.includes('restructuring')) return 'Debt Restructuring Agreement';
    
    // Basic fallbacks
    if (lowerName.includes('annual') || lowerName.includes('report')) return 'Annual Report';
    if (lowerName.includes('q1') || lowerName.includes('q2') || 
        lowerName.includes('q3') || lowerName.includes('q4') || 
        lowerName.includes('quarter')) return 'Quarterly Statement';
    if (lowerName.includes('budget')) return 'Budget';
    
    return 'Other';
  };

  // Handle file selection
  const handleFileSelection = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!documentType) {
      setUploadError('Please select a document type');
      setTimeout(() => setUploadError(null), 5000);
      return;
    }
    
    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size exceeds 10MB limit.');
      setTimeout(() => setUploadError(null), 5000);
      return;
    }
    
    setFileToUpload(file);
    setShowConfirmation(true);
  };

  // Handle confirmed upload
  const handleConfirmedUpload = async () => {
    if (!fileToUpload || !documentType || !selectedYear) {
      setUploadError('Missing required information for upload.');
      setTimeout(() => setUploadError(null), 5000);
      return;
    }
    
    try {
      setShowConfirmation(false);
      setUploading(true);
      setUploadError(null);
      setSuccessMessage(null);

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData?.session) {
        setUploadError('You must be logged in to upload documents');
        setUploading(false);
        return;
      }

      const userId = sessionData.session.user.id;
      
      // Add document type to filename for better organization
      const fileExt = fileToUpload.name.split('.').pop();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const sanitizedDocType = documentType.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const newFileName = `${sanitizedDocType}_${timestamp}.${fileExt}`;
      
      // Upload path includes user ID, year folder, and the new filename
      const filePath = `${userId}/${selectedYear}/${newFileName}`;

      // Upload the file
      const { error: uploadError } = await supabase
        .storage
        .from('financial-documents')
        .upload(filePath, fileToUpload, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        setUploadError(`Error uploading file: ${uploadError.message}`);
        setUploading(false);
        return;
      }

      // Get URL for the uploaded file
      const { data: urlData } = await supabase
        .storage
        .from('financial-documents')
        .createSignedUrl(filePath, 3600);
        
      // Optional: Log upload to a database table for better tracking
      try {
        await supabase
          .from('financial_document_logs')
          .insert({
            client_id: userId,
            document_type: documentType,
            document_category: getCategoryForType(documentType),
            file_path: filePath,
            file_name: newFileName,
            year: selectedYear,
            upload_date: new Date().toISOString()
          });
      } catch (logError) {
        // Non-critical error, just log to console
        console.warn('Could not log document upload:', logError);
      }

      // Add new document to state
      setDocuments(prev => [
        {
          name: newFileName,
          type: documentType,
          category: getCategoryForType(documentType),
          year: selectedYear,
          created_at: new Date().toISOString(),
          size: fileToUpload.size,
          url: urlData?.signedUrl || null
        },
        ...prev
      ]);

      setSuccessMessage(`${documentType} uploaded successfully to ${selectedYear} folder!`);
      setDocumentType(''); // Reset the document type selection
    } catch (error) {
      console.error('Error in handleConfirmedUpload:', error);
      setUploadError(`Error uploading file: ${error.message}`);
    } finally {
      setUploading(false);
      setFileToUpload(null);
      setTimeout(() => {
        setSuccessMessage(null);
        setUploadError(null);
      }, 5000);
    }
  };

  // Handle cancellation of upload
  const handleCancelUpload = () => {
    setShowConfirmation(false);
    setFileToUpload(null);
  };

  // Change the selected year and fetch documents
  const handleYearChange = (year) => {
    setSelectedYear(year);
  };

  // Change the selected category
  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setDocumentType(''); // Reset document type when category changes
  };

  // Function to show delete confirmation for a single document
  const handleDeleteDocument = (doc) => {
    setDocumentToDelete(doc);
    setShowDeleteConfirmation(true);
  };

  // Function to cancel single document deletion
  const handleCancelDelete = () => {
    setShowDeleteConfirmation(false);
    setDocumentToDelete(null);
  };

  // Function to confirm and execute single document deletion
  const handleConfirmDelete = async () => {
    if (!documentToDelete) return;
    
    try {
      setDeleteInProgress(true);
      setUploadError(null);
      setSuccessMessage(null);
      
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData?.session) {
        setUploadError('You must be logged in to delete documents');
        setDeleteInProgress(false);
        setShowDeleteConfirmation(false);
        setDocumentToDelete(null);
        return;
      }

      const userId = sessionData.session.user.id;
      const filePath = `${userId}/${documentToDelete.year}/${documentToDelete.name}`;
      
      // Delete the file from storage
      const { error: deleteError } = await supabase
        .storage
        .from('financial-documents')
        .remove([filePath]);
        
      if (deleteError) {
        console.error('Error deleting file:', deleteError);
        setUploadError(`Error deleting file: ${deleteError.message}`);
        setDeleteInProgress(false);
        setShowDeleteConfirmation(false);
        setDocumentToDelete(null);
        return;
      }
      
      // Also remove the entry from the financial_document_logs table
      try {
        await supabase
          .from('financial_document_logs')
          .delete()
          .eq('client_id', userId)
          .eq('file_path', filePath);
      } catch (dbError) {
        // Non-critical error, just log it
        console.warn('Could not remove document log:', dbError);
      }
      
      // Update the documents state to remove the deleted document
      setDocuments(prev => prev.filter(doc => doc.name !== documentToDelete.name));
      
      setSuccessMessage(`${documentToDelete.type} was successfully deleted`);
    } catch (error) {
      console.error('Error in handleConfirmDelete:', error);
      setUploadError(`Error deleting document: ${error.message}`);
    } finally {
      setDeleteInProgress(false);
      setShowDeleteConfirmation(false);
      setDocumentToDelete(null);
      setTimeout(() => {
        setSuccessMessage(null);
        setUploadError(null);
      }, 5000);
    }
  };

  // Function to show delete confirmation for all documents
  

  // Function to cancel deletion of all documents
  const handleCancelRemoveAll = () => {
    setShowDeleteAllConfirmation(false);
  };

  // Function to confirm and execute deletion of all documents
  const handleConfirmRemoveAll = async () => {
    try {
      setDeleteInProgress(true);
      setUploadError(null);
      setSuccessMessage(null);
      
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData?.session) {
        setUploadError('You must be logged in to remove documents');
        setDeleteInProgress(false);
        setShowDeleteAllConfirmation(false);
        return;
      }

      const userId = sessionData.session.user.id;
      let filesToDelete = [];
      
      // If a specific category is selected (not 'all'), only delete files from that category
      if (selectedCategory !== 'all') {
        // Filter documents to only include ones from this category
        filesToDelete = documents
          .filter(doc => getCategoryForType(doc.type) === selectedCategory)
          .map(doc => `${userId}/${selectedYear}/${doc.name}`);
      } else {
        // Delete all documents in the selected year
        filesToDelete = documents.map(doc => `${userId}/${selectedYear}/${doc.name}`);
      }
      
      if (filesToDelete.length === 0) {
        setSuccessMessage('No documents to remove');
        setDeleteInProgress(false);
        setShowDeleteAllConfirmation(false);
        return;
      }
      
      // Due to Supabase limitations, we can only delete up to 1000 files at once
      // So we process in batches of 100
      const batchSize = 100;
      let successCount = 0;
      
      for (let i = 0; i < filesToDelete.length; i += batchSize) {
        const batch = filesToDelete.slice(i, i + batchSize);
        
        const { data, error } = await supabase
          .storage
          .from('financial-documents')
          .remove(batch);
          
        if (error) {
          console.error('Error removing files:', error);
          setUploadError(`Error removing some files: ${error.message}`);
        } else {
          successCount += data?.length || 0;
        }
      }
      
      // Also remove entries from the financial_document_logs table if it exists
      try {
        if (selectedCategory !== 'all') {
          await supabase
            .from('financial_document_logs')
            .delete()
            .eq('client_id', userId)
            .eq('year', selectedYear)
            .eq('document_category', selectedCategory);
        } else {
          await supabase
            .from('financial_document_logs')
            .delete()
            .eq('client_id', userId)
            .eq('year', selectedYear);
        }
      } catch (dbError) {
        // Non-critical error, just log it
        console.warn('Could not remove document logs:', dbError);
      }
      
      // Clear the documents array to reflect deleted files
      if (selectedCategory !== 'all') {
        setDocuments(prev => prev.filter(doc => getCategoryForType(doc.type) !== selectedCategory));
      } else {
        setDocuments([]);
      }
      
      // Show success message
      const categoryText = selectedCategory !== 'all' ? ` in ${documentCategories[selectedCategory]?.name} category` : '';
      setSuccessMessage(`Successfully removed ${successCount} documents${categoryText} from ${selectedYear}`);
      
    } catch (error) {
      console.error('Error in handleConfirmRemoveAll:', error);
      setUploadError(`Error removing documents: ${error.message}`);
    } finally {
      setDeleteInProgress(false);
      setShowDeleteAllConfirmation(false);
      setTimeout(() => {
        setSuccessMessage(null);
        setUploadError(null);
      }, 5000);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };
  
  // Get icon for document category
  const getCategoryIcon = (category) => {
    switch(category) {
      case 'financial_statements': return '📊';
      case 'tax_compliance': return '📝';
      case 'banking_investment': return '🏦';
      case 'accounts': return '💰';
      case 'valuation': return '📈';
      case 'debt_loan': return '📄';
      case 'general': default: return '📁';
    }
  };
  
  // Get file type icon based on file extension
  const getFileIcon = (filename) => {
    const extension = filename.split('.').pop().toLowerCase();
    
    switch(extension) {
      case 'pdf': return '📕';
      case 'doc': 
      case 'docx': return '📘';
      case 'xls':
      case 'xlsx': 
      case 'csv': return '📗';
      case 'txt': return '📄';
      case 'jpg':
      case 'jpeg':
      case 'png': return '🖼️';
      default: return '📃';
    }
  };
  
  // View a document
  const handleViewDocument = (doc) => {
    if (doc.url) {
      window.open(doc.url, '_blank');
    }
  };

  if (loading && documents.length === 0) {
    return (
      <Layout>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading financial documents...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="documents-container">
        <h1>Corporate Financial Documents</h1>
        
        <div className="documents-header">
          <div className="filters-container">
            <div className="year-selector">
              <p>Select Year:</p>
              <div className="year-tabs">
                {yearFolders.map(year => (
                  <button
                    key={year}
                    className={`year-tab ${year === selectedYear ? 'active' : ''}`}
                    onClick={() => handleYearChange(year)}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="category-selector">
              <p>Document Category:</p>
              <div className="category-tabs">
                {Object.entries(documentCategories).map(([key, category]) => (
                  <button
                    key={key}
                    className={`category-tab ${key === selectedCategory ? 'active' : ''}`}
                    onClick={() => handleCategoryChange(key)}
                  >
                    {getCategoryIcon(key)} {category.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <div className="upload-section">
            <div className="custom-select-container">
              <label htmlFor="document-type" className="custom-select-label">Document Type</label>
              <select 
                id="document-type"
                className="document-type-select" 
                value={documentType} 
                onChange={(e) => setDocumentType(e.target.value)}
              >
                <option value="">Select Document Type</option>
                {getAllDocumentTypes().map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div>

            </div>

<div className="upload-button-container">
  <label className="upload-button">
    <span className="upload-icon">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 16V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M6 10L12 4L18 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M20 20H4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </span>
    <span className="upload-text">
      <span className="upload-primary">Upload Document</span>
      <span className="upload-secondary">to {selectedYear} folder</span>
    </span>
    <input 
      type="file" 
      onChange={handleFileSelection} 
      accept=".pdf,.xls,.xlsx,.doc,.docx,.csv,.txt,.jpg,.jpeg,.png"
      style={{ display: 'none' }}
      disabled={uploading}
    />
  </label>
  
  {uploading && (
    <div className="upload-progress">
      <div className="upload-spinner"></div>
      <span>Uploading...</span>
    </div>
  )}
</div>
           
            
           
          </div>
        </div>
        
        {successMessage && <div className="alert success"><span className="alert-icon">✅</span>{successMessage}</div>}
        {uploadError && <div className="alert error"><span className="alert-icon">⚠️</span>{uploadError}</div>}
        
        {/* Upload Confirmation Popup */}
        {showConfirmation && (
          <div className="confirmation-overlay">
            <div className="confirmation-dialog">
              <div className="confirmation-header">
                <h3>Confirm Upload</h3>
              </div>
              <div className="confirmation-content">
                <p>Are you sure you want to upload this file?</p>
                <div className="file-details">
                  <span className="doc-icon">{getFileIcon(fileToUpload?.name)}</span>
                  <span className="file-name">{fileToUpload?.name}</span>
                  <span className="file-size">({formatFileSize(fileToUpload?.size)})</span>
                </div>
                <p className="doc-type">Document type: <strong>{documentType}</strong></p>
                <p className="doc-year">Upload to: <strong>{selectedYear}</strong></p>
                <p className="doc-category">Category: <strong>{documentCategories[getCategoryForType(documentType)]?.name}</strong></p>
              </div>
              <div className="confirmation-actions">
                <button className="cancel-button" onClick={handleCancelUpload}>Cancel</button>
                <button className="confirm-button" onClick={handleConfirmedUpload}>Upload</button>
              </div>
            </div>
          </div>
        )}
        
        {/* Delete Confirmation Popup for Single Document */}
        {showDeleteConfirmation && documentToDelete && (
          <div className="confirmation-overlay">
            <div className="confirmation-dialog delete-confirmation">
              <div className="confirmation-header">
                <h3>Confirm Deletion</h3>
              </div>
              <div className="confirmation-content">
                <div className="warning-icon">⚠️</div>
                <p className="warning-message">Are you sure you want to delete this document?</p>
                <div className="file-details document-to-delete">
                  <span className="doc-icon">{getFileIcon(documentToDelete.name)}</span>
                  <div className="file-info">
                    <div className="file-name-type">
                      <span className="doc-type-badge">{documentToDelete.type}</span>
                      <span className="file-name">{documentToDelete.name.includes('_') ? documentToDelete.name.substring(documentToDelete.name.indexOf('_') + 1) : documentToDelete.name}</span>
                    </div>
                    <div className="file-meta">
                      <span className="file-date">{formatDate(documentToDelete.created_at)}</span>
                      <span className="file-size">{formatFileSize(documentToDelete.size)}</span>
                    </div>
                  </div>
                </div>
                <p className="warning-description">This action cannot be undone and the document will be permanently deleted.</p>
              </div>
              <div className="confirmation-actions">
                <button className="cancel-button" onClick={handleCancelDelete} disabled={deleteInProgress}>Cancel</button>
                <button className="delete-button" onClick={handleConfirmDelete} disabled={deleteInProgress}>
                  {deleteInProgress ? 'Deleting...' : 'Delete Document'}
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Delete All Confirmation Popup */}
        {showDeleteAllConfirmation && (
          <div className="confirmation-overlay">
            <div className="confirmation-dialog delete-confirmation">
              <div className="confirmation-header">
                <h3>Confirm Removal</h3>
              </div>
              <div className="confirmation-content">
                <div className="warning-icon">⚠️</div>
                <p className="warning-message">Are you sure you want to remove all 
                  {selectedCategory !== 'all' ? ` ${documentCategories[selectedCategory]?.name.toLowerCase()}` : ''} documents 
                  from {selectedYear}?
                </p>
                <p className="warning-description">
                  This action cannot be undone and will permanently delete 
                  {documents.length > 0 ? ` ${selectedCategory !== 'all' 
                    ? documents.filter(doc => getCategoryForType(doc.type) === selectedCategory).length 
                    : documents.length}` : ''} documents.
                </p>
              </div>
              <div className="confirmation-actions">
                <button className="cancel-button" onClick={handleCancelRemoveAll} disabled={deleteInProgress}>Cancel</button>
                <button className="delete-button" onClick={handleConfirmRemoveAll} disabled={deleteInProgress}>
                  {deleteInProgress ? 'Removing...' : 'Remove All'}
                </button>
              </div>
            </div>
          </div>
        )}

        {documents.length > 0 ? (
          <div className="documents-list-card">
            <div className="documents-list-header">
              <span className="doc-name">Document</span>
              <span className="doc-date">Uploaded</span>
              <span className="doc-actions">Actions</span>
            </div>
            
            <div className="documents-list">
              {documents.map((doc, index) => (
                <div className="document-item" key={index}>
                  <div className="doc-name-section">
                    <span className="doc-icon">{getFileIcon(doc.name)}</span>
                    <div className="doc-details">
                      <div className="doc-title">
                        {/* Show simplified name by removing the technical prefix */}
                        {doc.name.includes('_') ? doc.name.substring(doc.name.indexOf('_') + 1) : doc.name}
                      </div>
                      <div className="doc-metadata">
                        <span className="doc-type-badge">{doc.type}</span>
                        <span className="doc-category-badge">{documentCategories[doc.category]?.name || 'General'}</span>
                        <span className="doc-size-badge">{formatFileSize(doc.size)}</span>
                      </div>
                    </div>
                  </div>
                  <span className="doc-date">{formatDate(doc.created_at)}</span>
                  <span className="doc-actions">
                    {doc.url && (
                      <button 
                        className="action-button view-button"
                        onClick={() => handleViewDocument(doc)}
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M8 3C4.66667 3 1.82 5.07333 0 8C1.82 10.9267 4.66667 13 8 13C11.3333 13 14.18 10.9267 16 8C14.18 5.07333 11.3333 3 8 3ZM8 11.3333C6.16 11.3333 4.66667 9.84 4.66667 8C4.66667 6.16 6.16 4.66667 8 4.66667C9.84 4.66667 11.3333 6.16 11.3333 8C11.3333 9.84 9.84 11.3333 8 11.3333ZM8 6C6.89333 6 6 6.89333 6 8C6 9.10667 6.89333 10 8 10C9.10667 10 10 9.10667 10 8C10 6.89333 9.10667 6 8 6Z" fill="currentColor"/>
                        </svg>
                        View
                      </button>
                    )}
                    <button 
                      className="action-button delete-button"
                      onClick={() => handleDeleteDocument(doc)}
                    >
                      <svg width="14" height="16" viewBox="0 0 14 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 4H2.33333H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M4.33333 4V2.66667C4.33333 2.17464 4.52619 1.70272 4.87626 1.35265C5.22633 1.00258 5.69826 0.809715 6.19028 0.809715H7.80971C8.30174 0.809715 8.77367 1.00258 9.12374 1.35265C9.47381 1.70272 9.66667 2.17464 9.66667 2.66667V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M11.6667 4V13.3333C11.6667 13.8254 11.4738 14.2973 11.1237 14.6474C10.7737 14.9974 10.3017 15.1903 9.80971 15.1903H4.19028C3.69826 15.1903 3.22633 14.9974 2.87626 14.6474C2.52619 14.2973 2.33333 13.8254 2.33333 13.3333V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Delete
                    </button>
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="no-documents">
            <p>No financial documents found for {selectedYear} in {documentCategories[selectedCategory]?.name || 'All Categories'}.</p>
            <p>Use the upload button to add documents to this year folder.</p>
          </div>
        )}
        
       
      </div>
    </Layout>
  );
};

export default FinancialDocuments;