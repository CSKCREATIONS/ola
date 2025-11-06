This folder has been archived.

All former utility/migration/test scripts were moved to:

../archived-scripts/2025-11-02_maint/

Why:
- Reduce repo clutter and avoid accidental execution in production.
- Keep historical scripts available for reference.

How to use an archived script:
1) Copy the script you need from the archive to a temporary location (or run it with node using the archive path).
2) Ensure your .env has a valid MONGODB_URI for your local/dev database.
3) Run with Node.js (Windows PowerShell example):
   node ..\archived-scripts\2025-11-02_maint\<scriptName>.js

If you need any script restored to active maintenance, create an issue or move it back intentionally.
