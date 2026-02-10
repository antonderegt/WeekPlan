import React from 'react';
import type { ShoppingItem } from '../types';
import Modal from './Modal';

interface ShoppingListModalProps {
  isOpen: boolean;
  items: ShoppingItem[];
  onClose: () => void;
}

export default function ShoppingListModal({ isOpen, items, onClose }: ShoppingListModalProps) {
  return (
    <Modal
      title="Shopping list"
      isOpen={isOpen}
      onClose={onClose}
      footer={
        <div className="modal-actions">
          <button type="button" className="ghost" onClick={onClose}>
            Close
          </button>
        </div>
      }
    >
      {items.length === 0 ? (
        <p>No meals planned for this week.</p>
      ) : (
        <ul className="shopping-list">
          {items.map((item) => (
            <li key={`${item.ingredientId}-${item.unit}`}>
              <span>{item.name}</span>
              <span>
                {item.quantity} {item.unit}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
