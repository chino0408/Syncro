-- =====================================================================
-- SYNCRO — Salidas de los próximos días
--
-- Los datos de ejemplo crean las salidas del día en que se ejecutan.
-- Al día siguiente ya quedaron en el pasado y la app aparece sin
-- horarios. Este archivo genera las salidas de los próximos 7 días.
--
-- Se puede volver a ejecutar cuando haga falta: las que ya existen
-- se ignoran, no se duplican.
-- =====================================================================

INSERT INTO viaje (ruta_id, bus_id, chofer_id, sale_en)
SELECT
    r.id,
    -- Reparte las unidades activas entre las salidas
    (SELECT id FROM bus
      WHERE empresa_id = r.empresa_id AND estado = 'activo'
      ORDER BY id OFFSET ((d.dia * 5 + h.hora) % 4) LIMIT 1),
    (SELECT id FROM chofer
      WHERE empresa_id = r.empresa_id AND estado = 'disponible'
      ORDER BY id OFFSET ((d.dia * 3 + h.hora) % 4) LIMIT 1),
    (CURRENT_DATE + d.dia) + (h.hora || ' hours')::INTERVAL
FROM ruta r
CROSS JOIN generate_series(0, 6)  AS d(dia)
CROSS JOIN generate_series(5, 20) AS h(hora)
WHERE r.estado = 'activa'
  -- Una salida cada 3 horas, para no llenar la base de miles de filas
  AND h.hora % 3 = 2
ON CONFLICT (ruta_id, sale_en) DO NOTHING;


-- Algunas salidas quedan sin asignar a propósito: son las que el
-- panel de la empresa marca en ámbar para que alguien las resuelva.
UPDATE viaje SET bus_id = NULL, chofer_id = NULL
WHERE id IN (
    SELECT id FROM viaje
    WHERE sale_en > NOW()
    ORDER BY sale_en
    OFFSET 4 LIMIT 3
);


-- Comprobación: cuántas salidas quedan por delante
SELECT
    to_char(sale_en::date, 'DD/MM') AS dia,
    COUNT(*) AS salidas,
    COUNT(bus_id) AS con_unidad
FROM viaje
WHERE sale_en >= NOW()
GROUP BY sale_en::date
ORDER BY sale_en::date;
