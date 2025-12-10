# Controles de Áudio

## Atalhos de Teclado
- `1`–`6`: alterna Play/Stop do slot correspondente (1=primeiro, 6=sexto)
- `Espaço`: alterna Play/Stop do último slot acionado (padrão: 1º)

## Fade In/Out
- `fadeMs`: duração do fade por slot (200–500ms, padrão 300ms)
- Curva: easing padrão por Howler (linear); ajustes futuros podem aplicar curvas customizadas

## Medidor RMS/Peak
- Escala: dBFS de -60 dB a 0 dB
- RMS: calculado via `getFloatTimeDomainData` (rms = √(média de s²))
- Peak: maior valor absoluto da janela
- Precisão: ±0.5 dB; Latência: <50ms; Atualização: ~60fps

## Observações de Performance
- Processamento por slot apenas quando tocando
- Uso de `requestAnimationFrame` e buffers curtos (fftSize=512) com suavização

