import { ExpandMoreOutlined, OpenInNewOutlined } from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Link,
  Stack,
  Typography,
} from '@mui/material';
import type { ReactNode } from 'react';
import { CodeBlock } from '../../components/shared/CodeBlock';
import { PageHeader } from '../../components/ui/PageHeader';

const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';

const methodColor: Record<Method, 'info' | 'success' | 'warning' | 'error'> = {
  GET: 'info',
  POST: 'success',
  PUT: 'warning',
  DELETE: 'error',
};

interface Endpoint {
  method: Method;
  path: string;
  title: string;
  description: string;
  curl: string;
  notes?: ReactNode;
}

function buildCurl(
  method: Method,
  path: string,
  body?: unknown,
  extraHeaders: string[] = [],
): string {
  const lines = [
    `curl -X ${method} "${baseUrl}${path}"`,
    `  -H "Authorization: Bearer wh_live_SEU_TOKEN_AQUI"`,
  ];
  if (body !== undefined) lines.push('  -H "Content-Type: application/json"');
  extraHeaders.forEach((header) => lines.push(`  -H "${header}"`));
  if (body !== undefined)
    lines.push(`  -d '${JSON.stringify(body, null, 2).replace(/\n/g, '\n  ')}'`);
  return lines.join(' \\\n');
}

const messageEndpoints: Endpoint[] = [
  {
    method: 'POST',
    path: '/v1/messages',
    title: 'Enviar mensagem de texto',
    description:
      'Envia uma mensagem de texto livre para telefone E.164 ou BSUID retornado pela Meta. O número de origem é o cadastro do Hub.',
    curl: buildCurl(
      'POST',
      '/v1/messages',
      {
        to: '+5511999999999',
        content: 'Seu pedido foi confirmado!',
      },
      ['Idempotency-Key: 5e28f2f0-9a3c-4c34-9b7a-2f2f4d0a9d11'],
    ),
    notes:
      'phoneNumberId é opcional: por padrão o Hub usa o único número vinculado à aplicação em PUT /v1/applications/{id}/phone-numbers (cadastro inicial, feito uma vez). Informe phoneNumberId explicitamente apenas se a aplicação tiver mais de um número vinculado, ou nenhum. O header Idempotency-Key é opcional, mas recomendado: reenviar a mesma chave evita duplicar o envio em caso de retry. Quando um webhook trouxer sender.id como BSUID, reutilize esse valor em to; o @username não é um identificador de API.',
  },
  {
    method: 'POST',
    path: '/v1/messages/templates',
    title: 'Enviar mensagem de template',
    description:
      'Envia um template aprovado pela Meta para telefone E.164 ou BSUID. Informe templateId ou templateName e os parâmetros posicionais do BODY, se houver.',
    curl: buildCurl(
      'POST',
      '/v1/messages/templates',
      {
        to: '+5511999999999',
        templateName: 'order_confirmation',
        parameters: ['Maycon', '12345'],
      },
      ['Idempotency-Key: 5e28f2f0-9a3c-4c34-9b7a-2f2f4d0a9d11'],
    ),
    notes:
      'phoneNumberId é opcional pelo mesmo motivo do envio de texto livre (veja acima). Os itens de parameters preenchem {{1}}, {{2}}, ... do BODY do template, na ordem em que aparecem.',
  },
  {
    method: 'GET',
    path: '/v1/messages/{id}',
    title: 'Consultar status de uma mensagem',
    description:
      'Retorna os dados atuais da mensagem, incluindo status (PENDING, SENT, DELIVERED, READ, FAILED, ...) e o último erro, se houver.',
    curl: buildCurl('GET', '/v1/messages/6f1c2e6a-2222-4b3a-9a11-3d0a4f0a1234'),
  },
  {
    method: 'GET',
    path: '/v1/messages/{id}/attempts',
    title: 'Listar tentativas de entrega',
    description:
      'Retorna o histórico de tentativas de envio de uma mensagem, útil para depurar falhas e retries.',
    curl: buildCurl('GET', '/v1/messages/6f1c2e6a-2222-4b3a-9a11-3d0a4f0a1234/attempts'),
  },
  {
    method: 'GET',
    path: '/v1/messages',
    title: 'Listar mensagens',
    description:
      'Lista paginada das mensagens da aplicação autenticada. Aceita os parâmetros page, pageSize e status.',
    curl: buildCurl('GET', '/v1/messages?page=1&pageSize=20&status=DELIVERED'),
  },
];

