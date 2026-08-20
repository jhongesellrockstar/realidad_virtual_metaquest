# OpenClaw Offline Final Report

## Resultado global

**PASS**, con dos advertencias no bloqueantes: hardware muy ajustado y secretos existentes aún no migrados a SecretRefs.

## Entorno

Windows: Windows 11 Pro 10.0.26200 (build 26200)  
RAM: 11.62 GiB; guardián del runner en 512 MB libres  
GPU: NVIDIA GeForce MX330, 2 GiB VRAM, más Intel UHD  
Ollama: 0.32.9, saludable en `127.0.0.1:11434`  
OpenClaw: 2026.7.1-2, Gateway saludable en `127.0.0.1:18789`

## Modelos

General: `ollama/qwen3.5:4b-16k`  
Coding: el mismo modelo generalista; no se carga un segundo modelo  
Vision: `ollama/qwen3.5:4b-16k`  
Context: 16,000 tokens; reserva de compactación 6,000; piso 0  
Thinking del runner: off para reducir latencia y RAM

No se descargaron modelos. `gemma4:e2b` se conservó instalado, pero sus 7.2 GB no son adecuados como modelo residente en este equipo.

## Tools

read: PASS  
write: PASS  
edit: PASS  
exec: PASS  
PowerShell: PASS  
Python: PASS  
Node: PASS  
Git: PASS  
apply_patch fuera del workspace: habilitado  
shell host: Gateway/host, sandbox off

La política efectiva confirmada por `openclaw exec-policy show` es `security=full`, `ask=off` para `main`. El perfil expone directamente `exec` y deja las herramientas auxiliares detrás de Tool Search para que el prompt del modelo pequeño quepa en contexto.

## Acceso multi-ruta

Resultado: **PASS**.

OpenClaw leyó `source.txt` bajo `C:\Users\ACER\OpenClawWorker\test_runs\elemental_20260814_234749\path_A`, escribió `D:\OpenClawWorker_MultiPath_B\result.txt`, lo volvió a leer y verificó exactamente `MULTI_PATH_OK`.

El workspace `C:\Users\ACER\.openclaw\workspace` se mantiene como cwd/memoria por defecto, no como límite de acceso.

## Multimodal

Resultado: **PASS**.

- Prueba directa Ollama: respuesta `red square HELLO 42`.
- Prueba integrada OpenClaw mediante la herramienta `image`: `MULTIMODAL_OPENCLAW_PASS`.
- Imagen: `C:\Users\ACER\OpenClawWorker\test_runs\vision_test.png`.

## Runner TXT

Resultado: **PASS**.

Ruta: `C:\Users\ACER\OpenClawWorker\runner.ps1`

- Procesa `.txt` por nombre, uno a la vez.
- Mueve `inbox -> working -> done/failed`.
- Captura stdout, stderr, exit code, JSON, memoria mínima y causa de terminación.
- Mutex impide instancias concurrentes.
- Timeout duro: 1200 s; timeout del agente: 900 s.
- Límite de RAM libre: 512 MB.
- Usa `openclaw agent --local` para que un corte por recursos no deje un run del Gateway continuando en segundo plano.
- El comando real con `--local` fue inspeccionado y `RUNNER_LOCAL_VERIFIED` fue recibido y parseado correctamente.

## Ejecución desatendida

Resultado: **PASS**.

- Tarea: `OpenClaw TXT Worker`.
- Trigger: inicio de sesión del usuario actual.
- Estado final: Running.
- Ventana: oculta.
- Política: una sola instancia; reinicio cada minuto, hasta 999 veces; sin límite de duración.
- No almacena contraseña en texto plano (`InteractiveToken`).
- El inicio al logon se eligió porque permite acceso a las unidades y sesión del usuario sin guardar credenciales.

## Tests

TEST01 (crear carpeta): PASS  
TEST02 (crear hello.txt): PASS  
TEST03 (leer/verificar Hello World): PASS  
TEST04 (crear hello_world.py): PASS  
TEST05 (ejecutar Python): PASS  
TEST06 (crear/ejecutar PowerShell): PASS  
TEST07 (crear/ejecutar Node): PASS  
TEST08 (crear subcarpeta): PASS  
TEST09 (mover archivo): PASS  
TEST10 (copiar archivo): PASS  
TEST11 (editar archivo): PASS  
TEST12 (Git no destructivo): PASS  
MULTI_PATH: PASS  
MULTIMODAL_TEST: PASS  
FINAL_TEST: PASS  
REAL_REPOSITORY_TEST: PASS  
RUNNER_LOCAL_TEST: PASS

Total auditado: **17 PASS / 0 FAIL**.

## Prueba final end-to-end

`C:\Users\ACER\OpenClawWorker\test_runs\final_e2e\verification.json` confirma:

- `Status=PASS`
- `ExitCode=0`
- stdout y lectura posterior: `Hola desde OpenClaw`
- `ExactMatch=true`

## Prueba del repositorio real

Resultado físico: **PASS**.

OpenClaw inspeccionó el repositorio, leyó la primera línea del README, ejecutó `git status`, creó `OPENCLAW_TEST.md`, releyó el texto exacto y ejecutó `git status` nuevamente. La verificación registra:

- `ReadBack=OpenClaw local agent operational.`
- `GitStatusAfter=?? OPENCLAW_TEST.md`
- ambos exit codes: 0
- commit: false
- push: false

