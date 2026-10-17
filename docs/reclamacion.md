# Reclamación formal y presentación del proyecto

> Documento de trabajo. La plantilla de correo está lista para enviar; los campos
> entre `[corchetes]` deben completarse antes de remitir.
>
> Destino principal: `atencio.client@autocarsplana.com` (Atención al Cliente).
> Copia informativa: `info@autocarsplana.cat`.

---

## 1. Datos verificados del destinatario

Extraídos del sitio corporativo en producción (`https://www.busplana.com/contacta`
y `/aviso-legal`), no del repositorio de la web antigua:

| Campo | Valor |
| --- | --- |
| Razón social | **TERESA Y JOSÉ PLANA EMPRESA PLANA, S.L.** |
| CIF | **B-43009091** |
| Domicilio social | C/ Les Creus, 29 — 43120 Constantí (Tarragona) |
| Domicilio web (LSSI) | C/ Colom, 29 — 43001 Tarragona |
| **Atención al cliente** | **atencio.client@autocarsplana.com** |
| Tel. atención al cliente | 977 54 72 90 |
| Fax | 977 55 10 43 |
| Información general | info@autocarsplana.cat |
| Delegado de Protección de Datos | dpd@autocarsplana.cat |

> Nota: el dominio del correo de atención al cliente es `autocarsplana.com`,
> mientras que el general es `autocarsplana.cat`. Son dominios distintos. Dirigir
> la reclamación al correcto (`atencio.client@autocarsplana.com`) es la diferencia
> entre una entrada en el buzón de atención al cliente y un correo perdido.

---

## 2. Correo principal — listo para enviar

**Asunto:** Reclamación formal y solicitud de medidas correctorias — frecuencia y retraso del servicio de Ómnibus

---

Estimados señores de Atención al Cliente:

Por medio de la presente, **[NOMBRE COMPLETO]**, mayor de edad, con DNI/NIE **[DOCUMENTO]** y domicilio a efectos de notificaciones en **[DOMICILIO]**, correo electrónico **[EMAIL]** y teléfono **[TELÉFONO]**, usuaria habitual de los servicios de transporte de EMPRESA PLANA (CIF B-43009091), con domicilio social en C/ Les Creus, 29, 43120 Constantí (Tarragona), interpone **RECLAMACIÓN FORMAL** por la deficiente prestación del servicio de Ómnibus.

### I. ANTECEDENTES

1. Con fecha **[FECHA DEL HECHO]**, finalicé mi horario laboral a las **14:30** y me trasladé a la parada de **[PARADA DE ORIGEN]** con el propósito de regresar a mi domicilio en **[DESTINO]**.
2. La distancia del trayecto es de aproximadamente **[NÚMERO] kilómetros**. Un recorrido de esa distancia, en condiciones normales de circulación y con un servicio adecuado, no debería requerir más de **[TIEMPO ESTIMADO EN CONDICIONES NORMALES] minutos** en transporte público terrestre.
3. La siguiente salida programada de la línea **[LÍNEA]** se sitúa, no obstante, a las **15:40**, lo que supone una **espera de aproximadamente 70 minutos** desde el momento de mi salida del trabajo.
4. El tiempo total desde el fin de mi jornada hasta mi llegada al destino se sitúa en torno a **1 hora y 15 minutos**, de los cuales la parte mayoritaria corresponde a periodos de espera durante los cuales no dispongo de ninguna información sobre la ubicación del vehículo ni sobre el tiempo restante de espera.
5. Esta situación **no constituye un hecho aislado**. El intervalo entre salidas en la franja horaria de final de tarde es sistemáticamente incompatible con el horario de finalización de la jornada laboral de los usuarios, y la duración real de los recorridos excede de forma sostenida lo anunciado en los horarios oficiales, sin que la compañía facilite información sobre las desviaciones.

### II. PERJUICIO

- **Pérdida de tiempo:** aproximadamente una hora y cuarto por trayecto y por día laborable, en una franja horaria que reduce de forma directa el tiempo disponible para la conciliación de la vida laboral y personal.
- **Ausencia de información fiable:** no existe ningún canal público que permita al usuario conocer la posición real del vehículo, el tiempo estimado de llegada a cada parada ni las incidencias del servicio en curso.
- **Falta de cobertura en franja de mayor demanda:** la distribución de salidas no se ajusta a la demanda real del municipio.

### III. PETICIÓN

Solicito a EMPRESA PLANA:

1. La **revisión del horario y de la frecuencia** de la línea **[LÍNEA]** en la franja de **14:30 a 19:00**, motivando técnicamente los intervalos entre salidas.
2. La **puesta a disposición de un canal público de información en tiempo real** (web, aplicación o SMS) que permita conocer la posición del vehículo, el tiempo estimado de llegada a cada parada y las incidencias del servicio.
3. La **publicación de los tiempos reales de recorrido** de cada expedición.
4. La apertura de un **canal de recepción de reclamaciones y de seguimiento de la calidad del servicio**, con respuesta motivada.

### IV. RESERVA DE DERECHOS

