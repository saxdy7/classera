'use client';

import { useState, useRef } from 'react';
import { Paperclip, X, FileIcon, Image as ImageIcon, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export interface FileUploadProps {
    // Single file mode
    onFileSelect?: (file: File) => void;
    selectedFile?: File | null;
    onClear?: () => void;
    // Multiple files mode
    onFilesChange?: (images: string[], files: any[]) => void;
    disabled?: boolean;
}

export function FileUpload({
    onFileSelect,
    selectedFile,
    onClear,
    onFilesChange,
    disabled
}: FileUploadProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [images, setImages] = useState<string[]>([]);
    const [files, setFiles] = useState<any[]>([]);
    const [uploading, setUploading] = useState(false);
    const supabase = createClient();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 10 * 1024 * 1024) {
                alert('File size exceeds 10MB limit');
                return;
            }

            // Single file mode
            if (onFileSelect) {
                onFileSelect(file);
                return;
            }

            // Multiple files mode
            if (onFilesChange) {
                setUploading(true);
                try {
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
                    const filePath = `${fileName}`;

                    const { error: uploadError } = await supabase.storage
                        .from('community_uploads')
                        .upload(filePath, file);

                    if (uploadError) {
                        console.error('Error uploading file:', uploadError);
                        alert('Upload failed!');
                        return;
                    }

                    const { data: { publicUrl } } = supabase.storage
                        .from('community_uploads')
                        .getPublicUrl(filePath);

                    // Check if it's an image
                    if (file.type.startsWith('image/')) {
                        const newImages = [...images, publicUrl];
                        setImages(newImages);
                        onFilesChange(newImages, files);
                    } else {
                        // It's a regular file
                        const newFile = {
                            name: file.name,
                            size: file.size,
                            type: file.type,
                            url: publicUrl,
                            path: filePath
                        };
                        const newFiles = [...files, newFile];
                        setFiles(newFiles);
                        onFilesChange(images, newFiles);
                    }
                } finally {
                    setUploading(false);
                }
            }
        }
    };

    const removeImage = (index: number) => {
        const newImages = images.filter((_, i) => i !== index);
        setImages(newImages);
        onFilesChange?.(newImages, files);
    };

    const removeFile = (index: number) => {
        const newFiles = files.filter((_, i) => i !== index);
        setFiles(newFiles);
        onFilesChange?.(images, newFiles);
    };

    // Single file mode UI
    if (onFileSelect) {
        return (
            <div className="relative">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={disabled}
                />

                {selectedFile ? (
                    <div className="absolute bottom-full left-0 mb-2 p-2 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center gap-2 max-w-xs shadow-sm">
                        <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <FileIcon className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-indigo-900 truncate">
                                {selectedFile.name}
                            </p>
                            <p className="text-[10px] text-indigo-600">
                                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                        </div>
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                onClear?.();
                            }}
                            className="p-1 hover:bg-indigo-200 rounded-full transition-colors"
                        >
                            <X className="w-3 h-3 text-indigo-700" />
                        </button>
                    </div>
                ) : null}

                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={disabled}
                    className="p-3 text-slate-400 hover:text-indigo-600 transition-colors disabled:opacity-50"
                    title="Attach file"
                >
                    <Paperclip className="w-5 h-5" />
                </button>
            </div>
        );
    }

    // Multiple files mode UI
    return (
        <div className="space-y-3">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                disabled={disabled || uploading}
                accept="image/*,.pdf,.doc,.docx,.txt,.zip"
            />

            {/* Uploaded Images Preview */}
            {images.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                    {images.map((img, idx) => (
                        <div key={idx} className="relative">
                            <img
                                src={img}
                                alt={`Upload ${idx + 1}`}
                                className="w-full h-20 object-cover rounded-lg"
                            />
                            <button
                                type="button"
                                onClick={() => removeImage(idx)}
                                className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Uploaded Files */}
            {files.length > 0 && (
                <div className="space-y-2">
                    {files.map((file, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                            <FileIcon className="w-4 h-4 text-slate-500" />
                            <span className="text-sm text-slate-700 flex-1 truncate">{file.name}</span>
                            <span className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)}MB</span>
                            <button
                                type="button"
                                onClick={() => removeFile(idx)}
                                className="p-1 hover:bg-red-100 rounded"
                            >
                                <X className="w-3 h-3 text-red-500" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Upload Buttons */}
            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={disabled || uploading}
                    className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                    {uploading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <>
                            <ImageIcon className="w-4 h-4 text-slate-500" />
                            <span className="text-sm text-slate-700">Add Image</span>
                        </>
                    )}
                </button>
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={disabled || uploading}
                    className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                    <Paperclip className="w-4 h-4 text-slate-500" />
                    <span className="text-sm text-slate-700">Add File</span>
                </button>
            </div>
        </div>
    );
}

