import React, { useState, useEffect } from "react";
import { 
  X, 
  Check, 
  AlertTriangle, 
  Calendar, 
  Truck, 
  User, 
  Mail, 
  Phone, 
  FileText, 
  Eye 
} from "lucide-react";
import type { DeliveryPartner } from "../types";

interface DriverVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  driver: DeliveryPartner | null;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string, reason: string) => Promise<void>;
  isApproving: boolean;
  isRejecting: boolean;
}

export function DriverVerificationModal({
  isOpen,
  onClose,
  driver,
  onApprove,
  onReject,
  isApproving,
  isRejecting,
}: DriverVerificationModalProps) {
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [activePreviewUrl, setActivePreviewUrl] = useState<string | null>(null);
  const [activePreviewTitle, setActivePreviewTitle] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setRejectMode(false);
      setRejectReason("");
      setActivePreviewUrl(null);
      setErrorMsg(null);
    }
  }, [isOpen, driver]);

  if (!isOpen || !driver) return null;

  const handleApprove = async () => {
    try {
      setErrorMsg(null);
      await onApprove(driver.id);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to approve driver");
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectReason.trim()) return;
    try {
      setErrorMsg(null);
      await onReject(driver.id, rejectReason.trim());
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to reject driver application");
    }
  };

  const openDocumentPreview = (url: string | null, title: string) => {
    if (!url) return;
    setActivePreviewUrl(url);
    setActivePreviewTitle(title);
  };

  const documentItems = [
    { title: "Profile Picture", url: driver.profilePictureUrl },
    { title: "Driver License Front", url: driver.licenseFrontUrl },
    { title: "Driver License Back", url: driver.licenseBackUrl },
    { title: "Vehicle Plate Image", url: driver.vehiclePlateImage },
    { title: "Identity Proof Image", url: driver.identityProofImage },
  ];

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm animate-fade-in">
        <div className="bg-white border border-neutral-200 rounded-lg shadow-card w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="px-6 py-4 border-b border-neutral-200 flex justify-between items-center bg-neutral-50">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[18px] font-bold text-neutral-900">
                  Verify Delivery Partner Application
                </h2>
                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-semibold border uppercase ${
                  driver.onboardingStatus === "submitted" 
                    ? "bg-amber-50 text-amber-700 border-amber-200" 
                    : driver.onboardingStatus === "approved"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : driver.onboardingStatus === "rejected"
                    ? "bg-red-50 text-red-700 border-red-200"
                    : "bg-neutral-100 text-neutral-500 border-neutral-200"
                }`}>
                  {driver.onboardingStatus}
                </span>
              </div>
              <p className="text-[12px] text-neutral-500 mt-0.5">
                Review documents, driving credentials, and approve partner status.
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-neutral-700 transition-all p-1.5 hover:bg-neutral-100 rounded-full"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 flex flex-col md:flex-row gap-6">
            {/* Left Side: Details & Actions */}
            <div className="flex-1 flex flex-col gap-6 border-r border-neutral-100 pr-0 md:pr-6">
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-[13px] font-medium">
                  {errorMsg}
                </div>
              )}

              {/* Personal Info */}
              <div>
                <h3 className="text-[13px] font-bold text-neutral-400 uppercase tracking-wider mb-3">Personal Details</h3>
                <div className="bg-neutral-50 rounded-md p-4 flex flex-col gap-3 border border-neutral-100">
                  <div className="flex items-center gap-3">
                    {driver.profilePictureUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img 
                        src={driver.profilePictureUrl} 
                        alt="Profile" 
                        className="w-12 h-12 rounded-full object-cover border border-neutral-200 cursor-pointer"
                        onClick={() => openDocumentPreview(driver.profilePictureUrl, "Profile Picture")}
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-500">
                        <User size={20} />
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="font-bold text-neutral-900 text-[15px]">{driver.name}</span>
                      <span className="text-[12px] text-neutral-500">Registered {new Date(driver.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 border-t border-neutral-200/60 text-[13px] text-neutral-700">
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-neutral-400" />
                      <span>{driver.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail size={14} className="text-neutral-400" />
                      <span>{driver.email || "No Email Provided"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Vehicle & Compliance Details */}
              <div>
                <h3 className="text-[13px] font-bold text-neutral-400 uppercase tracking-wider mb-3">Vehicle & Credentials</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-neutral-50 rounded-md p-3.5 border border-neutral-100 flex items-start gap-3">
                    <div className="p-2 bg-primary-50 rounded text-primary-600">
                      <Truck size={16} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-semibold text-neutral-400 uppercase">Vehicle Type & Plate</span>
                      <span className="font-semibold text-neutral-800 text-[13px] capitalize">{driver.vehicleType || "Not Set"}</span>
                      <span className="text-[12px] text-neutral-500 uppercase font-medium">{driver.vehicleNumber || "No plate number"}</span>
                    </div>
                  </div>

                  <div className="bg-neutral-50 rounded-md p-3.5 border border-neutral-100 flex items-start gap-3">
                    <div className="p-2 bg-teal-50 rounded text-teal-600">
                      <FileText size={16} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-semibold text-neutral-400 uppercase">Driving License</span>
                      <span className="font-semibold text-neutral-800 text-[13px]">{driver.licenseNumber || "No License Number"}</span>
                      <span className="text-[12px] text-neutral-500 flex items-center gap-1">
                        <Calendar size={12} />
                        Expires: {driver.licenseExpiry || "N/A"}
                      </span>
                    </div>
                  </div>

                  <div className="bg-neutral-50 rounded-md p-3.5 border border-neutral-100 flex items-start gap-3 sm:col-span-2">
                    <div className="p-2 bg-indigo-50 rounded text-indigo-600">
                      <FileText size={16} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-semibold text-neutral-400 uppercase">Identity Proof ({driver.identityProofType || "N/A"})</span>
                      <span className="font-semibold text-neutral-800 text-[13px]">{driver.identityProofNumber || "No ID card number"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {driver.onboardingStatus === "rejected" && driver.rejectionReason && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-md flex items-start gap-2.5">
                  <AlertTriangle className="text-red-600 shrink-0 mt-0.5" size={16} />
                  <div className="flex flex-col gap-1 text-[13px]">
                    <span className="font-bold text-red-800">Previous Rejection Reason</span>
                    <span className="text-red-700">{driver.rejectionReason}</span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-auto pt-6 border-t border-neutral-100">
                {driver.onboardingStatus === "submitted" && !rejectMode && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => setRejectMode(true)}
                      className="flex-1 py-2.5 px-4 border border-red-200 text-red-600 hover:bg-red-50 rounded-md font-semibold text-[13.5px] transition-all"
                      disabled={isApproving}
                    >
                      Reject Application
                    </button>
                    <button
                      onClick={handleApprove}
                      className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-semibold text-[13.5px] rounded-md shadow-button-primary transition-all flex items-center justify-center gap-1.5"
                      disabled={isApproving}
                    >
                      {isApproving ? "Approving..." : (
                        <>
                          <Check size={16} />
                          <span>Approve Driver</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {rejectMode && (
                  <form onSubmit={handleRejectSubmit} className="flex flex-col gap-3 animate-slide-down">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[13px] font-bold text-neutral-700">Reason for Rejection</label>
                      <textarea
                        placeholder="e.g. License photo is blurred, or vehicle plate number doesn't match the photo."
                        rows={3}
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        className="px-3 py-2 border border-neutral-200 rounded-md text-[14px] bg-white focus:outline-none focus:border-red-500 transition-all resize-none"
                        required
                        disabled={isRejecting}
                      />
                    </div>
                    <div className="flex justify-end gap-3.5">
                      <button
                        type="button"
                        onClick={() => setRejectMode(false)}
                        className="px-4 py-2 border border-neutral-200 hover:bg-neutral-50 text-neutral-700 rounded-md text-[13px] font-semibold transition-all"
                        disabled={isRejecting}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-semibold text-[13px] px-5 py-2 rounded-md transition-all"
                        disabled={isRejecting || !rejectReason.trim()}
                      >
                        {isRejecting ? "Submitting..." : "Submit Rejection"}
                      </button>
                    </div>
                  </form>
                )}

                {driver.onboardingStatus !== "submitted" && (
                  <div className="flex justify-end">
                    <button
                      onClick={onClose}
                      className="px-5 py-2 border border-neutral-200 hover:bg-neutral-50 text-neutral-700 rounded-md text-[13px] font-semibold transition-all"
                    >
                      Close Overview
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right Side: Document Grid */}
            <div className="flex-1 flex flex-col gap-4">
              <h3 className="text-[13px] font-bold text-neutral-400 uppercase tracking-wider">Document Checklist</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {documentItems.map((doc) => (
                  <div 
                    key={doc.title}
                    className={`border border-neutral-200 rounded-md p-3.5 bg-white flex flex-col gap-2.5 shadow-sm transition-all group ${
                      doc.url ? "hover:border-primary-400 hover:shadow-md cursor-pointer" : "opacity-60 bg-neutral-50"
                    }`}
                    onClick={() => openDocumentPreview(doc.url, doc.title)}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] font-bold text-neutral-700">{doc.title}</span>
                      {doc.url ? (
                        <span className="text-primary-600 text-[11px] font-semibold flex items-center gap-1 group-hover:underline">
                          <Eye size={12} />
                          View
                        </span>
                      ) : (
                        <span className="text-[10px] text-neutral-400 italic">Not Uploaded</span>
                      )}
                    </div>

                    <div className="relative w-full h-32 rounded bg-neutral-100 overflow-hidden flex items-center justify-center border border-neutral-200/50">
                      {doc.url ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img 
                            src={doc.url} 
                            alt={doc.title} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                          />
                          <div className="absolute inset-0 bg-neutral-900/0 group-hover:bg-neutral-900/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <span className="px-2.5 py-1.5 rounded-md bg-white/90 text-[11px] font-bold text-neutral-800 shadow">
                              Preview Document
                            </span>
                          </div>
                        </>
                      ) : (
                        <FileText size={32} className="text-neutral-300" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full Document Preview Overlay */}
      {activePreviewUrl && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-4 bg-neutral-950/95 animate-fade-in">
          <div className="w-full max-w-4xl flex justify-between items-center mb-3">
            <h3 className="text-white text-[16px] font-bold">{activePreviewTitle}</h3>
            <button
              onClick={() => setActivePreviewUrl(null)}
              className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all"
            >
              <X size={20} />
            </button>
          </div>
          <div className="relative max-w-full max-h-[80vh] overflow-hidden rounded-md border border-white/10 shadow-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={activePreviewUrl} 
              alt={activePreviewTitle} 
              className="max-w-full max-h-[85vh] object-contain rounded bg-black"
            />
          </div>
        </div>
      )}
    </>
  );
}
