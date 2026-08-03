"use client";
import { useState } from "react";

interface DoctorCommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (comment: string) => void;
  title: string;
  actionLabel: string;
  status: string;
}

export default function DoctorCommentModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  actionLabel,
  status,
}: DoctorCommentModalProps) {
  const [comment, setComment] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(comment);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'text-green-600 dark:text-green-400';
      case 'COMPLETED': return 'text-blue-600 dark:text-blue-400';
      case 'CANCELLED': return 'text-red-600 dark:text-red-400';
      default: return 'text-yellow-600 dark:text-yellow-400';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl max-w-md w-full p-6 shadow-xl">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          You are about to mark this appointment as{" "}
          <strong className={getStatusColor(status)}>{status}</strong>.
          Add a comment for the patient (optional):
        </p>
        <form onSubmit={handleSubmit}>
          <textarea
            className="w-full p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            rows={4}
            placeholder="Add your comments here..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <div className="flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-4 py-2 text-sm text-white rounded-lg transition ${
                status === 'CONFIRMED' 
                  ? 'bg-yellow-500 hover:bg-yellow-600'
                  : status === 'COMPLETED'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-500 hover:bg-red-600'
              }`}
            >
              {actionLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
