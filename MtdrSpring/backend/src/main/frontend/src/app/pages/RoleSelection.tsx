import { useState } from 'react';
import { useNavigate } from 'react-router';
import { LogIn, UserPlus, Mail, Lock, User, LayoutDashboard } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

export default function RoleSelection() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('login');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/manager');
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/developer');
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-red-500/10 via-rose-500/5 to-transparent rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-red-600/10 via-red-500/5 to-transparent rounded-full blur-3xl"></div>

      <div className="relative min-h-screen flex">
        <div className="w-full lg:w-1/2 flex flex-col justify-between p-8 lg:p-16">
          <div>
            <div className="mb-12">
              <div className="flex items-baseline gap-3 mb-4">
                <h1 className="text-7xl lg:text-8xl tracking-tight">
                  <span className="bg-gradient-to-r from-red-700 via-red-600 to-rose-600 bg-clip-text text-transparent">
                    Synkra
                  </span>
                </h1>
                <div className="w-3 h-3 rounded-full bg-red-600 mb-4"></div>
              </div>
              <div className="ml-1 space-y-2">
                <p className="text-2xl text-gray-800">
                  Where productivity meets collaboration
                </p>
                <p className="text-base text-red-700 italic">
                  Sync smarter. Work faster. Achieve more.
                </p>
              </div>
            </div>

            <div className="w-32 h-1 bg-gradient-to-r from-red-600 to-transparent rounded-full"></div>
          </div>

          <div className="text-sm text-gray-500">
            <p>Software Requirements Project - Spring 2026</p>
          </div>
        </div>

        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-2xl shadow-xl border border-red-100 p-8">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login" className="flex items-center gap-2">
                    <LogIn className="w-4 h-4" />
                    Log In
                  </TabsTrigger>
                  <TabsTrigger value="signup" className="flex items-center gap-2">
                    <UserPlus className="w-4 h-4" />
                    Sign Up
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email" className="text-gray-700">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input id="login-email" type="email" placeholder="you@example.com" className="pl-10 border-gray-200 focus:border-red-500 focus:ring-red-500" required />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="login-password" className="text-gray-700">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input id="login-password" type="password" placeholder="••••••••" className="pl-10 border-gray-200 focus:border-red-500 focus:ring-red-500" required />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <label className="flex items-center gap-2 text-gray-600 cursor-pointer">
                        <input type="checkbox" className="rounded border-gray-300 text-red-600 focus:ring-red-500" />
                        Remember me
                      </label>
                      <a href="#" className="text-red-600 hover:text-red-700">Forgot password?</a>
                    </div>

                    <Button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20" size="lg">Log In to Synkra</Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name" className="text-gray-700">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input id="signup-name" type="text" placeholder="John Doe" className="pl-10 border-gray-200 focus:border-red-500 focus:ring-red-500" required />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-email" className="text-gray-700">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input id="signup-email" type="email" placeholder="you@example.com" className="pl-10 border-gray-200 focus:border-red-500 focus:ring-red-500" required />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-password" className="text-gray-700">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input id="signup-password" type="password" placeholder="••••••••" className="pl-10 border-gray-200 focus:border-red-500 focus:ring-red-500" required />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-confirm" className="text-gray-700">Confirm Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input id="signup-confirm" type="password" placeholder="••••••••" className="pl-10 border-gray-200 focus:border-red-500 focus:ring-red-500" required />
                      </div>
                    </div>

                    <Button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20" size="lg">Create Account</Button>
                  </form>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
