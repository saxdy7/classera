"use client";

import { Calendar, Code, Users, BookOpen, BarChart } from "lucide-react";
import RadialOrbitalTimeline from "@/components/ui/radial-orbital-timeline";

const timelineData = [
  {
    id: 1,
    title: "Course Creation",
    date: "Start Here",
    content: "Design and build engaging course content with our intuitive course builder.",
    category: "Content",
    icon: BookOpen,
    relatedIds: [2],
    status: "completed" as const,
    energy: 100,
  },
  {
    id: 2,
    title: "Live Classes",
    date: "Interactive",
    content: "Conduct real-time interactive sessions with students using video conferencing.",
    category: "Teaching",
    icon: Users,
    relatedIds: [1, 3],
    status: "completed" as const,
    energy: 90,
  },
  {
    id: 3,
    title: "Student Management",
    date: "Organize",
    content: "Track student progress, manage enrollments, and organize learning groups.",
    category: "Management",
    icon: Calendar,
    relatedIds: [2, 4],
    status: "in-progress" as const,
    energy: 75,
  },
  {
    id: 4,
    title: "Analytics Hub",
    date: "Insights",
    content: "Monitor learning progress with detailed analytics and performance reports.",
    category: "Analytics",
    icon: BarChart,
    relatedIds: [3, 5],
    status: "in-progress" as const,
    energy: 60,
  },
  {
    id: 5,
    title: "Assessment Tools",
    date: "Evaluate",
    content: "Create quizzes, assignments, and automated grading systems.",
    category: "Assessment",
    icon: Code,
    relatedIds: [4],
    status: "pending" as const,
    energy: 40,
  },
];

export function RadialOrbitalTimelineDemo() {
  return (
    <RadialOrbitalTimeline timelineData={timelineData} />
  );
}

export default RadialOrbitalTimelineDemo;