import React, { useState, useEffect } from 'react';
import { 
  Building2, Users, Calendar, MapPin, Plus, Trash2, Edit2, 
  ExternalLink, CheckCircle, Clock, ShieldAlert, Phone, Mail, 
  DollarSign, ChevronRight, X, Heart, ThumbsUp, AlertTriangle, 
  Lock, Eye, ArrowLeft, Check, Share2, Copy
} from 'lucide-react';

export default function App() {
  // Detección automática por URL: Si tiene ?cliente=ID entra forzosamente como Comprador
  const queryParams = new URLSearchParams(window.location.search);
  const urlBuyerId = queryParams.get('cliente');

  const [portalMode, setPortalMode] = useState(urlBuyerId ? 'buyer' : 'agent');
  const [selectedBuyerId, setSelectedBuyerId] = useState(urlBuyerId || null);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Protección de Agente por PIN
  const [isAgentAuthenticated, setIsAgentAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const AGENT_PIN = "1234"; // Tu clave para administrar

  // Base de datos sincronizada
  const [buyers, setBuyers] = useState(() => {
    const s = localStorage.getItem('santos_buyers');
    return s ? JSON.parse(s) : [
      { id: 'b1', name: 'Carlos Morales & Elena Ruiz', phone: '+1 555-0192', email: 'carlos.m@gmail.com', status: 'Buscando activamente', budget: '$650k - $800k', notes: 'Precalificados. Buscan jardín.' }
    ];
  });

  const [properties, setProperties] = useState(() => {
    const s = localStorage.getItem('santos_props');
    return s ? JSON.parse(s) : [
      { id: 'p1', buyerId: 'b1', address: '742 Evergreen Terrace', city: 'Springfield', price: 720000, mls: 'MLS-8821', link: 'https://ejemplo.com/casa1', image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800', notes: 'Amplia cocina y excelente jardín.', status: 'Nueva' },
      { id: 'p2', buyerId: 'b1', address: '124 Conch Street', city: 'Springfield', price: 685000, mls: 'MLS-4412', link: 'https://ejemplo.com/casa2', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800', notes: 'Piscina privada.', status: 'Interesado' }
    ];
  });

  const [tours, setTours] = useState(() => {
    const s = localStorage.getItem('santos_tours');
    return s ? JSON.parse(s) : [
      { id: 't1', buyerId: 'b1', date: '2026-10-05', startTime: '10:00', status: 'Confirmado', notes: 'Encuentro en primera casa.', propertyIds: ['p1', 'p2'] }
    ];
  });

  const [blocks, setBlocks] = useState(() => {
    const s = localStorage.getItem('santos_blocks');
    return s ? JSON.parse(s) : [
      { id: 'bk1', title: 'Cierre Notarial', date: '2026-10-05', startTime: '13:00', endTime: '15:00' }
    ];
  });

  useEffect(() => { localStorage.setItem('santos_buyers', JSON.stringify(buyers)); }, [buyers]);
  useEffect(() => { localStorage.setItem('santos_props', JSON.stringify(properties)); }, [properties]);
  useEffect(() => { localStorage.setItem('santos_tours', JSON.stringify(tours)); }, [tours]);
  useEffect(() => { localStorage.setItem('santos_blocks', JSON.stringify(blocks)); }, [blocks]);

  // Modales
  const [confirmModal, setConfirmModal] = useState({ open: false, title: '', message: '', onConfirm: null });
  const [buyerModal, setBuyerModal] = useState({ open: false, data: null });
  const [propertyModal, setPropertyModal] = useState({ open: false, data: null, buyerId: null });
  const [tourModal, setTourModal] = useState({ open: false, data: null });
  const [blockModal, setBlockModal] = useState({ open: false });
  const [copiedId, setCopiedId] = useState(null);

  // Copiar link exclusivo para el cliente
  const copyClientLink = (buyerId) => {
    const link = `${window.location.origin}${window.location.pathname}?cliente=${buyerId}`;
    navigator.clipboard.writeText(link);
    setCopiedId(buyerId);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Validar PIN de Agente
  const handlePinSubmit = (e) => {
    e.preventDefault();
    if (pinInput === AGENT_PIN) {
      setIsAgentAuthenticated(true);
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  // Operaciones CRUD Seguras
  const confirmDeleteBuyer = (buyer) => {
    setConfirmModal({
      open: true,
      title: '¿Seguro que deseas eliminar este comprador?',
      message: `Se eliminará a "${buyer.name}", junto con todas sus propiedades y tours de forma definitiva.`,
      onConfirm: () => {
        setBuyers(buyers.filter(b => b.id !== buyer.id));
        setProperties(properties.filter(p => p.buyerId !== buyer.id));
        setTours(tours.filter(t => t.buyerId !== buyer.id));
        setConfirmModal({ open: false, title: '', message: '', onConfirm: null });
      }
    });
  };

  const confirmDeleteProperty = (prop) => {
    setConfirmModal({
      open: true,
      title: '¿Seguro que deseas eliminar esta propiedad?',
      message: `La propiedad en ${prop.address} se borrará del historial del comprador.`,
      onConfirm: () => {
        setProperties(properties.filter(p => p.id !== prop.id));
        setTours(tours.map(t => ({ ...t, propertyIds: t.propertyIds.filter(id => id !== prop.id) })));
        setConfirmModal({ open: false, title: '', message: '', onConfirm: null });
      }
    });
  };

  // VISTA 1: COMPRADOR AISLADO (Si accede con link de cliente o pulsa Ver Portal)
  if (portalMode === 'buyer') {
    const currentBuyer = buyers.find(b => b.id === selectedBuyerId);
    const buyerProps = properties.filter(p => p.buyerId === selectedBuyerId);
    const buyerTours = tours.filter(t => t.buyerId === selectedBuyerId);

    if (!currentBuyer) {
      return (
        <div className="min-h-screen bg-stone-950 text-white flex flex-col items-center justify-center p-6 text-center">
          <ShieldAlert className="w-12 h-12 text-amber-500 mb-3" />
          <h2 className="text-xl font-bold font-serif">Portal No Encontrado</h2>
          <p className="text-stone-400 text-sm mt-1 max-w-sm">Este enlace de comprador no es válido o fue retirado por el agente.</p>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans">
        <header className="border-b border-stone-800 bg-stone-900/90 backdrop-blur sticky top-0 z-40 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-600/20 border border-amber-500/40 flex items-center justify-center">
              <Building2 className="text-amber-400 w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-serif font-bold tracking-wider text-white">SANTOS BIENES RAÍCES</h1>
              <p className="text-xs text-amber-500 font-medium">Portal Exclusivo</p>
            </div>
          </div>
          {!urlBuyerId && (
            <button
              onClick={() => setPortalMode('agent')}
              className="text-xs bg-stone-800 text-stone-300 hover:text-white px-3 py-1.5 rounded-lg border border-stone-700 flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Salir de vista previa
            </button>
          )}
        </header>

        <main className="flex-1 max-w-3xl w-full mx-auto p-4 sm:p-6 space-y-6">
          {/* Bienvenida al Comprador */}
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-widest">Residencias Seleccionadas</span>
            <h2 className="text-xl font-serif font-bold text-white mt-1">{currentBuyer.name}</h2>
            <p className="text-xs text-stone-400 mt-1">
              Aquí puedes revisar los detalles de cada propiedad y marcar cuáles te interesan o deseas visitar.
            </p>
          </div>

          {/* Tours Agendados para este Comprador */}
          {buyerTours.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider text-stone-400">Tus Tours Programados</h3>
              {buyerTours.map(t => (
                <div key={t.id} className="bg-stone-900 border border-amber-500/40 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {t.status}
                    </span>
                    <p className="text-sm font-bold text-white mt-1.5">Fecha: {t.date} a las {t.startTime}</p>
                    <p className="text-xs text-stone-400">{t.propertyIds.length} propiedades en el itinerario</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Catálogo de Casas del Comprador */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-stone-400 uppercase tracking-wider">Tus Opciones ({buyerProps.length})</h3>
            {buyerProps.length === 0 ? (
              <p className="text-stone-500 text-xs">Tu agente aún está preparando propiedades para tu perfil.</p>
            ) : (
              buyerProps.map(p => (
                <div key={p.id} className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden flex flex-col">
                  <img src={p.image} alt={p.address} className="w-full h-52 sm:h-64 object-cover" />
                  <div className="p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-stone-800 text-amber-400">{p.status}</span>
                      <p className="text-lg font-bold text-white">${p.price.toLocaleString()}</p>
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-white">{p.address}</h4>
                      <p className="text-xs text-stone-400">{p.city} {p.mls && `• MLS: ${p.mls}`}</p>
                    </div>

                    {/* Acciones permitidas al cliente: Solo expresar interés */}
                    <div className="pt-3 border-t border-stone-800 grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          setProperties(properties.map(item => item.id === p.id ? { ...item, status: 'Favorita' } : item));
                        }}
                        className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                          p.status === 'Favorita' ? 'bg-rose-600 text-white' : 'bg-stone-800 hover:bg-stone-700 text-rose-400'
                        }`}
                      >
                        <Heart className="w-4 h-4 fill-current" /> Favorita
                      </button>
                      <button
                        onClick={() => {
                          setProperties(properties.map(item => item.id === p.id ? { ...item, status: 'Quiere visitar' } : item));
                        }}
                        className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                          p.status === 'Quiere visitar' ? 'bg-amber-600 text-stone-950' : 'bg-stone-800 hover:bg-stone-700 text-amber-400'
                        }`}
                      >
                        <ThumbsUp className="w-4 h-4" /> Solicitar Tour
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>
    );
  }

  // VISTA 2: PANTALLA DE ACCESO RESTRINGIDO PARA EL AGENTE
  if (!isAgentAuthenticated) {
    return (
      <div className="min-h-screen bg-stone-950 text-stone-100 flex items-center justify-center p-4">
        <form onSubmit={handlePinSubmit} className="bg-stone-900 border border-stone-800 max-w-sm w-full p-6 rounded-2xl text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-amber-600/20 border border-amber-500/40 flex items-center justify-center mx-auto text-amber-400">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white font-serif">SANTOS BUYER PORTAL</h2>
            <p className="text-xs text-stone-400 mt-1">Panel de Control del Agente</p>
          </div>
          <div>
            <input
              type="password"
              maxLength={6}
              placeholder="Ingresa tu PIN (1234)"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              className="w-full text-center text-lg tracking-widest bg-stone-950 border border-stone-800 rounded-xl py-3 text-white focus:border-amber-500 outline-none"
            />
            {pinError && <p className="text-red-400 text-xs mt-1.5 font-medium">PIN incorrecto. (Usa 1234)</p>}
          </div>
          <button type="submit" className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold rounded-xl text-xs">
            Ingresar al Dashboard
          </button>
        </form>
      </div>
    );
  }

  // VISTA 3: DASHBOARD ADMINISTRADOR DEL AGENTE
  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans">
      <header className="border-b border-stone-800 bg-stone-900/90 backdrop-blur sticky top-0 z-40 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-600/20 border border-amber-500/40 flex items-center justify-center">
            <Building2 className="text-amber-400 w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-serif font-bold text-white">SANTOS BUYER PORTAL</h1>
            <p className="text-xs text-amber-500 font-semibold">Panel de Administración</p>
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
        {/* Métricas rápidas */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-stone-900 border border-stone-800 p-4 rounded-xl">
                <p className="text-xs text-stone-400">Compradores</p>
                <p className="text-2xl font-bold text-white mt-1">{buyers.length}</p>
              </div>
              <div className="bg-stone-900 border border-stone-800 p-4 rounded-xl">
                <p className="text-xs text-stone-400">Tours Activos</p>
                <p className="text-2xl font-bold text-amber-400 mt-1">{tours.filter(t => t.status === 'Confirmado').length}</p>
              </div>
              <div className="bg-stone-900 border border-stone-800 p-4 rounded-xl">
                <p className="text-xs text-stone-400">Pendientes</p>
                <p className="text-2xl font-bold text-amber-500 mt-1">{tours.filter(t => t.status === 'Pendiente').length}</p>
              </div>
              <div className="bg-stone-900 border border-stone-800 p-4 rounded-xl">
                <p className="text-xs text-stone-400">Completados</p>
                <p className="text-2xl font-bold text-emerald-400 mt-1">{tours.filter(t => t.status === 'Visitado').length}</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Compradores Registrados</h2>
              <button
                onClick={() => setBuyerModal({ open: true, data: null })}
                className="bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Nuevo Comprador
              </button>
            </div>

            {/* Lista de Compradores */}
            <div className="space-y-4">
              {buyers.map(b => {
                const bProps = properties.filter(p => p.buyerId === b.id);
                return (
                  <div key={b.id} className="bg-stone-900 border border-stone-800 rounded-2xl p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800 pb-3">
                      <div>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          {b.status}
                        </span>
                        <h3 className="text-base font-bold text-white mt-1">{b.name}</h3>
                        <p className="text-xs text-stone-400">Presupuesto: {b.budget || 'Sin definir'}</p>
                      </div>

                      {/* Botones de acción del agente */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Enlace para el Cliente */}
                        <button
                          onClick={() => copyClientLink(b.id)}
                          className="text-xs bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 border border-amber-500/30 px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-semibold"
                        >
                          {copiedId === b.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                          {copiedId === b.id ? '¡Link Copiado!' : 'Copiar Link Cliente'}
                        </button>
                        <button
                          onClick={() => { setSelectedBuyerId(b.id); setPortalMode('buyer'); }}
                          className="text-xs bg-stone-800 hover:bg-stone-700 text-stone-200 px-3 py-1.5 rounded-lg border border-stone-700 flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> Previsualizar
                        </button>
                        <button onClick={() => setBuyerModal({ open: true, data: b })} className="p-2 bg-stone-800 text-stone-300 rounded-lg">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => confirmDeleteBuyer(b)} className="p-2 bg-red-950/40 text-red-400 border border-red-800/30 rounded-lg">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="text-xs text-stone-400 space-y-1">
                      <p><span className="text-stone-500">Tel:</span> {b.phone} | <span className="text-stone-500">Email:</span> {b.email}</p>
                      {b.notes && <p className="italic text-stone-400"><span className="text-stone-500 not-italic">Notas confidenciales:</span> {b.notes}</p>}
                    </div>

                    {/* Sección de Casas de este Comprador */}
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

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {bProps.map(p => (
                          <div key={p.id} className="bg-stone-950 border border-stone-800 rounded-xl p-2.5 flex gap-3">
                            <img src={p.image} alt={p.address} className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />
                            <div className="flex-1 min-w-0 flex flex-col justify-between">
                              <div>
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] uppercase font-bold text-amber-400">{p.status}</span>
                                  <button onClick={() => confirmDeleteProperty(p)} className="text-stone-500 hover:text-red-400">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                <p className="text-xs font-bold text-white truncate">{p.address}</p>
                                <p className="text-[11px] text-stone-400">${p.price.toLocaleString()}</p>
                              </div>
                            </div>
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

        {/* Pestaña: Tours */}
        {activeTab === 'tours' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Tours Programados</h2>
              <button
                onClick={() => setTourModal({ open: true, data: null })}
                className="bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Crear Tour
              </button>
            </div>
            {tours.map(t => {
              const b = buyers.find(buyer => buyer.id === t.buyerId);
              const tourProps = properties.filter(p => t.propertyIds.includes(p.id));
              return (
                <div key={t.id} className="bg-stone-900 border border-stone-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-amber-400">{t.status}</span>
                      <h4 className="text-base font-bold text-white">{b?.name}</h4>
                      <p className="text-xs text-stone-400">{t.date} a las {t.startTime}</p>
                    </div>
                    <button
                      onClick={() => setTours(tours.filter(item => item.id !== t.id))}
                      className="p-2 text-stone-500 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-1">
                    {tourProps.map((p, idx) => (
                      <div key={p.id} className="bg-stone-950 p-2 rounded-lg text-xs flex items-center justify-between">
                        <span>{idx + 1}. {p.address}</span>
                        <button
                          onClick={() => {
                            setTours(tours.map(tour => tour.id === t.id ? { ...tour, propertyIds: tour.propertyIds.filter(id => id !== p.id) } : tour));
                          }}
                          className="text-stone-500 hover:text-red-400"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pestaña: Calendario */}
        {activeTab === 'calendar' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Mi Calendario y Bloqueos</h2>
              <button
                onClick={() => setBlockModal({ open: true })}
                className="bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Bloquear Horario
              </button>
            </div>
            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 space-y-2">
              {blocks.map(b => (
                <div key={b.id} className="bg-stone-950 p-3 rounded-xl border border-stone-800 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-red-400">{b.title}</p>
                    <p className="text-stone-400">{b.date} • {b.startTime} a {b.endTime}</p>
                  </div>
                  <button onClick={() => setBlocks(blocks.filter(item => item.id !== b.id))} className="text-stone-500 hover:text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Barra de Navegación del Agente */}
      <nav className="fixed bottom-0 left-0 right-0 bg-stone-900/95 backdrop-blur border-t border-stone-800 px-6 py-2.5 flex items-center justify-around z-40">
        <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center gap-1 text-[11px] font-medium ${activeTab === 'dashboard' ? 'text-amber-400' : 'text-stone-400'}`}>
          <Users className="w-5 h-5" /> Dashboard
        </button>
        <button onClick={() => setActiveTab('tours')} className={`flex flex-col items-center gap-1 text-[11px] font-medium ${activeTab === 'tours' ? 'text-amber-400' : 'text-stone-400'}`}>
          <MapPin className="w-5 h-5" /> Tours
        </button>
        <button onClick={() => setActiveTab('calendar')} className={`flex flex-col items-center gap-1 text-[11px] font-medium ${activeTab === 'calendar' ? 'text-amber-400' : 'text-stone-400'}`}>
          <Calendar className="w-5 h-5" /> Calendario
        </button>
      </nav>

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
      {confirmModal.open && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl max-w-sm w-full p-5 space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-950/60 border border-red-800/40 text-red-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-white">{confirmModal.title}</h3>
              <p className="text-xs text-stone-400 mt-1">{confirmModal.message}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setConfirmModal({ open: false, title: '', message: '', onConfirm: null })} className="flex-1 py-2 bg-stone-800 text-stone-300 text-xs rounded-xl font-bold">
                Cancelar
              </button>
              <button onClick={confirmModal.onConfirm} className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white text-xs rounded-xl font-bold">
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CREAR / EDITAR COMPRADOR */}
      {buyerModal.open && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.target);
              const data = {
                name: fd.get('name'),
                phone: fd.get('phone'),
                email: fd.get('email'),
                budget: fd.get('budget'),
                status: fd.get('status'),
                notes: fd.get('notes'),
              };
              if (buyerModal.data) {
                setBuyers(buyers.map(b => b.id === buyerModal.data.id ? { ...b, ...data } : b));
              } else {
                setBuyers([...buyers, { ...data, id: 'b_' + Date.now() }]);
              }
              setBuyerModal({ open: false, data: null });
            }}
            className="bg-stone-900 border border-stone-800 rounded-2xl max-w-md w-full p-5 space-y-4 text-xs"
          >
            <h3 className="text-base font-bold text-white">{buyerModal.data ? 'Editar Comprador' : 'Nuevo Comprador'}</h3>
            <div>
              <label className="text-stone-400 block mb-1">Nombre Completo *</label>
              <input required name="name" defaultValue={buyerModal.data?.name} className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2.5 text-white" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-stone-400 block mb-1">Teléfono</label>
                <input name="phone" defaultValue={buyerModal.data?.phone} className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2.5 text-white" />
              </div>
              <div>
                <label className="text-stone-400 block mb-1">Email</label>
                <input name="email" type="email" defaultValue={buyerModal.data?.email} className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2.5 text-white" />
              </div>
            </div>
            <div>
              <label className="text-stone-400 block mb-1">Presupuesto</label>
              <input name="budget" defaultValue={buyerModal.data?.budget} className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2.5 text-white" />
            </div>
            <div>
              <label className="text-stone-400 block mb-1">Notas Privadas del Agente</label>
              <textarea name="notes" defaultValue={buyerModal.data?.notes} rows={2} className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2.5 text-white" />
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setBuyerModal({ open: false, data: null })} className="flex-1 py-2 bg-stone-800 text-stone-300 rounded-xl font-bold">Cancelar</button>
              <button type="submit" className="flex-1 py-2 bg-amber-600 text-stone-950 rounded-xl font-bold">Guardar</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL CREAR PROPIEDAD */}
      {propertyModal.open && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.target);
              const data = {
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
              setProperties([...properties, data]);
              setPropertyModal({ open: false, data: null, buyerId: null });
            }}
            className="bg-stone-900 border border-stone-800 rounded-2xl max-w-md w-full p-5 space-y-4 text-xs"
          >
            <h3 className="text-base font-bold text-white">Agregar Casa al Comprador</h3>
            <div>
              <label className="text-stone-400 block mb-1">Dirección *</label>
              <input required name="address" className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2.5 text-white" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-stone-400 block mb-1">Ciudad *</label>
                <input required name="city" className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2.5 text-white" />
              </div>
              <div>
                <label className="text-stone-400 block mb-1">Precio ($) *</label>
                <input required type="number" name="price" className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2.5 text-white" />
              </div>
            </div>
            <div>
              <label className="text-stone-400 block mb-1">Link Foto (Opcional)</label>
              <input name="image" placeholder="https://..." className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2.5 text-white" />
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setPropertyModal({ open: false, data: null, buyerId: null })} className="flex-1 py-2 bg-stone-800 text-stone-300 rounded-xl font-bold">Cancelar</button>
              <button type="submit" className="flex-1 py-2 bg-amber-600 text-stone-950 rounded-xl font-bold">Guardar Casa</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL CREAR TOUR */}
      {tourModal.open && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.target);
              setTours([...tours, {
                id: 't_' + Date.now(),
                buyerId: fd.get('buyerId'),
                date: fd.get('date'),
                startTime: fd.get('startTime'),
                status: 'Pendiente',
                propertyIds: Array.from(fd.getAll('propertyIds'))
              }]);
              setTourModal({ open: false, data: null });
            }}
            className="bg-stone-900 border border-stone-800 rounded-2xl max-w-md w-full p-5 space-y-4 text-xs"
          >
            <h3 className="text-base font-bold text-white">Programar Nuevo Tour</h3>
            <div>
              <label className="text-stone-400 block mb-1">Comprador</label>
              <select name="buyerId" className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2.5 text-white">
                {buyers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-stone-400 block mb-1">Fecha</label>
                <input required type="date" name="date" className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2.5 text-white" />
              </div>
              <div>
                <label className="text-stone-400 block mb-1">Hora</label>
                <input required type="time" name="startTime" className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2.5 text-white" />
              </div>
            </div>
            <div>
              <label className="text-stone-400 block mb-1">Propiedades a Visitar</label>
              <div className="max-h-32 overflow-y-auto space-y-1 bg-stone-950 p-2 rounded-lg border border-stone-800">
                {properties.map(p => (
                  <label key={p.id} className="flex items-center gap-2 text-stone-300">
                    <input type="checkbox" name="propertyIds" value={p.id} defaultChecked />
                    <span className="truncate">{p.address}</span>
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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.target);
              setBlocks([...blocks, {
                id: 'bk_' + Date.now(),
                title: fd.get('title'),
                date: fd.get('date'),
                startTime: fd.get('startTime'),
                endTime: fd.get('endTime')
              }]);
              setBlockModal({ open: false });
            }}
            className="bg-stone-900 border border-stone-800 rounded-2xl max-w-sm w-full p-5 space-y-4 text-xs"
          >
            <h3 className="text-base font-bold text-white">Bloquear Horario Personal</h3>
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
