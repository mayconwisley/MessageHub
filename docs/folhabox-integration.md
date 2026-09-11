# Integração do FolhaBox

O FolhaBox usa uma API key de **Application** do Message Hub. Essa Application deve estar vinculada a exatamente um número remetente; quando houver mais de um, configure o `phoneNumberId` no FolhaBox.

## 1. Criar o template de autenticação

Crie o template uma vez para a conta WhatsApp e aguarde o status `APPROVED` da Meta:

```http
POST /v1/templates
Authorization: Bearer wh_live_...
Content-Type: application/json
```

```json
{
  "whatsAppAccountId": "019c0000-0000-7000-8000-000000000001",
  "name": "folhabox_codigo_acesso",
  "language": "pt_BR",
  "category": "AUTHENTICATION",
  "components": [
    {
      "type": "BODY",
      "addSecurityRecommendation": true
    },
    {
      "type": "FOOTER",
      "codeExpirationMinutes": 5
    },
    {
      "type": "BUTTONS",
      "buttons": [
        {
          "type": "OTP",
          "otp_type": "COPY_CODE",
          "text": "Copiar código"
        }
      ]
    }
  ]
}
```

O texto principal de templates `AUTHENTICATION` é padronizado pela Meta. `codeExpirationMinutes` deve permanecer alinhado ao `OTP_TTL_SECONDS` do FolhaBox.

## 2. Enviar o OTP

```http
POST /v1/messages/authentication
Authorization: Bearer wh_live_...
Content-Type: application/json
Idempotency-Key: folhabox-employee-otp:<challengeId>
X-Request-Id: <correlationId>
```

```json
{
  "to": "5544999999999",
  "templateName": "folhabox_codigo_acesso",
  "code": "391827"
}
```

O endpoint aceita apenas códigos de seis dígitos e templates aprovados da categoria `AUTHENTICATION`. Internamente, o Hub envia o código no BODY e no botão `COPY_CODE`. O código é cifrado enquanto aguarda processamento assíncrono e é omitido das respostas e consultas da API.
