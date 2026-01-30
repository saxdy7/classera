'use client';

import { useCallback } from 'react';
import ReactFlow, {
    Node,
    Edge,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    Connection,
    BackgroundVariant,
    MiniMap,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { RoadmapNode } from './RoadmapNode';

const nodeTypes = {
    roadmapNode: RoadmapNode,
};

interface RoadmapCanvasProps {
    initialNodes?: Node[];
    initialEdges?: Edge[];
    onNodesChange?: (nodes: Node[]) => void;
    onEdgesChange?: (edges: Edge[]) => void;
    editable?: boolean;
}

export function RoadmapCanvas({
    initialNodes = [],
    initialEdges = [],
    onNodesChange,
    onEdgesChange,
    editable = false,
}: RoadmapCanvasProps) {
    const [nodes, setNodes, handleNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, handleEdgesChange] = useEdgesState(initialEdges);

    const onConnect = useCallback(
        (params: Connection) => {
            const newEdges = addEdge(
                {
                    ...params,
                    animated: true,
                    style: { stroke: '#9333ea', strokeWidth: 2 },
                },
                edges
            );
            setEdges(newEdges);
            onEdgesChange?.(newEdges);
        },
        [edges, setEdges, onEdgesChange]
    );

    const handleNodesUpdate = useCallback(
        (changes: any) => {
            handleNodesChange(changes);
            onNodesChange?.(nodes);
        },
        [handleNodesChange, nodes, onNodesChange]
    );

    return (
        <div className="w-full h-[600px] border-2 border-gray-200 rounded-xl overflow-hidden bg-white">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={handleNodesUpdate}
                onEdgesChange={handleEdgesChange}
                onConnect={editable ? onConnect : undefined}
                nodeTypes={nodeTypes}
                fitView
                attributionPosition="bottom-left"
            >
                <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#e5e7eb" />
                <Controls />
                <MiniMap
                    nodeColor={(node) => {
                        interface NodeData {
                            title: string;
                            description?: string;
                            type?: string;
                            color?: string;
                        }
                        const data = node.data as NodeData;
                        return data.color || '#9333ea';
                    }}
                    maskColor="rgba(0, 0, 0, 0.1)"
                />
            </ReactFlow>
        </div>
    );
}
