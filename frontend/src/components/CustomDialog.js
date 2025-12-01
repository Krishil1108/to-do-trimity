import React from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X, Trash2 } from 'lucide-react';

const CustomDialog = ({ isOpen, onClose, title, message, type = 'info', onConfirm, confirmText = 'OK', cancelText = 'Cancel' }) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-12 h-12 text-green-500" />;
      case 'error':
        return <XCircle className="w-12 h-12 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-12 h-12 text-yellow-500" />;
      case 'confirm':
        return <AlertCircle className="w-12 h-12 text-blue-500" />;
      case 'delete':
        return <Trash2 className="w-12 h-12 text-red-500" />;
      default:
        return <Info className="w-12 h-12 text-blue-500" />;
    }
  };

  const getColors = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          button: 'bg-green-600 hover:bg-green-700'
        };
      case 'error':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          button: 'bg-red-600 hover:bg-red-700'
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          button: 'bg-yellow-600 hover:bg-yellow-700'
        };
      case 'delete':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          button: 'bg-red-600 hover:bg-red-700'
        };
      default:
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          button: 'bg-blue-600 hover:bg-blue-700'
        };
    }
  };

  const colors = getColors();
  const isConfirmDialog = type === 'confirm' || type === 'delete';

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 animate-fadeIn">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full animate-slideUp">
        {/* Header */}
        <div className={`${colors.bg} ${colors.border} border-b px-6 py-4 rounded-t-lg flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            {getIcon()}
            <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
          </div>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          <p className="text-gray-700 whitespace-pre-line leading-relaxed">{message}</p>
        </div>

        {/* Footer */}
        <div className={`px-6 py-4 bg-gray-50 rounded-b-lg flex gap-3 ${isConfirmDialog ? 'justify-end' : 'justify-center'}`}>
          {isConfirmDialog && (
            <button
              onClick={handleCancel}
              className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={handleConfirm}
            className={`px-6 py-2.5 ${colors.button} text-white rounded-lg transition-colors font-medium shadow-md hover:shadow-lg`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomDialog;
