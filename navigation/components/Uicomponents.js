import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

// Custom Card Component
export const Card = ({ children, className, ...props }) => (
  <View 
    className={`bg-white rounded-lg p-4 mb-4 shadow-sm ${className}`}
    {...props}
  >
    {children}
  </View>
);

// Custom Badge Component
export const Badge = ({ 
  children, 
  variant = 'default', 
  className, 
  textClassName,
  ...props 
}) => {
  const variantStyles = {
    default: {
      container: 'bg-blue-100',
      text: 'text-blue-800'
    },
    destructive: {
      container: 'bg-red-100',
      text: 'text-red-800'
    },
    success: {
      container: 'bg-green-100',
      text: 'text-green-800'
    }
  };

  const currentVariant = variantStyles[variant] || variantStyles.default;

  return (
    <View 
      className={`px-2 py-1 rounded-full ${currentVariant.container} ${className}`}
      {...props}
    >
      <Text className={`text-xs font-semibold ${currentVariant.text} ${textClassName}`}>
        {children}
      </Text>
    </View>
  );
};

// Custom Button Component
export const Button = ({ 
  children, 
  variant = 'default', 
  className, 
  textClassName,
  ...props 
}) => {
  const variantStyles = {
    default: {
      container: 'bg-blue-500',
      text: 'text-white'
    },
    outline: {
      container: 'border border-blue-500 bg-transparent',
      text: 'text-blue-500'
    },
    destructive: {
      container: 'bg-red-500',
      text: 'text-white'
    }
  };

  const currentVariant = variantStyles[variant] || variantStyles.default;

  return (
    <TouchableOpacity 
      className={`px-4 py-2 rounded-lg ${currentVariant.container} ${className}`}
      {...props}
    >
      <Text className={`text-center font-semibold ${currentVariant.text} ${textClassName}`}>
        {children}
      </Text>
    </TouchableOpacity>
  );
};

// Separator Component
export const Separator = ({ className }) => (
  <View className={`h-px bg-gray-200 ${className}`} />
);

