import * as React from "react"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline'
  size?: 'default' | 'lg'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = 'default', size = 'default', ...props }, ref) => {
    const baseClasses = "inline-flex items-center justify-center rounded-xl font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-gray-500/20 disabled:pointer-events-none disabled:opacity-50"
    
    const variants = {
      default: "bg-black hover:bg-gray-800 text-white shadow-sm hover:shadow-md",
      outline: "border-2 border-gray-300 bg-transparent text-gray-700 hover:bg-gray-50 hover:border-black hover:text-black"
    }
    
    const sizes = {
      default: "text-sm h-10 px-4 py-2",
      lg: "text-base h-12 px-6 py-3"
    }
    
    return (
      <button
        className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
