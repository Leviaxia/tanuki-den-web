import React, { useState } from 'react';
import { X, Sparkles, Mail, Lock, User, Phone, MapPin, Calendar, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '../src/lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (user: any) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onComplete }) => {
  const [step, setStep] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  // Location State
  const [department, setDepartment] = useState('');
  const [city, setCity] = useState('');
  const [birthDate, setBirthDate] = useState('');

  const DEPARTAMENTOS = [
    'Amazonas', 'Antioquia', 'Arauca', 'Atlántico', 'Bogotá D.C.', 'Bolívar', 'Boyacá', 'Caldas', 'Caquetá', 'Casanare', 'Cauca', 'Cesar', 'Chocó', 'Córdoba', 'Cundinamarca', 'Guainía', 'Guaviare', 'Huila', 'La Guajira', 'Magdalena', 'Meta', 'Nariño', 'Norte de Santander', 'Putumayo', 'Quindío', 'Risaralda', 'San Andrés y Providencia', 'Santander', 'Sucre', 'Tolima', 'Valle del Cauca', 'Vaupés', 'Vichada'
  ];

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message === 'Invalid login credentials' ? 'Credenciales incorrectas' : error.message);
      setLoading(false);
    } else {
      // Fetch profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      onComplete({ ...data.user, ...profile, id: data.user.id, name: profile?.full_name || data.user.email });
      setLoading(false);
      onClose();
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const fullLocation = `${city}, ${department}`;
      const validBirthDate = birthDate ? birthDate : null;

      // Enviamos el 'fullName' del formulario como 'username' (Apodo) en los metadatos
      const metadata = {
        username: fullName, // Mapeamos: Input "Nombre" -> DB "Username"
        full_name: fullName, // También llenamos full_name por si acaso
        phone: phone || "",
        location: fullLocation,
        birth_date: validBirthDate,
      };

      console.log('1. Starting registration with metadata:', metadata);

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      });

      if (signUpError) {
        console.error('Sign up error:', signUpError);
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        console.log('User created successfully:', data.user.id);

        // ÉXITO: Mostramos alerta o cerramos
        // Si no hay sesión (confirmación requerida), avisamos y cerramos.
        if (!data.session) {
          alert('¡Registro Exitoso! 🍃\n\nPor favor revisa tu correo para confirmar tu cuenta y poder entrar.');
          setLoading(false);
          onClose(); // Cerramos el modal para que no parezca "colgado"
          return;
        }

        // Si hay sesión (Auto Confirm), entramos directo
        onComplete({
          id: data.user.id,
          email,
          name: fullName, // Apodo
          photo: `https://api.dicebear.com/7.x/micah/svg?seed=${email}`,
          membership: null,
          location: fullLocation,
          phone,
          realName: fullName,
          birthDate: validBirthDate
        });

        // Feedback visual rápido
        alert(`¡Bienvenido al Clan, ${fullName}! 🍂`);
        setLoading(false);
        onClose();

      } else {
        setError('El servicio de identidad no respondió correctamente.');
        setLoading(false);
      }

    } catch (err: any) {
      console.error('Critical Register Error:', err);
      setError(`Error crítico: ${err.message || 'Error desconocido'}`);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-[#3A332F]/90 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-[40px] p-8 md:p-12 relative animate-pop shadow-2xl border-4 border-[#D4AF37]">
        <button onClick={onClose} className="absolute top-6 right-6 hover:rotate-90 transition-transform"><X size={24} /></button>

        <div className="text-center space-y-2 mb-8">
          <div className="w-16 h-16 bg-[#3A332F] rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-[#D4AF37]">
            <Sparkles className="text-[#D4AF37]" size={28} />
          </div>
          <h2 className="text-3xl font-ghibli-title text-[#3A332F] uppercase">{step === 'login' ? 'Regreso al Clan' : 'Únete a la Leyenda'}</h2>
          <p className="text-[#8C8279] text-xs font-bold uppercase tracking-widest">{step === 'login' ? 'Bienvenido de nuevo, viajero' : 'Comienza tu viaje en el Tanuki Den'}</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-100 rounded-2xl text-red-600 text-xs font-bold text-center uppercase tracking-wide animate-pulse">
            {error}
          </div>
        )}

        {step === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-[#3A332F] ml-2">Correo Ancestral</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#3A332F]/40" size={18} />
                <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-[#FDF5E6] border-2 border-transparent focus:border-[#C14B3A] rounded-full pl-12 pr-6 py-4 outline-none font-bold text-[#3A332F] transition-all" placeholder="tanuki@bosque.com" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-[#3A332F] ml-2">Llave Secreta</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#3A332F]/40" size={18} />
                <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-[#FDF5E6] border-2 border-transparent focus:border-[#C14B3A] rounded-full pl-12 pr-6 py-4 outline-none font-bold text-[#3A332F] transition-all" placeholder="••••••••" />
              </div>
            </div>
            <button disabled={loading} type="submit" className="w-full bg-[#C14B3A] text-white font-ghibli-title py-5 rounded-full text-base shadow-xl hover:bg-[#3A332F] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed">
              {loading ? <Loader2 className="animate-spin" /> : <>ENTRAR AL DEN <ArrowRight size={20} /></>}
            </button>
            <p className="text-center text-xs font-bold text-[#8C8279] mt-4">
              ¿Aún no tienes clan? <button type="button" onClick={() => setStep('register')} className="text-[#C14B3A] hover:underline uppercase tracking-wide">Iníciate aquí</button>
            </p>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 scrollbar-hide">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-[#3A332F] ml-2">Nombre de Usuario (Apodo)</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#3A332F]/40" size={18} />
                <input required type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="w-full bg-[#FDF5E6] border-2 border-transparent focus:border-[#C14B3A] rounded-full pl-12 pr-6 py-3 outline-none font-bold text-[#3A332F] transition-all" placeholder="Tu nombre" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-[#3A332F] ml-2">Correo</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#3A332F]/40" size={18} />
                <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-[#FDF5E6] border-2 border-transparent focus:border-[#C14B3A] rounded-full pl-12 pr-6 py-3 outline-none font-bold text-[#3A332F] transition-all" placeholder="correo@ejemplo.com" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-[#3A332F] ml-2">Celular</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-[#3A332F]/40" size={18} />
                <input required type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-[#FDF5E6] border-2 border-transparent focus:border-[#C14B3A] rounded-full pl-12 pr-4 py-3 outline-none font-bold text-[#3A332F] text-xs transition-all" placeholder="300..." />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#3A332F] ml-2">Departamento</label>
                <select required value={department} onChange={e => setDepartment(e.target.value)} className="w-full bg-[#FDF5E6] border-2 border-transparent focus:border-[#C14B3A] rounded-2xl px-4 py-3 outline-none font-bold text-[#3A332F] text-xs transition-all appearance-none">
                  <option value="">Selecciona...</option>
                  {DEPARTAMENTOS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#3A332F] ml-2">Ciudad</label>
                <input required type="text" value={city} onChange={e => setCity(e.target.value)} className="w-full bg-[#FDF5E6] border-2 border-transparent focus:border-[#C14B3A] rounded-2xl px-4 py-3 outline-none font-bold text-[#3A332F] text-xs transition-all" placeholder="Ciudad" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-[#3A332F] ml-2">Fecha de Nacimiento</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-[#3A332F]/40" size={18} />
                <input required type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} className="w-full bg-[#FDF5E6] border-2 border-transparent focus:border-[#C14B3A] rounded-full pl-12 pr-6 py-3 outline-none font-bold text-[#3A332F] transition-all" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-[#3A332F] ml-2">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#3A332F]/40" size={18} />
                <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-[#FDF5E6] border-2 border-transparent focus:border-[#C14B3A] rounded-full pl-12 pr-6 py-3 outline-none font-bold text-[#3A332F] transition-all" placeholder="Min. 6 caracteres" minLength={6} />
              </div>
            </div>

            <button disabled={loading} type="submit" className="w-full bg-[#3A332F] text-white font-ghibli-title py-5 rounded-full text-base shadow-xl hover:bg-[#C14B3A] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 mt-4 disabled:opacity-70">
              {loading ? <Loader2 className="animate-spin" /> : <>FORJAR MI CUENTA <Sparkles size={20} /></>}
            </button>
            <p className="text-center text-xs font-bold text-[#8C8279] mt-4">
              ¿Ya tienes cuenta? <button type="button" onClick={() => setStep('login')} className="text-[#C14B3A] hover:underline uppercase tracking-wide">Entra aquí</button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default AuthModal;
