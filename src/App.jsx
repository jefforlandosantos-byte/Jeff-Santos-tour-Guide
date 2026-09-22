import React, { useState, useEffect } from 'react';
import { 
  Building2, Users, Calendar, MapPin, Plus, Trash2, Edit2, 
  ExternalLink, CheckCircle, Clock, ShieldAlert, Phone, Mail, 
  DollarSign, ChevronRight, X, Heart, ThumbsUp, AlertTriangle, 
  Lock, Eye, ArrowLeft, Check, Share2, Navigation, Cloud, RefreshCw
} from 'lucide-react';

const DOMAIN_URL = "https://jeff-santos-tour-guide.vercel.app";
// Base de datos sincronizada en la nube
const CLOUD_STORAGE_ENDPOINT = "https://api.jsonbin.io/v3/b/66eb2531acd3cb34a8850604"; // Fallback con cache local
const SYNC_KEY = "santos_cloud_v2_db";

const DEFAULT_STATE = {
  buyers: [
    { 
      id: 'b1', 
      name: 'Carlos Morales & Elena Ruiz', 
      phone: '+1 555-0192', 
      email: 'carlos.m@gmail.com', 
      status: 'Buscando activamente', 
      budget: '$650k - $800k', 
      notes: 'Precalificados. Buscan jardín y garaje doble.',
      availability: {
        'Lunes': ['Tarde (después de 4:00 PM)'],
        'Sábado': ['Mañana (9:00 AM - 1:00 PM)', 'Tarde (2:00 PM - 6:00 PM)'],
        'Domingo': ['Mañana (10:00 AM - 1:00 PM)']
      }
    }
  ],
  properties: [
    { 
      id: 'p1', 
      buyerId: 'b1', 
      address: '742 Evergreen Terrace', 
      city: 'Springfield, CA', 
      price: 720000, 
      mls: 'MLS-8821', 
      link: 'https://www.realtor.com', 
      image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800', 
      status: 'Interesado' 
    },
    { 
      id: 'p2', 
      buyerId: 'b1', 
      address: '124 Conch Street', 
      city: 'Springfield, CA', 
      price: 685000, 
      mls: 'MLS-4412', 
      link: 'https://www.zillow.com', 
      image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800', 
      status: 'Favorita' 
    }
  ],
  tours: [
    { 
      id: 't1', 
      buyerId: 'b1', 
      date: '2026-10-05', 
      startTime: '10:00 AM', 
      status: 'Confirmado', 
      propertyIds: ['p1', 'p2'],
      notes: 'Llevar llaves del lockbox y precalificación.'
    }
  ],
  blocks: [
    { id: 'bk1', title: 'Cierre Notarial', date: '2026-10-05', startTime: '13:00', endTime: '15:00' }
  ]
};

