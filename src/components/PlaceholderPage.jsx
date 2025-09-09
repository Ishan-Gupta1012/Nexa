import React from 'react';

export default function PlaceholderPage({ title, icon: Icon }) {
    return (
        <div className="p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6">
                {Icon && <Icon className="w-8 h-8 text-emerald-600" />}
            </div>
            <h1 className="text-3xl font-bold text-slate-800">{title}</h1>
            <p className="text-slate-600 mt-2 max-w-md">
                This feature is currently under development and will be available soon. Stay tuned for exciting updates!
            </p>
        </div>
    );
}
