import * as React from "react"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline'
  size?: 'default' | 'lg'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = 'default', size = 'default', style, ...props }, ref) => {
    const baseClasses = "inline-flex items-center justify-center rounded-xl font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-gray-500/20 disabled:pointer-events-none disabled:opacity-50"
    
    const variants = {
      default: "text-white shadow-sm hover:shadow-md font-black",
      outline: "border-2 border-gray-300 bg-transparent text-gray-700 hover:bg-gray-50 hover:border-black hover:text-black font-black"
    }
    
    const sizes = {
      default: "text-sm h-10 px-4 py-2",
      lg: "text-base h-12 px-6 py-3"
    }
    
    // Styles forcés pour variant default (noir)
    const forcedDefaultStyle = variant === 'default' ? {
      backgroundColor: '#000000 !important',
      borderColor: '#000000 !important',
      color: '#ffffff !important',
      border: '2px solid #000000',
      fontWeight: '900',
      ...style
    } : style
    
    return (
      <button
        className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
        style={forcedDefaultStyle}
        ref={ref}
        onMouseEnter={(e) => {
          if (variant === 'default') {
            e.currentTarget.style.backgroundColor = '#374151';
            e.currentTarget.style.borderColor = '#374151';
          }
        }}
        onMouseLeave={(e) => {
          if (variant === 'default') {
            e.currentTarget.style.backgroundColor = '#000000';
            e.currentTarget.style.borderColor = '#000000';
          }
        }}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
