# Firebase — EXBR Portal

Projeto: `exbr-0709`

## Autenticação

- Método inicial: e-mail e senha.
- Os próprios membros podem criar suas contas no portal.
- O cadastro atual solicita um código temporário de seis dígitos: `070922`.
- O primeiro acesso cria automaticamente o perfil padrão no Firestore.

O código atual é apenas uma etapa funcional provisória da interface. Como ele está no JavaScript público do site, não deve ser considerado uma barreira de segurança. A versão definitiva deverá validar códigos únicos no servidor por uma Cloud Function ou outro backend confiável, sem expor a regra de validação no navegador.

## Perfis e funções

Documento: `users/{uid}`

```text
email       e-mail da conta
displayName nome exibido no perfil
role        member | admin
rankId      identificador presente em data/patentes.json
avatarId    assalto | pesado | reconhecimento
bannerId    brasil | comando | noturna
createdAt   criação do perfil
updatedAt   última atualização
```

Todo perfil novo recebe `role: member` e `rankId: soldado`. O próprio usuário só pode alterar nome, avatar e bandeira. Função, patente e medalhas são protegidas para administradores. A administração não precisa criar as contas dos membros.

Para definir o primeiro administrador, crie uma conta normalmente no portal, acesse o perfil e depois altere manualmente `users/{uid}.role` para `admin` no Firestore. Um usuário não consegue promover a própria conta pelo site.

## Perfis públicos da Comunidade

Documento: `publicProfiles/{uid}`

```text
displayName       nome público
rankId            patente atual
avatarId          template de soldado
bannerId          tratamento da bandeira
featuredMedals    até cinco medalhas em destaque
recentActivities  até três operações recentes
updatedAt         última sincronização
```

Essa coleção não armazena e-mail nem função administrativa. Usuários autenticados podem listar os perfis públicos e abrir `pages/perfil.html?uid={uid}`. Um membro comum recebe apenas os dados públicos, enquanto administradores continuam autorizados a consultar o documento privado e o histórico completo.

O registro é sincronizado quando o membro abre seu Perfil ou a página Comunidade, altera avatar/bandeira ou confirma participação. A Área administrativa também cria e atualiza a identidade pública dos membros cadastrados.

## Medalhas

Subcoleção: `users/{uid}/medals/{medalId}`

Campos preparados:

```text
name          nome da medalha
catalogId     identificador da medalha no catálogo
operationName nome da operação
operationDate data da operação (Timestamp recomendado)
emoji         ícone temporário
iconUrl       caminho/URL do PNG definitivo; usa recrutamento.png como padrão
```

Somente administradores podem conceder, editar ou remover medalhas. O membro pode consultar apenas as próprias condecorações.

O catálogo inicial de segurança está em `data/medalhas.json`, mas o catálogo editável fica em `medalCatalog/{medalId}` no Firestore. Na primeira abertura administrativa, os modelos locais são copiados para essa coleção quando ela ainda estiver vazia. Administradores podem criar novas medalhas e editar nome, descrição e URL do ícone das medalhas existentes.

Todos os modelos usam `../assets/icons/dock/recrutamento.png` enquanto não houver um caminho ou URL HTTPS terminado em `.png`. O módulo compartilhado `js/medal-images.js` normaliza caminhos locais, converte links `github.com/.../blob/...` para `raw.githubusercontent.com`, evita o envio de referenciador a servidores externos e retorna automaticamente ao ícone padrão se a imagem falhar. Perfil, comunidade e operações consultam a definição atual em `medalCatalog`, então uma imagem corrigida no catálogo também substitui snapshots antigos já concedidos. Cada concessão usa um documento automático, por isso o mesmo membro pode receber a mesma medalha em operações ou datas diferentes. O painel administrativo concede medalhas; a remoção é feita pelo administrador dentro do perfil consultado.

Membros autenticados podem consultar os modelos do catálogo para abrir os detalhes atualizados de suas medalhas. A escrita no catálogo continua exclusiva para administradores. A janela de detalhes apresenta nome, imagem ampliada, descrição, operação e data da concessão.

## Operações

Coleção: `operations/{operationId}`

A leitura pública está preparada; criação, edição e exclusão são restritas aos administradores.

Campos atuais: `title`, `kicker`, `description`, `details`, `startsAt`, `status`, `imageUrl`, `medalCatalogId`, `medalName`, `medalDescription` e `medalIconUrl`. O editor usa data e horário separados na interface e grava o resultado em `startsAt`. A medalha prevista é escolhida entre os modelos já existentes em `medalCatalog`.

O registro de participação é duplicado em uma operação atômica para facilitar as duas consultas:

```text
users/{uid}/participations/{operationId}
operations/{operationId}/participants/{uid}
```

O membro autenticado pode criar apenas o próprio registro, com estado `confirmed`. Administradores podem consultar e gerenciar os registros. A lista das participações também aparece no perfil do membro.

## Regras

O arquivo `firestore.rules` é a cópia versionada das regras publicadas no projeto Firebase. Qualquer alteração futura deve ser aplicada no arquivo e no console/CLI para mantê-los sincronizados.

## Painel administrativo

Rota protegida: `pages/admin.html`

- usuários `member` são redirecionados para o próprio perfil;
- usuários `admin` podem pesquisar todos os membros;
- dois cliques sobre um registro abrem o perfil consultado;
- mudanças de patente são salvas automaticamente;
- catálogo de medalhas pode ser criado e editado por administradores;
- o catálogo possui uma aba própria no painel, sem exigir a abertura de um membro;
- medalhas podem ser concedidas pela janela própria e removidas no perfil consultado;
- a data da concessão pode ser escolhida livremente para registrar conquistas retroativas;
- a mesma medalha pode ser concedida novamente em outra data ou operação;
- operações podem ser criadas e editadas na página dedicada com data, horário e medalha prevista;
- somente o dono do perfil recebe os controles de avatar e bandeira.

## Evolução planejada

- Bot do Discord para gerar códigos únicos de registro.
- Código com validade, uso único e vínculo ao usuário do Discord.
- Gestão de membros no Discord e registro de presença em operações.
- Pesquisa técnica sobre o Recursion Tracker para entender fontes permitidas de eventos de combate e, futuramente, desenvolver um complemento próprio para estatísticas da EXBR.

Esses itens ainda não estão implementados.
