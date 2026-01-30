'use client'

/**
 * FormField Usage Example
 * 
 * This file demonstrates how to use the FormField component
 * with validation messages and micro-interactions.
 * 
 * Example usage:
 * 
 * ```tsx
 * import { FormField } from '@/components/ui/form-field'
 * import { Input } from '@/components/ui/input'
 * import { Textarea } from '@/components/ui/textarea'
 * import { useToast } from '@/components/ui/toast'
 * import { SuccessFeedback, ErrorFeedback } from '@/components/ui/micro-interactions'
 * 
 * function MyForm() {
 *   const { toast } = useToast()
 *   const [email, setEmail] = useState('')
 *   const [emailError, setEmailError] = useState('')
 *   const [emailSuccess, setEmailSuccess] = useState('')
 * 
 *   const validateEmail = (value: string) => {
 *     if (!value) {
 *       setEmailError('Email is required')
 *       setEmailSuccess('')
 *       return false
 *     }
 *     if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
 *       setEmailError('Please enter a valid email address')
 *       setEmailSuccess('')
 *       return false
 *     }
 *     setEmailError('')
 *     setEmailSuccess('Email looks good!')
 *     return true
 *   }
 * 
 *   const handleSubmit = async (e: React.FormEvent) => {
 *     e.preventDefault()
 *     
 *     if (validateEmail(email)) {
 *       // Show success toast
 *       toast.success('Form submitted!', 'Your information has been saved.')
 *       
 *       // Or use SuccessFeedback component
 *       // <SuccessFeedback message="Form submitted successfully!" />
 *     } else {
 *       // Show error toast
 *       toast.error('Validation failed', 'Please check your inputs.')
 *     }
 *   }
 * 
 *   return (
 *     <form onSubmit={handleSubmit} className="space-y-4">
 *       <FormField
 *         label="Email Address"
 *         required
 *         error={emailError}
 *         success={emailSuccess}
 *         hint="We'll never share your email"
 *       >
 *         <Input
 *           type="email"
 *           value={email}
 *           onChange={(e) => {
 *             setEmail(e.target.value)
 *             if (emailError) validateEmail(e.target.value)
 *           }}
 *           onBlur={() => validateEmail(email)}
 *           error={!!emailError}
 *           success={!!emailSuccess}
 *           placeholder="you@example.com"
 *         />
 *       </FormField>
 * 
 *       <FormField
 *         label="Message"
 *         error={messageError}
 *       >
 *         <Textarea
 *           value={message}
 *           onChange={(e) => setMessage(e.target.value)}
 *           error={!!messageError}
 *           placeholder="Enter your message..."
 *         />
 *       </FormField>
 * 
 *       <Button type="submit">Submit</Button>
 *     </form>
 *   )
 * }
 * ```
 */

export const FormFieldExample = () => {
  return null // This is just a documentation file
}
