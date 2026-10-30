import type { ReactElement } from 'react'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

type MarkdownProps = {
  children: string
}

// Recipe steps and notes are written in light markdown: bold, italics, lists, quotes, tables.
// react-markdown ignores raw HTML, so imported text can't inject markup.
export const Markdown = ({ children }: MarkdownProps): ReactElement => (
  <ReactMarkdown
    remarkPlugins={[remarkGfm]}
    components={{
      p: ({ children: content }): ReactElement => (
        <p className='mb-2 last:mb-0'>{content}</p>
      ),
      ul: ({ children: content }): ReactElement => (
        <ul className='mb-2 list-disc space-y-1 pl-5 last:mb-0'>{content}</ul>
      ),
      ol: ({ children: content }): ReactElement => (
        <ol className='mb-2 list-decimal space-y-1 pl-5 last:mb-0'>
          {content}
        </ol>
      ),
      strong: ({ children: content }): ReactElement => (
        <strong className='font-semibold text-text'>{content}</strong>
      ),
      table: ({ children: content }): ReactElement => (
        <table className='mb-2 w-full text-left text-xs last:mb-0'>
          {content}
        </table>
      ),
      th: ({ children: content }): ReactElement => (
        <th className='border-b border-text-muted/30 px-2 py-1 font-semibold text-text'>
          {content}
        </th>
      ),
      td: ({ children: content }): ReactElement => (
        <td className='border-b border-text-muted/10 px-2 py-1'>{content}</td>
      ),
      blockquote: ({ children: content }): ReactElement => (
        <blockquote className='mb-2 border-l-2 border-accent/50 pl-3 last:mb-0'>
          {content}
        </blockquote>
      ),
    }}
  >
    {children}
  </ReactMarkdown>
)
