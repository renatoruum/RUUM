import React from 'react';
import styles from './CustomModal.module.css';

const CustomModal = ({ show, onClose, children }) => {
  if (!show) return null;
  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <button className={styles.closeBtn} onClick={onClose}>&times;</button>
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
};

export default CustomModal;