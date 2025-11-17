import React from 'react';
import Link from 'next/link';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface BaseButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  children: React.ReactNode;
}

interface ButtonAsButtonProps extends BaseButtonProps, Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof BaseButtonProps> {
  as?: 'button';
}

interface ButtonAsLinkProps extends BaseButtonProps {
  as: 'link';
  href: string;
}

type ButtonProps = ButtonAsButtonProps | ButtonAsLinkProps;

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-gradient-to-r from-pink-500 to-blue-500 hover:from-blue-500 hover:to-pink-500 text-white shadow-lg',
  secondary: 'bg-white/20 hover:bg-white/30 text-white border border-white/20',
  outline: 'bg-transparent border-2 border-current text-blue-600 hover:bg-blue-50',
  ghost: 'bg-transparent hover:bg-white/10 text-white',
  danger: 'bg-red-600 hover:bg-red-700 text-white shadow-lg',
  success: 'bg-green-600 hover:bg-green-700 text-white shadow-lg',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
};

const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  loading = false,
  className = '',
  children,
  ...props
}) => {
  const combinedClassName = `
    ${baseStyles}
    ${variantStyles[variant]}
    ${sizeStyles[size]}
    ${fullWidth ? 'w-full' : ''}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  const content = loading ? (
    <>
      <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      {children}
    </>
  ) : children;

  if ('as' in props && props.as === 'link') {
    return (
      <Link href={props.href} className={combinedClassName}>
        {content}
      </Link>
    );
  }

  const { as, ...buttonProps } = props as ButtonAsButtonProps;

  return (
    <button
      {...buttonProps}
      disabled={disabled || loading}
      className={combinedClassName}
    >
      {content}
    </button>
  );
};

// Icon Button variant
interface IconButtonProps extends Omit<ButtonAsButtonProps, 'children'> {
  icon: React.ReactNode;
  'aria-label': string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  'aria-label': ariaLabel,
  size = 'md',
  ...props
}) => {
  const iconSizeStyles: Record<ButtonSize, string> = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  return (
    <Button
      {...props}
      size={size}
      className={`${props.className || ''} ${iconSizeStyles[size]} p-0`}
      aria-label={ariaLabel}
    >
      {icon}
    </Button>
  );
};

// Button Group
interface ButtonGroupProps {
  children: React.ReactNode;
  className?: string;
}

export const ButtonGroup: React.FC<ButtonGroupProps> = ({ children, className = '' }) => {
  return (
    <div className={`inline-flex gap-2 ${className}`} role="group">
      {children}
    </div>
  );
};
