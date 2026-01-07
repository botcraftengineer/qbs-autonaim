import Link from "next/link"
import Image from "next/image"

interface Author {
  name: string
  role: string
  avatar: string
}

interface BlogPost {
  id: string
  slug: string
  title: string
  excerpt: string
  category: string
  categoryLabel: string
  date: string
  author: Author
  image: string
  featured?: boolean
}

interface BlogCardProps {
  post: BlogPost
  index: number
}

export function BlogCard({ post, index }: BlogCardProps) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group block animate-fade-up"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {/* Image Container */}
      <div className="relative aspect-[16/10] mb-4 overflow-hidden rounded-2xl border border-border/50 bg-muted/30">
        <Image
          src={post.image || "/placeholder.svg"}
          alt={post.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* Subtle gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Content */}
      <div>
        <h3 className="text-lg font-semibold text-foreground leading-snug mb-2 group-hover:text-primary transition-colors line-clamp-2">
          {post.title}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-2">{post.excerpt}</p>

        {/* Author & Date */}
        <div className="flex items-center gap-3">
          <div className="relative h-8 w-8 overflow-hidden rounded-full border border-border/50">
            <Image
              src={post.author.avatar || "/placeholder.svg"}
              alt={post.author.name}
              fill
              className="object-cover"
            />
          </div>
          <span className="text-sm text-muted-foreground">{post.date}</span>
        </div>
      </div>
    </Link>
  )
}
