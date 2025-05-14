import { useEffect, useState } from 'react';
import styles from './PropertysList.module.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

const PropertysList = ({ propertyList, selectProperty }) => {

  const setProperty = (property) => {
    selectProperty(property);
  }

  return (
    <div className={styles.listContainer}>
      {propertyList.map((property) => {
        const { fields, id } = property;
        const images = fields.Fotos_URLs
          ? fields.Fotos_URLs.split('\n').filter(Boolean)
          : [];

        return (
          <div
            className={styles.propertyCard}
            key={id}
            onClick={() => setProperty(property)}
            style={{ cursor: 'pointer' }}
          >
            <div className={styles.carouselContainer}>
              <div id={`carousel-${id}`} className="carousel slide" data-bs-ride="carousel">
                <div className="carousel-inner">
                  {images.map((imgUrl, i) => (
                    <div className={`carousel-item${i === 0 ? ' active' : ''}`} key={imgUrl}>
                      <img src={imgUrl} className={`d-block w-100 ${styles.propertyImage}`} alt={`Foto ${i + 1}`} />
                    </div>
                  ))}
                </div>
                {images.length > 1 && (
                  <>
                    <button className="carousel-control-prev" type="button" data-bs-target={`#carousel-${id}`} data-bs-slide="prev">
                      <span className="carousel-control-prev-icon" aria-hidden="true"></span>
                      <span className="visually-hidden">Previous</span>
                    </button>
                    <button className="carousel-control-next" type="button" data-bs-target={`#carousel-${id}`} data-bs-slide="next">
                      <span className="carousel-control-next-icon" aria-hidden="true"></span>
                      <span className="visually-hidden">Next</span>
                    </button>
                  </>
                )}
              </div>
            </div>
            <div className={styles.infoContainer}>
              <h5 className={styles.propertyTitle}>{fields.Tipo || 'Imóvel'} - {fields.Bairro || ''}</h5>
              <p className={styles.propertyDesc}>{fields.Descricao || 'Sem descrição.'}</p>
              <div className={styles.propertyDetails}>
                <span>
                  <strong>Valor:</strong>{' '}
                  {fields.Valor
                    ? fields.Valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                    : 'Não informado'}
                </span>
                <span><strong>Quartos:</strong> {fields.Quartos || '-'}</span>
                <span><strong>Banheiros:</strong> {fields.Banheiros || '-'}</span>
                <span><strong>Suítes:</strong> {fields.Suites || '-'}</span>
                <span><strong>Vagas:</strong> {fields.Vagas || '-'}</span>
                <span><strong>Área útil:</strong> {fields.Area_util ? `${fields.Area_util} m²` : '-'}</span>
                <span><strong>Cidade:</strong> {fields.Cidade || '-'}</span>
                <span><strong>UF:</strong> {fields.UF || '-'}</span>
                <span><strong>Código:</strong> {fields.Codigo || '-'}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PropertysList;