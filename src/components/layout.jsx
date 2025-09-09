import React, { useState, useEffect, useRef, useContext } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  Outlet,
  NavLink,
} from "react-router-dom";
import { supabase } from "../supabaseClient.js";
import {
  LayoutDashboard,
  FileText,
  Search,
  Map,
  Brain,
  BookOpen,
  MessageSquare,
  User as UserIcon,
  Menu,
  Info,
  LogOut,
  Loader2,
  Sun,
  Moon,
} from "lucide-react";
import nexaGenLogo from "../assets/logo.png";

// Dropdown components (no changes needed)
const DropdownMenuContext = React.createContext();

const DropdownMenu = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <DropdownMenuContext.Provider value={{ isOpen, setIsOpen }}>
      <div className="relative inline-block text-left">{children}</div>
    </DropdownMenuContext.Provider>
  );
};

const DropdownMenuTrigger = ({ children }) => {
  const { setIsOpen } = useContext(DropdownMenuContext);
  return <div onClick={() => setIsOpen((prev) => !prev)}>{children}</div>;
};

const DropdownMenuContent = ({ children }) => {
  const { isOpen, setIsOpen } = useContext(DropdownMenuContext);
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

  // --- CHANGE: Positioned for a top-right dropdown ---
  return (
    <div
      ref={menuRef}
      className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-gray-900/80 backdrop-blur-md ring-1 ring-white/10 focus:outline-none"
    >
      <div className="py-1">{children}</div>
    </div>
  );
};

const DropdownMenuItem = ({ children, onSelect }) => (
  <button
    onClick={onSelect}
    className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-200 hover:bg-white/10"
  >
    {children}
  </button>
);
const DropdownMenuLabel = ({ children }) => (
  <div className="px-4 py-2 text-sm text-gray-400">{children}</div>
);
const DropdownMenuSeparator = () => (
  <div className="border-t border-white/10 my-1" />
);

// Navigation items (no changes)
const navigationItems = [
  { title: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { title: "Resume Builder", to: "/resume-builder", icon: FileText },
  { title: "Resume Analyzer", to: "/resume-analyzer", icon: Search },
  { title: "Career Roadmap", to: "/career-roadmap", icon: Map },
  { title: "Skill Assessment", to: "/skill-assessment", icon: Brain },
  { title: "Learning Hub", to: "/learning-hub", icon: BookOpen },
  { title: "AI Assistant", to: "/ai-assistant", icon: MessageSquare },
];

export default function Layout() {
  // --- CHANGE: Renamed isSidebarOpen to isMobileMenuOpen for clarity ---
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [isDarkMode]);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const currentUser = session?.user;
        setUser(currentUser ?? null);
        if (!currentUser && location.pathname !== "/signin") {
          navigate("/signin");
        }
        setIsLoading(false);
      }
    );
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate, location.pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/signin");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  // --- CHANGE: Root layout is now a flex column to support the top header ---
  return (
    <div className="h-screen bg-background text-foreground flex flex-col">
      {/* --- CHANGE: The sidebar <aside> is now a horizontal <header> --- */}
      <header className="sticky top-0 z-50 w-full h-20 flex items-center justify-between px-6 bg-gray-900/80 backdrop-blur-lg border-b border-white/10">
        <div className="flex items-center gap-6">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="w-12 h-12 flex items-center justify-center">
              <img
                src={nexaGenLogo}
                alt="NexaGen AI Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-2xl font-bold text-white hidden sm:block">
              NexaGen AI
            </h1>
          </Link>
          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-4">
            {navigationItems.map((item) => (
              <NavLink
                key={item.title}
                to={item.to}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "text-gray-300 hover:bg-white/10 hover:text-white"
                  }`
                }
              >
                {item.title}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-4">
          
          <DropdownMenu>
            <DropdownMenuTrigger>
              <div className="h-10 w-10 rounded-full overflow-hidden border-2 border-white/20 cursor-pointer">
                {user?.user_metadata?.avatar_url ? (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-emerald-900 flex items-center justify-center text-emerald-300 font-bold">
                    {user?.user_metadata?.full_name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("") ||
                      user?.email?.charAt(0).toUpperCase() ||
                      "U"}
                  </div>
                )}
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>{user?.email}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => navigate("/profile")}>
                <UserIcon className="mr-2 h-4 w-4" /> Profile
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => navigate("/about-us")}>
                <Info className="mr-2 h-4 w-4" /> About Us
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" /> Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile Menu Button */}
          <button
            className="text-gray-200 lg:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* --- CHANGE: This is the new mobile "slide-down" panel --- */}
      {isMobileMenuOpen && (
        <nav className="fixed top-20 left-0 w-full h-[calc(100vh-5rem)] bg-gray-950/95 backdrop-blur-xl p-6 space-y-2 lg:hidden">
          {navigationItems.map((item) => (
            <NavLink
              key={item.title}
              to={item.to}
              onClick={() => setIsMobileMenuOpen(false)} // Close menu on click
              className={({ isActive }) =>
                `flex items-center gap-4 px-4 py-3 rounded-lg font-medium text-base transition-colors ${
                  isActive
                    ? "bg-emerald-500/20 text-emerald-300"
                    : "text-gray-300 hover:bg-white/10 hover:text-white"
                }`
              }
            >
              <item.icon className="w-6 h-6" />
              {item.title}
            </NavLink>
          ))}
        </nav>
      )}

      {/* --- CHANGE: Main content area is now a flex-1 container to fill remaining space --- */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}