Durante la segunda invocación, el cliente del runner cruzó temporalmente el umbral de RAM y cerró, pero el Gateway ya había aceptado el run y terminó después. La evidencia física permitió reconciliarlo como PASS. El runner quedó cambiado a `--local` para impedir esta condición en futuras tareas.

## Archivos creados

### Instalación y worker

- `C:\Users\ACER\OpenClawWorker\runner.ps1`
- `C:\Users\ACER\OpenClawWorker\README.md`
- `C:\Users\ACER\OpenClawWorker\elemental_tests.ps1`
- `C:\Users\ACER\OpenClawWorker\final_test_harness.ps1`
- `C:\Users\ACER\OpenClawWorker\repository_test_harness.ps1`
- carpetas `inbox`, `working`, `done`, `failed`, `logs`, `test_runs`
- prompts completados dentro de `done`: elemental, final, multimodal, repositorio y smoke tests locales
- logs individuales dentro de `C:\Users\ACER\OpenClawWorker\logs`

### Evidencia

- árbol `C:\Users\ACER\OpenClawWorker\test_runs\elemental_20260814_234749`
- árbol `C:\Users\ACER\OpenClawWorker\test_runs\final_e2e`
- `C:\Users\ACER\OpenClawWorker\test_runs\vision_test.png`
- `C:\Users\ACER\OpenClawWorker\test_runs\repository_test_verification.json`
- `D:\OpenClawWorker_MultiPath_B\result.txt`
- `C:\Users\ACER\Documents\GitHub\realidad_virtual_metaquest\OPENCLAW_TEST.md`
- `C:\Users\ACER\Documents\GitHub\realidad_virtual_metaquest\openclaw_codex_diagnostico.md`
- `C:\Users\ACER\Documents\GitHub\realidad_virtual_metaquest\OPENCLAW_OFFLINE_FINAL_REPORT.md`

## Configuración modificada

### `C:\Users\ACER\.openclaw\openclaw.json`

- agente primario `ollama/qwen3.5:4b-16k`
- timeout de agente 900 s; provider 300 s
- `sandbox.mode=off`
- `experimental.localModelLean=true`
- compactación: reserva 6000, piso 0, memory flush deshabilitado
- perfil/allowlist de tools reducido a desarrollo + imagen
- `tools.exec.host=gateway`, `tools.exec.mode=full`
- `tools.fs.workspaceOnly=false`
- `tools.exec.applyPatch.workspaceOnly=false`
- media image configurada para Ollama/Qwen
- contexto real 16000, salida máxima 4096, keep-alive 5m, temperatura 0
- Control UI insecure auth deshabilitado

### `C:\Users\ACER\.openclaw\exec-approvals.json`

- defaults y agente `main`: full/off/full sin confirmaciones repetitivas.

### Task Scheduler

- `OpenClaw TXT Worker`, al iniciar sesión, oculta y con reinicio automático.

## Backups

`C:\Users\ACER\backup_openclaw_20260814_233107`

## Cómo usarlo

### Ejemplo 1: trabajar sobre un repositorio

Crear `C:\Users\ACER\OpenClawWorker\inbox\001.txt`:

```text
Trabaja en C:\Users\ACER\Documents\GitHub\proyecto1.
Inspecciona el repositorio, ejecuta las pruebas, corrige errores y verifica el resultado.
No hagas commit ni push.
```

### Ejemplo 2: copiar/procesar entre discos

```text
Lee D:\Datos\Proyecto\entrada.csv.
Procesa las filas y escribe E:\Modelos\resultado.csv.
Vuelve a leer el resultado y verifica el número de filas.
```

### Ejemplo 3: analizar una captura

```text
Usa la herramienta image para analizar C:\Capturas\unity_error.png.
Transcribe el mensaje visible y describe el elemento de interfaz que falla.
```

### Ejemplo 4: crear y ejecutar código

```text
Trabaja en C:\Temp\demo.
Crea app.py, ejecútalo con Python, captura stdout y corrige hasta que termine con exit code 0.
```

### Ejemplo 5: tarea nocturna

Guardar el prompt como `.txt` dentro de `C:\Users\ACER\OpenClawWorker\inbox`. La tarea programada lo tomará secuencialmente y dejará el prompt en `done` o `failed`, con log persistente.

## Comandos importantes

### Iniciar

```powershell
ollama serve
openclaw gateway start
Start-ScheduledTask -TaskName 'OpenClaw TXT Worker'
```

### Detener

```powershell
Stop-ScheduledTask -TaskName 'OpenClaw TXT Worker'
openclaw gateway stop
ollama stop qwen3.5:4b-16k
```

### Ejecutar el runner una vez

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File C:\Users\ACER\OpenClawWorker\runner.ps1 -Once
```

### Diagnosticar

```powershell
openclaw gateway status --deep
openclaw exec-policy show
openclaw security audit --deep
openclaw doctor --non-interactive
ollama list
ollama ps
Get-ScheduledTask -TaskName 'OpenClaw TXT Worker'
```

## Problemas pendientes

- Migrar el token del Gateway y el marcador/API key local de Ollama a SecretRefs si se desea eliminar el warning de plaintext de `openclaw doctor`.
- Configurar `commands.ownerAllowFrom` solo si en el futuro se conecta un canal de mensajería y se necesitan comandos owner-only.
- El hardware obliga a trabajo secuencial y contexto 16K; 64K no es seguro en este equipo.

