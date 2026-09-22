import React, { useState, useEffect } from 'react';
import { 
  Building2, Users, Calendar, MapPin, Plus, Trash2, Edit2, 
  ExternalLink, CheckCircle, Clock, ShieldAlert, Phone, Mail, 
  DollarSign, ChevronRight, X, Heart, ThumbsUp, AlertTriangle, 
  Lock, Eye, ArrowLeft, Check, Sparkles
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [portalMode, setPortalMode] = useState('agent');
  const [selectedBuyerId, setSelectedBuyerId] = useState(null);
  
  // Persistencia Local & Nube
  const [buyers, setBuyers] = useState(() => {
    const saved = localStorage.getItem('santos_buyers');
    return saved ? JSON.parse(saved) : [
      { id: 'b1', name: 'Carlos Morales & Elena Ruiz', phone: '+1 555-0192', email: 'carlos.m@gmail.com', status: 'Buscando activamente', budget: '$650k - $800k', notes: 'Precalificados. Buscan 4 habs con jardín.' }
    ];
  });

  const [properties, setProperties] = useState(() => {
    const saved = localStorage.getItem('santos_props');
    return saved ? JSON.parse(saved) : [
      { id: 'p1', buyerId: 'b1', address: '742 Evergreen Terrace', city: 'Springfield', price: 720000, mls: 'MLS-8821', link: 'https://ejemplo.com/casa1', image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800', notes: 'Amplia cocina y excelente iluminación.', status: 'Quiere visitar' },
      { id: 'p2', buyerId: 'b1', address: '124 Conch Street', city: 'Springfield', price: 685000, mls: 'MLS-4412', link: 'https://ejemplo.com/casa2', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800', notes: 'Piscina privada y garaje para 2 autos.', status: 'Interesado' }
    ];
  });

  const [tours, setTours] = useState(() => {
    const saved = localStorage.getItem('santos_tours');
    return saved ? JSON.parse(saved) : [
      { id: 't1', buyerId: 'b1', date: '2026-10-05', startTime: '10:00', status: 'Confirmado', notes: 'Encuentro inicial en la primera propiedad.', propertyIds: ['p1', 'p2'] }
    ];
  });

  const [agentSchedule, setAgentSchedule] = useState(() => {
    const saved = localStorage.getItem('santos_schedule');
    return saved ? JSON.parse(saved) : [
      { day: 'Lunes', active: true, blocks: [{ start: '09:00', end: '13:00' }, { start: '15:00', end: '19:00' }] },
      { day: 'Martes', active: true, blocks: [{ start: '10:00', end: '17:00' }] },
      { day: 'Miércoles', active: true, blocks: [{ start: '09:00', end: '18:00' }] },
      { day: 'Jueves', active: true, blocks: [{ start: '09:00', end: '18:00' }] },
      { day: 'Viernes', active: true, blocks: [{ start: '09:00', end: '15:00' }] },
      { day: 'Sábado', active: true, blocks: [{ start: '10:00', end: '14:00' }] },
      { day: 'Domingo', active: false, blocks: [] }
    ];
  });

  const [blocks, setBlocks] = useState(() => {
    const saved = localStorage.getItem('santos_blocks');
    return saved ? JSON.parse(saved) : [
      { id: 'bk1', title: 'Cita con Notario / Cierre', date: '2026-10-05', startTime: '13:00', endTime: '15:00' }
    ];
  });

  // Guardado automático en storage
  useEffect(() => { localStorage.setItem('santos_buyers', JSON.stringify(buyers)); }, [buyers]);
  useEffect(() => { localStorage.setItem('santos_props', JSON.stringify(properties)); }, [properties]);
  useEffect(() => { localStorage.setItem('santos_tours', JSON.stringify(tours)); }, [tours]);
  useEffect(() => { localStorage.setItem('santos_schedule', JSON.stringify(agentSchedule)); }, [agentSchedule]);
  useEffect(() => { localStorage.setItem('santos_blocks', JSON.stringify(blocks)); }, [blocks]);

  // Modal de confirmación para eliminar
  const [confirmModal, setConfirmModal] = useState({ open: false, title: '', message: '', onConfirm: null });

  // Formularios modales
  const [buyerModal, setBuyerModal] = useState({ open: false, data: null });
  const [propertyModal, setPropertyModal] = useState({ open: false, data: null, buyerId: null });
  const [tourModal, setTourModal] = useState({ open: false, data: null });
  const [blockModal, setBlockModal] = useState({ open: false });

  // Validar conflicto de horario (Anti Double Booking)
  const checkConflict = (date, time, excludeTourId = null) => {
    const tourCollision = tours.find(t => t.id !== excludeTourId && t.date === date && t.startTime === time && t.status !== 'Cancelado');
    if (tourCollision) return 'Ya tienes un tour programado a esta hora.';
    const blockCollision = blocks.find(b => b.date === date && time >= b.startTime && time < b.endTime);
    if (blockCollision) return `Horario bloqueado por: "${blockCollision.title}".`;
    return null;
  };

  // Acciones CRUD Comprador
  const handleSaveBuyer = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const buyerData = {
      name: fd.get('name'),
      phone: fd.get('phone'),
      email: fd.get('email'),
      status: fd.get('status'),
      budget: fd.get('budget'),
      notes: fd.get('notes'),
    };
    if (buyerModal.data) {
      setBuyers(buyers.map(b => b.id === buyerModal.data.id ? { ...b, ...buyerData } : b));
    } else {
      setBuyers([...buyers, { ...buyerData, id: 'b_' + Date.now() }]);
    }
    setBuyerModal({ open: false, data: null });
  };

  const confirmDeleteBuyer = (buyer) => {
    setConfirmModal({
      open: true,
      title: '¿Seguro que deseas eliminar este comprador?',
      message: `Se eliminará a "${buyer.name}", junto con todas sus propiedades y tours asociados de forma permanente.`,
      onConfirm: () => {
        setBuyers(buyers.filter(b => b.id !== buyer.id));
        setProperties(properties.filter(p => p.buyerId !== buyer.id));
        setTours(tours.filter(t => t.buyerId !== buyer.id));
        setConfirmModal({ open: false, title: '', message: '', onConfirm: null });
      }
    });
  };

  // Acciones CRUD Propiedad
  const handleSaveProperty = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const propData = {
      address: fd.get('address'),
      city: fd.get('city'),
      price: Number(fd.get('price')),
      mls: fd.get('mls') || '',
      link: fd.get('link') || '',
      image: fd.get('image') || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
      notes: fd.get('notes') || '',
      status: fd.get('status'),
    };
    if (propertyModal.data) {
      setProperties(properties.map(p => p.id === propertyModal.data.id ? { ...p, ...propData } : p));
    } else {
      setProperties([...properties, { ...propData, id: 'p_' + Date.now(), buyerId: propertyModal.buyerId }]);
    }
    setPropertyModal({ open: false, data: null, buyerId: null });
  };

  const confirmDeleteProperty = (prop) => {
    setConfirmModal({
      open: true,
      title: '¿Seguro que deseas eliminar esta propiedad?',
      message: `La propiedad en ${prop.address} se borrará del comprador y de los tours activos.`,
      onConfirm: () => {
        setProperties(properties.filter(p => p.id !== prop.id));
        setTours(tours.map(t => ({ ...t, propertyIds: t.propertyIds.filter(id => id !== prop.id) })));
        setConfirmModal({ open: false, title: '', message: '', onConfirm: null });
      }
    });
  };

  // Acciones CRUD Tour
  const handleSaveTour = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const buyerId = fd.get('buyerId');
    const date = fd.get('date');
    const startTime = fd.get('startTime');
    const selectedProps = Array.from(fd.getAll('propertyIds'));

    const conflict = checkConflict(date, startTime, tourModal.data?.id);
    if (conflict) {
      alert(`No es posible agendar: ${conflict}`);
      return;
    }

    const tourData = {
      buyerId,
      date,
      startTime,
      notes: fd.get('notes') || '',
      status: fd.get('status') || 'Pendiente',
      propertyIds: selectedProps
    };

    if (tourModal.data) {
      setTours(tours.map(t => t.id === tourModal.data.id ? { ...t, ...tourData } : t));
    } else {
      setTours([...tours, { ...tourData, id: 't_' + Date.now() }]);
    }
    setTourModal({ open: false, data: null });
  };

  const confirmDeleteTour = (tour) => {
    setConfirmModal({
      open: true,
      title: '¿Seguro que deseas eliminar este tour?',
      message: 'El tour será cancelado y removido de la agenda del comprador.',
      onConfirm: () => {
        setTours(tours.filter(t => t.id !== tour.id));
        setConfirmModal({ open: false, title: '', message: '', onConfirm: null });
      }
    });
  };

  const removePropertyFromTour = (tourId, propId) => {
    setTours(tours.map(t => {
      if (t.id === tourId) {
        return { ...t, propertyIds: t.propertyIds.filter(id => id !== propId) };
      }
      return t;
    }));
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans">
      {/* Header Superior Luxury */}
      <header className="border-b border-stone-800 bg-stone-900/90 backdrop-blur sticky top-0 z-40 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-600/20 border border-amber-500/40 flex items-center justify-center">
            <Building2 className="text-amber-400 w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-serif font-bold tracking-wide text-white">SANTOS BUYER PORTAL</h1>
            <p className="text-xs text-stone-400">Santos Bienes Raíces</p>
          </div>
        </div>

        {/* Selector de Modo (Agente / Vista Comprador) */}
        <div className="flex items-center gap-2">
          {portalMode === 'agent' ? (
            <button
              onClick={() => {
                if (buyers.length === 0) return alert('Crea primero un comprador.');
                setSelectedBuyerId(buyers[0].id);
                setPortalMode('buyer');
              }}
              className="text-xs bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 px-3 py-1.5 rounded-full flex items-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5 text-amber-400" />
              Vista Comprador
            </button>
          ) : (
            <button
              onClick={() => setPortalMode('agent')}
              className="text-xs bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Volver al Agente
            </button>
          )}
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 pb-24 max-w-5xl w-full mx-auto p-4">
        {portalMode === 'agent' ? (
          <>
            {/* Dashboard del Agente */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                {/* Métricas */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-stone-900 border border-stone-800 p-4 rounded-xl">
                    <p className="text-xs text-stone-400">Compradores Activos</p>
                    <p className="text-2xl font-serif font-bold text-white mt-1">{buyers.length}</p>
                  </div>
                  <div className="bg-stone-900 border border-stone-800 p-4 rounded-xl">
                    <p className="text-xs text-stone-400">Tours Próximos</p>
                    <p className="text-2xl font-serif font-bold text-amber-400 mt-1">
                      {tours.filter(t => t.status === 'Confirmado').length}
                    </p>
                  </div>
                  <div className="bg-stone-900 border border-stone-800 p-4 rounded-xl">
                    <p className="text-xs text-stone-400">Tours Pendientes</p>
                    <p className="text-2xl font-serif font-bold text-amber-500 mt-1">
                      {tours.filter(t => t.status === 'Pendiente').length}
                    </p>
                  </div>
                  <div className="bg-stone-900 border border-stone-800 p-4 rounded-xl">
                    <p className="text-xs text-stone-400">Visitados</p>
                    <p className="text-2xl font-serif font-bold text-emerald-400 mt-1">
                      {tours.filter(t => t.status === 'Visitado').length}
                    </p>
                  </div>
                </div>

                {/* Lista de Compradores */}
                <div className="flex items-center justify-between pt-2">
                  <h2 className="text-lg font-bold text-white">Compradores Registrados</h2>
                  <button
                    onClick={() => setBuyerModal({ open: true, data: null })}
                    className="bg-amber-600 hover:bg-amber-500 text-stone-950 font-semibold px-4 py-2 rounded-xl text-sm flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Nuevo Comprador
                  </button>
                </div>

                <div className="grid gap-4">
                  {buyers.map(b => {
                    const bProps = properties.filter(p => p.buyerId === b.id);
                    const bTours = tours.filter(t => t.buyerId === b.id);
                    return (
                      <div key={b.id} className="bg-stone-900 border border-stone-800 rounded-2xl p-4 sm:p-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800/80 pb-3">
                          <div>
                            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              {b.status}
                            </span>
                            <h3 className="text-base font-bold text-white mt-1">{b.name}</h3>
                            <p className="text-xs text-stone-400">Presupuesto: {b.budget || 'No especificado'}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => { setSelectedBuyerId(b.id); setPortalMode('buyer'); }}
                              className="text-xs bg-stone-800 hover:bg-stone-700 text-stone-200 px-3 py-1.5 rounded-lg border border-stone-700 flex items-center gap-1"
                            >
                              <Eye className="w-3.5 h-3.5 text-amber-400" /> Ver Portal
                            </button>
                            <button
                              onClick={() => setBuyerModal({ open: true, data: b })}
                              className="p-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => confirmDeleteBuyer(b)}
                              className="p-2 rounded-lg bg-red-950/40 hover:bg-red-900/50 text-red-400 border border-red-800/30"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Contacto y Notas */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-stone-400 mt-3">
                          <p className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-stone-500" /> {b.phone}</p>
                          <p className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-stone-500" /> {b.email}</p>
                          {b.notes && <p className="col-span-full text-stone-400 italic">Notas: {b.notes}</p>}
                        </div>

                        {/* Propiedades de este Comprador */}
                        <div className="mt-4 pt-3 border-t border-stone-800">
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-xs font-bold text-stone-300">Propiedades Asignadas ({bProps.length})</p>
                            <button
                              onClick={() => setPropertyModal({ open: true, data: null, buyerId: b.id })}
                              className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
                            >
                              <Plus className="w-3.5 h-3.5" /> Agregar Casa
                            </button>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {bProps.map(p => (
                              <div key={p.id} className="bg-stone-950 border border-stone-800/80 rounded-xl overflow-hidden flex gap-3 p-2">
                                <img src={p.image} alt={p.address} className="w-20 h-20 object-cover rounded-lg flex-shrink-0" />
                                <div className="flex-1 min-w-0 flex flex-col justify-between">
                                  <div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-[10px] uppercase font-bold text-amber-400">{p.status}</span>
                                      <button onClick={() => confirmDeleteProperty(p)} className="text-stone-500 hover:text-red-400">
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                    <p className="text-xs font-bold text-white truncate">{p.address}</p>
                                    <p className="text-[11px] text-stone-400">{p.city} • ${p.price.toLocaleString()}</p>
                                  </div>
                                  {p.link && (
                                    <a href={p.link} target="_blank" rel="noreferrer" className="text-[10px] text-stone-400 hover:text-white flex items-center gap-1">
                                      Enlace <ExternalLink className="w-3 h-3" />
                                    </a>
                                  )}
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
                    className="bg-amber-600 hover:bg-amber-500 text-stone-950 font-semibold px-4 py-2 rounded-xl text-sm flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Crear Tour
                  </button>
                </div>

                <div className="grid gap-4">
                  {tours.map(t => {
                    const buyer = buyers.find(b => b.id === t.buyerId);
                    const tourProps = properties.filter(p => t.propertyIds.includes(p.id));
                    return (
                      <div key={t.id} className="bg-stone-900 border border-stone-800 rounded-2xl p-5 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-800 pb-3">
                          <div>
                            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-stone-800 text-amber-400 border border-amber-500/20">
                              {t.status}
                            </span>
                            <h3 className="text-base font-bold text-white mt-1">{buyer?.name || 'Comprador'}</h3>
                            <p className="text-xs text-stone-400">Fecha: {t.date} a las {t.startTime}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {t.status !== 'Visitado' && (
                              <button
                                onClick={() => setTours(tours.map(item => item.id === t.id ? { ...item, status: 'Visitado' } : item))}
                                className="text-xs bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 px-3 py-1.5 rounded-lg flex items-center gap-1 font-semibold"
                              >
                                <CheckCircle className="w-3.5 h-3.5" /> Marcar Visitado
                              </button>
                            )}
                            <button onClick={() => confirmDeleteTour(t)} className="p-2 rounded-lg bg-red-950/40 hover:bg-red-900/50 text-red-400 border border-red-800/30">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Propiedades de este Tour con opción de eliminar individual */}
                        <div>
                          <p className="text-xs font-bold text-stone-300 mb-2">Paradas del Tour ({tourProps.length}):</p>
                          <div className="space-y-2">
                            {tourProps.map((p, idx) => (
                              <div key={p.id} className="bg-stone-950 p-2.5 rounded-xl border border-stone-800 flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold flex items-center justify-center">
                                    {idx + 1}
                                  </span>
                                  <div>
                                    <p className="text-xs font-bold text-white">{p.address}</p>
                                    <p className="text-[11px] text-stone-400">{p.city} • ${p.price.toLocaleString()}</p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => removePropertyFromTour(t.id, p.id)}
                                  className="text-stone-500 hover:text-red-400 text-xs flex items-center gap-1 px-2 py-1 rounded"
                                  title="Quitar esta casa del tour"
                                >
                                  <X className="w-3.5 h-3.5" /> Quitar
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

            {/* Pestaña: Calendario Interno */}
            {activeTab === 'calendar' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-white">Mi Calendario Interno</h2>
                    <p className="text-xs text-stone-400">Sin Google Calendar. Control 100% privado de tus horarios.</p>
                  </div>
                  <button
                    onClick={() => setBlockModal({ open: true })}
                    className="bg-amber-600 hover:bg-amber-500 text-stone-950 font-semibold px-4 py-2 rounded-xl text-sm flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Bloquear Horario
                  </button>
                </div>

                {/* Bloqueos Activos */}
                <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4">
                  <h3 className="text-sm font-bold text-white mb-3">Bloqueos de Agenda / Excepciones</h3>
                  <div className="space-y-2">
                    {blocks.map(b => (
                      <div key={b.id} className="bg-stone-950 p-3 rounded-xl border border-stone-800 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-red-400">{b.title}</p>
                          <p className="text-xs text-stone-400">{b.date} • {b.startTime} a {b.endTime}</p>
                        </div>
                        <button
                          onClick={() => setBlocks(blocks.filter(item => item.id !== b.id))}
                          className="text-stone-500 hover:text-red-400 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Disponibilidad Semanal */}
                <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4">
                  <h3 className="text-sm font-bold text-white mb-3">Horario Habitual de Atención</h3>
                  <div className="space-y-3">
                    {agentSchedule.map((s, idx) => (
                      <div key={s.day} className="flex items-center justify-between py-2 border-b border-stone-800/60 last:border-none text-xs">
                        <span className="font-semibold text-white w-24">{s.day}</span>
                        <div className="flex-1 text-stone-400">
                          {s.active ? s.blocks.map(b => `${b.start} - ${b.end}`).join('  |  ') : 'No disponible'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          /* PORTAL EXCLUSIVO DEL COMPRADOR (Aislado) */
          <div className="space-y-6">
            <div className="bg-stone-900 border border-amber-500/30 p-5 rounded-2xl">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Portal del Comprador</span>
              <h2 className="text-xl font-bold text-white mt-1">
                {buyers.find(b => b.id === selectedBuyerId)?.name}
              </h2>
              <p className="text-xs text-stone-400 mt-1">Bienvenido a tu selección exclusiva de residencias preparadas por Santos Bienes Raíces.</p>
            </div>

            <div className="grid gap-4">
              <h3 className="text-base font-bold text-white">Propiedades Seleccionadas</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {properties.filter(p => p.buyerId === selectedBuyerId).map(p => (
                  <div key={p.id} className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden flex flex-col">
                    <img src={p.image} alt={p.address} className="w-full h-48 object-cover" />
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-amber-400 font-bold uppercase">{p.status}</span>
                          <span className="text-sm font-bold text-white">${p.price.toLocaleString()}</span>
                        </div>
                        <h4 className="text-base font-bold text-white mt-1">{p.address}</h4>
                        <p className="text-xs text-stone-400">{p.city}</p>
                      </div>

                      {/* Botones de Feedback del Comprador */}
                      <div className="pt-2 border-t border-stone-800 flex items-center justify-between gap-2">
                        <button
                          onClick={() => setProperties(properties.map(item => item.id === p.id ? { ...item, status: 'Favorita' } : item))}
                          className="flex-1 py-1.5 bg-stone-800 hover:bg-stone-700 text-rose-400 text-xs rounded-lg font-bold flex items-center justify-center gap-1"
                        >
                          <Heart className="w-3.5 h-3.5 fill-current" /> Favorita
                        </button>
                        <button
                          onClick={() => setProperties(properties.map(item => item.id === p.id ? { ...item, status: 'Quiere visitar' } : item))}
                          className="flex-1 py-1.5 bg-amber-600 hover:bg-amber-500 text-stone-950 text-xs rounded-lg font-bold flex items-center justify-center gap-1"
                        >
                          <ThumbsUp className="w-3.5 h-3.5" /> Visitar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Navegación Inferior Mobile-First */}
      {portalMode === 'agent' && (
        <nav className="fixed bottom-0 left-0 right-0 bg-stone-900/95 backdrop-blur border-t border-stone-800 px-6 py-2 flex items-center justify-around z-40">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center gap-1 text-[11px] font-medium ${activeTab === 'dashboard' ? 'text-amber-400' : 'text-stone-400'}`}
          >
            <Users className="w-5 h-5" />
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('tours')}
            className={`flex flex-col items-center gap-1 text-[11px] font-medium ${activeTab === 'tours' ? 'text-amber-400' : 'text-stone-400'}`}
          >
            <MapPin className="w-5 h-5" />
            Tours
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex flex-col items-center gap-1 text-[11px] font-medium ${activeTab === 'calendar' ? 'text-amber-400' : 'text-stone-400'}`}
          >
            <Calendar className="w-5 h-5" />
            Mi Calendario
          </button>
        </nav>
      )}

      {/* MODAL OBLIGATORIO DE CONFIRMACIÓN DE ELIMINACIÓN */}
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
              <button
                onClick={() => setConfirmModal({ open: false, title: '', message: '', onConfirm: null })}
                className="flex-1 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs rounded-xl font-bold"
              >
                Cancelar
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white text-xs rounded-xl font-bold"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CREAR / EDITAR COMPRADOR */}
      {buyerModal.open && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSaveBuyer} className="bg-stone-900 border border-stone-800 rounded-2xl max-w-md w-full p-5 space-y-4">
            <h3 className="text-base font-bold text-white">
              {buyerModal.data ? 'Editar Comprador' : 'Nuevo Comprador'}
            </h3>
            <div className="space-y-3 text-xs">
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
                <input name="budget" defaultValue={buyerModal.data?.budget} placeholder="Ej. $500k - $700k" className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2.5 text-white" />
              </div>
              <div>
                <label className="text-stone-400 block mb-1">Estado</label>
                <select name="status" defaultValue={buyerModal.data?.status || 'Buscando activamente'} className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2.5 text-white">
                  <option value="Buscando activamente">Buscando activamente</option>
                  <option value="Precalificado">Precalificado</option>
                  <option value="En pausa">En pausa</option>
                </select>
              </div>
              <div>
                <label className="text-stone-400 block mb-1">Notas Privadas</label>
                <textarea name="notes" defaultValue={buyerModal.data?.notes} rows={2} className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2.5 text-white" />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setBuyerModal({ open: false, data: null })} className="flex-1 py-2 bg-stone-800 text-stone-300 rounded-xl text-xs font-bold">
                Cancelar
              </button>
              <button type="submit" className="flex-1 py-2 bg-amber-600 text-stone-950 rounded-xl text-xs font-bold">
                Guardar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL CREAR / EDITAR PROPIEDAD */}
      {propertyModal.open && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSaveProperty} className="bg-stone-900 border border-stone-800 rounded-2xl max-w-md w-full p-5 space-y-4">
            <h3 className="text-base font-bold text-white">
              {propertyModal.data ? 'Editar Propiedad' : 'Agregar Propiedad al Comprador'}
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-stone-400 block mb-1">Dirección *</label>
                <input required name="address" defaultValue={propertyModal.data?.address} className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2.5 text-white" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-stone-400 block mb-1">Ciudad *</label>
                  <input required name="city" defaultValue={propertyModal.data?.city} className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2.5 text-white" />
                </div>
                <div>
                  <label className="text-stone-400 block mb-1">Precio ($) *</label>
                  <input required type="number" name="price" defaultValue={propertyModal.data?.price} className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2.5 text-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-stone-400 block mb-1">MLS # (Opcional)</label>
                  <input name="mls" defaultValue={propertyModal.data?.mls} className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2.5 text-white" />
                </div>
                <div>
                  <label className="text-stone-400 block mb-1">Estado</label>
                  <select name="status" defaultValue={propertyModal.data?.status || 'Nueva'} className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2.5 text-white">
                    <option value="Nueva">Nueva</option>
                    <option value="Interesado">Interesado</option>
                    <option value="Quiere visitar">Quiere visitar</option>
                    <option value="Visitada">Visitada</option>
                    <option value="Favorita">Favorita ❤️</option>
                    <option value="Descartada">Descartada ❌</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-stone-400 block mb-1">Link de la Propiedad</label>
                <input name="link" defaultValue={propertyModal.data?.link} placeholder="https://..." className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2.5 text-white" />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setPropertyModal({ open: false, data: null, buyerId: null })} className="flex-1 py-2 bg-stone-800 text-stone-300 rounded-xl text-xs font-bold">
                Cancelar
              </button>
              <button type="submit" className="flex-1 py-2 bg-amber-600 text-stone-950 rounded-xl text-xs font-bold">
                Guardar Casa
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL CREAR TOUR */}
      {tourModal.open && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSaveTour} className="bg-stone-900 border border-stone-800 rounded-2xl max-w-md w-full p-5 space-y-4">
            <h3 className="text-base font-bold text-white">Programar Tour</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-stone-400 block mb-1">Comprador</label>
                <select name="buyerId" className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2.5 text-white">
                  {buyers.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
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
                <label className="text-stone-400 block mb-1">Seleccionar Propiedades</label>
                <div className="max-h-32 overflow-y-auto space-y-1 bg-stone-950 p-2 rounded-lg border border-stone-800">
                  {properties.map(p => (
                    <label key={p.id} className="flex items-center gap-2 text-stone-300">
                      <input type="checkbox" name="propertyIds" value={p.id} defaultChecked />
                      <span className="truncate">{p.address} ({p.city})</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setTourModal({ open: false, data: null })} className="flex-1 py-2 bg-stone-800 text-stone-300 rounded-xl text-xs font-bold">
                Cancelar
              </button>
              <button type="submit" className="flex-1 py-2 bg-amber-600 text-stone-950 rounded-xl text-xs font-bold">
                Guardar Tour
              </button>
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
            className="bg-stone-900 border border-stone-800 rounded-2xl max-w-sm w-full p-5 space-y-4"
          >
            <h3 className="text-base font-bold text-white">Bloquear Horario Personal</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-stone-400 block mb-1">Motivo (Ej. Dentista, Notaría)</label>
                <input required name="title" className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2.5 text-white" />
              </div>
              <div>
                <label className="text-stone-400 block mb-1">Fecha</label>
                <input required type="date" name="date" className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2.5 text-white" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-stone-400 block mb-1">Desde</label>
                  <input required type="time" name="startTime" className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2.5 text-white" />
                </div>
                <div>
                  <label className="text-stone-400 block mb-1">Hasta</label>
                  <input required type="time" name="endTime" className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2.5 text-white" />
                </div>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setBlockModal({ open: false })} className="flex-1 py-2 bg-stone-800 text-stone-300 rounded-xl text-xs font-bold">
                Cancelar
              </button>
              <button type="submit" className="flex-1 py-2 bg-amber-600 text-stone-950 rounded-xl text-xs font-bold">
                Bloquear
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}