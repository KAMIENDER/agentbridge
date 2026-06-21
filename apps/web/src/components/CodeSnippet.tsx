import { memo, type CSSProperties } from "react";

interface CodeSnippetProps {
  code: string;
  language: string;
  wrapLongLines?: boolean;
  className?: string;
  inline?: boolean;
}

const WRAPPED_CODE_STYLE: CSSProperties = {
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
  overflowWrap: "anywhere",
};

const UNWRAPPED_CODE_STYLE: CSSProperties = {
  whiteSpace: "pre",
};

function CodeSnippetComponent({
  code,
  language: _language,
  wrapLongLines = true,
  className,
  inline = false,
}: CodeSnippetProps) {
  const codeStyle = wrapLongLines ? WRAPPED_CODE_STYLE : UNWRAPPED_CODE_STYLE;

  if (inline) {
    return (
      <span className={className}>
        <span className="font-mono" style={codeStyle}>
          {code}
        </span>
      </span>
    );
  }

  return (
    <div className={className}>
      <pre className="m-0 overflow-x-auto rounded-lg bg-muted p-3 text-xs leading-[1.4]">
        <code className="font-mono" style={codeStyle}>
          {code}
        </code>
      </pre>
    </div>
  );
}

export const CodeSnippet = memo(CodeSnippetComponent);