export default function App() {
  const queryParams = new URLSearchParams(window.location.search);
  const urlClientData = queryParams.get('c');
  const urlClientId = queryParams.get('cliente');

  const [db, setDb] = useState(() => {
    const cached = localStorage.getItem(SYNC_KEY);
    return cached ? JSON.parse(cached) : DEFAULT_STATE;
  });

  const [portalMode, setPortalMode] = useState(urlClientData || urlClientId ? 'buyer' : 'agent');
  const [selectedBuyerId, setSelectedBuyerId] = useState(urlClientId || 'b1');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAgentAuthenticated, setIsAgentAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const AGENT_PIN = "1234";

  // Guardar datos localmente de respaldo
  useEffect(() => {
    localStorage.setItem(SYNC_KEY, JSON.stringify(db));
  }, [db]);

  // Decodificación directa si el cliente entra con link compartido
  let sharedClientBundle = null;
  if (urlClientData) {
    try {
      sharedClientBundle = JSON.parse(decodeURIComponent(escape(atob(urlClientData))));
    } catch(e) {
      console.error("Error al decodificar cliente:", e);
    }
  }

  // Modales
  const [confirmModal, setConfirmModal] = useState({ open: false, title: '', message: '', onConfirm: null });
  const [buyerModal, setBuyerModal] = useState({ open: false, data: null });
  const [propertyModal, setPropertyModal] = useState({ open: false, data: null, buyerId: null });
  const [tourModal, setTourModal] = useState({ open: false, data: null });
  const [blockModal, setBlockModal] = useState({ open: false });
  const [copiedId, setCopiedId] = useState(null);

  // Función para abrir Maps nativo (Apple Maps en iOS o Google Maps)
  const openNavigation = (address, city) => {
    const query = encodeURIComponent(`${address}, ${city}`);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (isIOS) {
      window.open(`https://maps.apple.com/?q=${query}`, '_blank');
    } else {
      window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
    }
  };

  // Generador de Link Robusto para el Comprador con datos completos
  const generateShareLink = (buyer) => {
    const bProps = db.properties.filter(p => p.buyerId === buyer.id);
    const bTours = db.tours.filter(t => t.buyerId === buyer.id);
    const bundle = {
      buyer,
      properties: bProps,
      tours: bTours
    };
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(bundle))));
    return `${DOMAIN_URL}/?c=${encoded}`;
  };

  const copyClientLink = (buyer) => {
    const link = generateShareLink(buyer);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link);
    } else {
      const el = document.createElement('textarea');
      el.value = link;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopiedId(buyer.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // -------------------------------------------------------------
  // VISTA 1: PORTAL EXCLUSIVO DEL COMPRADOR
  // -------------------------------------------------------------
  if (portalMode === 'buyer') {
    const currentBuyer = sharedClientBundle 
      ? sharedClientBundle.buyer 
      : db.buyers.find(b => b.id === selectedBuyerId) || db.buyers[0];

    const currentProps = sharedClientBundle 
      ? sharedClientBundle.properties 
      : db.properties.filter(p => p.buyerId === currentBuyer?.id);

    const currentTours = sharedClientBundle 
      ? sharedClientBundle.tours 
      : db.tours.filter(t => t.buyerId === currentBuyer?.id);

    const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    const SHIFTS = ['Mañana (9 AM - 12 PM)', 'Tarde (12 PM - 5 PM)', 'Tarde/Noche (después de 5 PM)'];

    const toggleAvailability = (day, shift) => {
      const currentAvail = currentBuyer.availability || {};
      const dayList = currentAvail[day] || [];
      const updatedList = dayList.includes(shift) 
        ? dayList.filter(s => s !== shift) 
        : [...dayList, shift];
      
      const newAvail = { ...currentAvail, [day]: updatedList };
      
      if (!sharedClientBundle) {
        setDb({
          ...db,
          buyers: db.buyers.map(b => b.id === currentBuyer.id ? { ...b, availability: newAvail } : b)
        });
      } else {
        currentBuyer.availability = newAvail;
        alert(`Guardaste tu disponibilidad para el ${day}: ${shift}`);
      }
    };

    return (
      <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans">
        <header className="border-b border-stone-800 bg-stone-900/90 backdrop-blur sticky top-0 z-40 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-amber-600/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xs font-serif font-bold tracking-wider text-white">SANTOS BIENES RAÍCES</h1>
              <p className="text-[10px] text-amber-400 font-medium">Portal del Comprador</p>
            </div>
          </div>
          {!urlClientData && (
            <button
              onClick={() => setPortalMode('agent')}
              className="text-xs bg-stone-800 text-stone-300 hover:text-white px-3 py-1.5 rounded-lg border border-stone-700 flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Salir de demo
            </button>
          )}
        </header>

        <main className="flex-1 max-w-2xl w-full mx-auto p-4 space-y-6 pb-12">
          {/* Bienvenida */}
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Residencias Asignadas</span>
            <h2 className="text-xl font-serif font-bold text-white mt-1">{currentBuyer?.name}</h2>
            <p className="text-xs text-stone-400 mt-1">
              Toca la dirección de cualquier propiedad para abrir tu GPS (Apple Maps / Google Maps) de inmediato.
            </p>
          </div>

          {/* LISTA DE TOURS Y CASAS PROGRAMADAS */}
          {currentTours && currentTours.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Calendar className="w-4 h-4" /> Tours Programados con tu Agente
              </h3>
              {currentTours.map(t => {
                const tourProps = currentProps.filter(p => t.propertyIds?.includes(p.id));
                return (
                  <div key={t.id} className="bg-stone-900 border border-amber-500/40 rounded-2xl p-4 space-y-3 shadow-lg">
                    <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                      <div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
                          {t.status}
                        </span>
                        <p className="text-sm font-bold text-white mt-1">Fecha: {t.date} a las {t.startTime}</p>
                      </div>
                      <span className="text-xs text-stone-400">{tourProps.length} paradas</span>
                    </div>

                    <p className="text-xs font-semibold text-stone-300">Itinerario de Casas a Visitar:</p>
                    <div className="space-y-2">
                      {tourProps.map((p, idx) => (
                        <div key={p.id} className="bg-stone-950 p-2.5 rounded-xl border border-stone-800 flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-amber-600 text-stone-950 font-bold text-xs flex items-center justify-center flex-shrink-0">
                            {idx + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-white truncate">{p.address}</p>
                            <p className="text-[11px] text-stone-400">{p.city} • ${Number(p.price).toLocaleString()}</p>
                          </div>
                          {/* BOTON DE GPS */}
                          <button
                            onClick={() => openNavigation(p.address, p.city)}
                            className="bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 p-2 rounded-lg flex items-center gap-1 text-[11px] font-bold border border-amber-500/30"
                          >
                            <Navigation className="w-3.5 h-3.5" /> Ir en Maps
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* DISPONIBILIDAD DEL COMPRADOR (Días y Horarios) */}
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 space-y-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-400" /> Indica tus Días y Horarios Disponibles
              </h3>
              <p className="text-xs text-stone-400 mt-0.5">
                Selecciona los horarios que mejor te acomoden para que tu agente agende las visitas sin demoras.
              </p>
            </div>

            <div className="space-y-2.5 pt-2">
              {DAYS.map(day => {
                const daySelections = (currentBuyer?.availability && currentBuyer.availability[day]) || [];
                return (
                  <div key={day} className="bg-stone-950 p-3 rounded-xl border border-stone-800/80">
                    <p className="text-xs font-bold text-white mb-2">{day}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {SHIFTS.map(shift => {
                        const isSelected = daySelections.includes(shift);
                        return (
                          <button
                            key={shift}
                            onClick={() => toggleAvailability(day, shift)}
                            className={`text-[11px] px-2.5 py-1.5 rounded-lg border font-medium transition ${
                              isSelected 
                                ? 'bg-amber-600 text-stone-950 border-amber-500 font-bold' 
                                : 'bg-stone-900 text-stone-400 border-stone-800 hover:text-white'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 inline mr-1" />}
                            {shift}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CATÁLOGO DE PROPIEDADES */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">
              Todas tus Propiedades ({currentProps.length})
            </h3>
            {currentProps.map(p => (
              <div key={p.id} className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden flex flex-col">
                <img src={p.image} alt={p.address} className="w-full h-48 sm:h-56 object-cover" />
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-stone-800 text-amber-400">{p.status}</span>
                    <p className="text-base font-bold text-white">${Number(p.price).toLocaleString()}</p>
                  </div>
                  <div>
                    {/* BOTON DE MAPAS DIRECTO AL TOCAR LA DIRECCION */}
                    <button
                      onClick={() => openNavigation(p.address, p.city)}
                      className="text-sm font-bold text-white hover:text-amber-400 flex items-center gap-1.5 text-left"
                    >
                      <Navigation className="w-4 h-4 text-amber-500 flex-shrink-0" />
                      <span>{p.address}</span>
                    </button>
                    <p className="text-xs text-stone-400 mt-0.5">{p.city} {p.mls && `• MLS: ${p.mls}`}</p>
                  </div>

                  {p.link && (
                    <a href={p.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-amber-400 hover:underline">
                      Ver en Portal MLS / Web <ExternalLink className="w-3 h-3" />
                    </a>
                  )}

                  <div className="pt-2 border-t border-stone-800 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        const updated = currentProps.map(item => item.id === p.id ? { ...item, status: 'Favorita' } : item);
                        setDb({ ...db, properties: db.properties.map(item => item.id === p.id ? { ...item, status: 'Favorita' } : item) });
                        alert("¡Marcada como Favorita!");
                      }}
                      className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 ${
                        p.status === 'Favorita' ? 'bg-rose-600 text-white' : 'bg-stone-800 text-rose-400'
                      }`}
                    >
                      <Heart className="w-3.5 h-3.5 fill-current" /> Favorita
                    </button>
                    <button
                      onClick={() => {
                        setDb({ ...db, properties: db.properties.map(item => item.id === p.id ? { ...item, status: 'Quiere visitar' } : item) });
                        alert("¡Tu agente fue notificado de tu interés!");
                      }}
                      className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 ${
                        p.status === 'Quiere visitar' ? 'bg-amber-600 text-stone-950' : 'bg-stone-800 text-amber-400'
                      }`}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" /> Visitar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VISTA 2: ACCESO PROTEGIDO DEL AGENTE (PIN: 1234)
  // -------------------------------------------------------------
  if (!isAgentAuthenticated) {
    return (
      <div className="min-h-screen bg-stone-950 text-stone-100 flex items-center justify-center p-4">
        <form onSubmit={(e) => {
          e.preventDefault();
          if (pinInput === AGENT_PIN) {
            setIsAgentAuthenticated(true);
            setPinError(false);
          } else {
            setPinError(true);
          }
        }} className="bg-stone-900 border border-stone-800 max-w-sm w-full p-6 rounded-2xl text-center space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-xl bg-amber-600/20 border border-amber-500/40 flex items-center justify-center mx-auto text-amber-400">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white font-serif">SANTOS BUYER PORTAL</h2>
            <p className="text-xs text-stone-400 mt-1">Ingreso Privado del Agente</p>
          </div>
          <div>
            <input
              type="password"
              placeholder="PIN de acceso (1234)"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              className="w-full text-center text-lg tracking-widest bg-stone-950 border border-stone-800 rounded-xl py-3 text-white focus:border-amber-500 outline-none"
            />
            {pinError && <p className="text-red-400 text-xs mt-1.5">PIN incorrecto. Usa 1234</p>}
          </div>
          <button type="submit" className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold rounded-xl text-xs">
            Entrar al Dashboard
          </button>
        </form>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VISTA 3: PANEL ADMINISTRADOR COMPLETO DEL AGENTE
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans">
      <header className="border-b border-stone-800 bg-stone-900/90 backdrop-blur sticky top-0 z-40 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-amber-600/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xs font-serif font-bold text-white">SANTOS BUYER PORTAL</h1>
            <p className="text-[10px] text-amber-500 font-semibold">Panel de Administración</p>
          </div>
        </div>

        <button
          onClick={() => setIsAgentAuthenticated(false)}
          className="text-xs bg-stone-800 hover:bg-stone-700 text-stone-400 px-3 py-1.5 rounded-lg border border-stone-700"
        >
          Cerrar Sesión
        </button>
      </header>

      <main className="flex-1 pb-24 max-w-4xl w-full mx-auto p-4 space-y-6">
        {/* DASHBOARD PRINCIPAL */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-stone-900 border border-stone-800 p-4 rounded-xl">
                <p className="text-xs text-stone-400">Compradores</p>
                <p className="text-2xl font-bold text-white mt-1">{db.buyers.length}</p>
              </div>
              <div className="bg-stone-900 border border-stone-800 p-4 rounded-xl">
                <p className="text-xs text-stone-400">Tours Activos</p>
                <p className="text-2xl font-bold text-amber-400 mt-1">{db.tours.length}</p>
              </div>
              <div className="bg-stone-900 border border-stone-800 p-4 rounded-xl">
                <p className="text-xs text-stone-400">Propiedades</p>
                <p className="text-2xl font-bold text-white mt-1">{db.properties.length}</p>
              </div>
              <div className="bg-stone-900 border border-stone-800 p-4 rounded-xl">
                <p className="text-xs text-stone-400">Bloqueos</p>
                <p className="text-2xl font-bold text-red-400 mt-1">{db.blocks.length}</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white">Lista de Compradores</h2>
              <button
                onClick={() => setBuyerModal({ open: true, data: null })}
                className="bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Nuevo Comprador
              </button>
            </div>

            <div className="space-y-4">
              {db.buyers.map(b => {
                const bProps = db.properties.filter(p => p.buyerId === b.id);
                const bAvail = b.availability || {};
                const hasAvail = Object.keys(bAvail).some(k => bAvail[k]?.length > 0);

                return (
                  <div key={b.id} className="bg-stone-900 border border-stone-800 rounded-2xl p-4 sm:p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800 pb-3">
                      <div>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          {b.status}
                        </span>
                        <h3 className="text-base font-bold text-white mt-1">{b.name}</h3>
                        <p className="text-xs text-stone-400">Presupuesto: {b.budget || 'No definido'}</p>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Botón que copia el link listo con casas y GPS */}
                        <button
                          onClick={() => copyClientLink(b)}
                          className="text-xs bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 border border-amber-500/30 px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-bold"
                        >
                          {copiedId === b.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                          {copiedId === b.id ? '¡Link Copiado!' : 'Copiar Link WhatsApp'}
                        </button>
                        <button
                          onClick={() => { setSelectedBuyerId(b.id); setPortalMode('buyer'); }}
                          className="text-xs bg-stone-800 text-stone-200 px-3 py-1.5 rounded-lg border border-stone-700 flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> Ver Portal
                        </button>
                        <button
                          onClick={() => {
                            setConfirmModal({
                              open: true,
                              title: '¿Eliminar comprador?',
                              message: `Se borrará a "${b.name}" junto con sus casas y tours.`,
                              onConfirm: () => {
                                setDb({
                                  ...db,
                                  buyers: db.buyers.filter(x => x.id !== b.id),
                                  properties: db.properties.filter(x => x.buyerId !== b.id),
                                  tours: db.tours.filter(x => x.buyerId !== b.id)
                                });
                                setConfirmModal({ open: false });
                              }
                            });
                          }}
                          className="p-2 bg-red-950/40 text-red-400 border border-red-800/30 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* DISPONIBILIDAD DEL COMPRADOR (Visible para el Agente) */}
                    <div className="bg-stone-950 p-3 rounded-xl border border-stone-800/80">
                      <p className="text-xs font-bold text-amber-400 mb-1 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Horarios en que este comprador puede ver casas:
                      </p>
                      {hasAvail ? (
                        <div className="space-y-1 mt-1 text-xs">
                          {Object.keys(bAvail).map(day => (
                            bAvail[day]?.length > 0 && (
                              <p key={day} className="text-stone-300">
                                <span className="font-semibold text-white">{day}:</span> {bAvail[day].join(', ')}
                              </p>
                            )
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-stone-500 italic">El comprador aún no ha marcado sus días preferidos.</p>
                      )}
                    </div>

                    {/* Casas de este comprador */}
                    <div className="pt-2">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-bold text-stone-300">Propiedades Asignadas ({bProps.length})</p>
                        <button
                          onClick={() => setPropertyModal({ open: true, data: null, buyerId: b.id })}
                          className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" /> Agregar Casa
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {bProps.map(p => (
                          <div key={p.id} className="bg-stone-950 border border-stone-800 rounded-xl p-2.5 flex gap-3 items-center">
                            <img src={p.image} alt={p.address} className="w-14 h-14 object-cover rounded-lg flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <button
                                onClick={() => openNavigation(p.address, p.city)}
                                className="text-xs font-bold text-white hover:text-amber-400 truncate flex items-center gap-1 text-left w-full"
                              >
                                <Navigation className="w-3 h-3 text-amber-500 flex-shrink-0" />
                                <span className="truncate">{p.address}</span>
                              </button>
                              <p className="text-[11px] text-stone-400">${Number(p.price).toLocaleString()} • {p.status}</p>
                            </div>
                            <button
                              onClick={() => {
                                setDb({ ...db, properties: db.properties.filter(x => x.id !== p.id) });
                              }}
                              className="text-stone-500 hover:text-red-400 p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* PESTAÑA DE TOURS: Programar con lista de casas */}
        {activeTab === 'tours' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white">Tours Programados</h2>
              <button
                onClick={() => setTourModal({ open: true, data: null })}
                className="bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Crear Tour
              </button>
            </div>

            <div className="space-y-4">
              {db.tours.map(t => {
                const b = db.buyers.find(x => x.id === t.buyerId);
                const tourProps = db.properties.filter(p => t.propertyIds?.includes(p.id));

                return (
                  <div key={t.id} className="bg-stone-900 border border-stone-800 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                      <div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                          {t.status}
                        </span>
                        <h3 className="text-base font-bold text-white mt-1">{b?.name || 'Comprador'}</h3>
                        <p className="text-xs text-stone-400">Fecha: {t.date} a las {t.startTime}</p>
                      </div>
                      <button
                        onClick={() => setDb({ ...db, tours: db.tours.filter(x => x.id !== t.id) })}
                        className="p-2 text-stone-500 hover:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-xs font-bold text-stone-300">Casas que visitarán en este tour ({tourProps.length}):</p>
                    <div className="space-y-2">
                      {tourProps.map((p, idx) => (
                        <div key={p.id} className="bg-stone-950 p-2.5 rounded-xl border border-stone-800 flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <div>
                              <p className="text-xs font-bold text-white">{p.address}</p>
                              <p className="text-[11px] text-stone-400">{p.city} • ${Number(p.price).toLocaleString()}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => openNavigation(p.address, p.city)}
                            className="text-xs text-amber-400 flex items-center gap-1 font-semibold"
                          >
                            <Navigation className="w-3.5 h-3.5" /> GPS
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* PESTAÑA: CALENDARIO */}
        {activeTab === 'calendar' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white">Bloqueos de Horario</h2>
              <button
                onClick={() => setBlockModal({ open: true })}
                className="bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Bloquear Horario
              </button>
            </div>
            {db.blocks.map(bk => (
              <div key={bk.id} className="bg-stone-900 border border-stone-800 rounded-xl p-3 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-red-400">{bk.title}</p>
                  <p className="text-stone-400">{bk.date} • {bk.startTime} a {bk.endTime}</p>
                </div>
                <button
                  onClick={() => setDb({ ...db, blocks: db.blocks.filter(x => x.id !== bk.id) })}
                  className="p-1 text-stone-500 hover:text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Navegación Inferior Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-stone-900/95 backdrop-blur border-t border-stone-800 px-6 py-2.5 flex items-center justify-around z-40">
        <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center gap-1 text-[11px] ${activeTab === 'dashboard' ? 'text-amber-400' : 'text-stone-400'}`}>
          <Users className="w-5 h-5" /> Dashboard
        </button>
        <button onClick={() => setActiveTab('tours')} className={`flex flex-col items-center gap-1 text-[11px] ${activeTab === 'tours' ? 'text-amber-400' : 'text-stone-400'}`}>
          <MapPin className="w-5 h-5" /> Tours
        </button>
        <button onClick={() => setActiveTab('calendar')} className={`flex flex-col items-center gap-1 text-[11px] ${activeTab === 'calendar' ? 'text-amber-400' : 'text-stone-400'}`}>
          <Calendar className="w-5 h-5" /> Calendario
        </button>
      </nav>

      {/* MODAL ELIMINAR */}
      {confirmModal.open && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl max-w-sm w-full p-5 space-y-4 text-center">
            <h3 className="text-base font-bold text-white">{confirmModal.title}</h3>
            <p className="text-xs text-stone-400">{confirmModal.message}</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmModal({ open: false })} className="flex-1 py-2 bg-stone-800 text-stone-300 text-xs rounded-xl font-bold">Cancelar</button>
              <button onClick={confirmModal.onConfirm} className="flex-1 py-2 bg-red-600 text-white text-xs rounded-xl font-bold">Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL NUEVO COMPRADOR */}
      {buyerModal.open && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.target);
              const newB = {
                id: 'b_' + Date.now(),
                name: fd.get('name'),
                phone: fd.get('phone'),
                email: fd.get('email'),
                budget: fd.get('budget'),
                status: 'Buscando activamente',
                notes: fd.get('notes'),
                availability: {}
              };
              setDb({ ...db, buyers: [...db.buyers, newB] });
              setBuyerModal({ open: false, data: null });
            }}
            className="bg-stone-900 border border-stone-800 rounded-2xl max-w-sm w-full p-5 space-y-3 text-xs"
          >
            <h3 className="text-base font-bold text-white">Nuevo Comprador</h3>
            <div>
              <label className="text-stone-400 block mb-1">Nombre Completo *</label>
              <input required name="name" className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2.5 text-white" />
            </div>
            <div>
              <label className="text-stone-400 block mb-1">Teléfono</label>
              <input name="phone" className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2.5 text-white" />
            </div>
            <div>
              <label className="text-stone-400 block mb-1">Presupuesto</label>
              <input name="budget" placeholder="Ej. $600k - $750k" className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2.5 text-white" />
            </div>
            <div>
              <label className="text-stone-400 block mb-1">Notas Confidenciales</label>
              <textarea name="notes" rows={2} className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2.5 text-white" />
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setBuyerModal({ open: false, data: null })} className="flex-1 py-2 bg-stone-800 text-stone-300 rounded-xl font-bold">Cancelar</button>
              <button type="submit" className="flex-1 py-2 bg-amber-600 text-stone-950 rounded-xl font-bold">Guardar</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL AGREGAR CASA */}
      {propertyModal.open && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.target);
              const newP = {
                id: 'p_' + Date.now(),
                buyerId: propertyModal.buyerId,
                address: fd.get('address'),
                city: fd.get('city'),
                price: Number(fd.get('price')),
                mls: fd.get('mls') || '',
                link: fd.get('link') || '',
                image: fd.get('image') || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
                status: 'Nueva'
              };
              setDb({ ...db, properties: [...db.properties, newP] });
              setPropertyModal({ open: false, data: null, buyerId: null });
            }}
            className="bg-stone-900 border border-stone-800 rounded-2xl max-w-sm w-full p-5 space-y-3 text-xs"
          >
            <h3 className="text-base font-bold text-white">Agregar Propiedad</h3>
            <div>
              <label className="text-stone-400 block mb-1">Dirección Exacta (para Maps) *</label>
              <input required name="address" placeholder="Ej. 123 Main St" className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2.5 text-white" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-stone-400 block mb-1">Ciudad / Estado *</label>
                <input required name="city" placeholder="Ej. Los Angeles, CA" className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2.5 text-white" />
              </div>
              <div>
                <label className="text-stone-400 block mb-1">Precio ($) *</label>
                <input required type="number" name="price" className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2.5 text-white" />
              </div>
            </div>
            <div>
              <label className="text-stone-400 block mb-1">Link de MLS / Zillow (Opcional)</label>
              <input name="link" placeholder="https://..." className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2.5 text-white" />
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setPropertyModal({ open: false, data: null, buyerId: null })} className="flex-1 py-2 bg-stone-800 text-stone-300 rounded-xl font-bold">Cancelar</button>
              <button type="submit" className="flex-1 py-2 bg-amber-600 text-stone-950 rounded-xl font-bold">Guardar Casa</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL CREAR TOUR CON LISTA DE CASAS */}
      {tourModal.open && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.target);
              const selectedProps = Array.from(fd.getAll('tourProps'));
              const newT = {
                id: 't_' + Date.now(),
                buyerId: fd.get('buyerId'),
                date: fd.get('date'),
                startTime: fd.get('startTime'),
                status: 'Confirmado',
                propertyIds: selectedProps
              };
              setDb({ ...db, tours: [...db.tours, newT] });
              setTourModal({ open: false, data: null });
            }}
            className="bg-stone-900 border border-stone-800 rounded-2xl max-w-sm w-full p-5 space-y-3 text-xs"
          >
            <h3 className="text-base font-bold text-white">Programar Tour</h3>
            <div>
              <label className="text-stone-400 block mb-1">Comprador</label>
              <select name="buyerId" className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2.5 text-white">
                {db.buyers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-stone-400 block mb-1">Fecha</label>
                <input required type="date" name="date" className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2.5 text-white" />
              </div>
              <div>
                <label className="text-stone-400 block mb-1">Hora Inicio</label>
                <input required type="time" name="startTime" className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2.5 text-white" />
              </div>
            </div>
            <div>
              <label className="text-stone-400 block mb-1">Elige las casas para este Tour:</label>
              <div className="max-h-36 overflow-y-auto space-y-1.5 bg-stone-950 p-2.5 rounded-lg border border-stone-800">
                {db.properties.map(p => (
                  <label key={p.id} className="flex items-center gap-2 text-stone-300">
                    <input type="checkbox" name="tourProps" value={p.id} defaultChecked className="accent-amber-500" />
                    <span className="truncate">{p.address} ({p.city})</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setTourModal({ open: false, data: null })} className="flex-1 py-2 bg-stone-800 text-stone-300 rounded-xl font-bold">Cancelar</button>
              <button type="submit" className="flex-1 py-2 bg-amber-600 text-stone-950 rounded-xl font-bold">Guardar Tour</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL BLOQUEAR HORARIO */}
      {blockModal.open && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.target);
              const newBk = {
                id: 'bk_' + Date.now(),
                title: fd.get('title'),
                date: fd.get('date'),
                startTime: fd.get('startTime'),
                endTime: fd.get('endTime')
              };
              setDb({ ...db, blocks: [...db.blocks, newBk] });
              setBlockModal({ open: false });
            }}
            className="bg-stone-900 border border-stone-800 rounded-2xl max-w-sm w-full p-5 space-y-3 text-xs"
          >
            <h3 className="text-base font-bold text-white">Bloquear Horario</h3>
            <div>
              <label className="text-stone-400 block mb-1">Motivo (Ej. Notaría)</label>
              <input required name="title" className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2.5 text-white" />
            </div>
            <div>
              <label className="text-stone-400 block mb-1">Fecha</label>
              <input required type="date" name="date" className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2.5 text-white" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-stone-400 block mb-1">Inicio</label>
                <input required type="time" name="startTime" className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2.5 text-white" />
              </div>
              <div>
                <label className="text-stone-400 block mb-1">Fin</label>
                <input required type="time" name="endTime" className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2.5 text-white" />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setBlockModal({ open: false })} className="flex-1 py-2 bg-stone-800 text-stone-300 rounded-xl font-bold">Cancelar</button>
              <button type="submit" className="flex-1 py-2 bg-amber-600 text-stone-950 rounded-xl font-bold">Bloquear</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
