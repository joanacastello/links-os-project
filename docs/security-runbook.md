# Security runbook: newsletter endpoint

## Objetivo
Responder de forma rápida ante abuso, caída de proveedor o posible fuga de credenciales en `/api/subscribe`.

## Señales de alerta
- Pico de respuestas `429` en menos de 5 minutos.
- Incremento de respuestas `5xx` del endpoint.
- Errores repetidos `subscribe_provider_error` en logs estructurados.
- Fallos continuos de Turnstile (`subscribe_turnstile_failed`).

## Respuesta operativa
1. Confirmar alcance temporal y origen (IPs/ASN) a partir de logs.
2. Si hay abuso, bajar temporalmente `maxHits` y subir `windowMs`.
3. Si continúa, activar protección adicional en capa edge/WAF.
4. Si falla Beehiiv, mostrar estado degradado y pausar campañas.
5. Si hay sospecha de fuga de `BEEHIIV_API_KEY`, rotarla de inmediato y desplegar.

## Verificaciones posteriores
- Confirmar normalización del ratio éxito/fallo.
- Validar que no hubo exposición de PII en logs.
- Documentar incidente y acciones preventivas.
