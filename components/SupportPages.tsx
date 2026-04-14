import React, { useState } from 'react';
import { 
  Package, Search, ChevronDown, ChevronUp, FileText, Shield, 
  Clock, Truck, RotateCcw, CreditCard, MessageSquare, Sparkles,
  MapPin, HelpCircle, ArrowLeft
} from 'lucide-react';

interface SupportPagesProps {
  activeSection: 'rastreo' | 'faq' | 'terminos' | 'privacidad';
  onBack?: () => void;
}

const SupportPages: React.FC<SupportPagesProps> = ({ activeSection, onBack }) => {
  const [trackingId, setTrackingId] = useState('');
  const [email, setEmail] = useState('');
  const [isTracking, setIsTracking] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: "¿A qué destinos de Colombia realizan envíos?",
      a: "Nuestras figuras viajan por todos los reinos de Colombia. Desde las montañas de Antioquia hasta las costas del Caribe. Utilizamos pergaminos de envío certificados (Interrapidísimo, Servientrega, Envia) para asegurar que tu tesoro llegue sano y salvo."
    },
    {
      q: "¿Cuál es el tiempo de entrega estimado?",
      a: "Normalmente, los tesoros tardan entre 3 y 5 días hábiles en cruzar el bosque hasta tu puerta. Si es una pieza personalizada del Taller Mágico, el tiempo de creación puede añadir 2-3 días adicionales de magia."
    },
    {
      q: "¿Son las figuras 100% originales?",
      a: "No necesariamente. Sin embargo, en el Clan Tanuki solo trabajamos con piezas de alta calidad. Cada figura pasa por un portal de inspección antes de ser enviada para garantizar que recibes un tesoro digno de tu colección. Para nosotros es importante que lo que recibas sea justamente lo que esperas."
    },
    {
      q: "¿Qué métodos de pago aceptan?",
      a: "Aceptamos todas las monedas del reino: Tarjetas de crédito/débito, transferencias bancarias y plataformas seguras como Stripe. Tus datos están protegidos por hechizos de cifrado de alto nivel."
    },
    {
      q: "¿Tienen tienda física?",
      a: "Por ahora, nuestra guarida es 100% digital, lo que nos permite enviar tesoros a cada rincón del país sin fronteras. Sin embargo, participamos frecuentemente en eventos y convenciones de anime en las ciudades principales."
    }
  ];

  const renderRastreo = () => (
    <div className="space-y-12 max-w-4xl mx-auto px-4">
      <div className="text-center space-y-6">
        <div className="w-24 h-24 bg-[#FDF5E6] rounded-full border-4 border-[#3A332F] shadow-[8px_8px_0px_0px_#C14B3A] overflow-hidden flex items-center justify-center mx-auto">
          <Package size={48} className="text-[#C14B3A]" />
        </div>
        <h2 className="text-4xl md:text-6xl font-ghibli-title text-[#3A332F] uppercase tracking-tighter">Seguir <span className="text-[#C14B3A]">Tesoro.</span></h2>
        <p className="text-[#3A332F]/70 font-bold uppercase tracking-widest text-xs md:text-sm">Rastrea el viaje de tu adquisición desde nuestro bosque</p>
      </div>

      <div className="bg-white/80 backdrop-blur-md rounded-[50px] p-8 md:p-12 border-4 border-[#3A332F] shadow-2xl space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="font-ghibli-title text-sm uppercase tracking-widest text-[#3A332F] ml-4">ID del Tesoro (Orden)</label>
            <input 
              type="text" 
              placeholder="Ej: #TAN-12345"
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value)}
              className="w-full p-6 bg-[#FDF5E6] border-4 border-[#3A332F] rounded-[25px] font-bold text-xl outline-none focus:ring-4 ring-[#C14B3A]/20 transition-all placeholder-[#3A332F]/30 shadow-inner"
            />
          </div>
          <div className="space-y-2">
            <label className="font-ghibli-title text-sm uppercase tracking-widest text-[#3A332F] ml-4">Correo del Guardián</label>
            <input 
              type="email" 
              placeholder="tu@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-6 bg-[#FDF5E6] border-4 border-[#3A332F] rounded-[25px] font-bold text-xl outline-none focus:ring-4 ring-[#C14B3A]/20 transition-all placeholder-[#3A332F]/30 shadow-inner"
            />
          </div>
        </div>

        <button 
          onClick={() => setIsTracking(true)}
          className="w-full bg-[#C14B3A] text-white font-ghibli-title py-6 rounded-[30px] text-2xl shadow-xl hover:bg-[#3A332F] transition-all flex items-center justify-center gap-4 uppercase tracking-widest group active:scale-95"
        >
          <Search className="group-hover:rotate-12 transition-transform" />
          Rastrear Envío
        </button>

        {isTracking && (
          <div className="pt-8 border-t-4 border-[#3A332F]/10 animate-fade-in space-y-8">
            <div className="flex items-center justify-between px-4 overflow-x-auto gap-8 pb-4 scrollbar-hide">
              {[
                { icon: Sparkles, label: 'Preparando', done: true },
                { icon: Package, label: 'En Bosque', done: true },
                { icon: Truck, label: 'En Camino', done: false },
                { icon: MapPin, label: 'Entregado', done: false },
              ].map((step, i, arr) => (
                <div key={i} className="flex flex-col items-center gap-4 min-w-[100px] relative">
                  <div className={`p-4 rounded-full border-4 border-[#3A332F] ${step.done ? 'bg-[#C14B3A] text-white shadow-[#C14B3A]/30 shadow-lg' : 'bg-[#FDF5E6] text-[#3A332F]/30'}`}>
                    <step.icon size={24} />
                  </div>
                  <span className={`font-ghibli-title text-[9px] uppercase tracking-widest ${step.done ? 'text-[#C14B3A]' : 'text-[#3A332F]/30'}`}>{step.label}</span>
                  {i < arr.length - 1 && (
                    <div className="absolute top-7 left-[80%] w-[50%] h-1 bg-[#3A332F]/10 -z-10 hidden md:block"></div>
                  )}
                </div>
              ))}
            </div>
            <div className="bg-[#FDF5E6] p-6 rounded-[30px] border-2 border-[#3A332F]/5 text-center">
              <p className="text-[#3A332F] font-bold text-lg uppercase tracking-wider italic">"Tu tesoro está cruzando los Reinos del Centro. Se espera que llegue a tu guarida en 2 lunas (48h)."</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderFaq = () => (
    <div className="space-y-12 max-w-4xl mx-auto px-4">
      <div className="text-center space-y-6">
        <div className="w-24 h-24 bg-[#FDF5E6] rounded-full border-4 border-[#3A332F] shadow-[8px_8px_0px_0px_#D4AF37] overflow-hidden flex items-center justify-center mx-auto">
          <img src="/assets/soporte.png" alt="Soporte" className="w-full h-full object-cover" />
        </div>
        <h2 className="text-4xl md:text-6xl font-ghibli-title text-[#3A332F] uppercase tracking-tighter text-center">Preguntas <span className="text-[#D4AF37]">Frecuentes.</span></h2>
        <p className="text-[#3A332F]/70 font-bold uppercase tracking-widest text-xs md:text-sm">Sabiduría del clan para despejar tus dudas</p>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <div 
            key={index} 
            className="group bg-white/80 backdrop-blur-md rounded-[35px] border-4 border-[#3A332F] overflow-hidden shadow-lg transition-all"
          >
            <button 
              onClick={() => setOpenFaq(openFaq === index ? null : index)}
              className="w-full p-6 md:p-8 flex items-center justify-between text-left hover:bg-[#FDF5E6] transition-colors"
            >
              <span className="font-ghibli-title text-lg md:text-xl text-[#3A332F] uppercase tracking-wider">{faq.q}</span>
              {openFaq === index ? <ChevronUp className="text-[#D4AF37]" /> : <ChevronDown className="text-[#3A332F]/40" />}
            </button>
            <div className={`transition-all duration-300 ${openFaq === index ? 'max-h-[500px] p-6 md:p-8 pt-0' : 'max-h-0'}`}>
              <div className="bg-[#FDF5E6] p-6 md:p-8 rounded-[25px] border-2 border-[#3A332F]/5">
                <p className="text-[#3A332F] text-sm md:text-base font-bold leading-relaxed">{faq.a}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-[#3A332F] p-10 rounded-[50px] text-white text-center space-y-6 shadow-2xl relative overflow-hidden group">
        <Sparkles className="absolute top-4 right-4 text-[#D4AF37] opacity-20 group-hover:scale-150 transition-transform duration-700" size={80} />
        <h3 className="font-ghibli-title text-3xl uppercase tracking-widest">¿Aún tienes dudas?</h3>
        <p className="font-bold opacity-80 uppercase tracking-widest text-xs">Nuestros mensajeros están listos para ayudarte</p>
        <button 
          onClick={() => window.open('https://wa.me/573114286263?text=Hola%2C+Clan+Tanuki.+Tengo+una+duda+sobre...', '_blank')}
          className="bg-[#D4AF37] text-[#3A332F] font-ghibli-title px-10 py-4 rounded-full text-lg shadow-xl hover:bg-white transition-all uppercase tracking-widest active:scale-95"
        >
          Enviar Pergamino
        </button>
      </div>
    </div>
  );

  const renderLegal = (title: string, color: string, content: any[]) => (
    <div className="space-y-12 max-w-5xl mx-auto px-4">
      <div className="text-center space-y-6">
        <div className={`inline-flex p-4 bg-[#FDF5E6] rounded-full border-4 border-[#3A332F] shadow-[8px_8px_0px_0px_${color}]`}>
          {activeSection === 'terminos' ? <FileText size={40} style={{color}} /> : <Shield size={40} style={{color}} />}
        </div>
        <h2 className="text-4xl md:text-6xl font-ghibli-title text-[#3A332F] uppercase tracking-tighter leading-tight" dangerouslySetInnerHTML={{ __html: title }}></h2>
        <p className="text-[#3A332F]/70 font-bold uppercase tracking-widest text-xs md:text-sm">Documentos oficiales de la guarida Tanuki Den</p>
      </div>

      <div className="bg-white/90 backdrop-blur-xl rounded-[60px] p-8 md:p-20 border-4 border-[#3A332F] shadow-2xl relative">
        <div className="absolute top-0 right-0 p-8 opacity-5">
           {activeSection === 'terminos' ? <FileText size={200} /> : <Shield size={200} />}
        </div>
        
        <div className="space-y-12 relative z-10">
          {content.map((sec, i) => (
            <div key={i} className="space-y-4">
              <h3 className="font-ghibli-title text-2xl md:text-3xl text-[#3A332F] uppercase tracking-widest flex items-center gap-4">
                <span className="w-8 h-8 rounded-full bg-[#3A332F] text-[#FDF5E6] flex items-center justify-center text-sm font-black">{i + 1}</span>
                {sec.title}
              </h3>
              <p className="text-[#3A332F]/80 text-sm md:text-lg font-bold leading-[1.8] uppercase tracking-wide">
                {sec.text}
              </p>
            </div>
          ))}
          
          <div className="pt-12 border-t-4 border-[#3A332F]/10 flex flex-col md:flex-row items-center justify-between gap-8 opacity-60">
             <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-[#FDF5E6] rounded-full flex items-center justify-center border-2 border-[#3A332F]">
                 <Clock size={20} className="text-[#3A332F]" />
               </div>
               <div>
                 <p className="text-[10px] font-black uppercase tracking-widest">Última Actualización</p>
                 <p className="text-sm font-bold">14 de Abril, 2026</p>
               </div>
             </div>
             <div className="text-[10px] font-black uppercase tracking-[0.3em] text-center md:text-right">
               Validado por el Consejo del Clan Tanuki
             </div>
          </div>
        </div>
      </div>
    </div>
  );

  const terminosContent = [
    { title: "El Pacto de Venta", text: "Al realizar un pedido en nuestra boutique, el usuario acepta que los tesoros (figuras) están sujetos a disponibilidad en el bosque. Nos reservamos el derecho de cancelar cualquier hechizo (transacción) si se detectan anomalías en el flujo de energía." },
    { title: "Los Reinos de Envío", text: "Los envíos se realizan por mensajería externa. El tiempo de viaje es una estimación. Tanuki Den no se hace responsable por tormentas, dragones o retrasos de las transportadoras, pero siempre estaremos listos para ayudar a mediar." },
    { title: "Derecho al Retorno", text: "Si el tesoro llega con su espíritu fragmentado (dañado), el guardián tiene 5 lunas para reportar el suceso. Se requiere evidencia en forma de imagen capturada por un cristal mágico (fotografía) del paquete antes de ser abierto." },
    { title: "Magia del Taller", text: "Los pedidos del Taller Mágico son creaciones únicas a petición. Debido a su naturaleza mística y personalizada, no aceptamos devoluciones una vez que el proceso de forja ha comenzado, a menos que existan defectos de fabricación evidentes." }
  ];

  const privacidadContent = [
    { title: "El Secreto del Clan", text: "Tus datos (nombre, pergamino electrónico y guarida) son sagrados. En el Clan Tanuki, protegemos tu información con hechizos de cifrado que envidiarían los gremios más poderosos. Nunca compartiremos tus secretos con dragones externos." },
    { title: "Cristales de Rastreo (Cookies)", text: "Usamos pequeños cristales de energía llamados 'cookies' para recordar tus preferencias y brindarte una experiencia más mágica en nuestra boutique. Puedes desactivarlos en tu cristal mágico, pero la navegación podría perder algo de brillo." },
    { title: "Uso de la Energía Data", text: "Usamos tu información exclusivamente para enviarte tus tesoros, notificarte sobre nuevas expediciones y asegurarnos de que el Taller Mágico cumpla con tus deseos. Si deseas que borremos tus huellas del clan, solo debes solicitarlo." },
    { title: "Vigilancia de Menores", text: "Los tesoros de nuestra tienda pueden ser disfrutados por todos, pero las transacciones deben ser realizadas por guardianes mayores de edad (18+). No recopilamos energía de pequeños aprendices sin el consentimiento de sus maestros." }
  ];

  const getContent = () => {
    switch (activeSection) {
      case 'rastreo': return renderRastreo();
      case 'faq': return renderFaq();
      case 'terminos': return renderLegal('Términos <span className="text-[#3A332F]/40">Ancestrales.</span>', '#3A332F', terminosContent);
      case 'privacidad': return renderLegal('Privacidad <span className="text-[#3A332F]/40">del Clan.</span>', '#3A332F', privacidadContent);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDF5E6] pt-10 pb-32 md:pb-24">
      <div className="max-w-7xl mx-auto px-6 mb-12">
        <button 
          onClick={onBack}
          className="group flex items-center gap-4 text-[#3A332F] font-ghibli-title uppercase tracking-widest hover:text-[#C14B3A] transition-colors bg-white/50 py-3 px-6 rounded-full border-2 border-[#3A332F]/10 backdrop-blur-sm"
        >
          <div className="w-8 h-8 rounded-full bg-[#3A332F] text-white flex items-center justify-center group-hover:bg-[#C14B3A] transition-colors">
            <ArrowLeft size={16} />
          </div>
          Regresar a la Aldea
        </button>
      </div>

      <div className="section-reveal">
        {getContent()}
      </div>
    </div>
  );
};

export default SupportPages;
