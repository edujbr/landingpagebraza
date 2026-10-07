# BRAZA FORTE — Landing Page Premium

Landing page estática com direção de arte cinematográfica e identidade visual acolhedora inspirada em carvão, calor e brasa. Desenvolvida sem frameworks, utilizando HTML5, CSS3 moderno e JavaScript vanilla para máxima performance.

## Estrutura de Arquivos

- `index.html`: Página única contendo toda a estrutura, estilos e lógica.
- `logo.jpeg`: Logotipo oficial da marca (utilizado sem alterações).
- `burger-braza.jpg`: Fotografia real do produto (fallback estático).
- `fonts/Adumu.ttf`: Fonte oficial da marca para títulos e elementos de identidade.
- `fotos/`: Biblioteca de imagens reais da hamburgueria para composição editorial.
- `README.md`: Este arquivo de documentação.

## Identidade Visual Oficial

### Paleta de Cores
- **Carvão Principal** `#171613` — fundo predominante
- **Carvão Suave** `#211F1B` e **Ferro** `#34312C` — painéis e cards
- **Papel Quente** `#F1ECDF`, **Papel Profundo** `#E4DCCD` e **Branco Quente** `#FFFAF1` — textos e áreas claras
- **Laranja Brasa** `#E97B34` — cor principal de ação
- **Dourado** `#FFD27A` — realces pontuais
- **Vermelho Carvão** `#B84029` — apenas em detalhes pequenos
- **Gradiente de Brasa:** `#FFD579 → #FFB34C → #E97B34 → #C64C34`

### Tipografia
- **Adumu Regular** — títulos, chamadas e elementos de marca (arquivo local em `fonts/Adumu.ttf`)
- **DM Sans** — parágrafos, navegação, botões e informações funcionais (Google Fonts)

## Direção Visual & Estrutura Atual

O projeto adota uma estética "Premium Acolhedora" com foco em conversão mobile:
- **Hero com Carrossel:** Abertura com 4 fotos reais dos lanches em carrossel automático (5s), controles por toque/swipe e indicadores visuais. Respeita `prefers-reduced-motion`.
- **Info Strip:** Faixa compacta logo abaixo do hero com link para avaliação no Google e endereço resumido, garantindo acesso rápido às informações essenciais.
- **Ticker Variado:** Faixa animada com 8 frases distintas sobre a marca e produtos, sem repetições excessivas.
- **Textos Revisados:** Remoção de clichês e frases genéricas; uso consistente de "O BRAZA FORTE" no masculino.
- **Mobile-First:** Dock de pedido fixo, botão flutuante de WhatsApp com gradiente de brasa e hierarquia vertical otimizada para toque.
- **Acessibilidade:** Carrossel pausa em movimento reduzido; estados de foco visíveis em todos os controles.

## Configuração da Loja

Todas as informações dinâmicas estão centralizadas no objeto `STORE` dentro da tag `<script>` ao final do `index.html`. Edite conforme necessário:

```javascript
const STORE = {
  name: 'BRAZA FORTE',
  phone: '5565920012601', // DDI + DDD + Número (apenas dígitos)
  orderUrl: '',           // Link do sistema de pedidos (iFood/Próprio). Vazio = WhatsApp
  address: 'Avenida Rotary Internacional, 210, Centro, Sapezal - MT',
  mapsUrl: ''             // Link direto do Google Maps (opcional)
};
```

### Comportamento dos Links
- **Botões de Pedido (`data-link="order"`):** Usam `orderUrl` se preenchido; caso contrário, redirecionam para o WhatsApp com mensagem pré-definida.
- **WhatsApp (`data-link="whatsapp"`):** Abre compartilhamento direto com o número configurado.
- **Mapa (`data-link="maps"`):** Usa `mapsUrl` ou gera busca automática pelo endereço no Google Maps.

## Acessibilidade & Performance

- Suporte a `prefers-reduced-motion` (desativa animações quando solicitado pelo SO).
- Estados de foco visíveis em todos os elementos interativos.
- Imagens com atributos `alt` descritivos e `fetchpriority` no hero.
- Zero dependências externas além das fontes do Google.

## Próximos Passos (Dados Pendentes)

- [ ] Preencher `orderUrl` com o link oficial do sistema de pedidos quando disponível.
- [ ] Substituir placeholder do mapa por embed real ou imagem estática personalizada (opcional).
- [ ] Adicionar fotos adicionais de pratos ou ambiente nas seções futuras.
