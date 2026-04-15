import React, { useState } from 'react';
import { Plus, CreditCard as Edit, Trash2, Wrench, AlertCircle, CheckCircle, Clock, ChevronDown, Phone, Mail, Hash, X, Package, PackagePlus } from 'lucide-react';
import { Ticket, TicketItem, TicketStatus, DeviceType, Product, Service } from '../types';
import { formatCurrency } from '../utils/formatters';
import SearchBar from './SearchBar';

interface TicketsProps {
  tickets: Ticket[];
  products: Product[];
  services: Service[];
  onAddTicket: (ticket: Omit<Ticket, 'id'>) => void;
  onUpdateTicket: (id: string, ticket: Partial<Ticket>) => void;
  onDeleteTicket: (id: string) => void;
}

const STATUS_OPTIONS: TicketStatus[] = [
  'új',
  'folyamatban',
  'diagnosztika',
  'alkatrész rendelés',
  'javítás',
  'lezárva',
  'visszautasítva'
];

const DEVICE_TYPES: DeviceType[] = [
  'számítógép',
  'nyomtató',
  'telefon',
  'tablet',
  'konzol',
  'egyéb'
];

const PRIORITY_OPTIONS = ['alacsony', 'normál', 'magas', 'sürgős'] as const;

type Priority = typeof PRIORITY_OPTIONS[number];

const STATUS_STYLES: Record<TicketStatus, string> = {
  'új':                   'bg-sky-900/30 text-sky-300 border border-sky-600/40',
  'folyamatban':          'bg-yellow-900/30 text-yellow-300 border border-yellow-600/40',
  'diagnosztika':         'bg-cyan-900/30 text-cyan-300 border border-cyan-600/40',
  'alkatrész rendelés':   'bg-orange-900/30 text-orange-300 border border-orange-600/40',
  'javítás':              'bg-blue-900/30 text-blue-300 border border-blue-600/40',
  'lezárva':              'bg-green-900/30 text-green-300 border border-green-600/40',
  'visszautasítva':       'bg-red-900/30 text-red-300 border border-red-600/40',
};

const PRIORITY_STYLES: Record<Priority, string> = {
  'alacsony': 'bg-gray-700 text-gray-300',
  'normál':   'bg-blue-900/30 text-blue-300',
  'magas':    'bg-orange-900/30 text-orange-300',
  'sürgős':   'bg-red-900/30 text-red-300',
};

const emptyForm = {
  customerName: '',
  customerPhone: '',
  customerEmail: '',
  deviceType: 'számítógép' as DeviceType,
  deviceModel: '',
  deviceSerialNumber: '',
  problem: '',
  status: 'új' as TicketStatus,
  priority: 'normál' as Priority,
  notes: '',
  assignedTo: '',
};

function generateTicketNumber(count: number): string {
  const d = new Date();
  const yy = d.getFullYear().toString().slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const seq = String(count + 1).padStart(4, '0');
  return `TK-${yy}${mm}-${seq}`;
}

function StatusIcon({ status }: { status: TicketStatus }) {
  if (status === 'lezárva') return <CheckCircle className="w-3.5 h-3.5" />;
  if (status === 'új') return <AlertCircle className="w-3.5 h-3.5" />;
  return <Clock className="w-3.5 h-3.5" />;
}

function formatHu(date: Date) {
  return new Intl.DateTimeFormat('hu-HU', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  }).format(date);
}

