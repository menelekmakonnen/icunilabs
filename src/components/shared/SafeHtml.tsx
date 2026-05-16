/**
 * SafeHtml — Centralized HTML sanitization boundary.
 *
 * ALL user-generated or externally-sourced HTML (email bodies, invoice previews,
 * CMS rich text, job descriptions) MUST render through this component.
 *
 * Direct use of `dangerouslySetInnerHTML` is banned outside this file.
 */
import DOMPurify from 'dompurify'

interface SafeHtmlProps {
  /** Raw HTML string to sanitize and render */
  html: string
  /** Optional CSS class name */
  className?: string
}

// Configure allowed tags once — formatting, links, images, tables, lists
const PURIFY_CONFIG = {
  ALLOWED_TAGS: [
    // Text formatting
    'p', 'br', 'b', 'strong', 'i', 'em', 'u', 's', 'del', 'ins',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'span', 'div', 'blockquote', 'pre', 'code',
    // Links & media
    'a', 'img',
    // Lists
    'ul', 'ol', 'li',
    // Tables
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'td', 'th', 'caption',
    // Other
    'hr', 'sub', 'sup', 'small', 'mark', 'abbr', 'cite',
    // Email-specific
    'center', 'font',
  ],
  ALLOWED_ATTR: [
    'href', 'target', 'rel', 'src', 'alt', 'title', 'width', 'height',
    'class', 'style', 'id', 'align', 'valign', 'colspan', 'rowspan',
    'border', 'cellpadding', 'cellspacing', 'color', 'size', 'face',
    'bgcolor', 'background',
  ],
  // Force all links to open in new tab
  ADD_ATTR: ['target'],
  // Strip dangerous tags entirely
  FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'textarea', 'select', 'button'],
}

// Post-process: force all <a> tags to have target="_blank" and rel="noopener noreferrer"
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A') {
    node.setAttribute('target', '_blank')
    node.setAttribute('rel', 'noopener noreferrer')
  }
})

export default function SafeHtml({ html, className }: SafeHtmlProps) {
  if (!html) return null

  const clean = DOMPurify.sanitize(html, PURIFY_CONFIG)

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  )
}
