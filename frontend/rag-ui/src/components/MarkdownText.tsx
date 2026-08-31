import type { ReactNode } from "react";

interface MarkdownTextProps {
  content: string;
}

type Block =
  | {
      type: "code";
      text: string;
    }
  | {
      type: "heading";
      level: number;
      text: string;
    }
  | {
      type: "list";
      ordered: boolean;
      items: string[];
    }
  | {
      type: "paragraph";
      text: string;
    };

function renderInline(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const value = match[0];

    if (value.startsWith("**")) {
      parts.push(<strong key={`${match.index}-bold`}>{value.slice(2, -2)}</strong>);
    } else if (value.startsWith("`")) {
      parts.push(<code key={`${match.index}-code`}>{value.slice(1, -1)}</code>);
    } else {
      const linkMatch = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(value);
      if (linkMatch) {
        parts.push(
          <a
            key={`${match.index}-link`}
            href={linkMatch[2]}
            target="_blank"
            rel="noreferrer"
          >
            {linkMatch[1]}
          </a>,
        );
      }
    }

    lastIndex = match.index + value.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

function parseMarkdown(content: string): Block[] {
  const lines = content.split("\n");
  const blocks: Block[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    if (!line.trim()) {
      index += 1;
      continue;
    }

    if (line.startsWith("```")) {
      const code: string[] = [];
      index += 1;

      while (index < lines.length && !lines[index].startsWith("```")) {
        code.push(lines[index]);
        index += 1;
      }

      blocks.push({
        type: "code",
        text: code.join("\n"),
      });
      index += 1;
      continue;
    }

    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    if (heading) {
      blocks.push({
        type: "heading",
        level: heading[1].length,
        text: heading[2],
      });
      index += 1;
      continue;
    }

    const list = /^(\d+\.|-)\s+(.+)$/.exec(line);
    if (list) {
      const ordered = /\d+\./.test(list[1]);
      const items: string[] = [];

      while (index < lines.length) {
        const item = /^(\d+\.|-)\s+(.+)$/.exec(lines[index]);
        if (!item || /\d+\./.test(item[1]) !== ordered) {
          break;
        }

        items.push(item[2]);
        index += 1;
      }

      blocks.push({
        type: "list",
        ordered,
        items,
      });
      continue;
    }

    const paragraph: string[] = [line];
    index += 1;

    while (
      index < lines.length &&
      lines[index].trim() &&
      !lines[index].startsWith("```") &&
      !/^(#{1,3})\s+/.test(lines[index]) &&
      !/^(\d+\.|-)\s+/.test(lines[index])
    ) {
      paragraph.push(lines[index]);
      index += 1;
    }

    blocks.push({
      type: "paragraph",
      text: paragraph.join(" "),
    });
  }

  return blocks;
}

export default function MarkdownText({
  content,
}: MarkdownTextProps) {
  return (
    <div className="markdown-content">
      {parseMarkdown(content).map((block, index) => {
        if (block.type === "code") {
          return (
            <pre key={index}>
              <code>{block.text}</code>
            </pre>
          );
        }

        if (block.type === "heading") {
          const Heading = `h${block.level + 2}` as "h3" | "h4" | "h5";
          return <Heading key={index}>{renderInline(block.text)}</Heading>;
        }

        if (block.type === "list") {
          const List = block.ordered ? "ol" : "ul";
          return (
            <List key={index}>
              {block.items.map(item => (
                <li key={item}>{renderInline(item)}</li>
              ))}
            </List>
          );
        }

        return <p key={index}>{renderInline(block.text)}</p>;
      })}
    </div>
  );
}
