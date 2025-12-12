{mostrarModalAgendar && (
  <div className="modal-overlay">
    <div className="modal-lg">
      <div className="modal-header">
        <h5 className="modal-title">Agendar Pedido</h5>
        <button className="modal-close" onClick={() => setMostrarModalAgendar(false)}>&times;</button>
      </div>
      <div className="modal-body">
        <form onSubmit={(e) => { e.preventDefault(); handleGuardarAgendar(); }}>
          {/* Información del Cliente */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h6 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', color: '#1f2937' }}>
              Información del Cliente
            </h6>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
              <div style={{ position: 'relative' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Cliente <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={agendarCliente}
                  onChange={handleAgendarClienteChange}
                  onFocus={() => agendarCliente && setShowDropdownAgendar(true)}
                  onBlur={() => setTimeout(() => setShowDropdownAgendar(false), 200)}
                  placeholder="Nombre o razón social"
                  style={{ 
                    width: '100%', 
                    padding: '0.6rem', 
                    border: errors.cliente ? '1px solid #ef4444' : '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
                {errors.cliente && <span style={{ color: '#ef4444', fontSize: '12px' }}>{errors.cliente}</span>}
                {showDropdownAgendar && filteredClientesAgendar.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: 'white',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    zIndex: 1000,
                    marginTop: '4px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                  }}>
                    {filteredClientesAgendar.map((c, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleDropdownSelectCliente(c)}
                        style={{
                          padding: '0.6rem',
                          cursor: 'pointer',
                          borderBottom: idx < filteredClientesAgendar.length - 1 ? '1px solid #f3f4f6' : 'none',
                          fontSize: '14px'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                      >
                        {c.nombre}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Ciudad
                </label>
                <input
                  type="text"
                  value={agendarCiudad}
                  onChange={(e) => setAgendarCiudad(e.target.value)}
                  placeholder="Ciudad"
                  style={{ width: '100%', padding: '0.6rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Dirección
                </label>
                <input
                  type="text"
                  value={agendarDireccion}
                  onChange={(e) => setAgendarDireccion(e.target.value)}
                  placeholder="Dirección"
                  style={{ width: '100%', padding: '0.6rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Teléfono <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={agendarTelefono}
                  onChange={(e) => {
                    setAgendarTelefono(e.target.value);
                    if (errors.telefono) setErrors(prev => ({ ...prev, telefono: undefined }));
                  }}
                  placeholder="Teléfono"
                  style={{ 
                    width: '100%', 
                    padding: '0.6rem', 
                    border: errors.telefono ? '1px solid #ef4444' : '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
                {errors.telefono && <span style={{ color: '#ef4444', fontSize: '12px' }}>{errors.telefono}</span>}
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Correo <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="email"
                  value={agendarCorreo}
                  onChange={(e) => {
                    setAgendarCorreo(e.target.value);
                    if (errors.correo) setErrors(prev => ({ ...prev, correo: undefined }));
                  }}
                  placeholder="correo@ejemplo.com"
                  style={{ 
                    width: '100%', 
                    padding: '0.6rem', 
                    border: errors.correo ? '1px solid #ef4444' : '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
                {errors.correo && <span style={{ color: '#ef4444', fontSize: '12px' }}>{errors.correo}</span>}
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Fecha Agendamiento <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="date"
                  value={agendarFechaAg}
                  onChange={(e) => {
                    setAgendarFechaAg(e.target.value);
                    if (errors.fechaAg) setErrors(prev => ({ ...prev, fechaAg: undefined }));
                  }}
                  style={{ 
                    width: '100%', 
                    padding: '0.6rem', 
                    border: errors.fechaAg ? '1px solid #ef4444' : '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
                {errors.fechaAg && <span style={{ color: '#ef4444', fontSize: '12px' }}>{errors.fechaAg}</span>}
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                  Fecha Entrega <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="date"
                  value={agendarFechaEnt}
                  onChange={(e) => {
                    setAgendarFechaEnt(e.target.value);
                    if (errors.fechaEnt) setErrors(prev => ({ ...prev, fechaEnt: undefined }));
                  }}
                  style={{ 
                    width: '100%', 
                    padding: '0.6rem', 
                    border: errors.fechaEnt ? '1px solid #ef4444' : '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
                {errors.fechaEnt && <span style={{ color: '#ef4444', fontSize: '12px' }}>{errors.fechaEnt}</span>}
              </div>
            </div>
          </div>

          {/* Productos */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h6 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#1f2937' }}>
                Productos <span style={{ color: '#ef4444' }}>*</span>
              </h6>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={agregarProductoAgendar}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  <i className="fas fa-plus" style={{ marginRight: '0.5rem' }}></i>
                  Agregar Producto
                </button>
                {agendarProductos.length > 0 && (
                  <button
                    type="button"
                    onClick={limpiarProductosAgendados}
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    <i className="fas fa-trash" style={{ marginRight: '0.5rem' }}></i>
                    Limpiar Todo
                  </button>
                )}
              </div>
            </div>

            {errors.productos && <div style={{ color: '#ef4444', fontSize: '14px', marginBottom: '1rem' }}>{errors.productos}</div>}

            {agendarProductos.map((prod, idx) => (
              <div key={prod.uid} style={{ 
                background: '#f9fafb', 
                padding: '1rem', 
                borderRadius: '8px', 
                marginBottom: '1rem',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontWeight: '600', color: '#374151' }}>Producto {idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => eliminarProductoAgendar(idx)}
                    style={{
                      background: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '0.25rem 0.5rem',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '13px', fontWeight: '500' }}>
                      Producto
                    </label>
                    <select
                      value={prod.producto}
                      onChange={(e) => handleProductoSelectAgendar(idx, e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: productErrors[idx]?.producto ? '1px solid #ef4444' : '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '13px'
                      }}
                    >
                      <option value="">Seleccionar...</option>
                      {productosDisponibles.map(p => (
                        <option key={p._id || p.id} value={p._id || p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    {productErrors[idx]?.producto && (
                      <span style={{ color: '#ef4444', fontSize: '11px' }}>{productErrors[idx].producto}</span>
                    )}
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '13px', fontWeight: '500' }}>
                      Cantidad
                    </label>
                    <input
                      type="number"
                      name="cantidad"
                      value={prod.cantidad}
                      onChange={(e) => handleProductoAgendarChange(idx, e)}
                      placeholder="0"
                      min="0"
                      step="1"
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: productErrors[idx]?.cantidad ? '1px solid #ef4444' : '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '13px'
                      }}
                    />
                    {productErrors[idx]?.cantidad && (
                      <span style={{ color: '#ef4444', fontSize: '11px' }}>{productErrors[idx].cantidad}</span>
                    )}
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '13px', fontWeight: '500' }}>
                      Valor Unitario
                    </label>
                    <input
                      type="number"
                      name="valorUnitario"
                      value={prod.valorUnitario}
                      onChange={(e) => handleProductoAgendarChange(idx, e)}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: productErrors[idx]?.valorUnitario ? '1px solid #ef4444' : '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '13px'
                      }}
                    />
                    {productErrors[idx]?.valorUnitario && (
                      <span style={{ color: '#ef4444', fontSize: '11px' }}>{productErrors[idx].valorUnitario}</span>
                    )}
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '13px', fontWeight: '500' }}>
                      Descuento (%)
                    </label>
                    <input
                      type="number"
                      name="descuento"
                      value={prod.descuento}
                      onChange={(e) => handleProductoAgendarChange(idx, e)}
                      placeholder="0"
                      min="0"
                      max="100"
                      step="0.01"
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '13px'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '13px', fontWeight: '500' }}>
                      Subtotal
                    </label>
                    <input
                      type="text"
                      value={prod.subtotal}
                      readOnly
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '13px',
                        background: '#f3f4f6',
                        fontWeight: '600'
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginTop: '0.75rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '13px', fontWeight: '500' }}>
                    Descripción
                  </label>
                  <textarea
                    name="descripcion"
                    value={prod.descripcion}
                    onChange={(e) => handleProductoAgendarChange(idx, e)}
                    placeholder="Descripción del producto"
                    rows="2"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: '13px',
                      resize: 'vertical'
                    }}
                  />
                </div>
              </div>
            ))}

            {agendarProductos.length > 0 && (
              <div style={{ 
                background: '#f0fdf4', 
                padding: '1rem', 
                borderRadius: '8px',
                border: '1px solid #bbf7d0'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: '600', color: '#166534' }}>Total General:</span>
                  <span style={{ fontSize: '1.5rem', fontWeight: '700', color: '#166534' }}>
                    ${agendarProductos.reduce((sum, p) => sum + (parseFloat(p.subtotal) || 0), 0).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Descripción y Condiciones */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                Descripción
              </label>
              <Editor
                apiKey="your-tinymce-api-key"
                onInit={(evt, editor) => descripcionRef.current = editor}
                init={{
                  height: 200,
                  menubar: false,
                  plugins: ['lists', 'link'],
                  toolbar: 'undo redo | bold italic | bullist numlist'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                Condiciones de Pago
              </label>
              <Editor
                apiKey="your-tinymce-api-key"
                onInit={(evt, editor) => condicionesRef.current = editor}
                init={{
                  height: 200,
                  menubar: false,
                  plugins: ['lists', 'link'],
                  toolbar: 'undo redo | bold italic | bullist numlist'
                }}
              />
            </div>
          </div>

          {/* Botones */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
            <button
              type="button"
              onClick={() => setMostrarModalAgendar(false)}
              style={{
                padding: '0.625rem 1.5rem',
                background: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              style={{
                padding: '0.625rem 1.5rem',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              <i className="fas fa-save" style={{ marginRight: '0.5rem' }}></i>
              Guardar Pedido
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
)}
