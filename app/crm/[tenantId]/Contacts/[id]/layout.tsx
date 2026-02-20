'use client'

export default function ContactDetailLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // No need for ModuleTopBar here - it's already provided by the parent Contacts layout
  return (
    <>
      {children}
    </>
  )
}
