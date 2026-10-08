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
  orderUrl: 'https://pedido.brendi.com.br/braza-forte', // Link oficial de pedidos
  address: 'Avenida Rotary Internacional, 210, Centro, Sapezal - MT',
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Avenida+Rotary+Internacional,+210,+Centro,+Sapezal-MT',
  googleReviewUrl: 'https://search.google.com/local/writereview?placeid=ChIJr_CUlJPIaR52eXEAE' // Link direto de avaliação do Google
};
```

### Comportamento dos Links
- **Botões de Pedido (`data-link="order"`):** Usam `orderUrl` se preenchido; caso contrário, redirecionam para o WhatsApp com mensagem pré-definida.
- **WhatsApp (`data-link="whatsapp"`):** Abre conversa direta com o número configurado.
- **Mapa (`data-link="maps"`):** Usa `mapsUrl` configurado para rota/busca no Google Maps.
- **Avaliação (`data-link="googleReview"`):** Usa `googleReviewUrl` se preenchido; caso contrário, usa WhatsApp como fallback seguro (não abre rota).

## Identidade & Narrativa Visual
- **Conceito:** "Da montagem à primeira mordida" — narrativa visual contínua com grafismos de grelha, gergelim e texturas de hamburgueria integrados ao fundo e seções.
- **Carrossel:** Transições com profundidade (scale + translateZ), indicadores de progresso e suporte a gesto de arrastar/toque.
- **Microinterações:** Efeito de brilho deslizante nos botões, hover com elevação nos cards da galeria e revelação em sequência (`reveal-seq`) de títulos e conteúdos durante a rolagem.
- **Hashtag oficial:** #VEMPROBRAZA (presente no rodapé como assinatura gráfica em grande escala).
- **Nome no topo:** BRAZA FORTE (sem artigo "O").
- **Chamada principal:** "Hambúrguer artesanal em Sapezal. Seu próximo favorito começa aqui."
- **Textos removidos:** "100% na brasa", "01 / Conceito", "brasa de verdade", "O BRAZA FORTE".

## Acessibilidade & Performance

- Suporte a `prefers-reduced-motion` (desativa animações quando solicitado pelo SO).
- Estados de foco visíveis em todos os elementos interativos.
- Imagens com atributos `alt` descritivos e `fetchpriority` no hero.
- Zero dependências externas além das fontes do Google.

## Painel Administrativo (`/admin.html`)

O painel permite gerenciar fotos e promoções dinamicamente via Supabase, com autenticação segura e métricas de acesso.

### Configuração no Supabase

1.  Crie um projeto gratuito em [supabase.com](https://supabase.com).
2.  No **SQL Editor**, execute os comandos abaixo para criar as tabelas:

```sql
-- Tabela de fotos
create table photos (
  id bigint generated always as identity primary key,
  storage_path text not null,
  alt_text text,
  sort_order int default 0,
  active boolean default true,
  created_at timestamptz default now()
);

-- Tabela de promoções
create table promotions (
  id bigint generated always as identity primary key,
  title text not null,
  description text,
  button_text text,
  button_url text,
  start_date date,
  end_date date,
  active boolean default true,
  created_at timestamptz default now()
);

-- Tabela de métricas (page views)
create table page_views (
  id bigint generated always as identity primary key,
  path text,
  referrer text,
  user_agent text,
  viewed_at timestamptz default now()
);

-- Storage bucket para imagens
insert into storage.buckets (id, name, public) values ('site-images', 'site-images', true);

-- RLS Policies (segurança)
alter table photos enable row level security;
alter table promotions enable row level security;
alter table page_views enable row level security;

-- Leitura pública, escrita apenas para autenticados
create policy "Public read photos" on photos for select using (true);
create policy "Auth write photos" on photos for all using (auth.role() = 'authenticated');
create policy "Public read promos" on promotions for select using (true);
create policy "Auth write promos" on promotions for all using (auth.role() = 'authenticated');
create policy "Public insert views" on page_views for insert with check (true);
create policy "Auth read views" on page_views for select using (auth.role() = 'authenticated');
create policy "Public read images" on storage.objects for select using (bucket_id = 'site-images');
create policy "Auth upload images" on storage.objects for insert with check (bucket_id = 'site-images' and auth.role() = 'authenticated');
create policy "Auth delete images" on storage.objects for delete using (bucket_id = 'site-images' and auth.role() = 'authenticated');
```

3.  Em **Authentication > Users**, crie o usuário administrador (e-mail + senha).
4.  Copie a **Project URL** e a **anon key** em **Settings > API** e substitua os valores no `index.html` e `admin.html`.

### Funcionalidades

-   **Fotos:** Upload, ordenação, texto alternativo, ativar/desativar e exclusão com confirmação.
-   **Promoções:** CRUD completo com datas de vigência e botão configurável.
-   **Métricas:** Contagem total e diária de visitas (sem coleta de dados pessoais).
-   **Fallback:** Se o Supabase estiver indisponível, o site exibe o conteúdo estático normalmente.

## Seção "Som da Casa" (Spotify)

-   Link oficial: `https://open.spotify.com/playlist/4nuwmC5L2wR4E8OmXmxFtt?si=e89e8aa1b2324194`
-   Exibida no footer com ícone do Spotify e link direto para o app/web player.
-   Sem autoplay; abre na plataforma escolhida pelo usuário.

## Próximos Passos (Dados Pendentes)

-   [x] Link de avaliação do Google preenchido (`googleReviewUrl`).
-   [x] Link de pedidos preenchido (`orderUrl`).
-   [ ] Substituir placeholder do mapa por embed real ou imagem estática personalizada (opcional).
-   [ ] Adicionar fotos adicionais de pratos ou ambiente nas seções futuras.
