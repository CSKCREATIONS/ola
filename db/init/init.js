print("[init.js] Inicializando MongoDB para Pangea...");

const adminDB = db.getSiblingDB("admin");

adminDB.createUser({
  user: "root",
  pwd: "PangeaArdilla123",
  roles: [
    { role: "root", db: "admin" }
  ]
});

print("[init.js] Usuario root creado.");

print("[init.js] Restaurando base de datos desde dump...");
var rc = runProgram(
  "mongorestore",
  "--nsInclude=pangea.*",
  "--drop",
  "/docker-entrypoint-initdb.d/dump/pangea1"
);

if (rc === 0) {
  print("[init.js] 🔥 Restauración completada correctamente.");
} else {
  print("[init.js] ❌ mongorestore error code:", rc);
}

print("[init.js] ✔ Inicialización terminada!");
