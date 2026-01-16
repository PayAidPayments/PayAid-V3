# PayAid V3 - Frontend Architecture

**Version:** 3.0.0  
**Last Updated:** January 2026

---

## 1. UI/UX Framework & Design System

### Design System

**Framework:** Custom design system (no Material-UI or Chakra UI)

**Design Tokens:**

```typescript
// lib/design-tokens.ts
export const colors = {
  primary: '#3B82F6', // Blue
  secondary: '#10B981', // Green
  danger: '#EF4444', // Red
  warning: '#F59E0B', // Orange
  success: '#10B981', // Green
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    // ... Tailwind gray scale
    900: '#111827',
  },
}

export const spacing = {
  xs: '0.25rem', // 4px
  sm: '0.5rem',  // 8px
  md: '1rem',    // 16px
  lg: '1.5rem',  // 24px
  xl: '2rem',    // 32px
}

export const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['Fira Code', 'monospace'],
  },
  fontSize: {
    xs: '0.75rem',   // 12px
    sm: '0.875rem',  // 14px
    base: '1rem',    // 16px
    lg: '1.125rem',  // 18px
    xl: '1.25rem',   // 20px
  },
}
```

**Component Library:**
- Custom components in `components/ui/`
- Tailwind CSS for styling
- Lucide React for icons

**Component Examples:**
```typescript
// components/ui/Button.tsx
export function Button({
  variant = 'primary',
  size = 'md',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'rounded-lg font-medium transition-colors',
        variants[variant],
        sizes[size]
      )}
      {...props}
    >
      {children}
    </button>
  )
}
```

### Component Hierarchy

```
App Layout
├── Sidebar (Navigation)
├── Header (User menu, notifications)
├── Main Content
│   ├── Page Header
│   ├── Page Content
│   │   ├── Data Table
│   │   ├── Forms
│   │   ├── Charts
│   │   └── Modals
│   └── Page Footer
└── Footer
```

### Responsive Design Breakpoints

**Tailwind CSS Breakpoints:**
- `sm`: 640px (mobile landscape)
- `md`: 768px (tablet)
- `lg`: 1024px (desktop)
- `xl`: 1280px (large desktop)
- `2xl`: 1536px (extra large)

**Mobile-First Approach:**
```typescript
// Mobile-first responsive design
<div className="
  grid
  grid-cols-1        // Mobile: 1 column
  md:grid-cols-2     // Tablet: 2 columns
  lg:grid-cols-3     // Desktop: 3 columns
">
```

### Accessibility Standards

**WCAG 2.1 AA Compliance:**
- Semantic HTML
- ARIA labels
- Keyboard navigation
- Screen reader support
- Color contrast (4.5:1 minimum)

**Example:**
```typescript
<button
  aria-label="Delete contact"
  aria-describedby="delete-help-text"
  className="..."
>
  <TrashIcon aria-hidden="true" />
  <span className="sr-only">Delete</span>
</button>
```

### Dark Mode Support

**Current:** Not implemented  
**Future:** Dark mode toggle (planned Q2 2026)

---

## 2. State Management

### Primary: Zustand

**Global State Store:**
```typescript
// lib/stores/auth-store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  user: User | null
  token: string | null
  setUser: (user: User) => void
  setToken: (token: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      logout: () => set({ user: null, token: null }),
    }),
    { name: 'auth-storage' }
  )
)
```

**Usage:**
```typescript
// components/UserMenu.tsx
export function UserMenu() {
  const { user, logout } = useAuthStore()
  return <div>Welcome, {user?.name}</div>
}
```

### Data Fetching: TanStack React Query

**Query Configuration:**
```typescript
// lib/react-query/config.ts
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 3,
      refetchOnWindowFocus: false,
    },
  },
})
```

**Query Example:**
```typescript
// hooks/useContacts.ts
export function useContacts(filters?: ContactFilters) {
  return useQuery({
    queryKey: ['contacts', filters],
    queryFn: async () => {
      const response = await fetch('/api/contacts?' + new URLSearchParams(filters))
      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
```

**Mutation Example:**
```typescript
// hooks/useCreateContact.ts
export function useCreateContact() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: ContactFormData) => {
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['contacts'])
    },
  })
}
```

### Local State: React Hooks

**useState:**
```typescript
const [isOpen, setIsOpen] = useState(false)
```

**useReducer:**
```typescript
const [state, dispatch] = useReducer(formReducer, initialState)
```

### State Persistence

**localStorage:**
- Auth state (Zustand persist)
- User preferences
- Form drafts (future)

**sessionStorage:**
- Temporary data
- Not persisted across sessions

---

