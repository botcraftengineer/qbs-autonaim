import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface Breadcrumb {
  title: string;
  href?: string;
}

interface DocsBreadcrumbProps {
  items: Breadcrumb[];
}

export function DocsBreadcrumb({ items }: DocsBreadcrumbProps) {
  return (
    <nav className="mb-4 flex items-center gap-1 text-sm text-muted-foreground">
      {items.map((item, index) => (
        <span key={index} className="flex items-center gap-1">
          {index > 0 && <ChevronRight className="h-3.5 w-3.5" />}
          {item.href ? (
            <Link
              href={item.href}
              className="hover:text-foreground transition-colors"
            >
              {item.title}
            </Link>
          ) : (
            <span className="text-foreground">{item.title}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
