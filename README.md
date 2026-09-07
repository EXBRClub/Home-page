# EXBR — Home Page

Site institucional da Outfit EXBR em PlanetSide 2.

## Objetivo

Reunir apresentação, operações, recrutamento e canais comunitários da EXBR em uma interface inspirada em sistemas táticos futuristas.

## Estrutura

```text
Home-page/
├── index.html
├── README.md
├── MAPA-SITE.txt
├── FIREBASE.md
├── firestore.rules
├── site.webmanifest
├── assets/
│   └── icons/
│       ├── favicon.svg
│       ├── apple-touch-icon.png
│       ├── icon-192.png
│       └── icon-512.png
├── css/
│   ├── reset.css
│   ├── base.css
│   ├── components.css
│   └── pages/
│       ├── admin.css
│       ├── home.css
│       ├── login.css
│       ├── operacoes.css
│       └── perfil.css
├── data/
│   ├── medalhas.json
│   ├── operacoes.json
│   └── patentes.json
├── pages/
│   ├── admin.html
│   ├── login.html
│   ├── operacoes.html
│   └── perfil.html
└── js/
    ├── admin.js
    ├── firebase-client.js
    ├── home-operations.js
    ├── login.js
    ├── main.js
    ├── operations-page.js
    ├── perfil.js
    └── session-ui.js
```

## Publicação

O projeto é estático e compatível com GitHub Pages. Todos os caminhos internos são relativos ao diretório `Home-page`.

## Fluxo entre repositórios

- Desenvolvimento e atualizações pela IA: <https://github.com/mrserluiz/Home-page>
- Repositório oficial da EXBR: <https://github.com/EXBRClub/Home-page>

Os dois repositórios devem manter exatamente a mesma estrutura interna. Como os arquivos utilizam caminhos relativos, uma cópia pode ser transferida de um repositório para o outro sem alterar HTML, CSS ou JavaScript.

Endereços compatíveis:

- <https://mrserluiz.github.io/Home-page/>
- <https://exbrclub.github.io/Home-page/>

O endereço canônico usado nos metadados permanece o endereço oficial da EXBR:

<https://exbrclub.github.io/Home-page/>

## Conteúdo pendente

Antes de inserir links ou informações definitivas, confirmar com a administração da EXBR:

- logotipo e paleta oficiais;
- facção, servidor e plataforma;
- canal de recrutamento;
- Discord e redes sociais;
- história e apresentação institucional;
- agenda e registros de operações.

PlanetSide 2 é marca de seus respectivos detentores. Este é um projeto comunitário da Outfit EXBR.

## Login e perfis

O portal usa Firebase Authentication com e-mail e senha. Os membros podem criar suas próprias contas usando, nesta fase, o código temporário de seis dígitos `070922`. O primeiro acesso cria um perfil padrão no Firestore com patente Soldado e função Membro.

As regras separam os acessos `member` e `admin`. Membros podem alterar somente dados visuais do próprio perfil; apenas administradores atribuem patentes e medalhas. O código temporário é uma etapa de interface, não um controle de segurança definitivo; consulte [FIREBASE.md](FIREBASE.md).

Quando existe uma sessão ativa, o botão Login da Home muda para Perfil. No perfil, o dono pode revelar o botão de edição clicando no avatar; o controle volta a ficar oculto após 30 segundos sem atividade. Administradores recebem acesso ao painel protegido `pages/admin.html`, com pesquisa de membros, consulta de perfil, alteração automática de patente, criação e edição do catálogo de medalhas e concessão de condecorações. A mesma medalha pode ser concedida mais de uma vez em datas ou operações diferentes; a remoção administrativa fica no perfil consultado. Medalhas sem um PNG válido usam `assets/icons/dock/recrutamento.png`.

## Operações

A Home continua exibindo até três operações atuais no setor `#operacoes`. Os cartões abrem `pages/operacoes.html`, que reúne conteúdo completo, medalha prevista e registro de participação do membro. Administradores podem criar e editar operações diretamente nessa página.

Na mesma guia, o primeiro uso do atalho inferior de Operações leva ao setor da Home. Depois que a página dedicada é visitada, o atalho passa a retornar diretamente a ela até a guia ser encerrada.

## Interface tática

O cabeçalho utiliza abas compactas com iluminação central, botão de login recortado e indicador verde pulsante de portal ativo. A barra inferior curva possui seis espaços funcionais com emojis temporários, preparados para receber os ícones PNG definitivos individualmente.

O projeto inclui favicon vetorial, ícones para atalhos em celulares e manifesto para instalação como aplicativo web. A identidade azul utiliza a família azul-petróleo definida pelos tons `#07383d` e `#12525b`, com variações luminosas da mesma matiz.

## Efeitos de sessão

A cascata ambiente de pontos mantém sua fase durante atualizações e mudanças de página na mesma guia. A montagem inicial da Home usa uma marca vinculada à vida da própria guia: não reinicia com `F5` ou ao retornar do Login, mas volta a ser exibida em uma nova guia. Ambos os efeitos respeitam `prefers-reduced-motion`.