El presente escrito se formula como reclamación previa y formal, y se reserva expresamente el ejercicio de cuantos derechos y acciones asistan, incluidos, entre otros:

- La solicitud de la **hoja de reclamaciones oficial** correspondiente.
- La presentación de la reclamación ante la **Agència Catalana del Consum**, o el organismo competente de la comunidad autónoma.
- **[OTRAS RESERVAS, si las procede]**

Solicito respuesta **por escrito** en un plazo no superior a **[7 / 15 / 30] días**, indicando las medidas concretas que se adoptarán.

### V. PROPUESTA: UNA SOLUCIÓN YA DESARROLLADA

Con el ánimo de que esta reclamación contribuya a una mejora efectiva y no a un simple intercambio de impresiones, he desarrollado y puesto en funcionamiento un **prototipo de seguimiento de puntualidad** para el servicio de la zona:

**https://empresaplana.senseikatana.com/rastreig**

El prototipo incluye, tal y como funciona hoy:

- **Panel público de puntualidad por línea y día de servicio**, con el porcentaje de reportes a tiempo, el número de reportes negativos, el volumen total de reportes que sostiene cada cifra y la fecha del último reporte recibido. Cada porcentaje va acompañado de su denominador: sin el número de muestras el porcentaje no significa nada.
- **Formulario de reporte en parada**, con las seis estados de servicio (ha pasado, puntual, con retraso, no ha pasado, cancelado y otros) y el registro de los minutos de retraso.
- **Consulta pública y en formato abierto** del agregado, para que cualquier tercero pueda revisarlo sin depender de una imagen ni de una captura: `https://empresaplana.senseikatana.com/api/bus-tracking/punctuality`.

Todo lo anterior sale de reportes aportados por los propios usuarios. El panel no mide la posición de los vehículos: **no es una medición de flota, es un indicador de opinión**, y así se advierte en la propia pantalla.

**Lo que solicito de EMPRESA PLANA para poder completar el proyecto** y que redundaría directamente en mejor servicio para sus propios usuarios:

1. **Un fichero de ejemplo** del seguimiento que ya realizan de sus vehículos. Cualquier formato sirve: una hoja `.xlsx`, un `.csv`, un export del sistema que utilicen. Una única exportación con la estructura de las columnas es suficiente para que yo prepare la importación al prototipo, **sin que la compañía tenga que instalar, abrir ni aprender nada**.
2. **Confirmación de a qué paradas y líneas corresponde cada dato**, para representar correctamente la cobertura.
3. **Un interlocutor técnico** con quien revisar el formato de los datos cuando exista.

Esta propuesta **no condiciona la reclamación**. Son cuestiones independientes: la reclamación se sostiene por sí sola, y el proyecto se ofrece únicamente por si resulta útil para la compañía y para sus usuarios.

Atentamente,

**[NOMBRE COMPLETO]**
**[LOCALIDAD]**, **[FECHA]**
**[FIRMA]**

---

## 3. Qué completar antes de enviar

- [ ] `[NOMBRE COMPLETO]`, `[DOCUMENTO]`, `[DOMICILIO]`, `[EMAIL]`, `[TELÉFONO]`
- [ ] `[FECHA DEL HECHO]` — el día concreto. **Sin fecha, la reclamación pierde fuerza.**
- [ ] `[LÍNEA]` — número y nombre de la línea
- [ ] `[PARADA DE ORIGEN]`, `[DESTINO]`
- [ ] `[NÚMERO]` — km reales del trayecto
- [ ] `[TIEMPO ESTIMADO EN CONDICIONES NORMALES]` — lo que tardaría un servicio razonable
- [ ] Elegir el plazo de respuesta: 7 días (presión) / 15 días (equilibrado, **recomendado**) / 30 días (formal)
- [ ] Revisar y añadir reservas de derechos si procede

### Documentación adjunta (opcional pero útil)

- [ ] Captura del horario oficial publicado por la compañía
- [ ] Captura de la ficha de la línea en su web, con las salidas de la franja citada
- [ ] Captura de la pantalla de seguimiento del prototipo, mostrando su estado actual
- [ ] Si en el futuro se dispone de datos agregados: tabla de puntualidad por línea

> **Si no tienes ninguna de estas capturas, envíalo igual.** Una reclamación formal
> bien redactada, con datos verificables y sin exaggeraciones, tiene más valor que una
> complaint con documentación débil. La ausencia de adjuntos no la invalida; la falta
> de hechos concretos, sí.

---

## 4. Notas internas (no enviar)

### 4.1 Por qué la carta no afirma "muchos clientes se quejan"

Porque no es verificable hoy. Afirmar un volumen de reclamaciones que no puede
sustentarse permite a la empresa desmontarlo en una línea y discreditar el resto del
escrito. En su lugar:

- Se afirma **"no constituye un hecho aislado"**, que es una observación defendible.
- Se **ofrece el dato agregado** como algo disponible bajo solicitud.

Si más adelante el panel acumula suficientes reportes, ese párrafo se sustituye por
cifras concretas y la reclamación deja de ser una opinión para ser un expediente.

### 4.2 La hoja de reclamaciones y la Agència Catalana del Consum

