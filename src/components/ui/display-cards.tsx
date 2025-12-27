"use client";

import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

interface DisplayCardProps {
  className?: string;
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  date?: string;
  titleClassName?: string;
}

function DisplayCard({
  className,
  icon = <Sparkles className="size-4 text-blue-300" />,
  title = "Featured",
  description = "Discover amazing content",
  date = "Just now",
  titleClassName = "text-blue-500",
}: DisplayCardProps) {
  return (
    <div
      className={cn(
        "relative flex h-36 w-[22rem] -skew-y-[8deg] select-none flex-col justify-between rounded-3xl border-2 border-gray-300 bg-white/90 backdrop-blur-sm px-4 py-3 transition-all duration-700 shadow-md after:absolute after:-right-1 after:top-[-5%] after:h-[110%] after:w-[20rem] after:bg-gradient-to-l after:from-white after:to-transparent after:content-[''] hover:border-gray-400 hover:bg-white hover:shadow-xl [&>*]:flex [&>*]:items-center [&>*]:gap-2",
        className
      )}
    >
      <div>
        <span className="relative inline-block rounded-full bg-gray-100 p-1">
          {icon}
        </span>
        <p className={cn("text-lg font-medium text-gray-900", titleClassName)}>{title}</p>
      </div>
      <p className="whitespace-nowrap text-lg text-gray-700">{description}</p>
      <p className="text-gray-500">{date}</p>
    </div>
  );
}

interface DisplayCardsProps {
  cards?: DisplayCardProps[];
}

export default function DisplayCards({ cards }: DisplayCardsProps) {
  const defaultCards = [
    {
      className: "[grid-area:stack] hover:-translate-y-10 transition-all duration-700 grayscale-[100%] hover:grayscale-0 before:absolute before:inset-0 before:rounded-3xl before:bg-gray-200/30 before:transition-opacity before:duration-700 hover:before:opacity-0",
    },
    {
      className: "[grid-area:stack] translate-x-16 translate-y-10 hover:-translate-y-1 transition-all duration-700 grayscale-[100%] hover:grayscale-0 before:absolute before:inset-0 before:rounded-3xl before:bg-gray-200/30 before:transition-opacity before:duration-700 hover:before:opacity-0",
    },
    {
      className: "[grid-area:stack] translate-x-32 translate-y-20 hover:translate-y-10 transition-all duration-700",
    },
  ];

  const displayCards = cards || defaultCards;

  return (
    <div className="grid [grid-template-areas:'stack'] place-items-center opacity-100 animate-in fade-in-0 duration-700">
      {displayCards.map((cardProps, index) => (
        <DisplayCard key={index} {...cardProps} />
      ))}
    </div>
  );
}