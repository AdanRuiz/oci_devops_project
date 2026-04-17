import { Bell, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';

interface HeaderProps {
  title: string;
  subtitle?: string;
  userName: string;
  userInitials: string;
}

export default function Header({ title, subtitle, userName, userInitials }: HeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="bg-white border-b border-slate-200 shadow-sm">
      <div className="px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-slate-900">{title}</h1>
            {subtitle && <p className="text-sm text-slate-600 mt-1">{subtitle}</p>}
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative hover:bg-slate-100 text-slate-600">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
            </Button>

            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
              <div className="text-right">
                <p className="text-sm text-slate-900">{userName}</p>
                <p className="text-xs text-slate-500">Manager</p>
              </div>
              <Avatar className="w-10 h-10 bg-primary text-white">
                <AvatarFallback className="bg-primary text-white">{userInitials}</AvatarFallback>
              </Avatar>
            </div>

            <Button variant="ghost" size="icon" className="hover:bg-slate-100 text-slate-600" onClick={() => navigate('/')}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
