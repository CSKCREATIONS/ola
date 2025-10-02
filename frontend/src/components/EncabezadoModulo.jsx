import React from 'react'
/**Este componente contiene el nombre de la pagina en la que se encuentra. Es llamado en todas aquellas paginas en las que se requiere exportar a excel y pdf, tambien para realizar busquedas */

export default function EncabezadoModulo(props) {
	return (
		<div className='encabezado-modulo'>
			<div>
				<h3>{props.titulo}</h3>
				<button style={{ background: 'transparent', cursor: 'pointer' }} onClick={props.exportToExcel}><i className="fa-solid fa-file-excel"></i> <span>Exportar a Excel</span></button>
				<button style={{ background: 'transparent', cursor: 'pointer' }} onClick={props.exportarPDF}><i className="fa-solid fa-file-pdf"></i> <span>Exportar a PDF</span></button>
			</div>

		</div>
	)
}