const templateEndpoints: Endpoint[] = [
  {
    method: 'POST',
    path: '/v1/templates',
    title: 'Criar template',
    description:
      'Cria um modelo local e o envia para aprovação na Meta. Suporta HEADER, BODY, FOOTER, exemplos de variáveis e botão URL; category costuma ser UTILITY, MARKETING ou AUTHENTICATION.',
    curl: buildCurl('POST', '/v1/templates', {
      whatsAppAccountId: '22222222-2222-2222-2222-222222222222',
      name: 'order_confirmation',
      language: 'pt_BR',
      category: 'UTILITY',
      components: [
        { type: 'HEADER', format: 'TEXT', text: 'Confirmação de pedido' },
        {
          type: 'BODY',
          text: 'Olá {{1}}, seu pedido {{2}} foi confirmado!',
          example: { bodyText: [{ values: ['Maria Silva', 'PED-2026-001'] }] },
        },
        { type: 'FOOTER', text: 'Mensagem automática' },
        {
          type: 'BUTTONS',
          buttons: [
            {
              type: 'URL',
              text: 'Acompanhar pedido',
              url: 'https://exemplo.com/pedidos/{{1}}',
              example: 'https://exemplo.com/pedidos/PED-2026-001',
            },
          ],
        },
      ],
    }),
  },
  {
    method: 'GET',
    path: '/v1/templates',
    title: 'Listar modelos de mensagem',
    description:
      'Lista paginada dos modelos de mensagem de uma conta WhatsApp. Use sync=true para forçar a sincronização com a Meta antes de listar.',
    curl: buildCurl(
      'GET',
      '/v1/templates?whatsAppAccountId=22222222-2222-2222-2222-222222222222&page=1&pageSize=20',
    ),
  },
  {
    method: 'GET',
    path: '/v1/templates/{id}',
    title: 'Detalhes de um template',
    description:
      'Retorna os dados completos de um template, incluindo status de aprovação e motivo de rejeição, se houver.',
    curl: buildCurl('GET', '/v1/templates/33333333-3333-3333-3333-333333333333'),
  },
  {
    method: 'PUT',
    path: '/v1/templates/{id}',
    title: 'Atualizar template',
    description:
      'Atualiza a categoria e os componentes de um modelo. Uma alteração de modelo publicado é reenviada para análise da Meta; nome e idioma são imutáveis.',
    curl: buildCurl('PUT', '/v1/templates/33333333-3333-3333-3333-333333333333', {
      category: 'UTILITY',
      components: [
        {
          type: 'BODY',
          text: 'Olá {{1}}, seu pedido {{2}} já saiu para entrega!',
        },
      ],
    }),
  },
  {
    method: 'DELETE',
    path: '/v1/templates/{id}',
    title: 'Remover template',
    description: 'Remove um template do Hub e solicita a remoção na Meta.',
    curl: buildCurl('DELETE', '/v1/templates/33333333-3333-3333-3333-333333333333'),
  },
  {
    method: 'POST',
    path: '/v1/templates/sync',
    title: 'Sincronizar modelos de mensagem com a Meta',
    description:
      'Busca na Meta o status atual de todos os modelos de mensagem da conta e atualiza os registros locais.',
    curl: buildCurl('POST', '/v1/templates/sync', {
      whatsAppAccountId: '22222222-2222-2222-2222-222222222222',
    }),
  },
  {
    method: 'POST',
    path: '/v1/templates/publish-pending',
    title: 'Publicar modelos de mensagem pendentes',
    description:
      'Reenvia para aprovação da Meta os templates que ainda estão pendentes de publicação.',
    curl: buildCurl('POST', '/v1/templates/publish-pending', {
      whatsAppAccountId: '22222222-2222-2222-2222-222222222222',
    }),
  },
];

