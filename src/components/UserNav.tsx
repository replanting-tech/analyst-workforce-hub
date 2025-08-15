
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LogOut, User } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export const UserNav = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  
  // Check for development authentication
  const isDevAuth = localStorage.getItem('dev-auth') === 'true';

  const handleSignOut = async () => {
    try {
      if (isDevAuth) {
        localStorage.removeItem('dev-auth');
        navigate('/auth');
        toast.success('Logged out successfully');
      } else {
        await signOut();
        toast.success('Logged out successfully');
      }
    } catch (error) {
      toast.error('Error logging out');
    }
  };

  if (!user && !isDevAuth) return null;

  const userInitials = user?.email
    ? user.email.substring(0, 2).toUpperCase()
    : isDevAuth
    ? 'AD'
    : 'U';

  const displayEmail = user?.email || (isDevAuth ? 'admin@incident.dev' : 'Unknown User');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary/10 text-primary">
              {userInitials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {isDevAuth ? 'Admin (Dev)' : 'Account'}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {displayEmail}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserNav;
