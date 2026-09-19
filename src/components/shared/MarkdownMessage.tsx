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
        return <div className="whitespace-pre-wrap text-[var(--cl-on-dark)]">{content}</div>;
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
                                className="px-1.5 py-0.5 bg-[var(--cl-surface-strong)] text-[var(--cl-primary)] rounded text-sm font-mono"
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
                                <table className="min-w-full divide-y divide-[var(--cl-hairline)] border border-[var(--cl-hairline)] rounded-lg">
                                    {children}
                                </table>
                            </div>
                        );
                    },

                    thead({ children }) {
                        return <thead className="bg-[var(--cl-canvas-soft)]">{children}</thead>;
                    },

                    th({ children }) {
                        return (
                            <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--cl-body)] uppercase tracking-wider border-b border-[var(--cl-hairline)]">
                                {children}
                            </th>
                        );
                    },

                    td({ children }) {
                        return (
                            <td className="px-4 py-3 text-sm text-[var(--cl-ink)] border-b border-[var(--cl-hairline)]">
                                {children}
                            </td>
                        );
                    },

                    // Headings
                    h1({ children }) {
                        return <h1 className="text-3xl font-semibold tracking-tight text-foreground mt-6 mb-4">{children}</h1>;
                    },

                    h2({ children }) {
                        return <h2 className="text-xl font-semibold text-[var(--cl-ink)] mt-5 mb-3">{children}</h2>;
                    },

                    h3({ children }) {
                        return <h3 className="text-lg font-semibold text-[var(--cl-ink)] mt-4 mb-2">{children}</h3>;
                    },

                    // Lists
                    ul({ children }) {
                        return <ul className="list-disc list-inside space-y-1 my-3 text-[var(--cl-body)]">{children}</ul>;
                    },

                    ol({ children }) {
                        return <ol className="list-decimal list-inside space-y-1 my-3 text-[var(--cl-body)]">{children}</ol>;
                    },

                    li({ children }) {
                        return <li className="ml-4">{children}</li>;
                    },

                    // Paragraphs
                    p({ children }) {
                        return <p className="text-[var(--cl-body)] leading-relaxed my-3">{children}</p>;
                    },

                    // Blockquotes
                    blockquote({ children }) {
                        return (
                            <blockquote className="border-l-4 border-[var(--cl-primary)] pl-4 py-2 my-4 bg-[var(--cl-primary-soft)] text-[var(--cl-body)] italic">
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
                                className="text-[var(--cl-primary)] hover:text-[var(--cl-primary)] underline"
                            >
                                {children}
                            </a>
                        );
                    },

                    // Strong/Bold
                    strong({ children }) {
                        return <strong className="font-semibold text-[var(--cl-ink)]">{children}</strong>;
                    },

                    // Emphasis/Italic
                    em({ children }) {
                        return <em className="italic text-[var(--cl-body)]">{children}</em>;
                    },

                    // Horizontal rule
                    hr() {
                        return <hr className="my-6 border-t-2 border-[var(--cl-hairline)]" />;
                    },
                }}
            >
                {processedContent}
            </ReactMarkdown>
        </div>
    );
}