Son las dos vías de escalamiento que probablemente no conocés, y son las que
convierten una queja archivada en un expediente con número de registro:

- **Hoja de reclamaciones oficial**: todo consumidor puede solicitarla. Su sola
  petición obliga a abrir un registro formal.
- **Agència Catalana del Consum**: gratuita, competente en Tarragona, y con
  capacidad de requerir información a la empresa.

Si no hay respuesta en el plazo fijado, el siguiente paso es ahí, no repetir el
correo.

### 4.3 El ángulo de Excel

Si la compañía trabaja con hojas de cálculo —lo habitual en el sector—, el
prototipo debe **entrar por donde ya están**, no pedirles que aprendan una
herramienta nueva.

Esto ya tiene precedente en el repositorio: `src/scripts/sync-sheets.mjs` resuelve
exactamente el mismo problema con Google Sheets. El mismo patrón —**"tú sigue con tu
hoja, suelta el fichero, nosotros lo interpretamos"**— es el que hay que ofrecer.

El flujo de trabajo que se propone:

```
Excel de la compañía  ──export──▶  .xlsx / .csv  ──import──▶  panel
```

Sin servidor nuevo, sin app que instalar, sin formación.

### 4.4 Qué falta en el panel (dashboard)

Estado verificado en el repositorio, para no prometer nada que no exista todavía:

| Pieza | Estado | Bloquea |
| --- | --- | --- |
| Persistencia de reportes | ✅ **Postgres**: `Report`, `Escalation`, `Review`. Sobrevive a los despliegues | — |
| API de reportes | ✅ zod, tope de ráfaga en memoria y tope diario en base, `stopId` validado, escritura atómica | — |
| Panel de puntualidad por línea | ✅ público, agregado **en la base** (`groupBy`), caché 5 min, aviso si la consulta falla | — |
| Escalado a la empresa | ⚠️ **No envía nada.** Crea un registro en el panel de gestión y el copy dice exactamente eso | Salida de notificación real |
| Coordenadas de paradas | ❌ **No existen** en el modelo público (`Line` / `SchedulesOnLine`, que solo lleva texto). Existen en `Stop` (flota): hay un enlace posible que no se está usando | Mapa y ETA |
| Identidad de expedición (`Trip`) | ❌ **No existe**; los horarios son cadenas `"HH:MM"` de un solo día | Saber qué bus es cuál |
| Importador de Excel/CSV | ❌ **No existe** | El punto 4.3 |
| Fuente de posiciones | ❌ **Sin elegir.** GTFS-Realtime es el contrato propuesto (ADR-0010) | Tiempo real entero |

Las tres primeras filas —persistencia, API y panel— eran el orden recomendado en
esta misma sección y **ya están hechas**. Lo que queda no depende de nosotros:
coordenadas, expedición y posiciones hacen falta datos que no tenemos.

**Ver también:** `decisions/manifest.json` (familia `realtime`, estado
`proposed`) y `risks/README.md` (`drift:missing-stop-coordinates`,
`drift:no-trip-entity`).

---

## 5. Variante corta (si prefieres menos texto)

**Asunto:** Reclamación formal — frecuencia y retraso del servicio de Ómnibus

Estimados señores:

[Nombre], DNI [documento], domicilio a efectos de notificaciones en [domicilio],
correo [email], usuario habitual de su servicio, presento reclamación formal contra
TERESA Y JOSÉ PLANA EMPRESA PLANA, S.L. (CIF B-43009091).

El [fecha], al finalizar mi jornada a las 14:30, me trasladé a [origen] con el
propósito de regresar a [destino], un trayecto de aproximadamente [km] kilómetros. La
siguiente salida disponible se sitúa a las 15:40, lo que supone una espera de unos
70 minutos y un tiempo total de trayecto superior a una hora y cuarto.

La situación no es un hecho aislado: el intervalo entre salidas en la franja de
final de tarde no se ajusta a la demanda real y la duración efectiva de los
recorridos excede de forma sostenida lo anunciado en los horarios oficiales, sin que
la compañía facilite información sobre las desviaciones.

Solicito: revisión de la frecuencia en la franja de 14:30 a 19:00; publicación de
los tiempos reales de recorrido; y un canal público de información que indique el
tiempo estimado de llegada a cada parada.

Aporto a consideración un prototipo de seguimiento de puntualidad ya desarrollado y
disponible en https://empresaplana.senseikatana.com/rastreig, que muestra por línea y
día el porcentaje de reportes a tiempo, los reportes negativos y el volumen total de
muestras que sostiene cada cifra, con consulta pública en formato abierto.

Para completarlo me bastaría con **un fichero de ejemplo** de su seguimiento de
flota —una hoja `.xlsx` o un `.csv` con las columnas que ya usen—, de modo que la
compañía no tenga que instalar ni aprender nada.

Reservo el derecho a solicitar la hoja de reclamaciones oficial y a presentar la
reclamación ante la Agència Catalana del Consum.

Solicito respuesta por escrito en un plazo de [15] días.

Atentamente,
[Nombre], [localidad], [fecha]
