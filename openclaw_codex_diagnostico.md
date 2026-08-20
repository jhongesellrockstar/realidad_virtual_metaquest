# Diagnóstico OpenClaw + Ollama

Fecha: 2026-08-15 (America/Lima)

## Resumen

- OpenClaw 2026.7.1-2 está instalado y el Gateway responde en `127.0.0.1:18789`.
- Ollama 0.32.9 responde en `127.0.0.1:11434`.
- El provider usa la API nativa de Ollama; tool calling real y visión fueron comprobados.
- La ejecución se realiza sobre el host Windows, sin sandbox ni Docker.
- Las rutas absolutas no están restringidas al workspace por defecto.
- La política efectiva de ejecución para `main` es `security=full`, `ask=off`.

## Entorno

| Componente | Resultado |
|---|---|
| Windows | Windows 11 Pro, 10.0.26200, build 26200 |
| PowerShell | 7.6.4; Windows PowerShell 5.1 disponible para Task Scheduler |
| WSL | WSL2 instalado; Ubuntu-22.04 presente y detenido durante el inventario |
| Docker | No instalado/no localizado; no es necesario para el modo host elegido |
| Node.js | v24.15.0, `C:\Program Files\nodejs\node.exe` |
| npm | 11.12.1, `C:\Program Files\nodejs\npm.ps1` |
| Python | 3.14.4, `C:\Python314\python.exe` |
| Git | 2.53.0.windows.2, `C:\Program Files\Git\cmd\git.exe` |
| Ollama | 0.32.9, `C:\Users\ACER\AppData\Local\Programs\Ollama\ollama.exe` |
| OpenClaw | 2026.7.1-2, `C:\Users\ACER\AppData\Roaming\npm\openclaw.ps1` |

## Hardware

- RAM física: 12,474,507,264 bytes (aprox. 11.62 GiB).
- RAM disponible observada: variable entre 420 MB durante picos fallidos y más de 5 GB con el modelo descargado.
- GPU: NVIDIA GeForce MX330, 2048 MiB VRAM; Intel UHD Graphics; Meta Virtual Monitor.
- VRAM NVIDIA libre observada al inicio: 1969 MiB.
- El modelo seleccionado trabaja aproximadamente 96% CPU / 4% GPU a contexto 16K.

## Discos

| Unidad | Tamaño aproximado | Libre observado |
|---|---:|---:|
| C: | 929.2 GiB | 501.1 GiB |
| D: | 931.5 GiB | 126.8 GiB |
| G: | 15.0 GiB | 2.7 GiB |
| H: | 929.2 GiB | 476.0 GiB |
| I: | 15.0 GiB | 9.1 GiB |
| J: | 15.0 GiB | 4.6 GiB |

## Puertos y procesos relevantes

- `127.0.0.1:11434`: Ollama.
- `127.0.0.1:18789`: OpenClaw Gateway.
- Gateway enlazado solo a loopback, autenticado por token y registrado como tarea programada `OpenClaw Gateway`.
- No se detectó una segunda instancia de Ollama.

## Modelos Ollama instalados

| Modelo | Tamaño | Capacidades informadas por Ollama | Contexto del artefacto |
|---|---:|---|---:|
| qwen3.5:4b-16k | 3.4 GB | completion, vision, tools, thinking | 262144; Modelfile 16000 |
| qwen3.5:4b | 3.4 GB | completion, vision, tools, thinking | 262144 |
| nomic-embed-text:latest | 274 MB | embedding | 2048; Modelfile 8192 |
| qwen2.5-coder:3b-22k | 1.9 GB | completion, tools, insert | 32768; Modelfile 22000 |
| gemma4:e2b | 7.2 GB | completion, vision, audio, tools, thinking | 131072 |
| qwen2.5:3b | 1.9 GB | completion, tools | 32768 |
| qwen2.5-coder:3b | 1.9 GB | completion, tools, insert | 32768 |
| llama3.2:3b | 2.0 GB | completion, tools | 131072 |

No se descargó ningún modelo nuevo.

## Selección y contexto

- General/agente: `ollama/qwen3.5:4b-16k`.
- Código: se usa el mismo modelo generalista; `qwen2.5-coder:3b-22k` queda instalado como alternativa, pero no justificó mantener otro modelo residente.
- Visión: `ollama/qwen3.5:4b-16k`.
- Contexto efectivo final: 16,000 tokens.
- Reserva de compactación: 6,000 tokens; piso de reserva: 0.

El primer intento a 16K falló porque OpenClaw reservaba 20K tokens por defecto. A 32K respondió, pero los picos de RAM llegaron a 420–469 MB libres. Se ajustó la reserva a 6K y se volvió a 16K: la prueba final pasó con un mínimo de 915 MB libres y la multimodal integrada pasó con 678 MB libres. Forzar 64K no es razonable con 12 GB de RAM y 2 GB de VRAM.

## Diagnóstico OpenClaw

- Gateway: PASS; versión CLI y Gateway coinciden; conectividad WebSocket OK.
- Provider Ollama: PASS, API nativa `http://127.0.0.1:11434`.
- Tool calling directo: PASS; `qwen3.5:4b-16k` emitió una llamada estructurada válida.
- Tools de desarrollo: disponibles con perfil `coding` y allowlist reducida.
- Sandbox: `off`; no se requiere Docker.
- Host exec: `gateway` para sesiones normales; runner TXT usa `--local` de una sola ejecución para evitar tareas huérfanas.
- Aprobaciones: `security=full`, `ask=off`, `askFallback=full` en `main`.
- Acceso a archivos: `tools.fs.workspaceOnly=false` y `tools.exec.applyPatch.workspaceOnly=false`.
- Context overflow histórico: reproducido y corregido mediante contexto/reserva.
- Timeout histórico: el watchdog de 120 s fue observado; provider timeout quedó en 300 s y timeout de agente en 900 s.
- `NO_REPLY`: no se encontró como fallo operativo en las pruebas finales.
- `spawn docker ENOENT`: no se encontró en los logs examinados; Docker no se instaló.
- Plugins: 49 cargados, 0 errores según `openclaw doctor`.

## Seguridad

- Gateway permanece en loopback.
- `gateway.controlUi.allowInsecureAuth` quedó desactivado.
- Web/browser no están expuestos al modelo pequeño.
- El acceso amplio al filesystem y host exec es intencional para prompts locales del único operador.
- `openclaw doctor` advierte que el token del Gateway y el marcador/API key local de Ollama están en campos plaintext del JSON. No se imprimieron en este informe. Su migración a SecretRefs queda como mejora no bloqueante.
- No hay `commands.ownerAllowFrom` porque no se configuró un canal de mensajería propietario; la CLI local y el runner funcionan sin ello.

## Backup

`C:\Users\ACER\backup_openclaw_20260814_233107`

Incluye las configuraciones activas de OpenClaw anteriores a los cambios. No se borraron backups previos ni modelos.

