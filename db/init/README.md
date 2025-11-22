# MongoDB init scripts

Place initialization scripts and optional dumps under this folder. The `docker-compose.yml` mounts this folder
into the MongoDB container's `/docker-entrypoint-initdb.d` directory. Files here are executed automatically by the
official MongoDB image on the first container startup (when the database directory is empty).

How to restore a full dump automatically

- Produce a dump from an existing MongoDB (on your machine or server):

```powershell
# From your workstation where MongoDB is reachable
mongodump --uri="mongodb://localhost:27017/pangea" --out=./db/init/dump
```

- The resulting folder `db/init/dump` will contain one folder per database. The init script `02_restore_dump.sh`
  will run `mongorestore --drop` against that folder when the mongo container boots for the first time.

Notes
- Restores run only when the Mongo data volume is empty. To force re-run in development, remove the volume:

```powershell
docker-compose down
docker volume rm ola_mongo_data
docker-compose up -d
```

- Avoid committing large dump files to source control. Share dumps using private storage (S3, internal file share)
  and copy them into `db/init/dump` on the deploy host instead.
