import type { ReactElement, ReactNode } from 'react'

import { Children } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { DifficultyDots } from '@/components/atoms/recipe'

type ProseProps = {
  children: string
}

// The content files write difficulty as ●●●○○. Those glyphs come from fallback fonts at uneven
// sizes, so each run is drawn with the same dots the recipe pages use.
const DOT_RUN = /([●○]{5})/

const splitDots = (text: string): ReactNode[] =>
  text.split(DOT_RUN).map((part, index) =>
    DOT_RUN.test(part) ? (
      <span key={index} className='mx-0.5 inline-block align-middle'>
        <DifficultyDots level={part.split('●').length - 1} />
      </span>
    ) : (
      part
    )
  )

const withDots = (children: ReactNode): ReactNode =>
  Children.map(children, (child) =>
    typeof child === 'string' ? splitDots(child) : child  )

// Long-form markdown for the guide and about pages, at reading size. react-markdown ignores raw
// HTML, so the content files can't inject markup.
export const Prose = ({ children }: ProseProps): ReactElement => (
  <div className='text-base leading-relaxed text-text-muted sm:text-lg'>
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h2: ({ children: content }): ReactElement => (
          <h2 className='mt-10 mb-3 text-2xl font-bold text-text first:mt-0'>
            {content}
          </h2>
        ),
        h3: ({ children: content }): ReactElement => (
          <h3 className='mt-8 mb-2 text-xl font-semibold text-text first:mt-0'>
            {content}
          </h3>
        ),
        p: ({ children: content }): ReactElement => (
          <p className='mb-4 last:mb-0'>{withDots(content)}</p>
        ),
        ul: ({ children: content }): ReactElement => (
          <ul className='mb-4 list-disc space-y-2 pl-6 last:mb-0'>{content}</ul>
        ),
        li: ({ children: content }): ReactElement => (
          <li>{withDots(content)}</li>
        ),
        ol: ({ children: content }): ReactElement => (
          <ol className='mb-4 list-decimal space-y-2 pl-6 last:mb-0'>
            {content}
          </ol>
        ),
        strong: ({ children: content }): ReactElement => (
          <strong className='font-semibold text-text'>
            {withDots(content)}
          </strong>
        ),
        table: ({ children: content }): ReactElement => (
          <div className='mb-4 overflow-x-auto rounded-lg border border-text-muted/30 last:mb-0'>
            <table className='w-full text-left text-sm sm:text-base'>
              {content}
            </table>
          </div>
        ),
        thead: ({ children: content }): ReactElement => (
          <thead className='bg-surface text-text'>{content}</thead>
        ),
        th: ({ children: content }): ReactElement => (
          <th className='px-3 py-2 font-semibold whitespace-nowrap'>
            {content}
          </th>
        ),
        tr: ({ children: content }): ReactElement => (
          <tr className='border-t border-text-muted/30 first:border-t-0'>
            {content}
          </tr>
        ),
        td: ({ children: content }): ReactElement => (
          <td className='px-3 py-2 align-top first:font-semibold first:whitespace-nowrap first:text-text nth-2:whitespace-nowrap'>
            {content}
          </td>
        ),
        code: ({ children: content }): ReactElement => (
          <code className='rounded bg-surface px-1.5 py-0.5 text-[0.9em] text-text'>
            {withDots(content)}
          </code>
        ),
        a: ({ children: content, href }): ReactElement => (
          <a href={href} className='text-primary underline hover:text-text'>
            {content}
          </a>
        ),
      }}
    >
      {children}
    </ReactMarkdown>
  </div>
)