const Tickets: React.FC<TicketsProps> = ({ tickets, products, services, onAddTicket, onUpdateTicket, onDeleteTicket }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [items, setItems] = useState<TicketItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<TicketStatus | 'összes'>('összes');
  const [filterPriority, setFilterPriority] = useState<Priority | 'összes'>('összes');
  const [itemSearch, setItemSearch] = useState('');
  const [showItemPicker, setShowItemPicker] = useState(false);

  const filtered = tickets.filter(t => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      t.customerName.toLowerCase().includes(q) ||
      t.ticketNumber.toLowerCase().includes(q) ||
      (t.deviceModel ?? '').toLowerCase().includes(q) ||
      (t.customerPhone ?? '').includes(q);
    const matchStatus = filterStatus === 'összes' || t.status === filterStatus;
    const matchPriority = filterPriority === 'összes' || t.priority === filterPriority;
    return matchSearch && matchStatus && matchPriority;
  });

  const openCount = tickets.filter(t => t.status !== 'lezárva' && t.status !== 'visszautasítva').length;

  const itemsTotal = items.reduce((sum, i) => sum + i.totalPrice, 0);

  const openForm = (ticket?: Ticket) => {
    if (ticket) {
      setEditingId(ticket.id);
      setForm({
        customerName: ticket.customerName,
        customerPhone: ticket.customerPhone ?? '',
        customerEmail: ticket.customerEmail ?? '',
        deviceType: ticket.deviceType,
        deviceModel: ticket.deviceModel ?? '',
        deviceSerialNumber: ticket.deviceSerialNumber ?? '',
        problem: ticket.problem,
        status: ticket.status,
        priority: ticket.priority,
        notes: ticket.notes ?? '',
        assignedTo: ticket.assignedTo ?? '',
      });
      setItems(ticket.items ?? []);
    } else {
      setEditingId(null);
      setForm(emptyForm);
      setItems([]);
    }
    setShowItemPicker(false);
    setItemSearch('');
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setItems([]);
    setShowItemPicker(false);
    setItemSearch('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date();
    const base: Omit<Ticket, 'id'> = {
      ticketNumber: editingId
        ? (tickets.find(t => t.id === editingId)?.ticketNumber ?? generateTicketNumber(tickets.length))
        : generateTicketNumber(tickets.length),
      customerName: form.customerName,
      customerPhone: form.customerPhone || undefined,
      customerEmail: form.customerEmail || undefined,
      deviceType: form.deviceType,
      deviceModel: form.deviceModel || undefined,
      deviceSerialNumber: form.deviceSerialNumber || undefined,
      problem: form.problem,
      status: form.status,
      priority: form.priority,
      items,
      estimatedCost: itemsTotal > 0 ? itemsTotal : undefined,
      finalCost: undefined,
      notes: form.notes || undefined,
      assignedTo: form.assignedTo || undefined,
      createdAt: editingId ? (tickets.find(t => t.id === editingId)?.createdAt ?? now) : now,
      updatedAt: now,
    };

    if (editingId) {
      onUpdateTicket(editingId, base);
    } else {
      onAddTicket(base);
    }
    closeForm();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Biztosan törölni szeretnéd ezt a jegyet?')) {
      onDeleteTicket(id);
      if (expandedId === id) setExpandedId(null);
    }
  };

  const field = (key: keyof typeof form, value: string) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const addProductItem = (product: Product) => {
    const existing = items.find(i => i.productId === product.id);
    if (existing) {
      updateItemQty(existing.id, existing.quantity + 1);
    } else {
      const newItem: TicketItem = {
        id: crypto.randomUUID(),
        type: 'product',
        productId: product.id,
        name: product.name,
        quantity: 1,
        unitPrice: product.sellingPrice,
        totalPrice: product.sellingPrice,
        unit: product.unit,
      };
      setItems(prev => [...prev, newItem]);
    }
    setShowItemPicker(false);
    setItemSearch('');
  };

  const addServiceItem = (service: Service) => {
    const existing = items.find(i => i.serviceId === service.id);
    if (existing) {
      updateItemQty(existing.id, existing.quantity + 1);
    } else {
      const newItem: TicketItem = {
        id: crypto.randomUUID(),
        type: 'service',
        serviceId: service.id,
        name: service.name,
        quantity: 1,
        unitPrice: service.price,
        totalPrice: service.price,
        unit: service.unit,
      };
      setItems(prev => [...prev, newItem]);
    }
    setShowItemPicker(false);
    setItemSearch('');
  };

  const addCustomItem = () => {
    const newItem: TicketItem = {
      id: crypto.randomUUID(),
      type: 'custom',
      name: '',
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
      unit: 'db',
    };
    setItems(prev => [...prev, newItem]);
  };

  const updateItemQty = (id: string, qty: number) => {
    if (qty < 1) return;
    setItems(prev => prev.map(i => i.id === id
      ? { ...i, quantity: qty, totalPrice: Math.round(i.unitPrice * qty) }
      : i
    ));
  };

  const updateItemField = (id: string, key: keyof TicketItem, value: string | number) => {
    setItems(prev => prev.map(i => {
      if (i.id !== id) return i;
      const updated = { ...i, [key]: value };
      if (key === 'unitPrice' || key === 'quantity') {
        updated.totalPrice = Math.round(Number(updated.unitPrice) * Number(updated.quantity));
      }
      return updated;
    }));
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const filteredProducts = (() => {
    const q = itemSearch.toLowerCase();
    return products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      (p.description ?? '').toLowerCase().includes(q)
    );
  })();

  const filteredServices = (() => {
    const q = itemSearch.toLowerCase();
    return services.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q) ||
      (s.description ?? '').toLowerCase().includes(q)
    );
  })();

  return (
    <div className="p-4 md:p-6 space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Javítási Jegyek</h1>
          <p className="text-gray-400 mt-1">Ügyféli készülékek javításának kezelése</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-orange-900/20 border border-orange-600/30 px-4 py-2 rounded-lg text-center min-w-[80px]">
            <p className="text-xs text-gray-400">Aktív jegyek</p>
            <p className="text-xl font-bold text-orange-400">{openCount}</p>
          </div>
          <button
            onClick={() => openForm()}
            className="bg-green-600 hover:bg-green-500 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 transition-colors font-medium"
          >
            <Plus className="w-4 h-4" />
            Új Jegy
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {STATUS_OPTIONS.slice(0, 4).map(s => {
          const cnt = tickets.filter(t => t.status === s).length;
          return (
            <button
              key={s}
              onClick={() => setFilterStatus(filterStatus === s ? 'összes' : s)}
              className={`rounded-lg p-3 text-left border transition-all ${
                filterStatus === s
                  ? STATUS_STYLES[s] + ' ring-2 ring-white/20'
                  : 'bg-gray-800 border-gray-700 hover:border-gray-600'
              }`}
            >
              <p className="text-xs text-gray-400 capitalize">{s}</p>
              <p className="text-2xl font-bold text-white mt-0.5">{cnt}</p>
            </button>
          );
        })}
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-6 px-4 bg-black/70 overflow-y-auto">
          <div className="bg-gray-800 border border-gray-700 rounded-xl w-full max-w-3xl shadow-2xl mb-10">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-white">
                {editingId ? 'Jegy szerkesztése' : 'Új javítási jegy'}
              </h2>
              <button onClick={closeForm} className="text-gray-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">

              {/* Customer */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Ügyfél adatai</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    required
                    type="text"
                    placeholder="Ügyfél neve *"
                    value={form.customerName}
                    onChange={e => field('customerName', e.target.value)}
                    className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <input
                    type="tel"
                    placeholder="Telefonszám"
                    value={form.customerPhone}
                    onChange={e => field('customerPhone', e.target.value)}
                    className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <input
                    type="email"
                    placeholder="E-mail cím"
                    value={form.customerEmail}
                    onChange={e => field('customerEmail', e.target.value)}
                    className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 sm:col-span-2"
                  />
                </div>
              </div>

              {/* Device */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Eszköz adatai</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <select
                    value={form.deviceType}
                    onChange={e => field('deviceType', e.target.value)}
                    className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    {DEVICE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <input
                    type="text"
                    placeholder="Márka / modell"
                    value={form.deviceModel}
                    onChange={e => field('deviceModel', e.target.value)}
                    className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <input
                    type="text"
                    placeholder="Sorozatszám (opcionális)"
                    value={form.deviceSerialNumber}
                    onChange={e => field('deviceSerialNumber', e.target.value)}
                    className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 sm:col-span-2"
                  />
                </div>
              </div>

              {/* Problem */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Hiba leírása</p>
                <textarea
                  required
                  placeholder="Probléma részletes leírása *"
                  value={form.problem}
                  onChange={e => field('problem', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                />
              </div>

              {/* Items / cost */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Alkatrészek & Munkadíj</p>
                  {itemsTotal > 0 && (
                    <span className="text-sm font-bold text-green-400">Összesen: {formatCurrency(itemsTotal)}</span>
                  )}
                </div>

                {/* Items list */}
                {items.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {items.map(item => (
                      <div key={item.id} className="flex items-center gap-2 bg-gray-700/50 border border-gray-600/50 rounded-lg px-3 py-2">
                        <div className="flex-1 min-w-0">
                          {item.type === 'custom' ? (
                            <input
                              type="text"
                              placeholder="Tétel neve"
                              value={item.name}
                              onChange={e => updateItemField(item.id, 'name', e.target.value)}
                              className="w-full bg-transparent text-white text-sm placeholder-gray-500 focus:outline-none border-b border-gray-600 focus:border-green-500"
                            />
                          ) : (
                            <span className="text-sm text-white truncate block">{item.name}</span>
                          )}
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className={`text-xs px-1.5 py-0.5 rounded ${item.type === 'product' ? 'bg-blue-900/40 text-blue-400' : item.type === 'service' ? 'bg-green-900/40 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                              {item.type === 'product' ? 'termék' : item.type === 'service' ? 'szolgáltatás' : 'egyéni'}
                            </span>
                            {item.type === 'custom' && (
                              <input
                                type="number"
                                placeholder="Egységár"
                                value={item.unitPrice || ''}
                                onChange={e => updateItemField(item.id, 'unitPrice', Number(e.target.value))}
                                className="w-24 bg-gray-700 border border-gray-600 rounded text-white text-xs px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-green-500"
                              />
                            )}
                            {item.type !== 'custom' && (
                              <span className="text-xs text-gray-500">{formatCurrency(item.unitPrice)} / {item.unit}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => updateItemQty(item.id, item.quantity - 1)}
                            className="w-6 h-6 rounded bg-gray-600 hover:bg-gray-500 text-white text-sm flex items-center justify-center"
                          >−</button>
                          <span className="w-7 text-center text-white text-sm font-medium">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateItemQty(item.id, item.quantity + 1)}
                            className="w-6 h-6 rounded bg-gray-600 hover:bg-gray-500 text-white text-sm flex items-center justify-center"
                          >+</button>
                        </div>
                        <span className="text-sm font-semibold text-white w-20 text-right shrink-0">
                          {formatCurrency(item.totalPrice)}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="text-red-400 hover:text-red-300 p-1 shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Picker */}
                {showItemPicker && (
                  <div className="bg-gray-700 border border-gray-600 rounded-lg overflow-hidden mb-2">
                    <div className="p-2 border-b border-gray-600">
                      <input
                        type="text"
                        autoFocus
                        placeholder="Keresés neve, kategória alapján..."
                        value={itemSearch}
                        onChange={e => setItemSearch(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-1.5 text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-green-500"
                      />
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {filteredProducts.length === 0 && filteredServices.length === 0 && (
                        <p className="text-center text-gray-500 text-sm py-4">Nincs találat</p>
                      )}

                      {/* Products section */}
                      {filteredProducts.length > 0 && (
                        <>
                          <div className="px-3 py-1.5 bg-gray-800/60 border-b border-gray-600/50">
                            <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                              <Package className="w-3 h-3" />
                              Készlet ({filteredProducts.length})
                            </span>
                          </div>
                          {filteredProducts.map(p => (
                            <button
                              type="button"
                              key={p.id}
                              onClick={() => addProductItem(p)}
                              className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-gray-600 text-left transition-colors border-b border-gray-600/30 last:border-0"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <Package className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                <div className="min-w-0">
                                  <p className="text-sm text-white truncate">{p.name}</p>
                                  <p className="text-xs text-gray-400">{p.category} · készlet: <span className={p.currentStock > 0 ? 'text-green-400' : 'text-red-400'}>{p.currentStock} {p.unit}</span></p>
                                </div>
                              </div>
                              <span className="text-sm text-gray-300 shrink-0 ml-3">{formatCurrency(p.sellingPrice)}</span>
                            </button>
                          ))}
                        </>
                      )}

                      {/* Services section */}
                      {filteredServices.length > 0 && (
                        <>
                          <div className="px-3 py-1.5 bg-gray-800/60 border-b border-gray-600/50">
                            <span className="text-xs font-semibold text-green-400 uppercase tracking-wider flex items-center gap-1.5">
                              <Wrench className="w-3 h-3" />
                              Szolgáltatások ({filteredServices.length})
                            </span>
                          </div>
                          {filteredServices.map(s => (
                            <button
                              type="button"
                              key={s.id}
                              onClick={() => addServiceItem(s)}
                              className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-gray-600 text-left transition-colors border-b border-gray-600/30 last:border-0"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <Wrench className="w-3.5 h-3.5 text-green-400 shrink-0" />
                                <div className="min-w-0">
                                  <p className="text-sm text-white truncate">{s.name}</p>
                                  <p className="text-xs text-gray-400">{s.category}</p>
                                </div>
                              </div>
                              <span className="text-sm text-gray-300 shrink-0 ml-3">{formatCurrency(s.price)} / {s.unit}</span>
                            </button>
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Add buttons */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setShowItemPicker(p => !p); setItemSearch(''); }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-blue-700/30 hover:bg-blue-700/50 border border-blue-600/40 text-blue-300 rounded-lg text-sm transition-colors"
                  >
                    <Package className="w-4 h-4" />
                    Készletből / Szolgáltatás
                  </button>
                  <button
                    type="button"
                    onClick={addCustomItem}
                    className="flex items-center gap-1.5 px-3 py-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 text-gray-300 rounded-lg text-sm transition-colors"
                  >
                    <PackagePlus className="w-4 h-4" />
                    Egyéni tétel
                  </button>
                </div>
              </div>

              {/* Settings */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Jegy beállításai</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Státusz</label>
                    <select
                      value={form.status}
                      onChange={e => field('status', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Prioritás</label>
                    <select
                      value={form.priority}
                      onChange={e => field('priority', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Felelős (opcionális)</label>
                    <input
                      type="text"
                      placeholder="Technikus neve"
                      value={form.assignedTo}
                      onChange={e => field('assignedTo', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
              </div>

              <textarea
                placeholder="Belső megjegyzések (opcionális)"
                value={form.notes}
                onChange={e => field('notes', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              />

              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 hover:bg-green-500 text-white py-2.5 rounded-lg font-medium transition-colors"
                >
                  {editingId ? 'Mentés' : 'Jegy létrehozása'}
                </button>
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-6 bg-gray-700 hover:bg-gray-600 text-white py-2.5 rounded-lg font-medium transition-colors"
                >
                  Mégse
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Keresés: ügyfél, jegyszám, modell..."
            showResultCount
            resultCount={filtered.length}
            totalCount={tickets.length}
          />
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as TicketStatus | 'összes')}
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="összes">Összes státusz</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={filterPriority}
            onChange={e => setFilterPriority(e.target.value as Priority | 'összes')}
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="összes">Összes prioritás</option>
            {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        {/* Ticket list */}
        <div className="space-y-2 pt-1">
          {filtered.length === 0 && (
            <div className="text-center py-12">
              <Wrench className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 font-medium">Nincs találat</p>
              <p className="text-sm text-gray-500 mt-1">Hozz létre egy új jegyet az Új Jegy gombbal</p>
            </div>
          )}

          {filtered.map(ticket => {
            const expanded = expandedId === ticket.id;
            const ticketTotal = (ticket.items ?? []).reduce((s, i) => s + i.totalPrice, 0);
            return (
              <div key={ticket.id} className="bg-gray-750 border border-gray-700 rounded-lg overflow-hidden hover:border-gray-600 transition-colors" style={{ backgroundColor: 'rgb(31, 41, 55)' }}>
                <div className="flex items-center gap-3 px-4 py-3">
                  <button
                    onClick={() => setExpandedId(expanded ? null : ticket.id)}
                    className="shrink-0 text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                  </button>

                  <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-[160px_1fr_auto] gap-x-4 gap-y-1 items-center">
                    <div className="flex flex-col">
                      <span className="text-xs font-mono text-blue-400">{ticket.ticketNumber}</span>
                      <span className="text-sm font-semibold text-white truncate">{ticket.customerName}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 min-w-0">
                      <span className="text-sm text-gray-300 truncate">{ticket.deviceType}{ticket.deviceModel ? ` – ${ticket.deviceModel}` : ''}</span>
                      <span className="text-xs text-gray-500 truncate hidden sm:block">{ticket.problem}</span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[ticket.status]}`}>
                        <StatusIcon status={ticket.status} />
                        {ticket.status}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_STYLES[ticket.priority]}`}>
                        {ticket.priority}
                      </span>
                      {ticketTotal > 0 && (
                        <span className="text-yellow-400 text-sm font-semibold">{formatCurrency(ticketTotal)}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => openForm(ticket)}
                      className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 rounded transition-colors"
                      title="Szerkesztés"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(ticket.id)}
                      className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition-colors"
                      title="Törlés"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {expanded && (
                  <div className="border-t border-gray-700 px-4 py-4 bg-gray-900/40 space-y-4 text-sm">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Probléma leírása</p>
                        <p className="text-gray-200">{ticket.problem}</p>
                      </div>

                      {(ticket.customerPhone || ticket.customerEmail) && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Elérhetőség</p>
                          {ticket.customerPhone && (
                            <div className="flex items-center gap-1 text-gray-300">
                              <Phone className="w-3.5 h-3.5 text-gray-500" />
                              {ticket.customerPhone}
                            </div>
                          )}
                          {ticket.customerEmail && (
                            <div className="flex items-center gap-1 text-gray-300">
                              <Mail className="w-3.5 h-3.5 text-gray-500" />
                              {ticket.customerEmail}
                            </div>
                          )}
                        </div>
                      )}

                      {ticket.deviceSerialNumber && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Sorozatszám</p>
                          <div className="flex items-center gap-1 text-gray-300">
                            <Hash className="w-3.5 h-3.5 text-gray-500" />
                            {ticket.deviceSerialNumber}
                          </div>
                        </div>
                      )}

                      {ticket.assignedTo && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Felelős</p>
                          <p className="text-gray-300">{ticket.assignedTo}</p>
                        </div>
                      )}

                      <div>
                        <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Létrehozva</p>
                        <p className="text-gray-300">{formatHu(ticket.createdAt)}</p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Frissítve</p>
                        <p className="text-gray-300">{formatHu(ticket.updatedAt)}</p>
                      </div>
                    </div>

                    {ticket.notes && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Megjegyzések</p>
                        <p className="text-gray-300">{ticket.notes}</p>
                      </div>
                    )}

                    {(ticket.items ?? []).length > 0 && (
                      <div>
                        <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Alkatrészek & Munkadíj</p>
                        <div className="space-y-1.5">
                          {(ticket.items ?? []).map(item => (
                            <div key={item.id} className="flex items-center justify-between bg-gray-800/60 rounded-lg px-3 py-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className={`text-xs px-1.5 py-0.5 rounded shrink-0 ${item.type === 'product' ? 'bg-blue-900/40 text-blue-400' : item.type === 'service' ? 'bg-green-900/40 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                                  {item.type === 'product' ? 'termék' : item.type === 'service' ? 'svc' : 'egyéni'}
                                </span>
                                <span className="text-gray-200 truncate">{item.name}</span>
                              </div>
                              <div className="flex items-center gap-4 shrink-0 ml-3 text-sm">
                                <span className="text-gray-400">{item.quantity} × {formatCurrency(item.unitPrice)}</span>
                                <span className="font-semibold text-white">{formatCurrency(item.totalPrice)}</span>
                              </div>
                            </div>
                          ))}
                          <div className="flex justify-end pt-1">
                            <span className="text-sm font-bold text-yellow-400">Összesen: {formatCurrency(ticketTotal)}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Tickets;
