import { Helmet } from 'react-helmet-async'

interface SEOProps {
  title?: string
  description?: string
  path?: string
  image?: string
  type?: string
  noIndex?: boolean
}

const SITE_NAME = 'ICUNI Labs'
const BASE_URL = 'https://labs.icuni.org'
const DEFAULT_IMAGE = `${BASE_URL}/icuni_logo.png`
const DEFAULT_DESCRIPTION = 'Custom business operations systems, AI-powered dashboards, and workflow automation. Built in days, not months. No subscriptions. 80+ systems delivered.'

/**
 * SEO head tags component. Drop into any page to set unique meta data.
 * Falls back to site defaults for any missing props.
 */
export default function SEO({
  title,
  description = DEFAULT_DESCRIPTION,
  path = '/',
  image = DEFAULT_IMAGE,
  type = 'website',
  noIndex = false,
}: SEOProps) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — We Build Any Digital System Your Business Needs`
  const url = `${BASE_URL}${path}`

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />

      {noIndex && <meta name="robots" content="noindex, nofollow" />}
    </Helmet>
  )
}
