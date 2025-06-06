
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, UserType } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Shield, Users, Building } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<UserType>('client');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const success = await login(email, password, activeTab);
    
    if (success) {
      // Redirect based on user type
      switch (activeTab) {
        case 'admin':
          navigate('/admin');
          break;
        case 'business':
          navigate('/dashboard');
          break;
        case 'client':
        default:
          navigate('/');
          break;
      }
    } else {
      setError('Invalid credentials. Try: admin@b.com, client@b.com, or business@b.com with password "password"');
    }
    
    setIsLoading(false);
  };

  const userTypeConfig = {
    client: {
      icon: Users,
      title: 'Client Login',
      description: 'Access your followed businesses',
      placeholder: 'client@b.com'
    },
    business: {
      icon: Building,
      title: 'Business Owner Login',
      description: 'Manage your business profile',
      placeholder: 'business@b.com'
    },
    admin: {
      icon: Shield,
      title: 'Admin Login',
      description: 'Administrative access',
      placeholder: 'admin@b.com'
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-whatsapp-light px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-whatsapp-green rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">B</span>
          </div>
          <CardTitle className="text-2xl">Welcome to B</CardTitle>
          <CardDescription>Choose your login type below</CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as UserType)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="client" className="text-xs">Client</TabsTrigger>
              <TabsTrigger value="business" className="text-xs">Business</TabsTrigger>
              <TabsTrigger value="admin" className="text-xs">Admin</TabsTrigger>
            </TabsList>
            
            {Object.entries(userTypeConfig).map(([type, config]) => (
              <TabsContent key={type} value={type} className="space-y-4">
                <div className="text-center">
                  <config.icon className="w-12 h-12 mx-auto mb-2 text-whatsapp-green" />
                  <h3 className="text-lg font-semibold">{config.title}</h3>
                  <p className="text-sm text-gray-600">{config.description}</p>
                </div>
                
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder={config.placeholder}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  
                  {error && (
                    <div className="text-red-500 text-sm">{error}</div>
                  )}
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-whatsapp-green hover:bg-whatsapp-green/90"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Logging in...' : 'Login'}
                  </Button>
                </form>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
