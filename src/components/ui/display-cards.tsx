"use client";

import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

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
  icon = <Sparkles className="size-4 text-accent-purple" />,
  title = "Featured",
  description = "Discover amazing content",
  date = "Just now",
  titleClassName = "text-accent-purple",
  index = 0,
}: DisplayCardProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={
        reduceMotion
          ? { duration: 0.3 }
          : { delay: index * 0.2, duration: 0.6, type: "spring", stiffness: 100, damping: 15 }
      }
      whileHover={
        reduceMotion
          ? { filter: "grayscale(0%)" }
          : { y: -20, scale: 1.05, filter: "grayscale(0%)", transition: { duration: 0.3 } }
      }
      className={cn(
        "relative flex h-36 w-[22rem] -skew-y-[8deg] select-none flex-col justify-between rounded-xl border-2 border-border bg-[rgba(255,255,255,0.9)] backdrop-blur-sm px-4 py-3 cursor-pointer grayscale hover:grayscale-0 hover:border-border hover:bg-card after:absolute after:-right-1 after:top-[-5%] after:h-[110%] after:w-[20rem] after:content-[''] [&>*]:flex [&>*]:items-center [&>*]:gap-2",
        className
      )}
    >
      <div>
        <span className="relative inline-block rounded-full bg-muted p-1">
          {icon}
        </span>
        <p className={cn("text-lg font-medium text-foreground", titleClassName)}>{title}</p>
      </div>
      <p className="whitespace-nowrap text-lg text-foreground/80">{description}</p>
      <p className="text-muted-foreground">{date}</p>
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