import { PAGE_SIZE } from '../constants';
import { useState, useEffect } from 'react';
import { useRef } from 'react';
import styles from './PropertysList.module.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

const PropertysList = ({ propertyList, selectProperty, itemsToShow, setItemsToShow, loading }) => {
  const bottomRef = useRef(null);
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
  const [expandedDesc, setExpandedDesc] = useState({});
  const [imageLoaded, setImageLoaded] = useState({});
  const [showFilters, setShowFilters] = useState(window.innerWidth > 600);

  console.log('PropertysList - Recebeu propertyList:', propertyList);
  console.log('PropertysList - propertyList é array?', Array.isArray(propertyList));
  console.log('PropertysList - Tamanho da propertyList:', propertyList?.length);
  console.log('PropertysList - Loading status:', loading);
  console.log('PropertysList - itemsToShow:', itemsToShow);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 600) setShowFilters(true);
      else setShowFilters(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Verificação defensiva para garantir que propertyList é um array
  const safePropertyList = Array.isArray(propertyList) ? propertyList : [];
  
  // Inspecionar alguns itens da lista para debug
  if (safePropertyList.length > 0) {
    console.log('PropertysList - Primeiro item da lista:', safePropertyList[0]);
    console.log('PropertysList - Segundo item da lista (se existir):', safePropertyList[1]);
    console.log('PropertysList - fields do primeiro item:', safePropertyList[0]?.fields);
    console.log('PropertysList - Tipo do primeiro item:', typeof safePropertyList[0]);
    console.log('PropertysList - _rawJson?', safePropertyList[0]?._rawJson);
  }
  
  // Filtro aplicado sobre a lista
  const filteredList = safePropertyList.filter((property) => {
    // Verificar se property existe
    if (!property) {
      console.log('PropertysList - Item nulo/undefined encontrado');
      return false;
    }
    
    // Verificar se é um objeto Airtable Record ou se tem os campos necessários
    if (!property.fields) {
      console.log('PropertysList - Item sem fields encontrado:', property);
      return false;
    }
    
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

  // Coleta opções únicas para selects dinâmicos (com verificação defensiva)
  const tipos = Array.isArray(safePropertyList) 
    ? Array.from(new Set(safePropertyList
        .filter(p => p && p.fields)
        .map(p => p.fields.Tipo)
        .filter(Boolean)))
    : [];
  const ufs = Array.isArray(safePropertyList)
    ? Array.from(new Set(safePropertyList
        .filter(p => p && p.fields)
        .map(p => p.fields.UF)
        .filter(Boolean)))
    : [];

  // Função para pré-carregar imagens dos próximos imóveis
  useEffect(() => {
    const nextPage = filteredList.slice(itemsToShow, itemsToShow + PAGE_SIZE);
    nextPage.forEach(property => {
      // Verificação defensiva
      if (!property || !property.fields || !property.fields.Fotos_URLs) {
        return;
      }
      
      try {
        const images = property.fields.Fotos_URLs.split('\n').filter(Boolean);
        // Corrigir URLs HTTP para HTTPS para evitar Mixed Content
        images.forEach(url => {
          try {
            const secureUrl = url.replace(/^http:\/\//i, 'https://');
            const img = new window.Image();
            img.src = secureUrl;
          } catch (e) {
            console.error('Erro ao pré-carregar imagem:', e);
          }
        });
      } catch (e) {
        console.error('Erro ao processar URLs de imagens:', e);
      }
    });
  }, [itemsToShow, filteredList]);

  // Função para verificar se a descrição deve ser colapsada
  const shouldClamp = (desc) => {
    if (!desc) return false;
    return desc.split('\n').length > 5 || desc.length > 350;
  };

  // Botão para carregar mais imóveis
  const handleLoadMore = () => {
    setItemsToShow(prev => prev + PAGE_SIZE);
  };

  return (
    <div className={styles.listContainer}>
      {/* Loader para o carregamento inicial */}
      {loading && itemsToShow === PAGE_SIZE ? (
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <div className={styles.loader}></div>
          <div style={{ marginTop: '.5rem', textAlign: 'center', color: '#68bf6c', fontWeight: 'bold' }}>Carregando Imóveis</div>
        </div>
      ) : (
        <>
          {/* Botão de filtro para mobile */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <button
              className="btn btn-light d-md-none"
              style={{
                border: '1px solid #e6eaf0',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(44,62,80,0.06)',
                display: window.innerWidth <= 600 ? 'block' : 'none'
              }}
              onClick={() => setShowFilters(f => !f)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="#68bf6c" className="bi bi-funnel-fill" viewBox="0 0 16 16">
                <path d="M1.5 1.5A.5.5 0 0 1 2 1h12a.5.5 0 0 1 .4.8l-4.6 6.13V13.5a.5.5 0 0 1-.8.4l-2-1.5a.5.5 0 0 1-.2-.4V7.93L1.6 1.8A.5.5 0 0 1 1.5 1.5z" />
              </svg>
              <span style={{ marginLeft: 8, color: '#68bf6c', fontWeight: 600 }}>Filtros</span>
            </button>
          </div>
          
          {/* Filtros */}
          {showFilters && (
            <form className={styles.filterBar}>
              {/* Filtros aqui... */}
              <input
                type="number"
                className={styles.filterInput}
                placeholder="Valor mín."
                value={filters.minValor}
                onChange={handleFilterChange((f, e) => ({ ...f, minValor: e.target.value }))}
                min={0}
              />
              <input
                type="number"
                className={styles.filterInput}
                placeholder="Valor máx."
                value={filters.maxValor}
                onChange={handleFilterChange((f, e) => ({ ...f, maxValor: e.target.value }))}
                min={0}
              />
              {/* Outros filtros... */}
              <select
                className={styles.filterInput}
                value={filters.uf}
                onChange={handleFilterChange((f, e) => ({ ...f, uf: e.target.value }))}
              >
                <option value="">UF</option>
                {ufs.map(uf => <option key={uf} value={uf}>{uf}</option>)}
              </select>
              <select
                className={styles.filterInput}
                value={filters.tipo}
                onChange={handleFilterChange((f, e) => ({ ...f, tipo: e.target.value }))}
              >
                <option value="">Tipo</option>
                {tipos.map(tipo => <option key={tipo} value={tipo}>{tipo}</option>)}
              </select>
            </form>
          )}
          
          <input
            type="text"
            className={`${styles.filterInput} ${styles.searchInput}`}
            placeholder="Buscar por nome do imóvel, bairro ou código"
            value={searchTerm}
            onChange={handleSearchChange}
            style={{ marginBottom: '1.5rem', width: '100%' }}
          />
          
          {/* Lista de imóveis */}
          <div className={styles.gridContainer}>
            {filteredList.length === 0 ? (
              <div className="alert alert-info" style={{width: '100%', textAlign: 'center'}}>
                Nenhum imóvel encontrado. Verifique os filtros aplicados.
              </div>
            ) : (
              paginatedList.map((property, idx) => {
                if (!property || !property.fields) return null;
                
                const { fields, id } = property;
                
                // Extrair URLs de imagens com segurança
                let images = [];
                try {
                  if (fields.Fotos_URLs) {
                    images = fields.Fotos_URLs.split('\n')
                      .filter(Boolean)
                      .map(url => url.replace(/^http:\/\//i, 'https://'));
                  }
                } catch (e) {
                  console.error('Erro ao processar URLs de fotos:', e);
                }
                
                const desc = fields.Descricao || 'Sem descrição.';
                const isClamped = shouldClamp(desc) && !expandedDesc[id];
                
                return (
                  <div
                    className={styles.propertyCard}
                    key={id}
                    onClick={() => setProperty(property, idx)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className={styles.carouselContainer}>
                      <div id={`carousel-${id}`} className="carousel slide" data-bs-ride="carousel">
                        <div className="carousel-inner">
                          {images.length > 0 ? (
                            images.map((imgUrl, i) => (
                              <div
                                className={`carousel-item${i === 0 ? ' active' : ''}`}
                                key={imgUrl}
                                style={{ position: 'relative', minHeight: '180px' }}
                              >
                                {!imageLoaded[`${id}-${i}`] && (
                                  <div
                                    style={{
                                      position: 'absolute',
                                      inset: 0,
                                      background: '#eee',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      zIndex: 2
                                    }}
                                    className={styles.skeleton}
                                  >
                                    <span style={{ color: '#bbb', fontWeight: 500 }}>Carregando imagem...</span>
                                  </div>
                                )}
                                <img
                                  src={imgUrl}
                                  loading="lazy"
                                  className={`d-block w-100 ${styles.propertyImage}`}
                                  alt={`Foto ${i + 1}`}
                                  style={imageLoaded[`${id}-${i}`] ? {} : { display: 'none' }}
                                  onLoad={() => setImageLoaded(prev => ({ ...prev, [`${id}-${i}`]: true }))}
                                  onError={(e) => {
                                    console.error('Erro ao carregar imagem:', imgUrl);
                                    e.target.src = 'https://via.placeholder.com/800x600?text=Imagem+não+disponível';
                                    setImageLoaded(prev => ({ ...prev, [`${id}-${i}`]: true }));
                                  }}
                                />
                              </div>
                            ))
                          ) : (
                            <div 
                              className="carousel-item active" 
                              style={{ minHeight: '180px', background: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <span style={{ color: '#888', textAlign: 'center' }}>Sem imagens disponíveis</span>
                            </div>
                          )}
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
                      <div
                        className={`${styles.propertyDesc} ${isClamped ? styles.clamped : ''}`}
                        style={{ position: 'relative' }}
                      >
                        <h6 className={`${styles.textDesc}`}>{desc}</h6>
                        {shouldClamp(desc) && (
                          <button
                            type="button"
                            className="btn btn-link p-0"
                            style={{
                              fontSize: '1.3em',
                              color: '#68bf6c',
                              position: 'absolute',
                              right: 0,
                              bottom: 0,
                              background: 'rgba(255,255,255,0.85)',
                              zIndex: 2,
                              textDecoration: 'none'
                            }}
                            onClick={e => {
                              e.stopPropagation();
                              setExpandedDesc(prev => ({
                                ...prev,
                                [id]: !prev[id]
                              }));
                            }}
                          >
                            {expandedDesc[id] ? (
                              <span title="Mostrar menos" style={{ fontWeight: 600 }}>&#9650;</span>
                            ) : (
                              <span title="Mostrar mais" style={{ fontWeight: 600 }}>&#9660;</span>
                            )}
                          </button>
                        )}
                      </div>
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
              })
            )}
          </div>
          
          {itemsToShow < filteredList.length && (
            <div style={{ display: 'flex', justifyContent: 'center', margin: '2rem 0' }}>
              <button
                className="btn"
                style={{
                  backgroundColor: '#68bf6c',
                  color: '#fff',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: '1.1em',
                  padding: '0.7em 2.2em',
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(104,191,108,0.10)'
                }}
                onClick={handleLoadMore}
              >
                Carregar Próxima Página
              </button>
              <div ref={bottomRef} tabIndex={-1} />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PropertysList;
