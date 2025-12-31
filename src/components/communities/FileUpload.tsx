'use client';

import { useState, useRef } from 'react';
import { Paperclip, X, FileIcon, Loader2 } from 'lucide-react';

interface FileUploadProps {
    onFileSelect: (file: File) => void;
    selectedFile: File | null;
    onClear: () => void;
    disabled?: boolean;
}

export function FileUpload({ onFileSelect, selectedFile, onClear, disabled }: FileUploadProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 10 * 1024 * 1024) {
                alert('File size exceeds 10MB limit');
                return;
            }
            onFileSelect(file);
        }
    };

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
                            onClear();
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
