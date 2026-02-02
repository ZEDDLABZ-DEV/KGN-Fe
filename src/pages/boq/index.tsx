/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useRef, useEffect } from 'react';
import { ParentLayout } from '../../layout/ParentLayout';
import { Request } from '../../utils/Request';
import { FiUploadCloud, FiFile, FiX, FiCheckCircle, FiAlertCircle, FiChevronDown } from 'react-icons/fi';
import { HiOutlineDocumentText } from 'react-icons/hi';
import toast from 'react-hot-toast';

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

interface UploadedFile {
  file: File;
  status: UploadStatus;
  progress: number;
  message?: string;
}

interface Project {
  id: string;
  name: string;
}

const BOQ = () => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [projectsLoading, setProjectsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setProjectsLoading(true);
    try {
      const res = await Request.get('/v1/api/projects/all');
      setProjects(res.data || []);
    } catch (error) {
      console.log(error);
      toast.error('Failed to load projects');
    } finally {
      setProjectsLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
  };

  const handleFiles = (files: File[]) => {
    const validFiles = files.filter(file => {
      const validTypes = [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv',
        'application/pdf'
      ];
      const validExtensions = ['.xlsx', '.xls', '.csv', '.pdf'];
      const extension = '.' + file.name.split('.').pop()?.toLowerCase();
      return validTypes.includes(file.type) || validExtensions.includes(extension);
    });

    if (validFiles.length !== files.length) {
      toast.error('Some files were skipped. Only Excel, CSV, and PDF files are allowed.');
    }

    const newFiles: UploadedFile[] = validFiles.map(file => ({
      file,
      status: 'idle',
      progress: 0,
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);
  };

  const uploadFile = async (index: number) => {
    const fileData = uploadedFiles[index];
    if (!fileData || fileData.status === 'uploading') return;

    if (!selectedProjectId) {
      toast.error('Please select a project first');
      return;
    }

    setUploadedFiles(prev =>
      prev.map((f, i) => (i === index ? { ...f, status: 'uploading', progress: 0 } : f))
    );

    const formData = new FormData();
    formData.append('file', fileData.file);
    formData.append('projectId', selectedProjectId);

    try {
      await Request.post('/v1/api/boq/upload', formData, {
        onUploadProgress: (progressEvent: any) => {
          const progress = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
          setUploadedFiles(prev =>
            prev.map((f, i) => (i === index ? { ...f, progress } : f))
          );
        },
      });

      setUploadedFiles(prev =>
        prev.map((f, i) =>
          i === index ? { ...f, status: 'success', progress: 100, message: 'Uploaded successfully' } : f
        )
      );
      toast.success(`${fileData.file.name} uploaded successfully!`);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Upload failed';
      setUploadedFiles(prev =>
        prev.map((f, i) =>
          i === index ? { ...f, status: 'error', message: errorMessage } : f
        )
      );
      toast.error(`Failed to upload ${fileData.file.name}`);
    }
  };

  const uploadAllFiles = async () => {
    if (!selectedProjectId) {
      toast.error('Please select a project first');
      return;
    }
    for (let i = 0; i < uploadedFiles.length; i++) {
      if (uploadedFiles[i].status === 'idle' || uploadedFiles[i].status === 'error') {
        await uploadFile(i);
      }
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearAllFiles = () => {
    setUploadedFiles([]);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: UploadStatus) => {
    switch (status) {
      case 'success':
        return <FiCheckCircle className="text-emerald-500" size={20} />;
      case 'error':
        return <FiAlertCircle className="text-red-500" size={20} />;
      case 'uploading':
        return (
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
        );
      default:
        return <FiFile className="text-gray-400" size={20} />;
    }
  };

  const pendingCount = uploadedFiles.filter(f => f.status === 'idle' || f.status === 'error').length;

  return (
    <ParentLayout title="Upload BOQ">
      <div className="flex flex-col gap-6">
        {/* Header Section */}
        <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50">
              <HiOutlineDocumentText className="text-amber-600" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Bill of Quantities</h1>
              <p className="text-sm text-gray-500">
                Upload BOQ documents in Excel, CSV, or PDF format
              </p>
            </div>
          </div>

          {/* Project Selector */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <label className="text-sm font-medium text-gray-700">Select Project:</label>
            <div className="relative flex-1 max-w-md">
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                disabled={projectsLoading}
                className="w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 py-2.5 pr-10 text-sm text-gray-900 outline-none transition-colors focus:border-slate-500 focus:ring-1 focus:ring-slate-500 disabled:bg-gray-100 disabled:text-gray-500"
              >
                <option value="">
                  {projectsLoading ? 'Loading projects...' : '-- Select a project --'}
                </option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
              <FiChevronDown
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
            </div>
            {selectedProjectId && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Project selected
              </span>
            )}
          </div>
        </div>

        {/* Upload Area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed bg-white p-12 transition-all duration-200 ${
            isDragging
              ? 'border-sky-400 bg-sky-50'
              : !selectedProjectId
              ? 'border-amber-300 bg-amber-50/50 hover:border-amber-400'
              : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }`}
        >
          <div
            className={`flex h-16 w-16 items-center justify-center rounded-full transition-colors ${
              isDragging ? 'bg-sky-100' : 'bg-gray-100'
            }`}
          >
            <FiUploadCloud
              className={`transition-colors ${isDragging ? 'text-sky-500' : 'text-gray-400'}`}
              size={32}
            />
          </div>
          <div className="text-center">
            <p className="text-base font-medium text-gray-700">
              {isDragging ? 'Drop your files here' : 'Drag and drop your BOQ files here'}
            </p>
            <p className="mt-1 text-sm text-gray-500">or click to browse from your computer</p>
            {!selectedProjectId && (
              <p className="mt-2 text-sm font-medium text-amber-600">
                ⚠️ Please select a project above before uploading
              </p>
            )}
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
              .xlsx
            </span>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
              .xls
            </span>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
              .csv
            </span>
            <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
              .pdf
            </span>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".xlsx,.xls,.csv,.pdf"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Files List */}
        {uploadedFiles.length > 0 && (
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div className="flex items-center gap-3">
                <h2 className="text-sm font-semibold text-gray-900">
                  Files ({uploadedFiles.length})
                </h2>
                {pendingCount > 0 && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                    {pendingCount} pending
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={clearAllFiles}
                  className="text-sm font-medium text-gray-500 transition-colors hover:text-gray-700"
                >
                  Clear all
                </button>
                {pendingCount > 0 && (
                  <button
                    onClick={uploadAllFiles}
                    className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
                  >
                    Upload all
                  </button>
                )}
              </div>
            </div>

            <div className="divide-y divide-gray-100">
              {uploadedFiles.map((fileData, index) => (
                <div
                  key={`${fileData.file.name}-${index}`}
                  className="flex items-center gap-4 px-6 py-4"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                    {getStatusIcon(fileData.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {fileData.file.name}
                      </p>
                      <span className="text-xs text-gray-400">
                        {formatFileSize(fileData.file.size)}
                      </span>
                    </div>
                    {fileData.status === 'uploading' && (
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                        <div
                          className="h-full rounded-full bg-sky-500 transition-all duration-300"
                          style={{ width: `${fileData.progress}%` }}
                        />
                      </div>
                    )}
                    {fileData.message && (
                      <p
                        className={`mt-1 text-xs ${
                          fileData.status === 'success' ? 'text-emerald-600' : 'text-red-500'
                        }`}
                      >
                        {fileData.message}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {(fileData.status === 'idle' || fileData.status === 'error') && (
                      <button
                        onClick={() => uploadFile(index)}
                        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50"
                      >
                        Upload
                      </button>
                    )}
                    <button
                      onClick={() => removeFile(index)}
                      className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                    >
                      <FiX size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
          <h3 className="text-sm font-semibold text-gray-900">Upload Guidelines</h3>
          <ul className="mt-3 space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" />
              Supported formats: Excel (.xlsx, .xls), CSV (.csv), and PDF (.pdf)
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" />
              Maximum file size: 25MB per file
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" />
              Ensure your BOQ follows the standard template format for best results
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" />
              You can upload multiple files at once
            </li>
          </ul>
        </div>
      </div>
    </ParentLayout>
  );
};

export { BOQ };

