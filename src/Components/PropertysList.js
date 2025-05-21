import { useEffect, useState } from 'react';
import styles from './PropertysList.module.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

const PropertysList = ({ propertyList, selectProperty }) => {

  console.log('PropertysList', propertyList);

  const [filters, setFilters] = useState({
    minValor: '',
    maxValor: '',
    minArea: '',
    maxArea: '',
    quartos: '',
    banheiros: '',
    suites: '',
    vagas: '',
    cidade: '',
    uf: '',
    tipo: '',
  });
  const [searchTerm, setSearchTerm] = useState('');

  const setProperty = (property) => {
    selectProperty(property);
  };

  // Filtro aplicado sobre a lista
  const filteredList = propertyList.filter((property) => {
    const { fields } = property;
    const valor = Number(fields.Valor) || 0;
    const area = Number(fields.Area_util) || 0;

    if (filters.minValor && valor < Number(filters.minValor)) return false;
    if (filters.maxValor && valor > Number(filters.maxValor)) return false;
    if (filters.minArea && area < Number(filters.minArea)) return false;
    if (filters.maxArea && area > Number(filters.maxArea)) return false;
    if (filters.quartos && String(fields.Quartos) !== filters.quartos) return false;
    if (filters.banheiros && String(fields.Banheiros) !== filters.banheiros) return false;
    if (filters.suites && String(fields.Suites) !== filters.suites) return false;
    if (filters.vagas && String(fields.Vagas) !== filters.vagas) return false;
    if (filters.cidade && fields.Cidade && !fields.Cidade.toLowerCase().includes(filters.cidade.toLowerCase())) return false;
    if (filters.uf && fields.UF && fields.UF !== filters.uf) return false;
    if (filters.tipo && fields.Tipo && fields.Tipo !== filters.tipo) return false;
    if (
    searchTerm &&
    !(
      (fields.Bairro && fields.Bairro.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (fields.Tipo && fields.Tipo.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (fields.Codigo && fields.Codigo.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  ) {
    return false;
  }
    return true;
  });

  // Coleta opções únicas para selects dinâmicos
  const tipos = Array.from(new Set(propertyList.map(p => p.fields.Tipo).filter(Boolean)));
  const ufs = Array.from(new Set(propertyList.map(p => p.fields.UF).filter(Boolean)));

  return (
    <div className={styles.listContainer}>
      {/* Filtros */}
        <form className={styles.filterBar}>
          <input
            type="number"
            className={styles.filterInput}
            placeholder="Valor mín."
            value={filters.minValor}
            onChange={e => setFilters(f => ({ ...f, minValor: e.target.value }))}
            min={0}
          />
          <input
            type="number"
            className={styles.filterInput}
            placeholder="Valor máx."
            value={filters.maxValor}
            onChange={e => setFilters(f => ({ ...f, maxValor: e.target.value }))}
            min={0}
          />
          <input
            type="number"
            className={styles.filterInput}
            placeholder="Área mín."
            value={filters.minArea}
            onChange={e => setFilters(f => ({ ...f, minArea: e.target.value }))}
            min={0}
          />
          <input
            type="number"
            className={styles.filterInput}
            placeholder="Área máx."
            value={filters.maxArea}
            onChange={e => setFilters(f => ({ ...f, maxArea: e.target.value }))}
            min={0}
          />
          <input
            type="number"
            className={styles.filterInput}
            placeholder="Quartos"
            value={filters.quartos}
            onChange={e => setFilters(f => ({ ...f, quartos: e.target.value }))}
            min={0}
          />
          <input
            type="number"
            className={styles.filterInput}
            placeholder="Banheiros"
            value={filters.banheiros}
            onChange={e => setFilters(f => ({ ...f, banheiros: e.target.value }))}
            min={0}
          />
          <input
            type="number"
            className={styles.filterInput}
            placeholder="Suítes"
            value={filters.suites}
            onChange={e => setFilters(f => ({ ...f, suites: e.target.value }))}
            min={0}
          />
          <input
            type="number"
            className={styles.filterInput}
            placeholder="Vagas"
            value={filters.vagas}
            onChange={e => setFilters(f => ({ ...f, vagas: e.target.value }))}
            min={0}
          />
          <input
            type="text"
            className={styles.filterInput}
            placeholder="Cidade"
            value={filters.cidade}
            onChange={e => setFilters(f => ({ ...f, cidade: e.target.value }))}
          />
          <select
            className={styles.filterInput}
            value={filters.uf}
            onChange={e => setFilters(f => ({ ...f, uf: e.target.value }))}
          >
            <option value="">UF</option>
            {ufs.map(uf => <option key={uf} value={uf}>{uf}</option>)}
          </select>
          <select
            className={styles.filterInput}
            value={filters.tipo}
            onChange={e => setFilters(f => ({ ...f, tipo: e.target.value }))}
          >
            <option value="">Tipo</option>
            {tipos.map(tipo => <option key={tipo} value={tipo}>{tipo}</option>)}
          </select>
        </form>
        <input
          type="text"
          className={`${styles.filterInput} ${styles.searchInput}`}
          placeholder="Buscar por nome do imóvel, bairro ou código"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{ marginBottom: '1.5rem', width: '100%' }}
        />
        {/* Lista de imóveis */}
      <div className={styles.gridContainer}>
        {filteredList.map((property) => {
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
                      <button className="carousel-control-prev" type="button" data-bs-target={`#carousel-${id}`} data-bs-slide="prev" onClick={e => e.stopPropagation()}>
                        <span className="carousel-control-prev-icon" aria-hidden="true"></span>
                        <span className="visually-hidden">Previous</span>
                      </button>
                      <button className="carousel-control-next" type="button" data-bs-target={`#carousel-${id}`} data-bs-slide="next" onClick={e => e.stopPropagation()}>
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
    </div>
  );
};

export default PropertysList;