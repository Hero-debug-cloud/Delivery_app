"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  ClipboardList, 
  MapPin, 
  Search, 
  AlertTriangle,
  Info,
  Clock,
  User,
  ShoppingBag,
  CheckCircle,
  Truck,
  XCircle,
  Sparkles
} from "lucide-react";

interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

interface OrderEvent {
  id: string;
  eventType: string;
  createdAt: string;
  metadataJson?: any;
}

interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  deliveryLatitude: number;
  deliveryLongitude: number;
  paymentType: "prepaid" | "cod";
  status: "created" | "assigned" | "accepted" | "picked_up" | "in_transit" | "delivered" | "failed";
  trackingToken: string;
  proofPin: string;
  itemTotal: number;
  deliveryFee: number;
  handlingCharge: number;
  grandTotal: number;
  storeName: string;
  driverName: string | null;
  assignedDriverId: string | null;
  ignoredByAll: boolean;
  createdAt: string;
  items?: OrderItem[];
  events?: OrderEvent[];
}

interface OnlineDriver {
  id: string;
  name: string;
  status: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [onlineDrivers, setOnlineDrivers] = useState<OnlineDriver[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState<boolean>(false);
  const [isAssigning, setIsAssigning] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // Fetch online drivers for assignment
  const fetchOnlineDrivers = async () => {
    try {
      const res = await fetch(`${API_URL}/locations/live?page=1&limit=100`, {
        credentials: "include"
      });
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data) {
          setOnlineDrivers(result.data);
        }
      }
    } catch (err) {
      console.error("Failed to load online drivers:", err);
    }
  };

  // Fetch orders list
  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const statusFilter = selectedStatus !== "all" ? `&status=${selectedStatus}` : "";
      const searchFilter = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : "";
      
      const res = await fetch(
        `${API_URL}/orders?page=${page}&limit=10${statusFilter}${searchFilter}`,
        { credentials: "include" }
      );
      if (!res.ok) throw new Error("Failed to fetch orders");
      const result = await res.json();
      if (result.success && result.data) {
        setOrders(result.data);
        if (result.pagination) {
          setTotalPages(result.pagination.totalPages);
          setTotalItems(result.pagination.totalItems);
        }
      }
    } catch (err) {
      console.error("Failed to load orders queue:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Assign driver manual override
  const handleAssignDriver = async (orderId: string, driverId: string) => {
    if (!driverId) return;
    try {
      setIsAssigning(orderId);
      const res = await fetch(`${API_URL}/orders/${orderId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driverId }),
        credentials: "include"
      });
      if (res.ok) {
        // Refresh orders and drivers
        await fetchOrders();
        await fetchOnlineDrivers();
      } else {
        const errResult = await res.json();
        alert(`Failed to assign: ${errResult.message || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Assign error:", err);
      alert("Failed to assign driver due to server error");
    } finally {
      setIsAssigning(null);
    }
  };

  // Fetch single order details & timeline
  const viewOrderDetails = async (order: Order) => {
    try {
      setIsDetailLoading(true);
      setSelectedOrder(order);
      
      const res = await fetch(`${API_URL}/track/${order.trackingToken}`, {
        credentials: "include"
      });
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data) {
          setSelectedOrder(result.data);
        }
      }
    } catch (err) {
      console.error("Failed to fetch tracking details:", err);
    } finally {
      setIsDetailLoading(false);
    }
  };

  // Cancel order manual override
  const handleCancelOrder = async (orderId: string) => {
    if (!confirm("Are you sure you want to cancel this order? This will release any assigned driver.")) return;
    try {
      const res = await fetch(`${API_URL}/orders/${orderId}/cancel`, {
        method: "POST",
        credentials: "include"
      });
      if (res.ok) {
        alert("Order cancelled successfully");
        if (selectedOrder?.id === orderId) {
          setSelectedOrder(null);
        }
        await fetchOrders();
        await fetchOnlineDrivers();
      } else {
        alert("Failed to cancel order");
      }
    } catch (err) {
      console.error("Cancel order error:", err);
    }
  };

  // Polling data refresh
  useEffect(() => {
    fetchOrders();
    fetchOnlineDrivers();

    const interval = setInterval(() => {
      fetchOrders();
      fetchOnlineDrivers();
    }, 10000); // refresh every 10 seconds

    return () => clearInterval(interval);
  }, [selectedStatus, page]);

  // Debounced search
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      setPage(1);
      fetchOrders();
    }, 400);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "created": return "bg-slate-100 text-slate-700 border-slate-200";
      case "assigned": return "bg-blue-50 text-blue-700 border-blue-200";
      case "accepted": return "bg-purple-50 text-purple-700 border-purple-200";
      case "picked_up": return "bg-cyan-50 text-cyan-700 border-cyan-200";
      case "in_transit": return "bg-amber-50 text-amber-700 border-amber-200";
      case "delivered": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "failed": return "bg-rose-50 text-rose-700 border-rose-200";
      default: return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case "created": return <ShoppingBag className="text-blue-500" size={14} />;
      case "driver_assigned": return <User className="text-indigo-500" size={14} />;
      case "driver_accepted": return <User className="text-purple-500" size={14} />;
      case "reached_store": return <MapPin className="text-yellow-600" size={14} />;
      case "picked_up": return <Clock className="text-cyan-500" size={14} />;
      case "out_for_delivery": return <Truck className="text-amber-500" size={14} />;
      case "reached_location": return <MapPin className="text-orange-500" size={14} />;
      case "delivered": return <CheckCircle className="text-emerald-500" size={14} />;
      case "cancelled": return <XCircle className="text-rose-500" size={14} />;
      default: return <Info className="text-slate-400" size={14} />;
    }
  };

  const formatEventName = (type: string) => {
    return type.toUpperCase().replace(/_/g, " ");
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Title + Stats */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-heading-32-bold text-neutral-900 tracking-tight">Order Queue</h1>
          <p className="text-caption-14-regular text-neutral-500 mt-1">Real-time status updates, manual dispatch override, and timeline logs.</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-neutral-200 pb-3">
        {["all", "created", "assigned", "accepted", "picked_up", "in_transit", "delivered", "failed"].map((status) => (
          <button
            key={status}
            onClick={() => {
              setSelectedStatus(status);
              setPage(1);
            }}
            className={`px-3.5 py-1.5 rounded-full text-[12px] font-semibold transition-all border ${
              selectedStatus === status
                ? "bg-primary-900 text-white border-primary-900 shadow-sm"
                : "bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50"
            }`}
          >
            {status.toUpperCase().replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Queue Table */}
      <div className="bg-white border border-neutral-200 rounded-md shadow-card overflow-hidden">
        {/* Search */}
        <div className="p-4 border-b border-neutral-200 flex justify-between items-center bg-neutral-50">
          <div className="relative w-80">
            <Search className="absolute left-3 top-2.5 text-neutral-400" size={16} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Order ID, Customer, Phone..."
              className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-md text-[12px] bg-white focus:outline-none focus:border-primary-600 transition-all font-medium"
            />
          </div>
          <span className="text-[12px] font-semibold text-neutral-500">
            Showing {orders.length} of {totalItems} orders
          </span>
        </div>

        {/* Table View */}
        {isLoading && orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 gap-2 text-neutral-400">
            <svg className="animate-spin h-6 w-6 text-neutral-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-[13px] font-medium">Fetching orders queue...</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center text-neutral-400 gap-2">
            <ShoppingBag size={32} className="text-neutral-300" />
            <span className="text-[14px] font-semibold">No orders in queue</span>
            <p className="text-[12px] text-neutral-400 max-w-sm">No order matches selected status filter or search parameters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="border-b border-neutral-200 text-neutral-600 text-[11px] font-bold bg-neutral-50/50 uppercase tracking-wider">
                  <th className="p-4">Order ID & Store</th>
                  <th className="p-4">Customer Info</th>
                  <th className="p-4">Delivery Target</th>
                  <th className="p-4 text-center">Amount</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Assigned Dispatcher</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 text-[13px]">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-neutral-50/50 transition-all">
                    {/* ID & Store */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-md bg-neutral-100 flex items-center justify-center text-neutral-600 shrink-0 border border-neutral-200">
                          <ClipboardList size={16} />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-neutral-900 font-mono text-[13px]">
                            {order.id.substring(0, 8).toUpperCase()}
                          </span>
                          <span className="text-[11px] text-neutral-400 font-medium">{order.storeName}</span>
                        </div>
                      </div>
                    </td>

                    {/* Customer */}
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-neutral-800">{order.customerName}</span>
                        <span className="text-[11px] text-neutral-500 font-mono">{order.customerPhone}</span>
                      </div>
                    </td>

                    {/* Address */}
                    <td className="p-4 max-w-[200px] truncate">
                      <div className="flex items-center gap-1 text-neutral-600 font-medium">
                        <MapPin size={13} className="text-neutral-400 shrink-0" />
                        <span className="truncate" title={order.deliveryAddress}>{order.deliveryAddress}</span>
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="p-4 text-center font-bold text-neutral-800">
                      ₹{(order.grandTotal / 100).toFixed(2)}
                      <div className="text-[9px] text-neutral-400 uppercase mt-0.5">{order.paymentType}</div>
                    </td>

                    {/* Status */}
                    <td className="p-4">
                      <div className="flex flex-col gap-1 items-start">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadgeClass(order.status)}`}>
                          {order.status.replace("_", " ").toUpperCase()}
                        </span>
                        {/* Ignored Warning */}
                        {order.status === "created" && order.ignoredByAll && (
                          <span className="flex items-center gap-1 text-[9px] text-rose-600 bg-rose-50 border border-rose-100 rounded px-1.5 py-0.5 font-bold animate-pulse">
                            <AlertTriangle size={10} /> IGNORED BY ALL ONLINE
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Dispatch Driver Select */}
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {isAssigning === order.id ? (
                          <span className="text-[11px] text-neutral-400 font-medium flex items-center gap-1">
                            <span className="h-2 w-2 bg-primary-600 rounded-full animate-ping"></span> Dispatching...
                          </span>
                        ) : order.status === "delivered" || order.status === "failed" ? (
                          <span className="text-[12px] text-neutral-500 font-medium flex items-center gap-1">
                            <User size={13} className="text-neutral-400" /> {order.driverName || "No Partner"}
                          </span>
                        ) : (
                          <select 
                            value={order.assignedDriverId || ""}
                            onChange={(e) => handleAssignDriver(order.id, e.target.value)}
                            className="border border-neutral-200 rounded px-2 py-1 text-[11px] bg-white hover:bg-neutral-50 transition-all font-semibold focus:outline-none w-40 text-neutral-700"
                          >
                            <option value="">{order.assignedDriverId ? "Change Assignment" : "Select Online Driver"}</option>
                            {onlineDrivers.map(d => (
                              <option key={d.id} value={d.id}>
                                {d.name} ({d.status.toUpperCase()})
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button 
                          onClick={() => viewOrderDetails(order)}
                          className="text-[12px] font-semibold text-primary-600 hover:text-primary-700 transition-all px-2.5 py-1 hover:bg-primary-50 rounded"
                        >
                          Details & Logs
                        </button>
                        {order.status !== "delivered" && order.status !== "failed" && (
                          <button
                            onClick={() => handleCancelOrder(order.id)}
                            className="text-[12px] font-semibold text-red-600 hover:text-red-700 transition-all px-2.5 py-1 hover:bg-red-50 rounded"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-neutral-200 flex justify-between items-center bg-neutral-50">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="px-3 py-1 bg-white border border-neutral-200 rounded text-[12px] font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50 transition-all"
            >
              Previous
            </button>
            <span className="text-[12px] font-medium text-neutral-500">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="px-3 py-1 bg-white border border-neutral-200 rounded text-[12px] font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50 transition-all"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Premium Order Details & Timeline Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-neutral-200 w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-neutral-100 flex justify-between items-start bg-slate-50/50">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <ClipboardList className="text-primary-600" size={18} />
                  <span className="text-[16px] font-bold text-neutral-900">
                    Order Details: {selectedOrder.id.substring(0, 8).toUpperCase()}
                  </span>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadgeClass(selectedOrder.status)}`}>
                    {selectedOrder.status.replace("_", " ").toUpperCase()}
                  </span>
                </div>
                <span className="text-[11px] text-neutral-400 font-mono mt-0.5">Token: {selectedOrder.trackingToken}</span>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="text-neutral-400 hover:text-neutral-600 text-[20px] font-semibold leading-none"
              >
                &times;
              </button>
            </div>

            {/* Modal Body */}
            {isDetailLoading ? (
              <div className="flex-1 p-12 flex flex-col items-center justify-center gap-3 text-neutral-400">
                <svg className="animate-spin h-7 w-7 text-primary-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span className="text-[13px] font-semibold text-neutral-500">Loading timeline coordinates & logs...</span>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Left Side: Summary & Items */}
                <div className="flex flex-col gap-6">
                  {/* Customer and Delivery details */}
                  <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-100 flex flex-col gap-3">
                    <span className="text-[12px] font-bold text-neutral-400 uppercase tracking-wider">Recipient Details</span>
                    <div className="flex flex-col gap-1">
                      <span className="font-bold text-neutral-800 text-[14px]">{selectedOrder.customerName}</span>
                      <span className="text-[12px] text-neutral-600 font-medium">{selectedOrder.customerPhone}</span>
                      <span className="text-[12px] text-neutral-500 mt-1 font-medium flex items-start gap-1">
                        <MapPin size={14} className="text-neutral-400 shrink-0 mt-0.5" />
                        <span>{selectedOrder.deliveryAddress}</span>
                      </span>
                      {selectedOrder.status !== "delivered" && selectedOrder.status !== "failed" && (
                        <div className="mt-2.5 bg-yellow-50 border border-yellow-100 rounded p-2 flex items-center justify-between text-[12px]">
                          <span className="text-yellow-800 font-semibold">Delivery Verification PIN:</span>
                          <span className="font-bold text-yellow-900 bg-white px-2 py-0.5 rounded shadow-sm border border-yellow-100 font-mono tracking-widest text-[13px]">
                            {selectedOrder.proofPin}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="flex flex-col gap-2">
                    <span className="text-[12px] font-bold text-neutral-400 uppercase tracking-wider">Ordered Items</span>
                    <div className="border border-neutral-200 rounded-lg overflow-hidden">
                      <div className="divide-y divide-neutral-100">
                        {selectedOrder.items && selectedOrder.items.length > 0 ? (
                          selectedOrder.items.map((item) => (
                            <div key={item.id} className="p-3 flex justify-between items-center text-[12px] hover:bg-neutral-50">
                              <div className="flex flex-col">
                                <span className="font-bold text-neutral-800">{item.productName}</span>
                                <span className="text-[10px] text-neutral-400 font-medium">
                                  ₹{(item.unitPrice / 100).toFixed(2)} &times; {item.quantity}
                                </span>
                              </div>
                              <span className="font-bold text-neutral-800">
                                ₹{(item.lineTotal / 100).toFixed(2)}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="p-3 text-neutral-400 text-center font-medium">No item records resolved</div>
                        )}
                      </div>
                      <div className="bg-neutral-50 p-3 border-t border-neutral-200 flex flex-col gap-1.5 text-[12px]">
                        <div className="flex justify-between text-neutral-500 font-medium">
                          <span>Items Total</span>
                          <span>₹{(selectedOrder.itemTotal / 100).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-neutral-500 font-medium">
                          <span>Delivery Fee</span>
                          <span>{selectedOrder.deliveryFee === 0 ? "FREE" : `₹${(selectedOrder.deliveryFee / 100).toFixed(2)}`}</span>
                        </div>
                        <div className="flex justify-between text-neutral-500 font-medium">
                          <span>Handling Charges</span>
                          <span>₹{(selectedOrder.handlingCharge / 100).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-neutral-800 font-extrabold border-t border-neutral-200 pt-1.5 mt-0.5 text-[13px]">
                          <span>Grand Total</span>
                          <span className="text-emerald-600">₹{(selectedOrder.grandTotal / 100).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Side: Timeline Events Logs */}
                <div className="flex flex-col gap-3">
                  <span className="text-[12px] font-bold text-neutral-400 uppercase tracking-wider">Status Timeline Logs</span>
                  <div className="flex-1 bg-neutral-50 rounded-lg p-4 border border-neutral-100 overflow-y-auto max-h-[350px]">
                    {selectedOrder.events && selectedOrder.events.length > 0 ? (
                      <div className="relative pl-6 border-l border-neutral-200 flex flex-col gap-6 ml-2 mt-2">
                        {selectedOrder.events.map((evt, idx) => (
                          <div key={evt.id} className="relative flex flex-col gap-1">
                            {/* Marker Node icon */}
                            <div className="absolute -left-[33px] top-0 bg-white border-2 border-neutral-200 rounded-full p-1 shadow-sm">
                              {getEventIcon(evt.eventType)}
                            </div>
                            <span className="text-[12px] font-bold text-neutral-800">
                              {formatEventName(evt.eventType)}
                            </span>
                            <span className="text-[10px] text-neutral-400 font-semibold">
                              {new Date(evt.createdAt).toLocaleString()}
                            </span>
                            {evt.metadataJson && (
                              <pre className="text-[9px] font-mono text-neutral-500 bg-white rounded p-1.5 border border-neutral-100 overflow-x-auto mt-0.5">
                                {JSON.stringify(evt.metadataJson, null, 2)}
                              </pre>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-16 gap-1.5 text-neutral-400">
                        <Clock size={20} className="text-neutral-300" />
                        <span className="text-[12px] font-semibold">No timeline logged</span>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* Modal Footer */}
            <div className="p-4 border-t border-neutral-100 bg-neutral-50/50 flex justify-end gap-2 shrink-0">
              <button 
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 border border-neutral-200 rounded-md text-[12px] font-semibold text-neutral-700 hover:bg-neutral-50 bg-white transition-all shadow-sm"
              >
                Close details
              </button>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}
