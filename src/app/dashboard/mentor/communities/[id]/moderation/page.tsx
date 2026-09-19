import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Flag, CheckCircle, XCircle, Clock, AlertTriangle, User, MessageSquare, FileText } from "lucide-react";
import { ModerationActions } from "@/components/communities/ModerationActions";

export default async function CommunityModerationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: communityId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signin");
  }

  // Verify mentor owns this community
  const { data: community } = await supabase
    .from("communities")
    .select("name, mentor_id")
    .eq("id", communityId)
    .single();

  if (!community || community.mentor_id !== user.id) {
    redirect("/dashboard/mentor");
  }

  // Fetch all reports with detailed information
  const { data: reports } = await supabase
    .from("community_reports")
    .select(`
      id,
      reason,
      description,
      status,
      created_at,
      reporter:reporter_id (
        id,
        full_name,
        avatar_url
      ),
      post:post_id (
        id,
        title,
        content,
        created_at,
        author:author_id (
          id,
          full_name,
          avatar_url
        )
      ),
      comment:comment_id (
        id,
        content,
        created_at,
        author:author_id (
          id,
          full_name,
          avatar_url
        )
      )
    `)
    .eq("community_id", communityId)
    .order("created_at", { ascending: false });

  const pendingCount = reports?.filter((r) => r.status === "pending").length || 0;
  const resolvedCount = reports?.filter((r) => r.status === "resolved").length || 0;
  const dismissedCount = reports?.filter((r) => r.status === "dismissed").length || 0;

  return (
    <div className="min-h-screen py-8 bg-[var(--cl-canvas)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-[rgba(171,100,0,0.12)] rounded-[var(--cl-r-lg)]">
              <Flag className="w-6 h-6 text-[var(--cl-warning)]" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-[var(--cl-ink)]">Moderation Dashboard</h1>
              <p className="text-[var(--cl-body)]">{community.name}</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] p-6 border border-[var(--cl-warning)]">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[rgba(171,100,0,0.12)] rounded-[var(--cl-r-lg)]">
                <Clock className="w-6 h-6 text-[var(--cl-warning)]" />
              </div>
              <div>
                <div className="text-2xl font-semibold text-[var(--cl-ink)]">{pendingCount}</div>
                <div className="text-sm text-[var(--cl-body)]">Pending Reports</div>
              </div>
            </div>
          </div>

          <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] p-6 border border-[var(--cl-success)]">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[rgba(22,163,74,0.12)] rounded-[var(--cl-r-lg)]">
                <CheckCircle className="w-6 h-6 text-[var(--cl-success)]" />
              </div>
              <div>
                <div className="text-2xl font-semibold text-[var(--cl-ink)]">{resolvedCount}</div>
                <div className="text-sm text-[var(--cl-body)]">Resolved</div>
              </div>
            </div>
          </div>

          <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] p-6 border border-[var(--cl-hairline)]">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[var(--cl-surface-strong)] rounded-[var(--cl-r-lg)]">
                <XCircle className="w-6 h-6 text-[var(--cl-body)]" />
              </div>
              <div>
                <div className="text-2xl font-semibold text-[var(--cl-ink)]">{dismissedCount}</div>
                <div className="text-sm text-[var(--cl-body)]">Dismissed</div>
              </div>
            </div>
          </div>
        </div>

        {/* Reports List */}
        <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] border border-[var(--cl-hairline)]">
          <div className="p-6 border-b border-[var(--cl-hairline)]">
            <h2 className="text-xl font-semibold text-[var(--cl-ink)]">All Reports</h2>
          </div>

          <div className="divide-y divide-[var(--cl-hairline)]">
            {reports && reports.length > 0 ? (
              reports.map((report) => (
                <div key={report.id} className="p-6 hover:bg-[var(--cl-canvas-soft)] transition-colors">
                  <div className="flex items-start gap-4">
                    {/* Status Indicator */}
                    <div
                      className={`p-2 rounded-lg ${report.status === "pending"
                        ? "bg-[rgba(171,100,0,0.12)]"
                        : report.status === "resolved"
                          ? "bg-[rgba(22,163,74,0.12)]"
                          : "bg-[var(--cl-surface-strong)]"
                        }`}
                    >
                      {report.status === "pending" ? (
                        <AlertTriangle className="w-5 h-5 text-[var(--cl-warning)]" />
                      ) : report.status === "resolved" ? (
                        <CheckCircle className="w-5 h-5 text-[var(--cl-success)]" />
                      ) : (
                        <XCircle className="w-5 h-5 text-[var(--cl-body)]" />
                      )}
                    </div>

                    <div className="flex-1">
                      {/* Report Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${report.status === "pending"
                                ? "bg-[rgba(171,100,0,0.12)] text-[var(--cl-warning)]"
                                : report.status === "resolved"
                                  ? "bg-[rgba(22,163,74,0.12)] text-[var(--cl-success)]"
                                  : "bg-[var(--cl-surface-strong)] text-[var(--cl-body)]"
                                }`}
                            >
                              {report.status.toUpperCase()}
                            </span>
                            <span className="px-3 py-1 bg-[var(--cl-primary-soft)] text-[var(--cl-primary)] rounded-full text-xs font-medium">
                              {report.reason.replace("_", " ").toUpperCase()}
                            </span>
                          </div>
                          <div className="text-sm text-[var(--cl-body)]">
                            Reported {new Date(report.created_at).toLocaleDateString()} at{" "}
                            {new Date(report.created_at).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>

                      {/* Reporter Info */}
                      <div className="flex items-center gap-2 mb-3">
                        <User className="w-4 h-4 text-[var(--cl-muted-soft)]" />
                        <span className="text-sm text-[var(--cl-body)]">
                          Reported by{" "}
                          <span className="font-medium text-[var(--cl-ink)]">
                            {report.reporter?.[0]?.full_name || "Unknown User"}
                          </span>
                        </span>
                      </div>

                      {/* Report Description */}
                      {report.description && (
                        <div className="mb-4 p-3 bg-[var(--cl-canvas-soft)] rounded-lg">
                          <p className="text-sm text-[var(--cl-body)]">{report.description}</p>
                        </div>
                      )}

                      {/* Reported Content */}
                      <div className="bg-[rgba(239,68,68,0.12)] border border-[var(--cl-error)] rounded-lg p-4 mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          {report.post?.[0] ? (
                            <>
                              <FileText className="w-4 h-4 text-[var(--cl-error)]" />
                              <span className="text-sm font-medium text-[var(--cl-error)]">Reported Post</span>
                            </>
                          ) : (
                            <>
                              <MessageSquare className="w-4 h-4 text-[var(--cl-error)]" />
                              <span className="text-sm font-medium text-[var(--cl-error)]">Reported Comment</span>
                            </>
                          )}
                        </div>
                        {report.post?.[0] && (
                          <div>
                            {report.post[0].title && (
                              <h4 className="font-semibold text-[var(--cl-ink)] mb-1">{report.post[0].title}</h4>
                            )}
                            <p className="text-sm text-[var(--cl-body)] line-clamp-3">{report.post[0].content}</p>
                            <div className="text-xs text-[var(--cl-muted)] mt-2">
                              By {report.post[0].author?.[0]?.full_name || "Unknown"} •{" "}
                              {new Date(report.post[0].created_at).toLocaleDateString()}
                            </div>
                          </div>
                        )}
                        {report.comment?.[0] && (
                          <div>
                            <p className="text-sm text-[var(--cl-body)]">{report.comment[0].content}</p>
                            <div className="text-xs text-[var(--cl-muted)] mt-2">
                              By {report.comment[0].author?.[0]?.full_name || "Unknown"} •{" "}
                              {new Date(report.comment[0].created_at).toLocaleDateString()}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      {report.status === "pending" && (
                        <ModerationActions
                          reportId={report.id}
                          postId={report.post?.[0]?.id}
                          commentId={report.comment?.[0]?.id}
                          communityId={communityId}
                        />
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center">
                <div className="w-20 h-20 bg-[var(--cl-surface-strong)] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Flag className="w-10 h-10 text-[var(--cl-muted-soft)]" />
                </div>
                <h3 className="text-xl font-semibold text-[var(--cl-ink)] mb-2">No reports yet</h3>
                <p className="text-[var(--cl-body)]">Your community is clean! Reports will appear here.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
