"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

interface Category {
  id: string
  name: string
  count: number
}

interface BlogCategoryNavProps {
  categories: Category[]
}

export function BlogCategoryNav({ categories }: BlogCategoryNavProps) {
  const [activeCategory, setActiveCategory] = useState("all")

  return (
    <nav className="flex flex-wrap gap-2">
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => setActiveCategory(category.id)}
          className={cn(
            "px-4 py-2 text-sm font-medium rounded-full transition-all duration-200",
            activeCategory === category.id
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:text-foreground hover:bg-muted",
          )}
        >
          {category.name}
        </button>
      ))}
    </nav>
  )
}
