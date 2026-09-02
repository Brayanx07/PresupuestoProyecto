# Presupuesto Mensual Personal

Proyecto de la asignatura Fundamentos de Sistemas de Bases de Datos.

Es un sistema para llevar el control de las finanzas personales: se define un
presupuesto para un período (por ejemplo enero a marzo), se le asigna un monto
mensual a cada subcategoría de gasto, y después se registran las transacciones
reales. El sistema compara lo planeado contra lo ejecutado y muestra reportes.

Los montos se manejan en Lempiras (HNL).

## Tecnologías

- Base de datos: Firebird 5.0
- Backend: Node.js
- Frontend: React

Toda la lógica de negocio vive en la base de datos. El backend no ejecuta SQL
directo, únicamente invoca procedimientos almacenados y funciones.

## Estructura del repositorio

```
Database/
  DDL/
    01_crear_tablas.sql       Las 7 tablas
    02_llaves_foraneass.sql   Las 11 llaves foráneas
    03_indices.sql            Índices sobre año/mes de TRANSACCION
Docs/
  ModeloRelacional.dbml       Modelo relacional (se abre en dbdiagram.io)
  ERD.jpeg                    Diagrama entidad-relación
```

## Modelo de datos

Son siete entidades:

| Tabla | Para qué sirve |
|---|---|
| USUARIO | La persona que usa el sistema |
| CATEGORIA | Agrupación general: Alimentación, Transporte, Salario |
| SUBCATEGORIA | El detalle: Supermercado, Restaurantes |
| PRESUPUESTO | El período y los totales planificados |
| PRESUPUESTO_DETALLE | Cuánto se asigna por mes a cada subcategoría |
| OBLIGACION_FIJA | Pagos que se repiten cada mes |
| TRANSACCION | Los movimientos que ocurrieron de verdad |

Dos cosas del modelo que conviene tener claras:

**El monto del detalle es mensual, no total.** Si un presupuesto va de enero a
marzo y se asignan L. 4,000 a Supermercado, eso significa L. 4,000 en cada uno
de los tres meses. Es un solo registro, no tres.

**TRANSACCION no tiene llave foránea hacia PRESUPUESTO_DETALLE.** El monto
ejecutado no se almacena: se calcula al momento de consultarlo, cruzando
`ID_PRESUPUESTO`, `ID_SUBCATEGORIA`, `ANIO` y `MES`. Si se guardara como campo,
habría que actualizarlo con cada transacción y se desincronizaría al corregir o
borrar un movimiento.

## Cómo levantar la base de datos

Crear la base (desde isql, no desde DBeaver):

```sql
CREATE DATABASE 'C:\ruta\presupuesto.fdb'
  USER 'SYSDBA' PASSWORD 'masterkey'
  PAGE_SIZE 8192
  DEFAULT CHARACTER SET UTF8;
```

El charset UTF8 es necesario para que los acentos y la Ñ se guarden bien.

Después conectarse con DBeaver y correr los scripts en orden:

1. `Database/DDL/01_crear_tablas.sql`
2. `Database/DDL/02_llaves_foraneass.sql`
3. `Database/DDL/03_indices.sql`

En DBeaver hay que usar **Ejecutar script (Alt+X)**, no Ejecutar sentencia,
porque los archivos traen varias sentencias.

Para verificar que quedó todo:

```sql
SELECT RDB$RELATION_NAME FROM RDB$RELATIONS WHERE RDB$SYSTEM_FLAG = 0;
```

Deben salir las 7 tablas.

## Avance

- [x] Modelo relacional y diagrama entidad-relación
- [x] Tablas, llaves foráneas e índices
- [ ] Trigger de subcategoría por defecto
- [ ] Funciones
- [ ] Procedimientos almacenados
- [ ] Datos de prueba de dos meses
- [ ] Backend
- [ ] Frontend
- [ ] Reportes

## Autor

Brayan Pinel
