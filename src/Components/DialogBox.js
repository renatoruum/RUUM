import styles from './DialogBox.module.css'
import React, { useState, useEffect } from 'react';
import Modal from 'react-bootstrap/Modal';

function DialogBox({ actionScript, action, questionDialog, optionsDialog }) {

    let actionChange;

    const handleCloseModal = (action) => {
        actionScript(action);
    };

    return (
        <div>
            <div>
                {action === "processing"
                    ? <div className='d-flex align-items-center justify-content-center flex-column'>
                        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                            <div className={styles.loader}></div>
                            <div style={{ marginTop: '.5rem', textAlign: 'center', color: '#68bf6c', fontWeight: 'bold' }}>
                                <h6>{questionDialog}</h6>
                            </div>
                        </div>
                    </div>
                    : <div>
                        <h5 className='mt-5'>
                            {questionDialog}
                        </h5>
                        <div className='d-flex justify-content-center mt-5'>
                            <button className={`${styles.btn_cancel} me-3`} value={actionChange} onClick={() => handleCloseModal("Cancel")} >Cancel</button>
                            <button className={`${styles.btn_style}`} value={actionChange} onClick={() => handleCloseModal("Ok")} >Ok</button>
                        </div>
                    </div>}
            </div>
        </div>
    );
}

export default DialogBox