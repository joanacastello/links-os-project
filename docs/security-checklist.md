# Checklist de seguridad y RGPD

## Endpoint `/api/subscribe`
- [ ] Rate limiting activo y probado (`429` bajo ráfagas).
- [ ] Límite de body activo (`413` en payloads grandes).
- [ ] Validación estricta de payload y honeypot anti-bot.
- [ ] Errores públicos genéricos; detalle solo en logs.

## Frontend
- [ ] Consentimiento explícito antes de enviar email.
- [ ] Consentimiento con enlaces visibles a [Términos de Uso](https://www.beehiiv.com/tou) y [Privacidad](https://www.beehiiv.com/privacy) de beehiiv (proveedor del boletín).
- [ ] URL externa de comunidad validada (`https`).

## Despliegue
- [ ] Cabeceras CSP/HSTS/XFO/Referrer-Policy aplicadas.
- [ ] Variables sensibles definidas solo en entorno servidor.

## RGPD operativo
- [ ] Responsable y canal de derechos identificados.
- [ ] Retención y baja documentadas.
- [ ] DPA/condiciones de proveedor (Beehiiv) revisadas.
- [ ] Procedimiento de respuesta a incidente actualizado.
