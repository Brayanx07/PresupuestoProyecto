-- Acelera los reportes que filtran un presupuesto en un mes especifico
CREATE INDEX IDX_TRX_PRESUP_PERIODO ON TRANSACCION (ID_PRESUPUESTO, ANIO, MES);

-- Acelera el calculo del monto ejecutado por subcategoria en un mes
CREATE INDEX IDX_TRX_SUBCAT_PERIODO ON TRANSACCION (ID_SUBCATEGORIA, ANIO, MES);

-- Acelera el balance mensual de ingresos, gastos y ahorros de un usuario
CREATE INDEX IDX_TRX_USUARIO_PERIODO ON TRANSACCION (ID_USUARIO, ANIO, MES):
