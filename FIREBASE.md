# Firebase — EXBR Portal

Projeto: `exbr-0709`

## Autenticação

- Método inicial: e-mail e senha.
- Não existe cadastro público no site.
- As contas são criadas pela administração no Firebase Authentication.
- O primeiro acesso cria automaticamente o perfil padrão no Firestore.

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

Todo perfil novo recebe `role: member` e `rankId: soldado`. O próprio usuário só pode alterar nome, avatar e bandeira. Cargo, patente, exclusão de perfis, operações e medalhas são protegidos para administradores.

Para definir o primeiro administrador, crie a conta em **Authentication > Usuários**, faça o primeiro login no portal e depois altere manualmente `users/{uid}.role` para `admin` no Firestore. Um usuário não consegue promover a própria conta pelo site.

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

## Operações

Coleção: `operations/{operationId}`

A leitura pública está preparada; criação, edição e exclusão são restritas aos administradores.

## Regras

O arquivo `firestore.rules` é a cópia versionada das regras publicadas no projeto Firebase. Qualquer alteração futura deve ser aplicada no arquivo e no console/CLI para mantê-los sincronizados.
