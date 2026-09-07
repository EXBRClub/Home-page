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

## Medalhas

Subcoleção: `users/{uid}/medals/{medalId}`

Campos preparados:

```text
name          nome da medalha
operationName nome da operação
operationDate data da operação (Timestamp recomendado)
emoji         ícone temporário
iconUrl       caminho/URL do PNG definitivo
```

Somente administradores podem conceder, editar ou remover medalhas. O membro pode consultar apenas as próprias condecorações.

O catálogo visual inicial está em `data/medalhas.json`. Os emojis são temporários; cada definição já aceita `iconUrl` para receber posteriormente o PNG definitivo. O painel administrativo salva a concessão ou a remoção assim que o administrador seleciona a medalha.

## Operações

Coleção: `operations/{operationId}`

A leitura pública está preparada; criação, edição e exclusão são restritas aos administradores.

## Regras

O arquivo `firestore.rules` é a cópia versionada das regras publicadas no projeto Firebase. Qualquer alteração futura deve ser aplicada no arquivo e no console/CLI para mantê-los sincronizados.

## Painel administrativo

Rota protegida: `pages/admin.html`

- usuários `member` são redirecionados para o próprio perfil;
- usuários `admin` podem pesquisar todos os membros;
- dois cliques sobre um registro abrem o perfil consultado;
- mudanças de patente são salvas automaticamente;
- medalhas podem ser adicionadas ou removidas em uma janela própria;
- somente o dono do perfil recebe os controles de avatar e bandeira.

## Evolução planejada

- Bot do Discord para gerar códigos únicos de registro.
- Código com validade, uso único e vínculo ao usuário do Discord.
- Gestão de membros no Discord e registro de presença em operações.
- Pesquisa técnica sobre o Recursion Tracker para entender fontes permitidas de eventos de combate e, futuramente, desenvolver um complemento próprio para estatísticas da EXBR.

Esses itens ainda não estão implementados.
