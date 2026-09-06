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
│       ├── home.css
│       └── login.css
├── pages/
│   └── login.html
└── js/
    └── main.js
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

## Login

A página de login já possui a interface visual e a sinalização de acesso restrito. A autenticação permanece desativada até a definição de um serviço seguro para validar membros; nenhuma credencial é enviada ou armazenada pela versão atual.

## Interface tática

O cabeçalho utiliza abas compactas com iluminação central, botão de login recortado e indicador verde pulsante de portal ativo. A barra inferior curva possui seis espaços funcionais com emojis temporários, preparados para receber os ícones PNG definitivos individualmente.

O projeto inclui favicon vetorial, ícones para atalhos em celulares e manifesto para instalação como aplicativo web. A identidade azul utiliza a família azul-petróleo definida pelos tons `#07383d` e `#12525b`, com variações luminosas da mesma matiz.

## Efeitos de sessão

A cascata ambiente de pontos mantém sua fase durante atualizações e mudanças de página na mesma guia. A montagem inicial da Home usa uma marca vinculada à vida da própria guia: não reinicia com `F5` ou ao retornar do Login, mas volta a ser exibida em uma nova guia. Ambos os efeitos respeitam `prefers-reduced-motion`.
