import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Flag, CheckCircle, XCircle, Clock, AlertTriangle, User, MessageSquare, FileText } from "lucide-react";
import { ModerationActions } from "@/components/communities/ModerationActions";

export default async function CommunityModerationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: communityId } = await params;
  const supabase = await createServerClient();

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-amber-100 rounded-xl">
              <Flag className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Moderation Dashboard</h1>
              <p className="text-slate-600">{community.name}</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 border border-amber-200">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-100 rounded-xl">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{pendingCount}</div>
                <div className="text-sm text-slate-600">Pending Reports</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-green-200">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-xl">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{resolvedCount}</div>
                <div className="text-sm text-slate-600">Resolved</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-slate-100 rounded-xl">
                <XCircle className="w-6 h-6 text-slate-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{dismissedCount}</div>
                <div className="text-sm text-slate-600">Dismissed</div>
              </div>
            </div>
          </div>
        </div>

        {/* Reports List */}
        <div className="bg-white rounded-2xl border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-xl font-bold text-slate-900">All Reports</h2>
          </div>

          <div className="divide-y divide-slate-200">
            {reports && reports.length > 0 ? (
              reports.map((report) => (
                <div key={report.id} className="p-6 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start gap-4">
                    {/* Status Indicator */}
                    <div
                      className={`p-2 rounded-lg ${
                        report.status === "pending"
                          ? "bg-amber-100"
                          : report.status === "resolved"
                          ? "bg-green-100"
                          : "bg-slate-100"
                      }`}
                    >
                      {report.status === "pending" ? (
                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                      ) : report.status === "resolved" ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-slate-600" />
                      )}
                    </div>

                    <div className="flex-1">
                      {/* Report Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                report.status === "pending"
                                  ? "bg-amber-100 text-amber-700"
                                  : report.status === "resolved"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {report.status.toUpperCase()}
                            </span>
                            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
                              {report.reason.replace("_", " ").toUpperCase()}
                            </span>
                          </div>
                          <div className="text-sm text-slate-600">
                            Reported {new Date(report.created_at).toLocaleDateString()} at{" "}
                            {new Date(report.created_at).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>

                      {/* Reporter Info */}
                      <div className="flex items-center gap-2 mb-3">
                        <User className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-600">
                          Reported by{" "}
                          <span className="font-medium text-slate-900">
                            {report.reporter?.full_name || "Unknown User"}
                          </span>
                        </span>
                      </div>

                      {/* Report Description */}
                      {report.description && (
                        <div className="mb-4 p-3 bg-slate-50 rounded-lg">
                          <p className="text-sm text-slate-700">{report.description}</p>
                        </div>
                      )}

                      {/* Reported Content */}
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          {report.post_id ? (
                            <>
                              <FileText className="w-4 h-4 text-red-600" />
                              <span className="text-sm font-medium text-red-900">Reported Post</span>
                            </>
                          ) : (
                            <>
                              <MessageSquare className="w-4 h-4 text-red-600" />
                              <span className="text-sm font-medium text-red-900">Reported Comment</span>
                            </>
                          )}
                        </div>
                        {report.post && (
                          <div>
                            {report.post.title && (
                              <h4 className="font-semibold text-slate-900 mb-1">{report.post.title}</h4>
                            )}
                            <p className="text-sm text-slate-700 line-clamp-3">{report.post.content}</p>
                            <div className="text-xs text-slate-500 mt-2">
                              By {report.post.author?.full_name || "Unknown"} •{" "}
                              {new Date(report.post.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        )}
                        {report.comment && (
                          <div>
                            <p className="text-sm text-slate-700">{report.comment.content}</p>
                            <div className="text-xs text-slate-500 mt-2">
                              By {report.comment.author?.full_name || "Unknown"} •{" "}
                              {new Date(report.comment.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      {report.status === "pending" && (
                        <ModerationActions
                          reportId={report.id}
                          postId={report.post_id}
                          commentId={report.comment_id}
                          communityId={communityId}
                        />
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Flag className="w-10 h-10 text-slate-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">No reports yet</h3>
                <p className="text-slate-600">Your community is clean! Reports will appear here.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
