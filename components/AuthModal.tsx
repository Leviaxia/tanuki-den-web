import React, { useState } from 'react';
import { X, Sparkles, Mail, Lock, User, Phone, MapPin, Calendar, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '../src/lib/supabase';
import { COLOMBIA_DATA } from '../src/data/colombia';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (user: any) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onComplete }) => {
  const [step, setStep] = useState<'login' | 'register' | 'success'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{ name: string; email: string; isAutoLogin: boolean } | null>(null);

  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  // Location State
  const [department, setDepartment] = useState('');
  const [city, setCity] = useState('');

  const [birthDate, setBirthDate] = useState('');
  // Validation States
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);

  // Reset to Login when closed
  React.useEffect(() => {
    if (!isOpen) {
      setStep('login');
      setError(null);
      setLoading(false);
      setPhoneError(null);
      setDateError(null);
    }
  }, [isOpen]);

  // Validar fecha de nacimiento
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const year = parseInt(val.split('-')[0]);

    setBirthDate(val);

    if (val && (year < 1900 || year > 2100)) {
      setDateError("Año fuera de rango (1900-2100)");
    } else {
      setDateError(null);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Allow only numbers
    if (!/^\d*$/.test(val)) return;

    setPhone(val);

    if (val && !/^3\d{9}$/.test(val)) {
      // Si ya tiene 10 dígitos pero no empieza por 3, o si es corto (opcional: validar longitud en blur o typing?)
      // Para UX agresiva validamos "typing" pero quizá sea molesto si es muy estricto al inicio.
      // Mejor: Validamos si la longitud > 3 y no empieza por 3. O cuando length == 10.
      if (val.length > 0 && !val.startsWith('3')) {
        setPhoneError("Debe empezar por 3");
      } else if (val.length === 10 && !/^3\d{9}$/.test(val)) {
        setPhoneError("Número inválido");
      } else if (val.length > 10) {
        setPhoneError("Demasiado largo");
      } else {
        setPhoneError(null);
      }
    } else {
      setPhoneError(null);
    }
  };

  // Custom validation on Blur for better UX (don't scream while typing too much)
  const handlePhoneBlur = () => {
    if (phone && !/^3\d{9}$/.test(phone)) {
      setPhoneError("Debe ser un celular válido (3XXXXXXXXX)");
    }
  };

  const handleDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDepartment(e.target.value);
    setCity(''); // Reset city when department changes
  };

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Timeout safety
      const loginPromise = supabase.auth.signInWithPassword({
        email,
        password,
      });
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Tiempo de espera agotado (60s). Si es la primera vez, Supabase puede estar "despertando". Intenta de nuevo.')), 60000));

      const { data, error } = await Promise.race([loginPromise, timeoutPromise]) as any;

      if (error) {
        throw error;
      }

      if (data?.user) {
        // Fetch profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        onComplete({ ...data.user, ...profile, id: data.user.id, name: profile?.full_name || data.user.email });
        onClose(); // Close FIRST
      }
    } catch (err: any) {
      console.error("Login Error:", err);
      setError(err.message === 'Invalid login credentials' ? 'Credenciales incorrectas' : (err.message || 'Error desconocido al iniciar sesión'));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validaciones estrictas
    if (!/^3\d{9}$/.test(phone)) {
      setError("El número de celular debe ser colombiano (Empieza por 3 y tiene 10 dígitos).");
      setLoading(false);
      return;
    }

    const birthYear = parseInt(birthDate.split('-')[0]);
    if (birthDate && (birthYear < 1900 || birthYear > 2100)) {
      setError("Por favor ingresa un año de nacimiento válido (1900-2100).");
      setLoading(false);
      return;
    }

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

      // 10 second timeout safety
      const signUpPromise = supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      });

      // 30 second timeout safety (Supabase sometimes takes time)
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Tardó demasiado')), 30000)
      );

      const { data, error: signUpError } = await Promise.race([signUpPromise, timeoutPromise]) as any;

      if (signUpError) {
        console.error('Sign up error:', signUpError);
        // Translate common errors
        if (signUpError.message?.includes('registered')) {
          setError('Este correo ya está registrado. Intenta iniciar sesión.');
        } else {
          setError(signUpError.message);
        }
        setLoading(false);
        return;
      }

      if (data.user) {
        console.log('User created successfully:', data.user.id);
        // ... (rest of success logic)
        setSuccessData({
          name: fullName || 'Viajero',
          email: email,
          isAutoLogin: !!data.session
        });
        setStep('success');

      } else if (!signUpError) {
        setError('El servicio de identidad no respondió correctamente (Sin usuario).');
      }

    } catch (err: any) {
      console.error('Critical Register Error:', err);
      // Nice error for timeout
      if (err.message === 'Tardó demasiado') {
        setError('El servidor está lento. Es posible que tu registro sí se haya creado. Revisa tu correo o intenta entrar.');
      } else {
        if (!error) setError(`Error inesperado: ${err.message || 'Intenta de nuevo'}`);
      }
    } finally {
      // FORCE stop loading no matter what
      setLoading(false);
    }
  };

  const handleSuccessContinue = () => {
    if (successData?.isAutoLogin) {
      // Construir objeto de usuario para autologin
      const fullLocation = `${city}, ${department}`;
      const validBirthDate = birthDate ? birthDate : null;

      // Nota: El ID real lo obtendríamos de la sesión, pero aquí usamos un placeholder si no lo tenemos a mano
      // En realidad, handleRegister ya verificó data.session. 
      // Para simplificar, cerramos y dejamos que App.tsx detecte la sesión por onAuthStateChange, 
      // O forzamos los datos que tenemos.

      // Mejor: Cerramos modal. App.tsx detectará el evento SIGNED_IN de Supabase y actualizará todo.
      onClose();
    } else {
      // Caso: Requiere confirmación de email
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-[#3A332F]/90 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-[40px] p-8 md:p-12 relative animate-pop shadow-2xl border-4 border-[#D4AF37]">
        <button onClick={onClose} className="absolute top-6 right-6 hover:rotate-90 transition-transform"><X size={24} /></button>

        <div className="text-center space-y-2 mb-8">
          <div className="w-16 h-16 bg-[#3A332F] rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-[#D4AF37]">
            {step === 'success' ? <CheckCircle2 className="text-[#81C784]" size={32} /> : <Sparkles className="text-[#D4AF37]" size={28} />}
          </div>
          <h2 className="text-3xl font-ghibli-title text-[#3A332F] uppercase">
            {step === 'login' ? 'Regreso al Clan' : step === 'register' ? 'Únete a la Leyenda' : '¡Registro Exitoso!'}
          </h2>
          <p className="text-[#8C8279] text-xs font-bold uppercase tracking-widest">
            {step === 'login' ? 'Bienvenido de nuevo, viajero' : step === 'register' ? 'Comienza tu viaje en el Tanuki Den' : 'Tu leyenda comienza ahora'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-100 rounded-2xl text-red-600 text-xs font-bold text-center uppercase tracking-wide animate-pulse">
            {error}
          </div>
        )}

        {step === 'success' ? (
          <div className="text-center space-y-6">
            <div className="bg-[#FDF5E6] p-6 rounded-[30px] border-2 border-[#E6D5B8] space-y-4">
              <p className="text-[#3A332F] font-bold text-lg">
                ¡Bienvenido, <span className="text-[#C14B3A]">{successData?.name}</span>! 🍃
              </p>
              <p className="text-[#8C8279] text-sm leading-relaxed">
                {successData?.isAutoLogin
                  ? "Tu cuenta ha sido creada y los espíritus te han reconocido. Ya eres parte del Tanuki Den."
                  : `Hemos enviado un pergamino de confirmación a ${successData?.email}. Por favor revísalo para activar tu entrada.`}
              </p>
            </div>

            <button onClick={handleSuccessContinue} className="w-full bg-[#3A332F] text-white font-ghibli-title py-5 rounded-full text-base shadow-xl hover:bg-[#81C784] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3">
              {successData?.isAutoLogin ? <>CONTINUAR MI VIAJE <ArrowRight size={20} /></> : <>ENTENDIDO <X size={20} /></>}
            </button>
          </div>
        ) : step === 'login' ? (
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
            {/* REGISTRATION FORM CONTENT (SAME AS BEFORE) */}
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
                <Phone className={`absolute left-4 top-1/2 -translate-y-1/2 ${phoneError ? 'text-red-500' : 'text-[#3A332F]/40'}`} size={18} />
                <input required type="tel" value={phone} onChange={handlePhoneChange} onBlur={handlePhoneBlur} className={`w-full bg-[#FDF5E6] border-2 ${phoneError ? 'border-red-500 focus:border-red-600' : 'border-transparent focus:border-[#C14B3A]'} rounded-full pl-12 pr-4 py-3 outline-none font-bold text-[#3A332F] text-xs transition-all`} placeholder="300..." />
              </div>
              {phoneError && <p className="text-[10px] text-red-500 font-bold ml-4 animate-pulse">{phoneError}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#3A332F] ml-2">Departamento</label>
                <select required value={department} onChange={handleDepartmentChange} className="w-full bg-[#FDF5E6] border-2 border-transparent focus:border-[#C14B3A] rounded-2xl px-4 py-3 outline-none font-bold text-[#3A332F] text-xs transition-all appearance-none">
                  <option value="">Selecciona...</option>
                  {Object.keys(COLOMBIA_DATA).map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#3A332F] ml-2">Ciudad / Municipio</label>
                <select required disabled={!department} value={city} onChange={e => setCity(e.target.value)} className="w-full bg-[#FDF5E6] border-2 border-transparent focus:border-[#C14B3A] rounded-2xl px-4 py-3 outline-none font-bold text-[#3A332F] text-xs transition-all appearance-none disabled:opacity-50 disabled:cursor-not-allowed">
                  <option value="">{department ? 'Selecciona...' : 'Elige Depto primero'}</option>
                  {department && COLOMBIA_DATA[department]?.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-[#3A332F] ml-2">Fecha de Nacimiento</label>
              <div className="relative">
                <Calendar className={`absolute left-4 top-1/2 -translate-y-1/2 ${dateError ? 'text-red-500' : 'text-[#3A332F]/40'}`} size={18} />
                <input required type="date" min="1900-01-01" max="2100-12-31" value={birthDate} onChange={handleDateChange} className={`w-full bg-[#FDF5E6] border-2 ${dateError ? 'border-red-500 focus:border-red-600' : 'border-transparent focus:border-[#C14B3A]'} rounded-full pl-12 pr-6 py-3 outline-none font-bold text-[#3A332F] transition-all`} />
              </div>
              {dateError && <p className="text-[10px] text-red-500 font-bold ml-4 animate-pulse">{dateError}</p>}
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
            <div className="text-center mt-2">
              <span className="text-[10px] text-gray-300 font-mono">v1.1 - Colombia Update</span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AuthModal;
