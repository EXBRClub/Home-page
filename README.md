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
│       ├── comunidade.css
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
│   ├── comunidade.html
│   ├── login.html
│   ├── operacoes.html
│   └── perfil.html
└── js/
    ├── admin.js
    ├── community-media.js
    ├── comunidade.js
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

O portal usa Firebase Authentication com e-mail e senha. Os membros podem criar suas próprias contas usando, nesta fase, o código temporário de seis dígitos `070922`. O cadastro cria imediatamente um perfil padrão no Firestore com patente Soldado e função Membro; a abertura do Perfil também repara contas antigas que estejam apenas no Authentication.

As regras separam os acessos `member` e `admin`. Membros podem alterar somente dados visuais do próprio perfil; apenas administradores atribuem patentes e medalhas. A lista de soldados do painel administrativo acompanha novos documentos em `users` em tempo real. O código temporário é uma etapa de interface, não um controle de segurança definitivo; consulte [FIREBASE.md](FIREBASE.md).

Quando existe uma sessão ativa, o botão Login da Home muda para Perfil. No perfil, o dono pode revelar o botão de edição clicando no avatar; o controle volta a ficar oculto após 30 segundos sem atividade. O membro pode escrever uma apresentação de até 220 caracteres, escolher sua classe e facção favoritas e marcar com uma estrela até cinco medalhas para exibir na Comunidade. A apresentação aparece em um monitor tático com falhas discretas; classe e facção ocupam marcadores próprios sobre o cartão do avatar. Administradores recebem acesso ao painel protegido `pages/admin.html`, com abas próprias para gestão de soldados, edição do catálogo de medalhas e galeria. A concessão permite escolher livremente a data da conquista, inclusive de forma retroativa. A mesma medalha pode ser concedida mais de uma vez em datas ou operações diferentes; a remoção administrativa fica no perfil consultado. Medalhas sem um PNG válido usam `assets/icons/dock/recrutamento.png`. URLs `github.com/.../blob/...` são convertidas para o arquivo bruto, imagens externas usam política sem referenciador e qualquer falha retorna ao ícone padrão. Perfis, comunidade e operações priorizam a imagem atual do catálogo, inclusive para concessões antigas. Ao selecionar uma medalha no perfil, o membro vê sua imagem ampliada, nome, descrição, operação e data.

## Operações

A Home continua exibindo até três operações atuais no setor `#operacoes`. Os cartões abrem `pages/operacoes.html`, que reúne conteúdo completo, medalha prevista e registro de participação do membro. Administradores podem criar e editar operações diretamente nessa página, escolhendo data e horário em campos próprios e vinculando uma medalha já existente no catálogo.

Na mesma guia, o primeiro uso do atalho inferior de Operações leva ao setor da Home. Depois que a página dedicada é visitada, o atalho passa a retornar diretamente a ela até a guia ser encerrada.

## Comunidade

A rota protegida `pages/comunidade.html` reúne os perfis públicos dos membros autenticados. A aba Membros permite pesquisar por nome, patente, classe ou facção e mostra avatar, patente, apresentação pessoal, preferências, atividade recente, até cinco medalhas escolhidas pelo próprio membro e acesso ao perfil público completo. Na aba Galeria, cada membro autenticado pode publicar imagens e vídeos externos por URL e remover suas próprias publicações; administradores mantêm o controle geral. Somente as URLs e seus textos são persistidos no Firestore, sem upload de mídia para o site.

Os dados comunitários usam `publicProfiles/{uid}`, separado do documento privado `users/{uid}`. E-mail, função administrativa e outros dados privados não são publicados. Membros autenticados podem consultar os perfis públicos; apenas o próprio membro ou um administrador pode atualizar seu registro público.

## Interface tática

O cabeçalho utiliza abas compactas com iluminação central, botão de login recortado e indicador verde pulsante de portal ativo. A barra inferior curva possui seis espaços funcionais com emojis temporários, preparados para receber os ícones PNG definitivos individualmente.

O projeto inclui favicon vetorial, ícones para atalhos em celulares e manifesto para instalação como aplicativo web. A identidade azul utiliza a família azul-petróleo definida pelos tons `#07383d` e `#12525b`, com variações luminosas da mesma matiz.

## Efeitos de sessão

A cascata ambiente de pontos mantém sua fase durante atualizações e mudanças de página na mesma guia. A montagem inicial da Home usa uma marca vinculada à vida da própria guia: não reinicia com `F5` ou ao retornar do Login, mas volta a ser exibida em uma nova guia. Ambos os efeitos respeitam `prefers-reduced-motion`.
