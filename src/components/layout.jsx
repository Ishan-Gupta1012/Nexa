import React, { useState, useEffect, useRef, useContext } from "react";
import { Link, useLocation, useNavigate, Outlet, NavLink } from "react-router-dom";
import { supabase } from "../supabaseClient.js";
import {
  LayoutDashboard,
  FileText,
  Search,
  Map,
  MessageSquare,
  User as UserIcon,
  Menu,
  Info,
  LogOut,
  Loader2,
  Mic,
  Lightbulb,
  X,
  Compass
} from "lucide-react";
import nexaGenLogo from "../assets/logo.png";
import BackgroundAnimation from "./UI/BackgroundAnimation.jsx";
import ChatWidget from "./UI/ChatWidget.jsx";

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


export default function Layout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // FIX 1: Ref to store mutable navigation values for the single-run useEffect
  const navigationRef = useRef({ navigate, location });

  useEffect(() => {
    // FIX 2: Update the ref on every render to ensure it holds the current navigate/location functions
    navigationRef.current = { navigate, location };
  });

  useEffect(() => {
    let isMounted = true; 

    // Async function to handle auth state and profile fetch
    const handleAuthStateChange = async (session) => {
      if (!isMounted) return;

      setIsLoading(false); 

      try {
        const currentUser = session?.user;
        
        if (isMounted) {
            setUser(currentUser ?? null);
        }

        let profileData = null;
        if (currentUser) {
          // Fetch profile data
          const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", currentUser.id)
            .single();
            
          // Check for the "no rows found" error code (PGRST116)
          if (error && error.code !== "PGRST116") {
            console.error("Error fetching profile:", error);
          } else if (data) {
            profileData = data;
          }
        }
        
        if (isMounted) {
            setProfile(profileData);
        }

        // Use the current values from the ref for redirection logic
        const { navigate: currentNavigate, location: currentLocation } = navigationRef.current;
        
        if (!currentUser && currentLocation.pathname !== "/signin") {
          currentNavigate("/signin");
        }
        
      } catch (error) {
        console.error("Layout auth/profile error during state change:", error);
      } finally {
        // IMPORTANT: Ensure loading is set to false regardless of success or failure
        if (isMounted) {
            setIsLoading(false);
        }
      }
    };

    // Set up the listener only once on mount
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
          handleAuthStateChange(session);
      }
    );

    // Cleanup function: Unsubscribe the listener and mark as unmounted
    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []); // FIX 3: Empty dependency array ensures this listener is set up only once.

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/signin");
  };

  const isStudent = profile?.experience_level === 'entry';

  const navigationItems = [
    { title: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
    isStudent && { title: "Career Compass", to: "/career-compass", icon: Compass },
    { title: "Resume Builder", to: "/resume-builder", icon: FileText },
    { title: "Resume Analyzer", to: "/resume-analyzer", icon: Search },
    { title: "Interview Prep", to: "/interview-prep", icon: Mic },
    { title: "Career Explorer", to: "/career-explorer", icon: Map },
    { title: "Strategies", to: "/strategies", icon: Lightbulb },
  ].filter(Boolean);


  const gridBackgroundStyle = {
    backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.07) 1px, transparent 1px)',
    backgroundSize: '2rem 2rem',
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
      </div>
    );
  }
  
  const avatarUrl = profile?.profile_picture_url || user?.user_metadata?.avatar_url;

  return (
    <div className="h-screen bg-gray-950 text-white flex flex-col">
      <BackgroundAnimation />
      <header className="sticky top-0 z-40 w-full h-20 flex items-center justify-between px-6 bg-gray-900/80 backdrop-blur-lg border-b border-white/10">
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

        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger>
              <div className="h-10 w-10 rounded-full overflow-hidden border-2 border-white/20 cursor-pointer bg-gray-800">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-emerald-900 flex items-center justify-center text-emerald-300 font-bold">
                    {user?.email?.charAt(0).toUpperCase() || "U"}
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
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" /> Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            className="text-gray-200 lg:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </header>

      {isMobileMenuOpen && (
        <nav className="fixed top-20 left-0 w-full h-[calc(100vh-5rem)] bg-gray-950/95 backdrop-blur-xl p-6 space-y-2 lg:hidden z-30">
          {navigationItems.map((item) => (
            <NavLink
              key={item.title}
              to={item.to}
              onClick={() => setIsMobileMenuOpen(false)}
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
      
      <main className="flex-1 overflow-y-auto relative" style={gridBackgroundStyle}>
        <Outlet context={{ user, profile }} />
        
        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="fixed bottom-8 right-8 z-40 w-16 h-16 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all duration-300"
          title="AI Career Assistant"
        >
          {isChatOpen ? <X className="w-8 h-8 text-white" /> : <MessageSquare className="w-8 h-8 text-white" />}
        </button>

        {isChatOpen && <ChatWidget onClose={() => setIsChatOpen(false)} />}
      </main>
    </div>
  );
}