'use client';

import { useState } from 'react';
import { Copy, Check, Download, Maximize2, Minimize2 } from 'lucide-react';

interface CodeBlockProps {
    language: string;
    value: string;
}

export function CodeBlock({ language, value }: CodeBlockProps) {
    const [copied, setCopied] = useState(false);
    const [expanded, setExpanded] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        const extension = getFileExtension(language);
        const blob = new Blob([value], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `code.${extension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const getFileExtension = (lang: string): string => {
        const extensions: Record<string, string> = {
            javascript: 'js',
            typescript: 'ts',
            python: 'py',
            java: 'java',
            html: 'html',
            css: 'css',
            jsx: 'jsx',
            tsx: 'tsx',
            json: 'json',
            markdown: 'md',
            bash: 'sh',
            shell: 'sh',
            sql: 'sql',
            php: 'php',
            ruby: 'rb',
            go: 'go',
            rust: 'rs',
            cpp: 'cpp',
            c: 'c',
        };
        return extensions[lang.toLowerCase()] || 'txt';
    };

    return (
        <div className="relative group my-4 rounded-lg overflow-hidden border border-slate-700">
            {/* Header with language label and action buttons */}
            <div className="flex items-center justify-between bg-slate-800 text-slate-200 px-4 py-2 text-sm font-mono border-b border-slate-700">
                <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-wide font-semibold text-fuchsia-400">
                        {language || 'code'}
                    </span>
                    <span className="text-xs text-slate-400">
                        {value.split('\n').length} lines
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    {/* Expand/Collapse button */}
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="flex items-center gap-1 px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded transition-colors text-xs"
                        title={expanded ? 'Collapse' : 'Expand'}
                    >
                        {expanded ? (
                            <>
                                <Minimize2 className="w-3 h-3" />
                                Collapse
                            </>
                        ) : (
                            <>
                                <Maximize2 className="w-3 h-3" />
                                Expand
                            </>
                        )}
                    </button>

                    {/* Download button */}
                    <button
                        onClick={handleDownload}
                        className="flex items-center gap-1 px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded transition-colors text-xs"
                        title="Download code"
                    >
                        <Download className="w-3 h-3" />
                        Download
                    </button>

                    {/* Copy button */}
                    <button
                        onClick={handleCopy}
                        className="flex items-center gap-1 px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded transition-colors text-xs"
                        title="Copy code"
                    >
                        {copied ? (
                            <>
                                <Check className="w-3 h-3 text-green-400" />
                                <span className="text-green-400">Copied!</span>
                            </>
                        ) : (
                            <>
                                <Copy className="w-3 h-3" />
                                Copy
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Code content */}
            <div
                className={`bg-slate-900 overflow-x-auto transition-all ${expanded ? 'max-h-none' : 'max-h-96'
                    }`}
            >
                <pre className="p-4 text-sm leading-relaxed">
                    <code className={`language-${language} text-slate-100`}>{value}</code>
                </pre>
            </div>

            {/* Show "Scroll for more" indicator if content is long and not expanded */}
            {!expanded && value.split('\n').length > 20 && (
                <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-slate-900 to-transparent flex items-end justify-center pb-2">
                    <button
                        onClick={() => setExpanded(true)}
                        className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
                    >
                        ↓ Scroll for more ↓
                    </button>
                </div>
            )}
        </div>
    );
}
