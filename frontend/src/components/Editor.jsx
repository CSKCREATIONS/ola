import React, { useState } from "react";
import { Editor } from "@tinymce/tinymce-react";

export default function FormularioConEditor() {
  const [contenido, setContenido] = useState("");

  const handleEditorChange = (content) => {
    setContenido(content);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Contenido del editor:", contenido);
  };

  return (
    <div className="container">
      <h3>Formulario con Editor TinyMCE</h3>
      <form onSubmit={handleSubmit}>
        <label>Nombre del Documento</label>
        <input type="text" name="nombre" required />

        <label>Contenido</label>
        <Editor
          apiKey="otu4s642tv612posr0ne65wrxy2i5kmop915g2gu2zbv5mho"  // Opcional, usa la versión gratuita
          initialValue="<p>Escribe aquí...</p>"
          init={{
            height: 1000,
            menubar: false,
            plugins: [
              "advlist autolink lists link image charmap print preview anchor",
              "searchreplace visualblocks code fullscreen",
              "insertdatetime media table paste code help wordcount",
            ],
            toolbar:
              "undo redo | formatselect | bold italic backcolor | \
              alignleft aligncenter alignright alignjustify | \
              bullist numlist outdent indent | removeformat | help",
          }}
          onEditorChange={handleEditorChange}
        />

        <button type="submit">Guardar</button>
      </form>
    </div>
  );
}
