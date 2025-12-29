#!/usr/bin/env node
import { readdirSync, readFileSync, statSync, writeFileSync } from "fs";
import { join } from "path";

function getAllFiles(dir, files = []) {
  const items = readdirSync(dir);
  for (const item of items) {
    const path = join(dir, item);
    if (statSync(path).isDirectory()) {
      if (!path.includes("node_modules") && !path.includes(".next")) {
        getAllFiles(path, files);
      }
    } else if (path.endsWith(".tsx") || path.endsWith(".ts")) {
      files.push(path);
    }
  }
  return files;
}

const files = getAllFiles("apps/app/src");
let totalChanges = 0;

for (const file of files) {
  let content = readFileSync(file, "utf-8");
  const original = content;
  let changed = false;
  let needsUseQuery = false;
  let needsUseMutation = false;

  // Пропускаем файл react.tsx
  if (file.includes("trpc/react.tsx") || file.includes("trpc\\react.tsx"))
    continue;

  // Заменяем все вхождения .useQuery( и .useMutation(
  // Ищем паттерн: trpc.xxx.yyy.useQuery( или trpc.xxx.yyy.zzz.useQuery(
  const useQueryRegex = /(trpc(?:\.\w+)+)\.useQuery\(/g;
  const useMutationRegex = /(trpc(?:\.\w+)+)\.useMutation\(/g;

  if (useQueryRegex.test(content)) {
    needsUseQuery = true;
    changed = true;
  }
  content = content.replace(useQueryRegex, "useQuery($1.queryOptions(");

  if (useMutationRegex.test(content)) {
    needsUseMutation = true;
    changed = true;
  }
  content = content.replace(
    useMutationRegex,
    "useMutation($1.mutationOptions(",
  );

  // Добавляем импорты если нужно
  if (changed) {
    const hasTanstackImport =
      content.includes("from '@tanstack/react-query'") ||
      content.includes('from "@tanstack/react-query"');

    if (!hasTanstackImport && (needsUseQuery || needsUseMutation)) {
      // Ищем первый импорт
      const firstImportMatch = content.match(/^import\s+/m);
      if (firstImportMatch) {
        const imports = [];
        if (needsUseQuery) imports.push("useQuery");
        if (needsUseMutation) imports.push("useMutation");

        const insertPos = firstImportMatch.index;
        content =
          content.slice(0, insertPos) +
          `import { ${imports.join(", ")} } from '@tanstack/react-query';\n` +
          content.slice(insertPos);
      }
    } else if (hasTanstackImport) {
      // Добавляем в существующий импорт если нужно
      if (
        needsUseQuery &&
        !content.match(
          /import\s+{[^}]*\buseQuery\b[^}]*}\s+from\s+['"]@tanstack\/react-query['"]/,
        )
      ) {
        content = content.replace(
          /(import\s+{)([^}]*)(}\s+from\s+['"]@tanstack\/react-query['"])/,
          (match, start, imports, end) => {
            const trimmed = imports.trim();
            if (trimmed && !trimmed.endsWith(",")) {
              return start + trimmed + ", useQuery" + end;
            }
            return start + trimmed + "useQuery" + end;
          },
        );
      }
      if (
        needsUseMutation &&
        !content.match(
          /import\s+{[^}]*\buseMutation\b[^}]*}\s+from\s+['"]@tanstack\/react-query['"]/,
        )
      ) {
        content = content.replace(
          /(import\s+{)([^}]*)(}\s+from\s+['"]@tanstack\/react-query['"])/,
          (match, start, imports, end) => {
            const trimmed = imports.trim();
            if (trimmed && !trimmed.endsWith(",")) {
              return start + trimmed + ", useMutation" + end;
            }
            return start + trimmed + "useMutation" + end;
          },
        );
      }
    }
  }

  if (content !== original) {
    writeFileSync(file, content, "utf-8");
    totalChanges++;
    console.log(`✓ ${file}`);
  }
}

console.log(`\n✓ Обработано файлов: ${files.length}`);
console.log(`✓ Изменено файлов: ${totalChanges}`);
