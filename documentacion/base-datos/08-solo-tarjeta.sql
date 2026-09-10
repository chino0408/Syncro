-- ============================================================
-- 08-solo-tarjeta.sql
-- Restringe los metodos de pago unicamente a tarjeta.
-- Ejecutar DESPUES de 07-paradas.sql
--
-- DECISION DE ALCANCE:
-- SINPE Movil se retira del prototipo. Una integracion real
-- requiere confirmacion asincronica del pago contra el sistema
-- bancario y conciliacion posterior, un flujo que excede el
-- alcance academico del proyecto. El pago con tarjeta se modela
-- como transaccion sincronica, que si es demostrable.
--
-- NOTA TECNICA:
-- El valor 'sinpe' se conserva dentro del ENUM tipo_metodo_pago
-- porque PostgreSQL no permite eliminar valores de un tipo
-- enumerado; solo permite agregarlos. La restriccion se aplica
-- mediante un CHECK, que ademas es reversible con un simple
-- DROP CONSTRAINT si el alcance del proyecto cambia.
-- ============================================================

-- 1. Verificacion previa: ninguna compra debe usar SINPE.
--    Debe devolver 0 antes de continuar.
SELECT count(*) AS compras_con_sinpe
FROM compra c
JOIN metodo_pago m ON m.id = c.metodo_pago_id
WHERE m.tipo = 'sinpe';

-- 2. Eliminar los metodos SINPE existentes.
DELETE FROM metodo_pago WHERE tipo = 'sinpe';

-- 3. Impedir el registro de nuevos metodos SINPE.
ALTER TABLE metodo_pago
  ADD CONSTRAINT solo_tarjeta CHECK (tipo = 'tarjeta');

COMMENT ON CONSTRAINT solo_tarjeta ON metodo_pago IS
  'El prototipo solo admite pago con tarjeta. Ver cabecera de 08-solo-tarjeta.sql';