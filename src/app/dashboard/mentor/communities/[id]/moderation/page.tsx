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
    <div className="min-h-screen py-8 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-amber-500/10 rounded-lg">
              <Flag className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground">Moderation Dashboard</h1>
              <p className="text-foreground/80">{community.name}</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-card rounded-xl p-6 border border-amber-500">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-500/10 rounded-lg">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <div className="text-2xl font-semibold text-foreground">{pendingCount}</div>
                <div className="text-sm text-foreground/80">Pending Reports</div>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl p-6 border border-green-600">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/10 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-semibold text-foreground">{resolvedCount}</div>
                <div className="text-sm text-foreground/80">Resolved</div>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl p-6 border border-border">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-muted rounded-lg">
                <XCircle className="w-6 h-6 text-foreground/80" />
              </div>
              <div>
                <div className="text-2xl font-semibold text-foreground">{dismissedCount}</div>
                <div className="text-sm text-foreground/80">Dismissed</div>
              </div>
            </div>
          </div>
        </div>

        {/* Reports List */}
        <div className="bg-card rounded-xl border border-border">
          <div className="p-6 border-b border-border">
            <h2 className="text-xl font-semibold text-foreground">All Reports</h2>
          </div>

          <div className="divide-y divide-border">
            {reports && reports.length > 0 ? (
              reports.map((report) => (
                <div key={report.id} className="p-6 hover:bg-muted/40 transition-colors">
                  <div className="flex items-start gap-4">
                    {/* Status Indicator */}
                    <div
                      className={`p-2 rounded-lg ${report.status === "pending"
                        ? "bg-amber-500/10"
                        : report.status === "resolved"
                          ? "bg-green-500/10"
                          : "bg-muted"
                        }`}
                    >
                      {report.status === "pending" ? (
                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                      ) : report.status === "resolved" ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-foreground/80" />
                      )}
                    </div>

                    <div className="flex-1">
                      {/* Report Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${report.status === "pending"
                                ? "bg-amber-500/10 text-amber-600"
                                : report.status === "resolved"
                                  ? "bg-green-500/10 text-green-600"
                                  : "bg-muted text-foreground/80"
                                }`}
                            >
                              {report.status.toUpperCase()}
                            </span>
                            <span className="px-3 py-1 bg-accent-purple/10 text-accent-purple rounded-full text-xs font-medium">
                              {report.reason.replace("_", " ").toUpperCase()}
                            </span>
                          </div>
                          <div className="text-sm text-foreground/80">
                            Reported {new Date(report.created_at).toLocaleDateString()} at{" "}
                            {new Date(report.created_at).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>

                      {/* Reporter Info */}
                      <div className="flex items-center gap-2 mb-3">
                        <User className="w-4 h-4 text-muted-foreground/70" />
                        <span className="text-sm text-foreground/80">
                          Reported by{" "}
                          <span className="font-medium text-foreground">
                            {report.reporter?.[0]?.full_name || "Unknown User"}
                          </span>
                        </span>
                      </div>

                      {/* Report Description */}
                      {report.description && (
                        <div className="mb-4 p-3 bg-muted/40 rounded-lg">
                          <p className="text-sm text-foreground/80">{report.description}</p>
                        </div>
                      )}

                      {/* Reported Content */}
                      <div className="bg-destructive/10 border border-destructive rounded-lg p-4 mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          {report.post?.[0] ? (
                            <>
                              <FileText className="w-4 h-4 text-destructive" />
                              <span className="text-sm font-medium text-destructive">Reported Post</span>
                            </>
                          ) : (
                            <>
                              <MessageSquare className="w-4 h-4 text-destructive" />
                              <span className="text-sm font-medium text-destructive">Reported Comment</span>
                            </>
                          )}
                        </div>
                        {report.post?.[0] && (
                          <div>
                            {report.post[0].title && (
                              <h4 className="font-semibold text-foreground mb-1">{report.post[0].title}</h4>
                            )}
                            <p className="text-sm text-foreground/80 line-clamp-3">{report.post[0].content}</p>
                            <div className="text-xs text-muted-foreground mt-2">
                              By {report.post[0].author?.[0]?.full_name || "Unknown"} •{" "}
                              {new Date(report.post[0].created_at).toLocaleDateString()}
                            </div>
                          </div>
                        )}
                        {report.comment?.[0] && (
                          <div>
                            <p className="text-sm text-foreground/80">{report.comment[0].content}</p>
                            <div className="text-xs text-muted-foreground mt-2">
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
                <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Flag className="w-10 h-10 text-muted-foreground/70" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">No reports yet</h3>
                <p className="text-foreground/80">Your community is clean! Reports will appear here.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