## 3. Routing & Navigation

### Routing Library

**Next.js App Router:**
- File-based routing
- Server components support
- Route groups for organization

**Route Structure:**
```
app/
├── (auth)/
│   ├── login/
│   └── register/
├── dashboard/
│   ├── contacts/
│   ├── invoices/
│   └── settings/
└── api/
    └── ...
```

### Route Hierarchy

```
/ (Landing page)
├── /login (Public)
├── /register (Public)
└── /dashboard/* (Protected)
    ├── /dashboard/contacts
    ├── /dashboard/invoices
    ├── /dashboard/settings
    └── /dashboard/admin/*
```

### Protected Routes

**Middleware:**
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')
  
  if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  return NextResponse.next()
}
```

**Permission-Based Navigation:**
```typescript
// components/Sidebar.tsx
export function Sidebar() {
  const { user } = useAuthStore()
  
  return (
    <nav>
      {hasPermission(user, 'crm:contacts:read') && (
        <Link href="/dashboard/contacts">Contacts</Link>
      )}
      {hasPermission(user, 'invoicing:invoices:read') && (
        <Link href="/dashboard/invoices">Invoices</Link>
      )}
    </nav>
  )
}
```

### Breadcrumb Implementation

```typescript
// components/Breadcrumbs.tsx
export function Breadcrumbs() {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)
  
  return (
    <nav>
      {segments.map((segment, index) => (
        <Link key={index} href={`/${segments.slice(0, index + 1).join('/')}`}>
          {segment}
        </Link>
      ))}
    </nav>
  )
}
```

### URL Structure and Deep Linking

**URL Patterns:**
- `/dashboard/contacts` - Contact list
- `/dashboard/contacts/[id]` - Contact detail
- `/dashboard/invoices/[id]/edit` - Edit invoice
- `/dashboard/settings?tab=payment` - Settings with tab

**Deep Linking Support:**
- All routes support direct access
- Query parameters for filters
- Hash fragments for sections

---

## 4. API Integration

### HTTP Client Library

**Primary:** Fetch API (native)

**Wrapper:**
```typescript
// lib/api/client.ts
export async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const token = getToken()
  
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options?.headers,
    },
  })
  
  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`)
  }
  
  return response.json()
}
```

### API Base URL Configuration

**Environment-Based:**
```typescript
// Development
NEXT_PUBLIC_APP_URL=http://localhost:3000

// Production
NEXT_PUBLIC_APP_URL=https://app.payaid.in
```

### Authentication Token Handling

**Token Storage:**
- HTTP-only cookie (secure)
- Sent automatically with requests
- Not accessible via JavaScript (XSS protection)

**Token Refresh:**
```typescript
// lib/api/auth.ts
export async function refreshToken() {
  const response = await fetch('/api/auth/refresh', {
    method: 'POST',
    credentials: 'include',
  })
  
  if (response.ok) {
    const { token } = await response.json()
    setToken(token)
  }
}
```

### Error Handling and User Feedback

**Error Handling:**
```typescript
// lib/api/error-handler.ts
export function handleApiError(error: Error) {
  if (error.message.includes('401')) {
    // Unauthorized - redirect to login
    window.location.href = '/login'
  } else if (error.message.includes('403')) {
    // Forbidden - show error message
    toast.error('You do not have permission to perform this action')
  } else {
    // Generic error
    toast.error('An error occurred. Please try again.')
  }
}
```

**User Feedback:**
- Toast notifications (react-hot-toast)
- Loading states (React Query)
- Error boundaries (React)

### Request/Response Interceptors

**Request Interceptor:**
```typescript
// Add token to all requests
fetch.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
```

**Response Interceptor:**
```typescript
// Handle errors globally
fetch.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)
```

### Loading and Error States

**Loading State:**
```typescript
// components/ContactList.tsx
export function ContactList() {
  const { data, isLoading, error } = useContacts()
  
  if (isLoading) {
    return <LoadingSpinner />
  }
  
  if (error) {
    return <ErrorMessage error={error} />
  }
  
  return <div>{/* Contact list */}</div>
}
```

---

## 5. Real-Time Features

### WebSocket Support

**Current:** Limited (voice agents, chat)

**Implementation:**
```typescript
// lib/websocket/client.ts
export class WebSocketClient {
  private ws: WebSocket | null = null
  
  connect(url: string) {
    this.ws = new WebSocket(url)
    this.ws.onmessage = (event) => {
      this.handleMessage(JSON.parse(event.data))
    }
  }
  
  send(message: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    }
  }
}
```

### Server-Sent Events (Future)

