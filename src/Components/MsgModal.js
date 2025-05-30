import React from 'react';
import styles from './MsgModal.module.css';

const MsgModal = ({ show, onClose, children }) => {
    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.content}>{children}</div>
            </div>
        </div>
    )
}

export default MsgModal