function EndpointAccordion({ endpoint }: { endpoint: Endpoint }) {
  return (
    <Accordion variant="outlined" disableGutters>
      <AccordionSummary expandIcon={<ExpandMoreOutlined />}>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
          <Chip
            label={endpoint.method}
            color={methodColor[endpoint.method]}
            size="small"
            sx={{ fontWeight: 700, minWidth: 64 }}
          />
          <Typography
            component="code"
            sx={{
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
              fontSize: 14,
            }}
          >
            {endpoint.path}
          </Typography>
          <Typography color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
            — {endpoint.title}
          </Typography>
        </Stack>
      </AccordionSummary>
      <AccordionDetails>
        <Stack spacing={1.5}>
          <Typography color="text.secondary">{endpoint.description}</Typography>
          <CodeBlock code={endpoint.curl} />
          {endpoint.notes && <Alert severity="info">{endpoint.notes}</Alert>}
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}

export function ApiDocsPage() {
  return (
    <Stack spacing={3}>
      <PageHeader
        title="Documentação da API"
        description="Endpoints públicos para enviar mensagens e gerenciar modelos de mensagem a partir de outras aplicações."
      />

      <Card variant="outlined">
        <CardContent>
          <Stack spacing={1.5}>
            <Typography variant="h6">Como autenticar</Typography>
            <Typography color="text.secondary">
              Todas as chamadas abaixo usam uma API key de aplicação (não a sessão administrativa).
              Gere ou copie a chave em <Link href="/api-keys">Chaves de API</Link> e informe-a no
              cabeçalho{' '}
              <Typography
                component="code"
                sx={{
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
                }}
              >
                Authorization: Bearer wh_live_...
              </Typography>{' '}
              de cada requisição.
            </Typography>
            <Divider />
            <Typography variant="subtitle2">URL base</Typography>
            <CodeBlock code={baseUrl} />
            <Alert severity="warning">
              A chave em texto puro só é exibida uma vez, no momento da criação. Guarde-a com
              segurança — o Hub armazena apenas o hash.
            </Alert>
            <Button
              component={Link}
              href={`${baseUrl}/docs`}
              target="_blank"
              rel="noreferrer"
              variant="outlined"
              startIcon={<OpenInNewOutlined />}
              sx={{ alignSelf: 'flex-start' }}
            >
              Referência completa (Swagger)
            </Button>
            <Button
              component="a"
              href="/message-hub.postman_collection.json"
              download
              variant="text"
              sx={{ alignSelf: 'flex-start' }}
            >
              Baixar coleção Postman
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Stack spacing={1.5}>
        <Typography variant="h6">Mensagens</Typography>
        <Stack spacing={1}>
          {messageEndpoints.map((endpoint) => (
            <EndpointAccordion key={`${endpoint.method}-${endpoint.path}`} endpoint={endpoint} />
          ))}
        </Stack>
      </Stack>

      <Stack spacing={1.5}>
        <Typography variant="h6">Modelos de mensagem</Typography>
        <Stack spacing={1}>
          {templateEndpoints.map((endpoint) => (
            <EndpointAccordion key={`${endpoint.method}-${endpoint.path}`} endpoint={endpoint} />
          ))}
        </Stack>
      </Stack>

      <Card variant="outlined">
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h6">Exemplos de integração</Typography>
            <Typography color="text.secondary">
              Use uma chave por aplicação, guarde-a em um cofre de segredos e envie uma chave de
              idempotência a cada operação de escrita.
            </Typography>
            <Typography variant="subtitle2">Node.js (fetch)</Typography>
            <CodeBlock
              code={`await fetch("${baseUrl}/v1/messages", {
  method: "POST",
  headers: {
    Authorization: "Bearer wh_live_SEU_TOKEN",
    "Content-Type": "application/json",
    "Idempotency-Key": crypto.randomUUID(),
  },
  body: JSON.stringify({ phoneNumberId, to: "+5511999999999", content: "Olá" }),
});`}
            />
            <Typography variant="subtitle2">C# (.NET)</Typography>
            <CodeBlock
              code={`using var request = new HttpRequestMessage(HttpMethod.Post, "${baseUrl}/v1/messages");
request.Headers.Authorization = new("Bearer", "wh_live_SEU_TOKEN");
request.Headers.Add("Idempotency-Key", Guid.NewGuid().ToString());
request.Content = JsonContent.Create(new { phoneNumberId, to = "+5511999999999", content = "Olá" });
var response = await httpClient.SendAsync(request, cancellationToken);`}
            />
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
