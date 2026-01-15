import Link from "next/link";
import { DocsBreadcrumb } from "@/components/docs/docs-breadcrumb";
import { DocsCallout } from "@/components/docs/docs-callout";
import { DocsToc } from "@/components/docs/docs-toc";

export default function CoverLettersGuidePage() {
  const tocItems = [
    { id: "debate", title: "Спор о письмах", level: 2 },
    { id: "when-read", title: "Когда читать", level: 2 },
    { id: "when-skip", title: "Когда пропускать", level: 2 },
    { id: "red-flags", title: "Красные флаги", level: 2 },
  ];

  return (
    <div className="flex gap-12">
      <article className="flex-1 max-w-3xl">
        <DocsBreadcrumb
          items={[
            { title:
