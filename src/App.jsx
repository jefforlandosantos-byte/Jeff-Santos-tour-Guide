import React, { useState, useEffect } from 'react';
import { 
  Building2, Users, Calendar, MapPin, Plus, Trash2, Edit2, 
  ExternalLink, Phone, Mail, X, Heart, ThumbsUp, AlertTriangle, 
  Lock, Eye, ArrowLeft, Check, Share2, RefreshCw
} from 'lucide-react';

// URL canónica fija para evitar enlaces raros de Vercel
const DOMAIN_URL = "https://jeff-santos-tour-guide.vercel.app";
const STORAGE_KEY = "santos_cloud_database_v1";

export default function App() {
  const queryParams = new URLSearchParams(window.location.search);
  const urlBuyerId = queryParams.get('cliente');

  const [portalMode, setPortalMode] = useState(urlBuyerId ? 'buyer' : 'agent');
  const [selectedBuyerId, setSelectedBuyerId] = useState(urlBuyerId || null);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // PIN de Agente
  const [isAgentAuthenticated, setIsAgentAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const AGENT_PIN = "1234";

  // Estado Maestro
  const [data, setData] = useState(() => {
    const local = localStorage.getItem(STORAGE_KEY);
    if (local) {
      try { return JSON.parse(local); } catch(e){}
    }
    return {
      buyers: [
        { id: 'b1', name: 'Carlos Morales & Elena Ruiz', phone: '+1 555-0192', email: 'carlos.m@gmail.com', status: 'Buscando activamente', budget: '$650k - $800k', notes: 'Precalificados. Buscan 4 habs.' }
      ],
      properties: [
        { id: 'p1', buyerId: 'b1', address: '742 Evergreen Terrace', city: 'Springfield', price: 720000, mls: 'MLS-8821', link: 'https://ejemplo.com', image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800', notes: '', status: 'Nueva' },
        { id: 'p2', buyerId: 'b1', address: '124 Conch Street', city: 'Springfield', price: 685000, mls: 'MLS-4412', link: 'https://ejemplo.com', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800', notes: '', status: 'Interesado' }
      ],
      tours: [
        { id: 't1', buyerId: 'b1', date: '2026-10-05', startTime: '10:00', status: 'Confirmado', propertyIds: ['p1', 'p2'] }
      ],
      blocks: [
        { id: 'bk1', title: 'Cierre Notaría', date: '2026-10-05', startTime: '13:00', endTime: '15:00' }
      ]
    };
  });

  // Guardado persistente
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  // Modales
  const [confirmModal, setConfirmModal] = useState({ open: false, title: '', message: '', onConfirm: null });
  const [buyerModal, setBuyerModal] = useState({ open: false, data: null });
  const [propertyModal, setPropertyModal] = useState({ open: false, data: null, buyerId: null });
  const [tourModal, setTourModal] = useState({ open: false, data: null });
  const [blockModal, setBlockModal] = useState({ open: false });
  const [copiedId, setCopiedId] = useState(null);

  // Copiar enlace limpio garantizado
  const copyClientLink = (buyerId) => {
    const link = `${DOMAIN_URL}/?cliente=${buyerId}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link);
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = link;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCopiedId(buyerId);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handlePinSubmit = (e) => {
    e.preventDefault();
    if (pinInput === AGENT_PIN) {
      setIsAgentAuthenticated(true);
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  // VISTA DEL COMPRADOR (Totalmente aislada)
  if (portalMode === 'buyer') {
    const currentBuyer = data.buyers.find(b => b.id === selectedBuyerId);
    const buyerProps = data.properties.filter(p => p.buyerId === selectedBuyerId);
    const buyerTours = data.tours.filter(t => t.buyerId === selectedBuyerId);

    if (!currentBuyer) {
      return (
        <div className="min-h-screen bg-stone-950 text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-amber-600/10 border border-amber-500/30 flex items-center justify-center mb-4 text-amber-400">
            <Building2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold font-serif text-white">Santos Bienes Raíces</h2>
          <p className="text-stone-400 text-sm mt-2 max-w-sm">No encontramos este catálogo. Por favor comunícate con tu agente para recibir tu enlace actualizado.</p>
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
              <p className="text-xs text-amber-500 font-medium">Portal Exclusivo de Propiedades</p>
            </div>
          </div>
          {!urlBuyerId && (
            <button
              onClick={() => setPortalMode('agent')}
              className="text-xs bg-stone-800 text-stone-300 px-3 py-1.5 rounded-lg border border-stone-700 flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Salir de vista previa
            </button>
          )}
        </header>

        <main className="flex-1 max-w-3xl w-full mx-auto p-4 sm:p-6 space-y-6">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Bienvenido</span>
            <h2 className="text-xl font-serif font-bold text-white mt-1">{currentBuyer.name}</h2>
            <p className="text-xs text-stone-400 mt-1">
              Aquí puedes revisar los detalles de cada propiedad seleccionada para ti y marcar las que te interesan.
            </p>
          </div>

          {buyerTours.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider">Tours Programados</h3>
              {buyerTours.map(t => (
                <div key={t.id} className="bg-stone-900 border border-amber-500/30 rounded-xl p-4">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    {t.status}
                  </span>
                  <p className="text-sm font-bold text-white mt-2">Día: {t.date} a las {t.startTime}</p>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider">Tus Propiedades ({buyerProps.length})</h3>
            {buyerProps.length === 0 ? (
              <p className="text-stone-500 text-xs">Aún no hay casas agregadas a tu lista.</p>
            ) : (
              buyerProps.map(p => (
                <div key={p.id} className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden flex flex-col">
                  <img src={p.image} alt={p.address} className="w-full h-52 object-cover" />
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-400 uppercase">{p.status}</span>
                      <p className="text-base font-bold text-white">${Number(p.price).toLocaleString()}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{p.address}</h4>
                      <p className="text-xs text-stone-400">{p.city} {p.mls && `• MLS: ${p.mls}`}</p>
                    </div>
                    {p.link && (
                      <a href={p.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-amber-400 hover:underline">
                        Ver ficha completa <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    <div className="pt-2 border-t border-stone-800 grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          const updated = data.properties.map(item => item.id === p.id ? { ...item, status: 'Favorita ❤️' } : item);
                          setData({ ...data, properties: updated });
                        }}
                        className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 ${
                          p.status === 'Favorita ❤️' ? 'bg-rose-600 text-white' : 'bg-stone-800 text-rose-400'
                        }`}
                      >
                        <Heart className="w-4 h-4 fill-current" /> Favorita
                      </button>
                      <button
                        onClick={() => {
                          const updated = data.properties.map(item => item.id === p.id ? { ...item, status: 'Quiere visitar' } : item);
                          setData({ ...data, properties: updated });
                        }}
                        className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 ${
                          p.status === 'Quiere visitar' ? 'bg-amber-600 text-stone-950' : 'bg-stone-800 text-amber-400'
                        }`}
                      >
                        <ThumbsUp className="w-4 h-4" /> Visitar
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

  // ACCESO CON PIN DE SEGURIDAD PARA EL AGENTE
  if (!isAgentAuthenticated) {
    return (
      <div className="min-h-screen bg-stone-950 text-stone-100 flex items-center justify-center p-4">
        <form onSubmit={handlePinSubmit} className="bg-stone-900 border border-stone-800 max-w-sm w-full p-6 rounded-2xl text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-amber-600/20 border border-amber-500/40 flex items-center justify-center mx-auto text-amber-400">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white font-serif">SANTOS BUYER PORTAL</h2>
            <p className="text-xs text-stone-400 mt-1">Panel de Administración</p>
          </div>
          <div>
            <input
              type="password"
              placeholder="Ingresa PIN (1234)"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              className="w-full text-center text-lg tracking-widest bg-stone-950 border border-stone-800 rounded-xl py-3 text-white focus:border-amber-500 outline-none"
            />
            {pinError && <p className="text-red-400 text-xs mt-1.5 font-medium">PIN incorrecto. Usa 1234</p>}
          </div>
          <button type="submit" className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold rounded-xl text-xs">
            Entrar al Dashboard
          </button>
        </form>
      </div>
    );
  }

  // DASHBOARD DEL AGENTE
  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans">
      <header className="border-b border-stone-800 bg-stone-900/90 backdrop-blur sticky top-0 z-40 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-600/20 border border-amber-500/40 flex items-center justify-center">
            <Building2 className="text-amber-400 w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-serif font-bold text-white">SANTOS BUYER PORTAL</h1>
            <p className="text-xs text-amber-500 font-semibold">Agente Administrador</p>
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
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Contadores */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-stone-900 border border-stone-800 p-4 rounded-xl">
                <p className="text-xs text-stone-400">Compradores</p>
                <p className="text-2xl font-bold text-white mt-1">{data.buyers.length}</p>
              </div>
              <div className="bg-stone-900 border border-stone-800 p-4 rounded-xl">
                <p className="text-xs text-stone-400">Tours</p>
                <p className="text-2xl font-bold text-amber-400 mt-1">{data.tours.length}</p>
              </div>
              <div className="bg-stone-900 border border-stone-800 p-4 rounded-xl">
                <p className="text-xs text-stone-400">Propiedades</p>
                <p className="text-2xl font-bold text-white mt-1">{data.properties.length}</p>
              </div>
              <div className="bg-stone-900 border border-stone-800 p-4 rounded-xl">
                <p className="text-xs text-stone-400">Bloqueos</p>
                <p className="text-2xl font-bold text-red-400 mt-1">{data.blocks.length}</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white">Compradores</h2>
              <button
                onClick={() => setBuyerModal({ open: true, data: null })}
                className="bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Nuevo Comprador
              </button>
            </div>

            {/* Tarjetas de Compradores */}
            <div className="space-y-4">
              {data.buyers.map(b => {
                const bProps = data.properties.filter(p => p.buyerId === b.id);
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
                        {/* Botón que genera el link limpio */}
                        <button
                          onClick={() => copyClientLink(b.id)}
                          className="text-xs bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 border border-amber-500/30 px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-bold"
                        >
                          {copiedId === b.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                          {copiedId === b.id ? '¡Link Copiado!' : 'Copiar Link WhatsApp'}
                        </button>
                        <button
                          onClick={() => { setSelectedBuyerId(b.id); setPortalMode('buyer'); }}
                          className="text-xs bg-stone-800 hover:bg-stone-700 text-stone-200 px-3 py-1.5 rounded-lg border border-stone-700 flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> Ver Vista Previa
                        </button>
                        <button
                          onClick={() => {
                            setConfirmModal({
                              open: true,
                              title: '¿Eliminar comprador?',
                              message: `Se borrará a "${b.name}" junto con sus casas y tours.`,
                              onConfirm: () => {
                                setData({
                                  ...data,
                                  buyers: data.buyers.filter(x => x.id !== b.id),
                                  properties: data.properties.filter(x => x.buyerId !== b.id),
                                  tours: data.tours.filter(x => x.buyerId !== b.id)
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

                    <div className="text-xs text-stone-400">
                      <p>Tel: {b.phone} | Email: {b.email}</p>
                      {b.notes && <p className="italic text-stone-400 mt-1">Notas privadas: {b.notes}</p>}
                    </div>

                    {/* Casas de este comprador */}
                    <div className="pt-2">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-bold text-stone-300">Casas Asignadas ({bProps.length})</p>
                        <button
                          onClick={() => setPropertyModal({ open: true, data: null, buyerId: b.id })}
                          className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" /> Agregar Casa
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {bProps.map(p => (
                          <div key={p.id} className="bg-stone-950 border border-stone-800 rounded-xl p-2 flex gap-3 items-center">
                            <img src={p.image} alt={p.address} className="w-14 h-14 object-cover rounded-lg flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-white truncate">{p.address}</p>
                              <p className="text-[11px] text-stone-400">${Number(p.price).toLocaleString()} • {p.status}</p>
                            </div>
                            <button
                              onClick={() => {
                                setData({
                                  ...data,
                                  properties: data.properties.filter(x => x.id !== p.id)
                                });
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

        {/* Pestaña: Tours */}
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
            {data.tours.map(t => {
              const b = data.buyers.find(x => x.id === t.buyerId);
              return (
                <div key={t.id} className="bg-stone-900 border border-stone-800 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-amber-400 uppercase">{t.status}</span>
                    <p className="text-sm font-bold text-white">{b?.name || 'Comprador'}</p>
                    <p className="text-xs text-stone-400">{t.date} a las {t.startTime}</p>
                  </div>
                  <button
                    onClick={() => setData({ ...data, tours: data.tours.filter(x => x.id !== t.id) })}
                    className="p-2 text-stone-500 hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Pestaña: Calendario */}
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
            {data.blocks.map(bk => (
              <div key={bk.id} className="bg-stone-900 border border-stone-800 rounded-xl p-3 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-red-400">{bk.title}</p>
                  <p className="text-stone-400">{bk.date} • {bk.startTime} a {bk.endTime}</p>
                </div>
                <button
                  onClick={() => setData({ ...data, blocks: data.blocks.filter(x => x.id !== bk.id) })}
                  className="p-1 text-stone-500 hover:text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Navegación Inferior */}
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
              };
              setData({ ...data, buyers: [...data.buyers, newB] });
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
              setData({ ...data, properties: [...data.properties, newP] });
              setPropertyModal({ open: false, data: null, buyerId: null });
            }}
            className="bg-stone-900 border border-stone-800 rounded-2xl max-w-sm w-full p-5 space-y-3 text-xs"
          >
            <h3 className="text-base font-bold text-white">Agregar Propiedad</h3>
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
              <label className="text-stone-400 block mb-1">Link de la casa (Opcional)</label>
              <input name="link" placeholder="https://..." className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2.5 text-white" />
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setPropertyModal({ open: false, data: null, buyerId: null })} className="flex-1 py-2 bg-stone-800 text-stone-300 rounded-xl font-bold">Cancelar</button>
              <button type="submit" className="flex-1 py-2 bg-amber-600 text-stone-950 rounded-xl font-bold">Guardar Casa</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL TOUR */}
      {tourModal.open && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.target);
              const newT = {
                id: 't_' + Date.now(),
                buyerId: fd.get('buyerId'),
                date: fd.get('date'),
                startTime: fd.get('startTime'),
                status: 'Pendiente',
                propertyIds: []
              };
              setData({ ...data, tours: [...data.tours, newT] });
              setTourModal({ open: false, data: null });
            }}
            className="bg-stone-900 border border-stone-800 rounded-2xl max-w-sm w-full p-5 space-y-3 text-xs"
          >
            <h3 className="text-base font-bold text-white">Nuevo Tour</h3>
            <div>
              <label className="text-stone-400 block mb-1">Comprador</label>
              <select name="buyerId" className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2.5 text-white">
                {data.buyers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
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
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setTourModal({ open: false, data: null })} className="flex-1 py-2 bg-stone-800 text-stone-300 rounded-xl font-bold">Cancelar</button>
              <button type="submit" className="flex-1 py-2 bg-amber-600 text-stone-950 rounded-xl font-bold">Guardar Tour</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL BLOQUEO */}
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
              setData({ ...data, blocks: [...data.blocks, newBk] });
              setBlockModal({ open: false });
            }}
            className="bg-stone-900 border border-stone-800 rounded-2xl max-w-sm w-full p-5 space-y-3 text-xs"
          >
            <h3 className="text-base font-bold text-white">Bloquear Horario</h3>
            <div>
              <label className="text-stone-400 block mb-1">Motivo</label>
              <input required name="title" placeholder="Ej. Notaría / Personal" className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2.5 text-white" />
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
