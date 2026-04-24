import { useEffect, useState } from "react";
import { LatexText } from "@/lib/latex";

export function LatexPreview({ text }: { text: string }) {
  const [debounced, setDebounced] = useState(text);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(text), 500);
    return () => clearTimeout(t);
  }, [text]);

  return (
    <div className="rounded-md border bg-muted/30 p-3 text-sm">
      <div className="mb-1 text-xs font-medium text-muted-foreground">Pratinjau</div>
      {debounced.trim() ? (
        <LatexText text={debounced} />
      ) : (
        <span className="text-muted-foreground italic">Kosong</span>
      )}
    </div>
  );
}
