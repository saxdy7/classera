"use client";

import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";

interface DisplayCardProps {
  className?: string;
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  date?: string;
  titleClassName?: string;
  index?: number;
}

function DisplayCard({
  className,
  icon = <Sparkles className="size-4 text-blue-300" />,
  title = "Featured",
  description = "Discover amazing content",
  date = "Just now",
  titleClassName = "text-blue-500",
  index = 0,
}: DisplayCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        delay: index * 0.2,
        duration: 0.6,
        type: "spring",
        stiffness: 100,
        damping: 15
      }}
      whileHover={{ 
        y: -20, 
        scale: 1.05,
        filter: "grayscale(0%)",
        transition: { duration: 0.3 }
      }}
      className={cn(
        "relative flex h-36 w-[22rem] -skew-y-[8deg] select-none flex-col justify-between rounded-3xl border-2 border-gray-300 bg-white/90 backdrop-blur-sm px-4 py-3 shadow-md cursor-pointer grayscale hover:grayscale-0 hover:border-gray-400 hover:bg-white hover:shadow-2xl after:absolute after:-right-1 after:top-[-5%] after:h-[110%] after:w-[20rem] after:bg-gradient-to-l after:from-white after:to-transparent after:content-[''] [&>*]:flex [&>*]:items-center [&>*]:gap-2",
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
    </motion.div>
  );
}

interface DisplayCardsProps {
  cards?: DisplayCardProps[];
}

export default function DisplayCards({ cards }: DisplayCardsProps) {
  const defaultCards = [
    {
      className: "[grid-area:stack]",
      index: 0,
    },
    {
      className: "[grid-area:stack] translate-x-16 translate-y-10",
      index: 1,
    },
    {
      className: "[grid-area:stack] translate-x-32 translate-y-20",
      index: 2,
    },
  ];

  const displayCards = cards || defaultCards;

  return (
    <div className="grid [grid-template-areas:'stack'] place-items-center">
      {displayCards.map((cardProps, index) => (
        <DisplayCard key={index} index={cardProps.index ?? index} {...cardProps} />
      ))}
    </div>
  );
}