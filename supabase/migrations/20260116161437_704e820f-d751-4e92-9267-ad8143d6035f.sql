-- Enum para roles de permissões
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Enum para status de reservas
CREATE TYPE public.reservation_status AS ENUM (
  'pending', 
  'confirmed', 
  'rejected', 
  'cancelled_by_user', 
  'cancelled_by_admin', 
  'expired', 
  'presence_confirmed'
);

-- Enum para permissões de admin
CREATE TYPE public.admin_permission AS ENUM (
  'manage_locations',
  'manage_reservations', 
  'manage_users',
  'manage_payments',
  'manage_checkin',
  'view_reports'
);

-- Tabela de perfis de usuário
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE(user_id, role)
);

-- Tabela de permissões de admin
CREATE TABLE public.admin_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  permission admin_permission NOT NULL,
  UNIQUE(user_id, permission)
);

-- Tabela de locais
CREATE TABLE public.locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  capacity INTEGER NOT NULL DEFAULT 1,
  rules TEXT,
  price_per_hour DECIMAL(10,2) NOT NULL DEFAULT 0,
  price_fixed DECIMAL(10,2),
  available_start_time TIME NOT NULL DEFAULT '08:00',
  available_end_time TIME NOT NULL DEFAULT '22:00',
  is_active BOOLEAN NOT NULL DEFAULT true,
  images TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de reservas
CREATE TABLE public.reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE DEFAULT UPPER(SUBSTRING(gen_random_uuid()::TEXT FROM 1 FOR 8)),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  location_id UUID REFERENCES public.locations(id) ON DELETE CASCADE NOT NULL,
  reservation_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status reservation_status NOT NULL DEFAULT 'pending',
  total_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  admin_notes TEXT,
  user_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de logs de reserva
CREATE TABLE public.reservation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID REFERENCES public.reservations(id) ON DELETE CASCADE NOT NULL,
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de pagamentos
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID REFERENCES public.reservations(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  is_paid BOOLEAN NOT NULL DEFAULT false,
  paid_at TIMESTAMPTZ,
  payment_method TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de check-in
CREATE TABLE public.checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID REFERENCES public.reservations(id) ON DELETE CASCADE NOT NULL UNIQUE,
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  checked_in_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de notificações
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Configurações de check-in
CREATE TABLE public.checkin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tolerance_before_minutes INTEGER NOT NULL DEFAULT 15,
  tolerance_after_minutes INTEGER NOT NULL DEFAULT 30,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Inserir configuração padrão
INSERT INTO public.checkin_settings (id) VALUES (gen_random_uuid());

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkin_settings ENABLE ROW LEVEL SECURITY;

-- Função para verificar role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Função para verificar permissão
CREATE OR REPLACE FUNCTION public.has_permission(_user_id UUID, _permission admin_permission)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_permissions
    WHERE user_id = _user_id
      AND permission = _permission
  )
$$;

-- Função para verificar se é admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin')
$$;

-- Trigger para criar perfil automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'Usuário'),
    NEW.email
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies

-- Profiles: usuários podem ver e editar seu próprio perfil, admins podem ver todos
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.is_admin(auth.uid()));

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.is_admin(auth.uid()));

-- User roles: apenas admins podem gerenciar
CREATE POLICY "Admins can manage user roles" ON public.user_roles
  FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can view own role" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- Admin permissions
CREATE POLICY "Admins can manage permissions" ON public.admin_permissions
  FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can view own permissions" ON public.admin_permissions
  FOR SELECT USING (auth.uid() = user_id);

-- Locations: todos podem ver ativos, admins podem gerenciar
CREATE POLICY "Anyone can view active locations" ON public.locations
  FOR SELECT USING (is_active = true OR public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage locations" ON public.locations
  FOR ALL USING (public.has_permission(auth.uid(), 'manage_locations') OR public.is_admin(auth.uid()));

-- Reservations
CREATE POLICY "Users can view own reservations" ON public.reservations
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Users can create reservations" ON public.reservations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pending reservations" ON public.reservations
  FOR UPDATE USING (
    auth.uid() = user_id AND status = 'pending'
    OR public.has_permission(auth.uid(), 'manage_reservations')
    OR public.is_admin(auth.uid())
  );

CREATE POLICY "Admins can manage reservations" ON public.reservations
  FOR ALL USING (public.has_permission(auth.uid(), 'manage_reservations') OR public.is_admin(auth.uid()));

-- Reservation logs
CREATE POLICY "Admins can view and create logs" ON public.reservation_logs
  FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can view own reservation logs" ON public.reservation_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.reservations r
      WHERE r.id = reservation_id AND r.user_id = auth.uid()
    )
  );

-- Payments
CREATE POLICY "Admins can manage payments" ON public.payments
  FOR ALL USING (public.has_permission(auth.uid(), 'manage_payments') OR public.is_admin(auth.uid()));

CREATE POLICY "Users can view own payments" ON public.payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.reservations r
      WHERE r.id = reservation_id AND r.user_id = auth.uid()
    )
  );

-- Checkins
CREATE POLICY "Admins with permission can manage checkins" ON public.checkins
  FOR ALL USING (public.has_permission(auth.uid(), 'manage_checkin') OR public.is_admin(auth.uid()));

CREATE POLICY "Users can view own checkins" ON public.checkins
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.reservations r
      WHERE r.id = reservation_id AND r.user_id = auth.uid()
    )
  );

-- Notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

-- Checkin settings
CREATE POLICY "Admins can manage checkin settings" ON public.checkin_settings
  FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Anyone can view checkin settings" ON public.checkin_settings
  FOR SELECT USING (true);