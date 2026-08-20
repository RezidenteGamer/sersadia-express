import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Eye, EyeOff, Mail, Lock, User, IdCard, MapPin } from 'lucide-react';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { signInWithGoogleNative } from '@/lib/googleAuthNative';
import { BrandLogo } from '@/components/BrandLogo';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

const signupSchema = loginSchema.extend({
  fullName: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  mbrfId: z.string().regex(/^\d{6}$/, 'ID MBRF deve ter exatamente 6 dígitos').optional().or(z.literal('')),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Senhas não conferem',
  path: ['confirmPassword'],
});

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signIn, signUp } = useAuth();
  const [isLogin, setIsLogin] = useState(() => searchParams.get('mode') !== 'signup');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    mbrfId: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [forgotPassword, setForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail || !z.string().email().safeParse(resetEmail).success) {
      toast.error('Informe um email válido');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/auth`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Email de recuperação enviado! Verifique sua caixa de entrada.');
      setForgotPassword(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      if (isLogin) {
        const result = loginSchema.safeParse(formData);
        if (!result.success) {
          const fieldErrors: Record<string, string> = {};
          result.error.errors.forEach(err => {
            if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
          });
          setErrors(fieldErrors);
          setLoading(false);
          return;
        }

        const { error } = await signIn(formData.email, formData.password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast.error('Email ou senha incorretos');
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success('Login realizado com sucesso!');
          const redirectTo = searchParams.get('redirect') || '/locations';
          navigate(redirectTo);
        }
      } else {
        const result = signupSchema.safeParse(formData);
        if (!result.success) {
          const fieldErrors: Record<string, string> = {};
          result.error.errors.forEach(err => {
            if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
          });
          setErrors(fieldErrors);
          setLoading(false);
          return;
        }

        const { error, data } = await signUp(formData.email, formData.password, formData.fullName);
        if (error) {
          if (error.message.includes('already registered')) {
            toast.error('Este email já está cadastrado');
          } else {
            toast.error(error.message);
          }
        } else {
          if (data?.user && formData.mbrfId) {
            await supabase.from('profiles').update({ mbrf_id: formData.mbrfId }).eq('id', data.user.id);
          }
          toast.success('Conta criada com sucesso! Bem-vindo!');
          const redirectTo = searchParams.get('redirect') || '/locations';
          navigate(redirectTo);
        }
      }
    } catch (err) {
      toast.error('Ocorreu um erro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      {/* Warm gradient background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsl(30_25%_96%)_0%,_hsl(30_20%_90%)_100%)]" />
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")' }} />

      <div className="w-full max-w-md animate-slide-up relative z-10">
        <Card className="shadow-xl rounded-[20px] p-2">
          <CardHeader className="space-y-1 pb-2 text-center">
            <div className="flex justify-center mb-2">
              <BrandLogo className="h-16" alt="Ser Sadia Express" />
            </div>
            <CardTitle className="text-2xl font-serif">
              {forgotPassword ? 'Recuperar Senha' : isLogin ? 'Bem-vindo de volta' : 'Criar Conta'}
            </CardTitle>
            <CardDescription>
              {forgotPassword
                ? 'Informe seu email para receber o link de recuperação'
                : isLogin 
                  ? 'Entre para gerenciar suas reservas' 
                  : 'Preencha os dados para criar sua conta'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {forgotPassword ? (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="resetEmail">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="resetEmail" type="email" placeholder="seu@email.com" className="pl-10" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Enviando...' : 'Enviar Link de Recuperação'}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Nome Completo</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="fullName" type="text" placeholder="Seu nome completo" className="pl-10" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} />
                    </div>
                    {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
                  </div>
                )}

                {!isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor="mbrfId">ID MBRF (6 dígitos)</Label>
                    <div className="relative">
                      <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="mbrfId" type="text" placeholder="000000" className="pl-10" maxLength={6} value={formData.mbrfId} onChange={(e) => setFormData({ ...formData, mbrfId: e.target.value.replace(/\D/g, '').slice(0, 6) })} />
                    </div>
                    {errors.mbrfId && <p className="text-sm text-destructive">{errors.mbrfId}</p>}
                    <p className="text-xs text-muted-foreground">Opcional. Se você é sócio, informe seu ID para ter desconto automaticamente.</p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="email" type="email" placeholder="seu@email.com" className="pl-10" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                  </div>
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Senha</Label>
                    {isLogin && (
                      <button type="button" onClick={() => setForgotPassword(true)} className="text-xs text-primary hover:underline">
                        Esqueceu a senha?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" className="pl-10 pr-10" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                </div>

                {!isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="confirmPassword" type={showPassword ? 'text' : 'password'} placeholder="••••••••" className="pl-10" value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} />
                    </div>
                    {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Carregando...' : isLogin ? 'Entrar' : 'Criar Conta'}
                </Button>
              </form>
            )}

            <div className="mt-6 space-y-3 text-center">
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
                <div className="relative flex justify-center"><span className="bg-card px-3 text-xs text-muted-foreground">ou</span></div>
              </div>

              {!forgotPassword && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    disabled={loading}
                    onClick={async () => {
                      setLoading(true);
                      // Try native Google Sign-In first (Capacitor on Android/iOS)
                      const nativeResult = await signInWithGoogleNative();
                      if (nativeResult.native) {
                        if (nativeResult.ok === true) {
                          toast.success('Login realizado com sucesso!');
                          const redirectTo = searchParams.get('redirect') || '/locations';
                          navigate(redirectTo);
                        } else if (nativeResult.error !== 'cancelled') {
                          toast.error('Erro ao entrar com Google: ' + nativeResult.error);
                        }
                        setLoading(false);
                        return;
                      }
                      // Web fallback (browser)
                      const { error } = await supabase.auth.signInWithOAuth({
                        provider: 'google',
                        options: {
                          redirectTo:
                            window.location.origin +
                            (searchParams.get('redirect') || '/locations'),
                        },
                      });
                      if (error) {
                        toast.error('Erro ao entrar com Google');
                        setLoading(false);
                      }
                    }}
                  >
                    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                    Continuar com Google
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    disabled={loading}
                    onClick={async () => {
                      setLoading(true);
                      const { error } = await supabase.auth.signInWithOAuth({
                        provider: 'azure',
                        options: {
                          redirectTo:
                            window.location.origin +
                            (searchParams.get('redirect') || '/locations'),
                        },
                      });
                      if (error) {
                        toast.error('Erro ao entrar com Microsoft');
                        setLoading(false);
                      }
                    }}
                  >
                    <svg className="w-4 h-4 mr-2" viewBox="0 0 23 23">
                      <path fill="#f35325" d="M1 1h10v10H1z"/>
                      <path fill="#81bc06" d="M12 1h10v10H12z"/>
                      <path fill="#05a6f0" d="M1 12h10v10H1z"/>
                      <path fill="#ffba08" d="M12 12h10v10H12z"/>
                    </svg>
                    Continuar com Microsoft
                  </Button>
                </>
              )}


              <p className="text-sm text-muted-foreground">
                {forgotPassword ? (
                  <button type="button" onClick={() => setForgotPassword(false)} className="text-primary font-medium hover:underline">Voltar ao login</button>
                ) : (
                  <>
                    {isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'}
                    <button type="button" onClick={() => { setIsLogin(!isLogin); setErrors({}); }} className="ml-1 text-primary font-medium hover:underline">
                      {isLogin ? 'Criar conta' : 'Fazer login'}
                    </button>
                  </>
                )}
              </p>
              <Button variant="outline" className="w-full" onClick={() => navigate('/locations')}>
                <MapPin className="w-4 h-4 mr-2" />
                Ver Locais Disponíveis
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
