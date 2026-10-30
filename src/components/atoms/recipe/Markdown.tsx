import type { ReactElement } from 'react'

import ReactMarkdown from 'react-markdown'

type MarkdownProps = {
  children: string
}

// Recipe steps and notes are written in light markdown: bold, italics, lists, quotes.
// react-markdown ignores raw HTML, so imported text can't inject markup.
export const Markdown = ({ children }: MarkdownProps): ReactElement => (
  <ReactMarkdown
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
