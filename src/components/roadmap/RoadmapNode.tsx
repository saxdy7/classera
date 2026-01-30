'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { CheckCircle2, Circle, Clock, BookOpen } from 'lucide-react';

export const RoadmapNode = memo(({ data }: NodeProps) => {
    const isCompleted = data.status === 'completed';
    const isInProgress = data.status === 'in_progress';

    return (
        <div
            className={`px-4 py-3 rounded-lg border-2 shadow-lg min-w-[200px] max-w-[250px] transition-all ${isCompleted
                    ? 'bg-green-50 border-green-400'
                    : isInProgress
                        ? 'bg-blue-50 border-blue-400'
                        : 'bg-white border-purple-300 hover:border-purple-500'
                }`}
            style={{
                borderColor: data.color || '#9333ea',
            }}
        >
            <Handle
                type="target"
                position={Position.Top}
                className="w-3 h-3 !bg-purple-500"
            />

            <div className="flex items-start gap-2">
                <div className="flex-shrink-0 mt-0.5">
                    {isCompleted ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : isInProgress ? (
                        <Circle className="h-5 w-5 text-blue-600 animate-pulse" />
                    ) : (
                        <Circle className="h-5 w-5 text-gray-400" />
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm text-gray-900 mb-1 line-clamp-2">
                        {data.title}
                    </h4>
                    {data.description && (
                        <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                            {data.description}
                        </p>
                    )}

                    <div className="flex items-center gap-3 text-xs text-gray-500">
                        {data.node_type && (
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded">
                                {data.node_type}
                            </span>
                        )}
                        {data.estimated_hours && (
                            <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>{data.estimated_hours}h</span>
                            </div>
                        )}
                        {data.resources && (
                            <div className="flex items-center gap-1">
                                <BookOpen className="h-3 w-3" />
                                <span>
                                    {(data.resources.videos?.length || 0) +
                                        (data.resources.articles?.length || 0)}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Handle
                type="source"
                position={Position.Bottom}
                className="w-3 h-3 !bg-purple-500"
            />
        </div>
    );
});

RoadmapNode.displayName = 'RoadmapNode';
