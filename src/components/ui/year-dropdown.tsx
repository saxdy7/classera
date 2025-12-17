"use client"

import * as React from "react"
import { motion, AnimatePresence, MotionConfig } from "framer-motion"
import { ChevronDown, GraduationCap, BookOpen, User } from "lucide-react"

// Utility function for className merging
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ")
}

// Custom hook for click outside detection
function useClickAway(ref: React.RefObject<HTMLElement | null>, handler: (event: MouseEvent | TouchEvent) => void) {
  React.useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return
      }
      handler(event)
    }

    document.addEventListener("mousedown", listener)
    document.addEventListener("touchstart", listener)

    return () => {
      document.removeEventListener("mousedown", listener)
      document.removeEventListener("touchstart", listener)
    }
  }, [ref, handler])
}

// Types
interface YearOption {
  id: string
  label: string
  icon: React.ElementType
  color: string
}

const yearOptions: YearOption[] = [
  { id: "1", label: "1st Year", icon: User, color: "#A06CD5" },
  { id: "2", label: "2nd Year", icon: BookOpen, color: "#FF6B6B" },
  { id: "3", label: "3rd Year", icon: BookOpen, color: "#4ECDC4" },
  { id: "4", label: "4th Year", icon: GraduationCap, color: "#45B7D1" },
  { id: "graduate", label: "Graduate", icon: GraduationCap, color: "#F9C74F" },
]

// Icon wrapper with animation
const IconWrapper = ({
  icon: Icon,
  isHovered,
  color,
}: { icon: React.ElementType; isHovered: boolean; color: string }) => (
  <motion.div 
    className="w-4 h-4 mr-2 relative" 
    initial={false} 
    animate={isHovered ? { scale: 1.2 } : { scale: 1 }}
  >
    <Icon className="w-4 h-4" />
    {isHovered && (
      <motion.div
        className="absolute inset-0"
        style={{ color }}
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      >
        <Icon className="w-4 h-4" strokeWidth={2} />
      </motion.div>
    )}
  </motion.div>
)

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      when: "beforeChildren",
      staggerChildren: 0.05,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: -10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.1, 0.25, 1] as const,
    },
  },
}

// Main component
interface YearDropdownProps {
  value?: string
  onChange: (year: string) => void
  placeholder?: string
}

export function YearDropdown({ value, onChange, placeholder = "Select your year of study" }: YearDropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [selectedYear, setSelectedYear] = React.useState<YearOption | null>(
    value ? yearOptions.find(y => y.id === value) || null : null
  )
  const [hoveredYear, setHoveredYear] = React.useState<string | null>(null)
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  useClickAway(dropdownRef, () => setIsOpen(false))

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false)
    }
  }

  const handleSelect = (year: YearOption) => {
    setSelectedYear(year)
    onChange(year.id)
    setIsOpen(false)
  }

  return (
    <MotionConfig reducedMotion="user">
      <div
        className="w-full relative"
        ref={dropdownRef}
      >
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
              "w-full justify-between bg-white border border-gray-300 text-gray-700 rounded-lg",
              "hover:border-purple-500 hover:bg-gray-50",
              "focus:ring-2 focus:ring-purple-500 focus:border-purple-500",
              "transition-all duration-200 ease-in-out",
              "h-12 px-4",
              "inline-flex items-center",
              isOpen && "border-purple-500 bg-gray-50",
            )}
            aria-expanded={isOpen}
            aria-haspopup="true"
          >
            {selectedYear ? (
              <span className="flex items-center text-gray-900">
                <IconWrapper 
                  icon={selectedYear.icon} 
                  isHovered={false} 
                  color={selectedYear.color} 
                />
                {selectedYear.label}
              </span>
            ) : (
              <span className="text-gray-500">{placeholder}</span>
            )}
            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center justify-center w-5 h-5"
            >
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </motion.div>
          </button>

          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 1, y: 0, height: 0 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  height: "auto",
                  transition: {
                    type: "spring",
                    stiffness: 500,
                    damping: 30,
                    mass: 1,
                  },
                }}
                exit={{
                  opacity: 0,
                  y: 0,
                  height: 0,
                  transition: {
                    type: "spring",
                    stiffness: 500,
                    damping: 30,
                    mass: 1,
                  },
                }}
                className="absolute left-0 right-0 top-full mt-2 z-50"
                onKeyDown={handleKeyDown}
              >
                <motion.div
                  className="w-full rounded-lg border border-gray-200 bg-white p-1 shadow-xl"
                  initial={{ borderRadius: 8 }}
                  animate={{
                    borderRadius: 12,
                    transition: { duration: 0.2 },
                  }}
                  style={{ transformOrigin: "top" }}
                >
                  <motion.div 
                    className="py-2 relative" 
                    variants={containerVariants} 
                    initial="hidden" 
                    animate="visible"
                  >
                    <motion.div
                      layoutId="hover-highlight"
                      className="absolute inset-x-1 bg-purple-50 rounded-md"
                      animate={{
                        y: yearOptions.findIndex((y) => (hoveredYear || selectedYear?.id) === y.id) * 44,
                        height: 44,
                      }}
                      transition={{
                        type: "spring",
                        bounce: 0.15,
                        duration: 0.5,
                      }}
                    />
                    {yearOptions.map((year) => (
                      <motion.button
                        key={year.id}
                        type="button"
                        onClick={() => handleSelect(year)}
                        onHoverStart={() => setHoveredYear(year.id)}
                        onHoverEnd={() => setHoveredYear(null)}
                        className={cn(
                          "relative flex w-full items-center px-4 py-2.5 text-sm rounded-md",
                          "transition-colors duration-150",
                          "focus:outline-none",
                          selectedYear?.id === year.id || hoveredYear === year.id
                            ? "text-purple-700 font-medium"
                            : "text-gray-700",
                        )}
                        whileTap={{ scale: 0.98 }}
                        variants={itemVariants}
                      >
                        <IconWrapper
                          icon={year.icon}
                          isHovered={hoveredYear === year.id}
                          color={year.color}
                        />
                        {year.label}
                      </motion.button>
                    ))}
                  </motion.div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
    </MotionConfig>
  )
}
