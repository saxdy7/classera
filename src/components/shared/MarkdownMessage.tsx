'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CodeBlock } from './CodeBlock';

interface MarkdownMessageProps {
    content: string;
    isUser?: boolean;
}

// Preprocess content to fix common formatting issues
function preprocessContent(content: string): string {
    let processed = content;

    // Remove "code" and "Copy code" labels that appear before code blocks
    processed = processed.replace(/\n\s*code\s*\n\s*Copy code\s*\n/gi, '\n');
    processed = processed.replace(/\n\s*Copy code\s*\n/gi, '\n');
    processed = processed.replace(/\n\s*code\s*\n/gi, '\n');

    // Remove standalone "code" or "Copy code" that appears after code blocks
    processed = processed.replace(/```\s*\n\s*code\s*$/gim, '```');
    processed = processed.replace(/```\s*\n\s*Copy code\s*$/gim, '```');

    return processed;
}

export function MarkdownMessage({ content, isUser = false }: MarkdownMessageProps) {
    if (isUser) {
        // User messages don't need markdown rendering
        return <div className="whitespace-pre-wrap text-white">{content}</div>;
    }

    // Preprocess content to fix formatting issues
    const processedContent = preprocessContent(content);

    return (
        <div className="prose prose-slate max-w-none">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    // Code blocks
                    code(props) {
                        interface CodeProps {
                            node?: any;
                            inline?: boolean;
                            className?: string;
                            children?: React.ReactNode;
                        }
                        const { node, inline, className, children, ...rest } = props as CodeProps;
                        const match = /language-(\w+)/.exec(className || '');
                        const language = match ? match[1] : '';
                        const value = String(children).replace(/\n$/, '');

                        return !inline ? (
                            <CodeBlock language={language} value={value} />
                        ) : (
                            <code
                                className="px-1.5 py-0.5 bg-slate-100 text-fuchsia-600 rounded text-sm font-mono"
                                {...rest}
                            >
                                {children}
                            </code>
                        );
                    },

                    // Tables
                    table({ children }) {
                        return (
                            <div className="overflow-x-auto my-4">
                                <table className="min-w-full divide-y divide-slate-200 border border-slate-200 rounded-lg">
                                    {children}
                                </table>
                            </div>
                        );
                    },

                    thead({ children }) {
                        return <thead className="bg-slate-50">{children}</thead>;
                    },

                    th({ children }) {
                        return (
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                                {children}
                            </th>
                        );
                    },

                    td({ children }) {
                        return (
                            <td className="px-4 py-3 text-sm text-slate-900 border-b border-slate-100">
                                {children}
                            </td>
                        );
                    },

                    // Headings
                    h1({ children }) {
                        return <h1 className="text-2xl font-bold text-slate-900 mt-6 mb-4">{children}</h1>;
                    },

                    h2({ children }) {
                        return <h2 className="text-xl font-bold text-slate-900 mt-5 mb-3">{children}</h2>;
                    },

                    h3({ children }) {
                        return <h3 className="text-lg font-semibold text-slate-900 mt-4 mb-2">{children}</h3>;
                    },

                    // Lists
                    ul({ children }) {
                        return <ul className="list-disc list-inside space-y-1 my-3 text-slate-700">{children}</ul>;
                    },

                    ol({ children }) {
                        return <ol className="list-decimal list-inside space-y-1 my-3 text-slate-700">{children}</ol>;
                    },

                    li({ children }) {
                        return <li className="ml-4">{children}</li>;
                    },

                    // Paragraphs
                    p({ children }) {
                        return <p className="text-slate-700 leading-relaxed my-3">{children}</p>;
                    },

                    // Blockquotes
                    blockquote({ children }) {
                        return (
                            <blockquote className="border-l-4 border-fuchsia-500 pl-4 py-2 my-4 bg-fuchsia-50 text-slate-700 italic">
                                {children}
                            </blockquote>
                        );
                    },

                    // Links
                    a({ href, children }) {
                        return (
                            <a
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-fuchsia-600 hover:text-fuchsia-700 underline"
                            >
                                {children}
                            </a>
                        );
                    },

                    // Strong/Bold
                    strong({ children }) {
                        return <strong className="font-bold text-slate-900">{children}</strong>;
                    },

                    // Emphasis/Italic
                    em({ children }) {
                        return <em className="italic text-slate-700">{children}</em>;
                    },

                    // Horizontal rule
                    hr() {
                        return <hr className="my-6 border-t-2 border-slate-200" />;
                    },
                }}
            >
                {processedContent}
            </ReactMarkdown>
        </div>
    );
}
