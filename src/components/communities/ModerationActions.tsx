"use client";

import { useState } from "react";
import { CheckCircle, XCircle, Trash2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface ModerationActionsProps {
  reportId: string;
  postId?: string;
  commentId?: string;
  communityId: string;
}

export function ModerationActions({
  reportId,
  postId,
  commentId,
  communityId,
}: ModerationActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleResolve = async (deleteContent: boolean) => {
    if (
      !confirm(
        deleteContent
          ? "This will delete the content and mark the report as resolved. Continue?"
          : "This will mark the report as resolved without deleting content. Continue?"
      )
    ) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/community-moderation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId,
          action: "resolve",
          deleteContent,
          postId,
          commentId,
        }),
      });

      if (!response.ok) throw new Error("Failed to resolve report");

      router.refresh();
    } catch (error) {
      console.error("Error resolving report:", error);
      alert("Failed to resolve report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = async () => {
    if (!confirm("This will dismiss the report as invalid. Continue?")) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/community-moderation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId,
          action: "dismiss",
        }),
      });

      if (!response.ok) throw new Error("Failed to dismiss report");

      router.refresh();
    } catch (error) {
      console.error("Error dismissing report:", error);
      alert("Failed to dismiss report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-3">
      <button
        onClick={() => handleResolve(true)}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-[var(--cl-error)] text-[var(--cl-on-dark)] rounded-lg hover:bg-[var(--cl-error)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Trash2 className="w-4 h-4" />
        )}
        Delete & Resolve
      </button>

      <button
        onClick={() => handleResolve(false)}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-[var(--cl-success)] text-[var(--cl-on-dark)] rounded-lg hover:bg-[var(--cl-success)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <CheckCircle className="w-4 h-4" />
        )}
        Resolve (Keep Content)
      </button>

      <button
        onClick={handleDismiss}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-[var(--cl-surface-strong)] text-[var(--cl-on-dark)] rounded-lg hover:bg-[var(--cl-surface-inverse)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <XCircle className="w-4 h-4" />
        )}
        Dismiss
      </button>
    </div>
  );
}
