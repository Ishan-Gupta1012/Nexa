import React, { useState, useRef, useEffect, createContext, useContext } from 'react';

const DropdownContext = createContext();

export const DropdownMenu = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <DropdownContext.Provider value={{ isOpen, setIsOpen }}>
            <div className="relative inline-block text-left">{children}</div>
        </DropdownContext.Provider>
    );
};

export const DropdownMenuTrigger = ({ children }) => {
    const { setIsOpen } = useContext(DropdownContext);
    return <button onClick={() => setIsOpen(prev => !prev)}>{children}</button>;
};

export const DropdownMenuContent = ({ children }) => {
    const { isOpen, setIsOpen } = useContext(DropdownContext);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [setIsOpen]);

    if (!isOpen) return null;

    return (
        <div ref={menuRef} className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
            <div className="py-1">{children}</div>
        </div>
    );
};

export const DropdownMenuItem = ({ children, onSelect }) => (
    <button onClick={onSelect} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
        {children}
    </button>
);

export const DropdownMenuLabel = ({ children }) => (
    <div className="px-4 py-2 text-sm text-gray-500">{children}</div>
);

export const DropdownMenuSeparator = () => <div className="border-t border-gray-100 my-1" />;
