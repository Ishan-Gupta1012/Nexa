import React from 'react';

const BackgroundAnimation = () => {
  return (
    <div aria-hidden="true" className="fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-600 rounded-full mix-blend-lighten filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-0 -right-4 w-72 h-72 bg-emerald-600 rounded-full mix-blend-lighten filter blur-3xl opacity-20 animate-blob" style={{ animationDelay: '2s' }}></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-600 rounded-full mix-blend-lighten filter blur-3xl opacity-20 animate-blob" style={{ animationDelay: '4s' }}></div>
    </div>
  );
};

export default BackgroundAnimation;