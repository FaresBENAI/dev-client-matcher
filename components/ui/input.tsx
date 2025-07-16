import * as React from "react"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={`
          flex h-10 w-full rounded-md border px-3 py-2 text-sm
          bg-white border-slate-300 
          text-slate-900 
          placeholder:text-slate-500 
          focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent
          disabled:cursor-not-allowed disabled:opacity-50
          ${className || ''}
        `.replace(/\s+/g, ' ').trim()}
        ref={ref}
        {...props}
      />
    )
  }
)

Input.displayName = "Input"
export { Input }
