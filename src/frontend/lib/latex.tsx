import katex from "katex";
import "katex/dist/katex.min.css";

/**
 * Render text containing LaTeX inline ($...$) and display ($$...$$).
 * Returns an HTML string safe to inject via dangerouslySetInnerHTML.
 *
 * Note: input is treated as plain text; only LaTeX delimiters are interpreted.
 * Other HTML tags in the input are NOT escaped here — content comes from the
 * admin-controlled questions table, not from arbitrary user input.
 */
export function renderLatex(text: string | null | undefined): string {
  if (!text) return "";

  // Display math first ($$...$$)
  let result = text.replace(/\$\$([\s\S]+?)\$\$/g, (_match, math) => {
    try {
      return katex.renderToString(math, {
        displayMode: true,
        throwOnError: false,
      });
    } catch {
      return `<span class="text-destructive">[LaTeX Error]</span>`;
    }
  });

  // Inline math ($...$)
  result = result.replace(/\$([^$\n]+?)\$/g, (_match, math) => {
    try {
      return katex.renderToString(math, {
        displayMode: false,
        throwOnError: false,
      });
    } catch {
      return `<span class="text-destructive">[LaTeX Error]</span>`;
    }
  });

  // Preserve simple line breaks
  result = result.replace(/\n/g, "<br />");

  return result;
}

export function LatexText({
  text,
  className = "",
}: {
  text: string | null | undefined;
  className?: string;
}) {
  return (
    <span
      className={`latex-content ${className}`}
      dangerouslySetInnerHTML={{ __html: renderLatex(text) }}
    />
  );
}
