import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db/prisma'

interface PageContent {
  type: string
  sections?: Array<{
    type: string
    title?: string
    subtitle?: string
    content?: string
    cta?: {
      text: string
      link: string
    } | null
  }>
}

interface Page {
  id: string
  path: string
  title: string
  contentJson: PageContent
  isPublished: boolean
}

interface Website {
  id: string
  name: string
  domain?: string
  subdomain?: string
  metaTitle?: string
  metaDescription?: string
  pages: Page[]
  tenant: {
    name: string
    address?: string
    city?: string
    state?: string
    postalCode?: string
    country?: string
    phone?: string
    email?: string
    logo?: string
  }
}

export default async function PublicWebsitePage({
  params,
}: {
  params: { subdomain: string; path: string[] }
}) {
  // Debug logging
  console.log('🔍 Public website lookup for subdomain:', params.subdomain, 'path:', params.path)
  
  const website = await prisma.website.findUnique({
    where: { subdomain: params.subdomain },
    include: {
      tenant: {
        select: {
          name: true,
          address: true,
          city: true,
          state: true,
          postalCode: true,
          country: true,
          phone: true,
          email: true,
          logo: true,
        },
      },
      pages: {
        where: { isPublished: true },
        orderBy: { path: 'asc' },
      },
    },
  })

  console.log('📊 Website found:', website ? {
    id: website.id,
    name: website.name,
    status: website.status,
    subdomain: website.subdomain,
    publishedPages: website.pages.length,
  } : 'NOT FOUND')

  if (!website) {
    console.log('❌ Website not found for subdomain:', params.subdomain)
    notFound()
  }

  if (website.status !== 'PUBLISHED') {
    console.log('❌ Website not published. Status:', website.status)
    notFound()
  }

  const pathArray = params.path || []
  const currentPath = '/' + pathArray.join('/')
  console.log('🔍 Looking for page with path:', currentPath)
  console.log('📄 Available pages:', website.pages.map(p => p.path))
  
  const currentPage = website.pages.find((p) => p.path === currentPath || (currentPath === '/' && p.path === '/'))

  if (!currentPage) {
    console.log('❌ Page not found for path:', currentPath)
    notFound()
  }

  console.log('✅ Rendering page:', currentPage.title, 'at path:', currentPage.path)
  console.log('📝 Page content structure:', JSON.stringify(currentPage.contentJson, null, 2))

  const renderContent = (content: PageContent) => {
    if (!content || !content.sections || content.sections.length === 0) {
      console.log('⚠️ No sections found in content:', content)
      return (
        <div className="text-center py-12 text-gray-500">
          <p>No content available for this page.</p>
          <p className="text-sm mt-2">Content structure: {JSON.stringify(content)}</p>
        </div>
      )
    }

    console.log('📄 Rendering', content.sections.length, 'sections')

    return content.sections.map((section, index) => {
      switch (section.type) {
        case 'hero':
          return (
            <div key={index} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20 px-6 text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">{section.title || 'Welcome'}</h1>
              {section.subtitle && (
                <p className="text-xl md:text-2xl mb-8 text-blue-100">{section.subtitle}</p>
              )}
              {section.cta && (
                <a
                  href={`/sites/${params.subdomain}${section.cta.link}`}
                  className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
                >
                  {section.cta.text}
                </a>
              )}
            </div>
          )
        case 'content':
          return (
            <div key={index} className="max-w-4xl mx-auto px-6 py-12">
              {section.title && <h2 className="text-3xl font-bold mb-4">{section.title}</h2>}
              {section.content && (
                <div className="prose prose-lg max-w-none">
                  <div className="text-gray-700 leading-relaxed whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: section.content }} />
                </div>
              )}
            </div>
          )
        default:
          return (
            <div key={index} className="max-w-4xl mx-auto px-6 py-8">
              {section.title && <h2 className="text-2xl font-bold mb-4">{section.title}</h2>}
              {section.subtitle && <p className="text-gray-600 mb-4">{section.subtitle}</p>}
              {section.content && (
                <div className="text-gray-700" dangerouslySetInnerHTML={{ __html: section.content }} />
              )}
            </div>
          )
      }
    })
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>{currentPage.title} - {website.name}</title>
        <meta name="description" content={website.metaDescription || `${website.name} - ${currentPage.title}`} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="min-h-screen bg-white" suppressHydrationWarning>
        {/* Navigation */}
        {website.pages.length > 1 && (
          <nav className="bg-white border-b sticky top-0 z-10 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <a href={`/sites/${params.subdomain}`} className="text-xl font-bold text-gray-900">{website.name}</a>
                <div className="flex gap-4">
                  {website.pages.map((page) => (
                    <a
                      key={page.id}
                      href={`/sites/${params.subdomain}${page.path}`}
                      className={`text-sm font-medium ${
                        page.path === currentPath
                          ? 'text-blue-600'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {page.title}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </nav>
        )}

        {/* Page Content */}
        <main>
          {renderContent(currentPage.contentJson as PageContent)}
        </main>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-12 mt-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">{website.tenant.name}</h3>
                {website.tenant.address && (
                  <p className="text-gray-400 text-sm">
                    {website.tenant.address}
                    {website.tenant.city && `, ${website.tenant.city}`}
                    {website.tenant.state && `, ${website.tenant.state}`}
                    {website.tenant.postalCode && ` ${website.tenant.postalCode}`}
                  </p>
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">Contact</h3>
                {website.tenant.phone && (
                  <p className="text-gray-400 text-sm mb-2">Phone: {website.tenant.phone}</p>
                )}
                {website.tenant.email && (
                  <p className="text-gray-400 text-sm">Email: {website.tenant.email}</p>
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
                <div className="flex flex-col gap-2">
                  {website.pages.map((page) => (
                    <a
                      key={page.id}
                      href={`/sites/${params.subdomain}${page.path}`}
                      className="text-gray-400 text-sm hover:text-white"
                    >
                      {page.title}
                    </a>
                  ))}
                </div>
              </div>
            </div>
            <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
              <p>&copy; {new Date().getFullYear()} {website.tenant.name}. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}