**Planned:** SSE for notifications
- Lower overhead than WebSocket
- One-way communication (server → client)
- Automatic reconnection

### Connection Management

**Auto-Reconnect:**
```typescript
// lib/websocket/reconnect.ts
export function withReconnect(ws: WebSocket) {
  ws.onclose = () => {
    setTimeout(() => {
      // Reconnect after 1 second
      connect()
    }, 1000)
  }
}
```

---

## 6. Performance Optimization

### Code Splitting and Lazy Loading

**Route-Based Splitting:**
- Automatic with Next.js App Router
- Each route is a separate chunk

**Component Lazy Loading:**
```typescript
// Lazy load heavy components
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <LoadingSpinner />,
  ssr: false,
})
```

### Bundle Size Monitoring

**Bundle Analyzer:**
```bash
npm run build
npm run analyze
```

**Target:** < 1MB gzipped

### Image Optimization

**Next.js Image Component:**
```typescript
import Image from 'next/image'

<Image
  src="/logo.png"
  alt="Logo"
  width={200}
  height={200}
  loading="lazy"
  placeholder="blur"
/>
```

**Optimizations:**
- Automatic WebP conversion
- Responsive images
- Lazy loading
- Blur placeholder

### Memoization

**React.memo:**
```typescript
export const ExpensiveComponent = React.memo(({ data }) => {
  return <div>{/* Expensive rendering */}</div>
})
```

**useMemo:**
```typescript
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data)
}, [data])
```

**useCallback:**
```typescript
const handleClick = useCallback(() => {
  doSomething(id)
}, [id])
```

### Virtual Scrolling

**Future:** For large lists (1000+ items)
- react-window or react-virtualized
- Render only visible items
- Improve performance

---

## 7. Testing

### Unit Testing Framework

**Jest + React Testing Library:**
```typescript
// __tests__/Button.test.tsx
import { render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/Button'

test('renders button', () => {
  render(<Button>Click me</Button>)
  expect(screen.getByText('Click me')).toBeInTheDocument()
})
```

### Component Testing

**React Testing Library:**
```typescript
// __tests__/ContactForm.test.tsx
test('submits form', async () => {
  const onSubmit = jest.fn()
  render(<ContactForm onSubmit={onSubmit} />)
  
  fireEvent.change(screen.getByLabelText('Name'), {
    target: { value: 'John Doe' }
  })
  fireEvent.click(screen.getByText('Submit'))
  
  await waitFor(() => {
    expect(onSubmit).toHaveBeenCalledWith({ name: 'John Doe' })
  })
})
```

### E2E Testing

**Playwright (Future):**
```typescript
// e2e/contact-creation.spec.ts
test('create contact', async ({ page }) => {
  await page.goto('/dashboard/contacts')
  await page.click('text=Add Contact')
  await page.fill('[name="name"]', 'John Doe')
  await page.click('text=Save')
  await expect(page.locator('text=John Doe')).toBeVisible()
})
```

### Test Coverage Targets

**Current:** ~30%  
**Target:** 70%+

---

## 8. Forms & Validation

### Form Library

**React Hook Form:**
```typescript
// components/forms/ContactForm.tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
})

export function ContactForm() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  })
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name')} />
      {errors.name && <span>{errors.name.message}</span>}
    </form>
  )
}
```

### Validation Library

**Zod:**
- Schema validation
- Type-safe
- Runtime validation

**Example:**
```typescript
const contactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email').optional(),
  phone: z.string().regex(/^[0-9]{10}$/, 'Invalid phone').optional(),
})
```

### Async Validation

**Example:**
```typescript
const schema = z.object({
  email: z.string().email().refine(async (email) => {
    const response = await fetch(`/api/contacts/check-email?email=${email}`)
    const { available } = await response.json()
    return available
  }, 'Email already exists'),
})
```

### Error Display

**Error Messages:**
```typescript
{errors.email && (
  <span className="text-red-500 text-sm">{errors.email.message}</span>
)}
```

---

## Summary

PayAid V3 frontend uses Next.js 16 App Router, React 19, Tailwind CSS, Zustand for state management, and TanStack React Query for data fetching. The architecture is optimized for performance with code splitting, lazy loading, and image optimization.

**Key Features:**
- ✅ Next.js App Router (file-based routing)
- ✅ React 19 with Server Components
- ✅ Tailwind CSS (custom design system)
- ✅ Zustand (global state)
- ✅ TanStack React Query (server state)
- ✅ React Hook Form + Zod (forms)
- ✅ Code splitting and lazy loading
- ✅ Image optimization
- ✅ Responsive design (mobile-first)
- ✅ Accessibility (WCAG 2.1 AA)
