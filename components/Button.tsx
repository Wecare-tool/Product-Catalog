import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'positive' | 'icon';
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  className = '', 
  icon,
  ...props 
}) => {
  const baseStyles = "font-lexend font-medium transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-wecare-blue text-white hover:bg-wecare-darkBlue rounded px-4 py-2",
    positive: "bg-wecare-green text-white hover:opacity-90 rounded px-4 py-2",
    secondary: "bg-transparent border border-wecare-blue text-wecare-blue hover:bg-wecare-blue/10 rounded px-4 py-2",
    icon: "text-white hover:text-wecare-lightBlue p-2 rounded-full hover:bg-white/10"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
};
