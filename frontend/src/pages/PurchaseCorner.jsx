import React, { useState, useEffect } from 'react';
import Navbar from '../components/layout/Navbar';
import { ShoppingCart, Pill, Activity, ShieldCheck, Truck, Plus, Minus, CreditCard, ChevronRight, CheckCircle, Package, Lock, Filter, Search } from 'lucide-react';

const PATIENT_ID = 2;

const PurchaseCorner = () => {
  const [inventory, setInventory] = useState([]);
  const [cart, setCart] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // UI State
  const [activeTab, setActiveTab] = useState('Store'); // Store or Orders
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState("");
  
  // Checkout State
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [invRes, cartRes, dashRes, ordRes] = await Promise.all([
        fetch('http://localhost:8000/products'),
        fetch(`http://localhost:8000/cart/${PATIENT_ID}`),
        fetch(`http://localhost:8000/dashboard/${PATIENT_ID}`),
        fetch(`http://localhost:8000/orders/${PATIENT_ID}`)
      ]);
      
      const invData = await invRes.json();
      const cartData = await cartRes.json();
      const dashData = await dashRes.json();
      const ordData = await ordRes.json();

      setInventory(invData);
      setCart(cartData);
      setPrescriptions(dashData.prescriptions || []);
      setOrders(ordData || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const hasPrescriptionFor = (drugName) => {
      return prescriptions.some(p => p.drug_name.toLowerCase().includes(drugName.toLowerCase()));
  };

  const handleAddToCart = async (product) => {
    if (product.category === "Prescription" && !hasPrescriptionFor(product.name)) {
        alert(`ACCESS DENIED: You do not have an active prescription for ${product.name}. Please consult your doctor.`);
        return;
    }
    try {
      await fetch(`http://localhost:8000/cart/add/${PATIENT_ID}/${product.id}`, { method: 'POST' });
      fetchData(); // Refresh cart
    } catch (e) {
      console.error(e);
    }
  };

  const handleRemoveFromCart = async (productId) => {
    try {
      await fetch(`http://localhost:8000/cart/remove/${PATIENT_ID}/${productId}`, { method: 'POST' });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCheckout = async () => {
    setIsCheckingOut(true);
    setTimeout(async () => {
        try {
            await fetch(`http://localhost:8000/pay/${PATIENT_ID}`, { method: 'POST' });
            setPaymentSuccess(true);
            setCart([]);
            fetchData();
        } catch (e) {
            console.error(e);
            alert("Payment failed.");
        }
        setIsCheckingOut(false);
    }, 2000);
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const insuranceCover = subtotal * 0.8; // 80% covered by mock insurance
  const total = subtotal - insuranceCover;

  if (paymentSuccess) {
      return (
          <div className="min-h-screen bg-[#05070a] text-white flex items-center justify-center p-6">
              <Navbar />
              <div className="bg-slate-900/60 border border-white/5 p-12 rounded-[2rem] text-center max-w-lg backdrop-blur-xl animate-fade-in">
                  <div className="w-24 h-24 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                      <CheckCircle size={48} />
                  </div>
                  <h2 className="text-3xl font-bold mb-4">Payment Successful</h2>
                  <p className="text-slate-400 mb-8">Your medications are being packed at our secure dispensary and will be dispatched shortly.</p>
                  <button onClick={() => setPaymentSuccess(false)} className="px-8 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition-all">
                      Return to Pharmacy
                  </button>
              </div>
          </div>
      )
  }

  // Filter Inventory
  const filteredInventory = inventory.filter(item => {
      const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      if (filter === 'All') return matchSearch;
      if (filter === 'Prescription') return item.category === 'Prescription' && matchSearch;
      if (filter === 'OTC & Supplements') return item.category !== 'Prescription' && matchSearch;
      return matchSearch;
  });

  return (
    <div className="min-h-screen bg-[#05070a] text-white p-6 pt-24 font-sans selection:bg-cyan-500/30">
      <Navbar />
      
      <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
        
        {/* --- Header --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/40 p-8 rounded-[2rem] border border-white/5 backdrop-blur-xl relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px] pointer-events-none -translate-y-1/2"></div>
           <div>
             <h1 className="text-3xl md:text-4xl font-black flex items-center gap-3">
               <Pill className="text-cyan-400 w-8 h-8" /> 
               UHLIS E-Pharmacy
             </h1>
             <p className="text-slate-400 mt-2 text-sm max-w-lg font-medium">
               Secure dispensary linked directly to your active prescriptions. Insurance benefits are automatically applied at checkout.
             </p>
           </div>
           
           {/* Tab Nav */}
           <div className="flex bg-slate-950 rounded-xl p-1 border border-white/10 relative z-10">
               <button 
                   onClick={() => setActiveTab('Store')} 
                   className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'Store' ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/20' : 'text-slate-400 hover:text-white'}`}
               >
                   Dispensary
               </button>
               <button 
                   onClick={() => setActiveTab('Orders')} 
                   className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'Orders' ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/20' : 'text-slate-400 hover:text-white'}`}
               >
                   My Orders
               </button>
           </div>
        </div>

        {activeTab === 'Orders' ? (
            /* --- ORDER TRACKING DASHBOARD --- */
            <div className="bg-slate-900/60 p-8 rounded-[2rem] border border-white/5 min-h-[500px]">
                <h2 className="text-2xl font-bold flex items-center gap-2 mb-8"><Package className="text-cyan-400"/> Order Tracking Dashboard</h2>
                {orders.length === 0 ? (
                    <div className="text-center text-slate-500 py-20">No active orders found.</div>
                ) : (
                    <div className="space-y-4">
                        {orders.map((ord, i) => (
                            <div key={i} className="bg-slate-950/50 p-6 rounded-2xl border border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
                                <div>
                                    <h3 className="font-bold text-lg">Order #{ord.id}</h3>
                                    <p className="text-slate-400 text-sm">Placed on: {ord.date}</p>
                                </div>
                                <div className="flex-1 w-full max-w-md">
                                    <div className="flex justify-between text-xs font-bold text-slate-500 mb-2 uppercase">
                                        <span className={ord.status !== 'Processing' ? 'text-cyan-400' : ''}>Processing</span>
                                        <span className={ord.status === 'Shipped' || ord.status === 'Delivered' ? 'text-cyan-400' : ''}>Shipped</span>
                                        <span className={ord.status === 'Delivered' ? 'text-cyan-400' : ''}>Delivered</span>
                                    </div>
                                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                        <div className={`h-full bg-cyan-500 transition-all ${ord.status === 'Processing' ? 'w-1/3' : ord.status === 'Shipped' ? 'w-2/3' : 'w-full'}`}></div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-mono text-xl font-bold text-cyan-400">${(ord.total || 0).toFixed(2)}</div>
                                    <button className="text-xs text-white bg-slate-800 px-3 py-1 rounded-lg mt-2 hover:bg-slate-700 transition-all">View Receipt</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        ) : (
            /* --- STORE INVENTORY --- */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* LEFT COLUMN: Inventory & Filters */}
                <div className="lg:col-span-2 space-y-6">
                    
                    {/* Live Filters & Search */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                            <input 
                                type="text" 
                                placeholder="Search medication or supplement..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-slate-900 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-cyan-500 text-white"
                            />
                        </div>
                        <div className="flex bg-slate-900 border border-white/10 rounded-xl p-1">
                            {['All', 'Prescription', 'OTC & Supplements'].map(f => (
                                <button 
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filter === f ? 'bg-cyan-600/20 text-cyan-400' : 'text-slate-400 hover:text-white'}`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    {/* Catalog */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {loading ? (
                            <div className="col-span-2 text-center text-slate-500 py-10">Loading inventory...</div>
                        ) : filteredInventory.map(item => {
                            const isRestricted = item.category === "Prescription";
                            const isVerified = hasPrescriptionFor(item.name);
                            
                            return (
                            <div key={item.id} className="bg-slate-900/60 p-5 rounded-[1.5rem] border border-white/5 hover:border-cyan-500/30 transition-all group relative overflow-hidden flex flex-col justify-between h-[200px]">
                                {isRestricted && !isVerified && (
                                    <div className="absolute top-0 right-0 bg-red-500/20 text-red-400 text-[10px] font-bold px-3 py-1 rounded-bl-xl flex items-center gap-1 border-b border-l border-red-500/30">
                                        <Lock size={10} /> Rx Required
                                    </div>
                                )}
                                {isRestricted && isVerified && (
                                    <div className="absolute top-0 right-0 bg-green-500/20 text-green-400 text-[10px] font-bold px-3 py-1 rounded-bl-xl flex items-center gap-1 border-b border-l border-green-500/30">
                                        <ShieldCheck size={10} /> Rx Verified
                                    </div>
                                )}

                                <div>
                                    <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center mb-4 text-cyan-400 group-hover:scale-110 transition-transform">
                                        <Pill size={24} />
                                    </div>
                                    <h3 className="font-bold text-white truncate">{item.name}</h3>
                                    <p className="text-xs text-slate-500 truncate">{item.description}</p>
                                </div>
                                <div className="flex justify-between items-end mt-4">
                                    <div className="font-mono text-cyan-400 font-bold">${(item.price || 0).toFixed(2)}</div>
                                    <button 
                                        onClick={() => handleAddToCart(item)}
                                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isRestricted && !isVerified ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-cyan-600 hover:bg-cyan-500 text-white'}`}
                                    >
                                        {isRestricted && !isVerified ? <Lock size={16} /> : <Plus size={18} />}
                                    </button>
                                </div>
                            </div>
                        )})}
                    </div>

                </div>

                {/* RIGHT COLUMN: Slide-out/Sticky Cart */}
                <div className="lg:col-span-1">
                    <div className="bg-slate-900/80 border border-white/10 rounded-[2rem] p-6 sticky top-28 backdrop-blur-xl shadow-2xl flex flex-col min-h-[500px]">
                        <h2 className="text-xl font-bold flex items-center gap-2 mb-6 border-b border-white/10 pb-4">
                            <ShoppingCart className="text-cyan-400" /> Cart Summary
                        </h2>

                        {cart.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 space-y-3">
                                <ShoppingCart size={48} className="mx-auto opacity-20" />
                                <p>Your cart is empty.</p>
                            </div>
                        ) : (
                            <div className="flex flex-col h-full justify-between flex-1">
                                <div className="space-y-3 overflow-y-auto custom-scrollbar pr-2 mb-6 flex-1 max-h-[300px]">
                                    {cart.map(item => (
                                        <div key={item.id} className="flex flex-col gap-2 bg-slate-950/50 p-4 rounded-2xl border border-white/5">
                                            <div className="flex justify-between items-start">
                                                <div className="font-bold text-sm text-white max-w-[150px]">{item.name}</div>
                                                <div className="text-xs text-cyan-400 font-mono font-bold">${((item.price || 0) * item.quantity).toFixed(2)}</div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="text-[10px] text-slate-500 uppercase tracking-widest">{item.category || "Item"}</div>
                                                <div className="flex items-center gap-3 bg-slate-900 px-2 py-1 rounded-lg border border-white/5">
                                                    <button onClick={() => handleRemoveFromCart(item.id)} className="text-slate-400 hover:text-white p-1"><Minus size={12} /></button>
                                                    <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                                                    <button onClick={() => handleAddToCart(item)} className="text-slate-400 hover:text-white p-1"><Plus size={12} /></button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Professional Pricing Breakdown */}
                                <div className="space-y-3 text-sm border-t border-white/10 pt-6 mb-6">
                                    <div className="flex justify-between text-slate-400">
                                        <span>Subtotal</span>
                                        <span className="font-mono text-white">${subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-green-400">
                                        <span className="flex items-center gap-1"><ShieldCheck size={14}/> Insurance (80%)</span>
                                        <span className="font-mono">-${insuranceCover.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-400">
                                        <span>Shipping</span>
                                        <span className="font-mono text-white">$0.00</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xl font-black pt-4 border-t border-white/10 mt-2">
                                        <span className="text-white">Total</span>
                                        <span className="font-mono text-cyan-400">${total.toFixed(2)}</span>
                                    </div>
                                </div>

                                {/* Secure Checkout Button */}
                                <button 
                                    onClick={handleCheckout}
                                    disabled={isCheckingOut}
                                    className="w-full relative overflow-hidden group bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all disabled:opacity-70"
                                >
                                    {isCheckingOut ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <CreditCard size={20} /> Checkout <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}
      </div>
      
      <style>{`
        .animate-fade-in { animation: fadeIn 0.4s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
      `}</style>
    </div>
  );
};

export default PurchaseCorner;