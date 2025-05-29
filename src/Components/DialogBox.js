import styles from './DialogBox.module.css'
import React, { useState, useEffect } from 'react';
import Modal from 'react-bootstrap/Modal';

function DialogBox({ actionScript, action, questionDialog, isopen }) {

    const [modalIsOpen, setModalIsOpen] = useState(isopen);

    let actionChange;

    const handleCloseModal = (action) => {
        setModalIsOpen(false);
        actionScript(action);
    };

    return (
        <div>
            {
                <div>
                    <Modal show={modalIsOpen} backdrop="static" centered>
                        <Modal.Body>
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
                                        {questionDialog}
                                    </div>}
                            </div>
                        </Modal.Body>
                        {action != "processing"
                            && <Modal.Footer>
                                <div>
                                    <button className={`${styles.btn_cancel} me-3`} value={actionChange} onClick={() => handleCloseModal("Cancel")} >Cancel</button>
                                    <button className={`${styles.btn_style}`} value={actionChange} onClick={() => handleCloseModal("Ok")} >Ok</button>
                                </div>
                            </Modal.Footer>}

                    </Modal>

                </div>}
        </div>
    );
}

export default DialogBox