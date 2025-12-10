# Sistema de Cores dos PADs

## Objetivos
- Cores únicas por PAD quando ativados
- Harmonia visual e contraste mínimo 4.5:1 (WCAG AA)
- Persistência temporária durante a sessão

## Geração de Paleta
- Paleta harmônica gerada em HSL com espaçamento uniforme de matiz
- Saturação: 60%, Luminosidade: 72% para efeito pastel
- Conversão HSL→HEX no runtime

## Contraste e Acessibilidade
- Cálculo de luminância relativa e razão de contraste conforme WCAG
- Seleção automática de texto branco/ preto com base no melhor contraste
- Gradiente no card somente em reprodução, sem comprometer legibilidade das bordas

## Persistência
- Paleta armazenada em memória por componente para consistência na sessão
- Reinicializada ao recarregar a página/alterar sessão

## Estados Especiais
- Pausa: amarelo pastel padronizado para rápida identificação
- Loop: cor própria do PAD quando ativo

