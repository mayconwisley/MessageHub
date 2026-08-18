# Política de Segurança

## Versões suportadas

As correções de segurança são aplicadas à branch `main`. Não há suporte retroativo para versões
anteriores enquanto o projeto não possuir releases versionadas.

## Reportar uma vulnerabilidade

Não abra issue pública para relatar uma vulnerabilidade que possa expor dados, credenciais ou
infraestrutura.

Use o recurso **Report a vulnerability** na aba **Security** do GitHub, que permite uma troca
privada com o mantenedor. Caso esse recurso ainda não esteja habilitado no repositório, não abra
uma issue pública: entre em contato de forma privada pelo perfil do proprietário no GitHub e peça
um canal seguro para o envio do reporte.

Inclua no reporte:

- descrição objetiva do problema e seu impacto;
- componentes e versões afetados;
- passos mínimos para reprodução ou uma prova de conceito segura;
- sugestão de mitigação, se disponível.

O recebimento será confirmado em até 7 dias e haverá atualizações sobre a triagem e a correção
conforme a criticidade. Quando a correção estiver pronta, o reporte será divulgado de forma
coordenada com o autor.

## Escopo sensível

Trate como informação sensível qualquer dado relacionado a autenticação, isolamento entre tenants,
API keys, sessões administrativas, tokens da Meta, credenciais SMTP, criptografia, webhooks,
RabbitMQ, PostgreSQL e rate limiting.

## Práticas obrigatórias

- Nunca inclua segredos, tokens, senhas, chaves privadas ou dumps de produção em issues, pull
  requests, logs ou commits.
- Use exclusivamente arquivos `.env.example` com valores fictícios como referência de configuração.
- Revogue e rotacione imediatamente uma credencial que tenha sido exposta, mesmo que o commit seja
  removido depois.
- Mantenha dependências atualizadas e corrija vulnerabilidades de severidade alta ou crítica antes
  de publicar uma versão.
