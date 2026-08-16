// components/LoadingSpinner.tsx
'use client';

export const LoadingSpinner = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-4">
        {/* Spinner */}
        <div className="relative inline-block">
          <div className="animate-spin rounded-full h-14 w-14 border-4 border-gray-200 border-t-blue-600"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-4 w-4 bg-blue-600 rounded-full animate-pulse"></div>
          </div>
        </div>
        
        {/* Loading text with dots animation */}
        <div className="flex items-center justify-center space-x-1">
          <p className="text-gray-600 font-medium">Loading</p>
          <span className="animate-bounce delay-0">.</span>
          <span className="animate-bounce delay-150">.</span>
          <span className="animate-bounce delay-300">.</span>
        </div>
        
        {/* Optional: Skeleton blocks */}
        <div className="space-y-2 w-48 mx-auto">
          <div className="h-2 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-2 bg-gray-200 rounded w-3/4 mx-auto animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};