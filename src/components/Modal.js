"use client";

import { FiX } from "react-icons/fi";
import { colors } from "../theme";

/**
 * Modal Component
 * Dialog/Modal for showing content
 */
export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer = null,
  size = "md",
  closeButton = true,
}) => {
  if (!isOpen) return null;

  const sizes = {
    sm: "w-96",
    md: "w-[32rem]",
    lg: "w-2xl",
    xl: "w-4xl",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`relative bg-white rounded-lg shadow-2xl overflow-hidden ${sizes[size]}`}
      >
        {/* Header */}
        {(title || closeButton) && (
          <div
            className="flex items-center justify-between px-6 py-4 border-b"
            style={{ borderColor: colors.neutral[200] }}
          >
            {title && (
              <h2 className="text-lg font-bold text-gray-900">{title}</h2>
            )}
            {closeButton && (
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-100 rounded-lg transition"
              >
                <FiX size={24} />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="px-6 py-4">{children}</div>

        {/* Footer */}
        {footer && (
          <div
            className="px-6 py-4 border-t flex justify-end gap-2"
            style={{ borderColor: colors.neutral[200] }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Drawer Component
 * Side drawer for showing content
 */
export const Drawer = ({
  isOpen,
  onClose,
  title,
  children,
  position = "right",
  width = "w-80",
}) => {
  if (!isOpen) return null;

  const positionClasses = {
    left: "left-0",
    right: "right-0",
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`absolute top-0 ${positionClasses[position]} h-full ${width} bg-white shadow-lg overflow-y-auto transform transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        {(title) && (
          <div
            className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white"
            style={{ borderColor: colors.neutral[200] }}
          >
            <h2 className="text-lg font-bold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-lg transition"
            >
              <FiX size={24} />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>
  );
};

export default { Modal, Drawer };
