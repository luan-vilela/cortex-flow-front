# PRD — Sistema de Nós do Cortex Flow

> **Versão:** 1.0 | **Data:** 2026-03-01 | **Workspace:** `cortex-flow-front`

---

## 1. Objetivo

Documentar o sistema de nós do Cortex Flow: como criar novos nós, como integrá-los ao editor visual e ao compilador Node-RED, e quais convenções devem ser seguidas para manter o sistema extensível e consistente.

---

## 2. Arquitetura Geral

```
┌──────────────────────────────────────────────────────────────────┐
│                      Editor Visual (ReactFlow)                   │
│                                                                  │
│  Paleta  ──▶  Canvas (nós)  ──▶  NodeConfigPanel (painel lateral)│
└────────────────────────┬─────────────────────────────────────────┘
                         │ save flow (JSON)
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│                  Backend (cortex-flow / NestJS)                  │
│                                                                  │
│  flow-compiler.service.ts  ──▶  Node-RED JSON  ──▶  API Node-RED │
└──────────────────────────────────────────────────────────────────┘
```

### Componentes principais

| Camada     | Arquivo                                                  | Responsabilidade                                             |
| ---------- | -------------------------------------------------------- | ------------------------------------------------------------ |
| Registro   | `src/lib/node-registry/index.ts`                         | Array mestre `NODE_REGISTRY`; gera `NODE_TYPES_MAP` e paleta |
| Taxonomia  | `src/lib/node-registry/taxonomy.ts`                      | `CATEGORIES`, `PROVIDERS`, `PRODUCTS`                        |
| Tipos      | `src/lib/node-registry/types.ts`                         | Interface `NodeDefinition`                                   |
| Definições | `src/lib/node-registry/definitions/*.ts`                 | Arrays por categoria                                         |
| Nó canvas  | `nodes/{categoria}/{provider}/{Name}Node.tsx`            | Componente visual no canvas                                  |
| Nó config  | `nodes/{categoria}/{provider}/{Name}NodeConfig.tsx`      | Painel de configuração lateral                               |
| Roteador   | `src/components/flow-editor/NodeConfigPanel.tsx`         | Roteia `node.type` → painel correto                          |
| Compilador | `cortex-flow/src/modules/flows/flow-compiler.service.ts` | Gera JSON do Node-RED                                        |

---

## 3. Taxonomia

### 3.1 Categorias (`CATEGORIES`)

| ID              | Cor     | Descrição                                       |
| --------------- | ------- | ----------------------------------------------- |
| `trigger`       | emerald | Nós que iniciam o fluxo (webhook, cron, manual) |
| `communication` | violet  | Envio de mensagens (email, SMS, WhatsApp)       |
| `automation`    | orange  | Automações HTTP, lógica, transformação          |
| `integration`   | blue    | Conexões com sistemas externos                  |

### 3.2 Providers (`PROVIDERS`)

| ID       | Descrição                               |
| -------- | --------------------------------------- |
| `native` | Implementação própria do Cortex         |
| `google` | Integração Google (Gmail, Sheets, etc.) |
| `meta`   | Integração Meta (WhatsApp, Instagram)   |
| `openai` | Integração OpenAI                       |

### 3.3 Products (`PRODUCTS`)

Enum de produto técnico: `WEBHOOK_IN`, `WEBHOOK_OUT`, `EMAIL`, `SMS`, `CHAT`, `DATABASE`, etc.

---

## 4. Variantes de Nó (`FlowNodeVariant`)

| Variant   | Handles         | Uso típico                                       |
| --------- | --------------- | ------------------------------------------------ |
| `"start"` | Apenas saída    | Triggers (início do fluxo)                       |
| `"work"`  | Entrada + saída | Transformações, chamadas HTTP, processamento     |
| `"end"`   | Apenas entrada  | Terminadores (HTTP Response, enviar email final) |

---

## 5. Anatomia de um Nó

### 5.1 Arquivo do nó canvas (`{Name}Node.tsx`)

```tsx
"use client";
import { memo } from "react";
import { type NodeProps } from "@xyflow/react";
import FlowNode from "@/components/flow-editor/FlowNode";

// 1. Tipos de dados do nó
export interface MyNodeData {
  someField?: string;
  [key: string]: unknown; // obrigatório para compatibilidade com ReactFlow
}

// 2. Componente visual
function MyNode({ data, selected }: NodeProps) {
  const d = data as MyNodeData;
  const isConfigured = !!d.someField; // quando o nó está "configurado"

  return (
    <FlowNode
      variant="work" // "start" | "work" | "end"
      color="orange" // cor da categoria
      icon="🔧" // emoji representativo
      label={d.someField ?? "Meu Nó"}
      configured={isConfigured}
      selected={selected}
    />
  );
}

export default memo(MyNode);
```

### 5.2 Arquivo de configuração (`{Name}NodeConfig.tsx`)

```tsx
"use client";
import { useCallback } from "react";
import type { MyNodeData } from "./MyNode";

interface Props {
  nodeId: string;
  workspaceId: string;
  flowId: string;
  data: MyNodeData;
  onChange: (d: MyNodeData) => void;
}

export default function MyNodeConfig({ data, onChange }: Props) {
  const set = useCallback(
    (patch: Partial<MyNodeData>) => onChange({ ...data, ...patch }),
    [data, onChange],
  );

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
          Campo
        </label>
        <input
          type="text"
          value={data.someField ?? ""}
          onChange={(e) => set({ someField: e.target.value })}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
      </div>
    </div>
  );
}
```

---

## 6. Registro de Nós

### 6.1 Interface `NodeDefinition`

```typescript
interface NodeDefinition {
  type: string; // chave única, ex: "httpRequestNode"
  label: string; // nome exibido na UI
  icon: string; // emoji
  description: string; // texto descritivo para tooltip/paleta
  category: string; // CATEGORIES.*.id
  provider: string; // PROVIDERS.*.id
  product: string; // PRODUCTS.*
  variant: FlowNodeVariant; // "start" | "work" | "end"
  color: FlowNodeColor; // "emerald" | "orange" | "violet" | ...
  component: ComponentType; // componente React do nó canvas
}
```

### 6.2 Arquivo de definições por categoria

Criar em `src/lib/node-registry/definitions/{categoria}.ts`:

```typescript
import type { NodeDefinition } from "../types";
import { CATEGORIES, PROVIDERS, PRODUCTS } from "../taxonomy";
import MyNode from "@/components/flow-editor/nodes/{categoria}/native/MyNode";

export const MY_CATEGORY_NODES: NodeDefinition[] = [
  {
    type: "myNode",
    label: "Meu Nó",
    icon: "🔧",
    description: "Descrição clara do que este nó faz.",
    category: CATEGORIES.AUTOMATION.id,
    provider: PROVIDERS.NATIVE.id,
    product: PRODUCTS.WEBHOOK_OUT,
    variant: "work",
    color: CATEGORIES.AUTOMATION.color,
    component: MyNode,
  },
];
```

### 6.3 Adicionar ao registro principal

Em `src/lib/node-registry/index.ts`:

```typescript
import { MY_CATEGORY_NODES } from "./definitions/{categoria}";

export const NODE_REGISTRY: NodeDefinition[] = [
  ...TRIGGER_NODES,
  ...COMMUNICATION_NODES,
  ...AUTOMATION_NODES,
  ...MY_CATEGORY_NODES, // ← adicionar aqui
];
```

---

## 7. Roteamento do Painel de Configuração

Em `NodeConfigPanel.tsx`, adicionar o bloco condicional:

```tsx
import MyNodeConfig from "./nodes/{categoria}/native/MyNodeConfig";
import type { MyNodeData } from "./nodes/{categoria}/native/MyNode";

// Dentro do JSX, na seção "Config form":
{
  node.type === "myNode" && (
    <MyNodeConfig
      nodeId={node.id}
      workspaceId={workspaceId}
      flowId={flowId}
      data={data as MyNodeData}
      onChange={handleChange}
    />
  );
}
```

---

## 8. Variáveis Dinâmicas (`{{variavel}}`)

O Cortex Flow suporta interpolação de variáveis em campos de texto usando a sintaxe `{{nome_da_variavel}}`.

### Como funciona

1. **Save time**: O valor digitado (ex: `{{email}}`) é salvo literalmente no JSON do fluxo
2. **Compile time**: O compilador transfere esse valor para env vars do Node-RED
3. **Runtime**: A função `render()` no Node-RED substitui `{{variavel}}` pelo valor do payload do webhook

### Convenção nos campos de config

- Sempre mostrar hint abaixo de campos de texto que suportam variáveis:

```tsx
<p className="text-[11px] text-gray-400 mt-1">
  Use <code className="bg-gray-100 rounded px-0.5">{"{{variavel}}"}</code> para
  valores dinâmicos
</p>
```

### Variáveis disponíveis automaticamente

| Variável        | Origem                   |
| --------------- | ------------------------ |
| `{{payload.*}}` | Corpo do webhook trigger |
| `{{query.*}}`   | Query string do webhook  |
| `{{headers.*}}` | Headers do webhook       |

---

## 9. Compilador Node-RED (`flow-compiler.service.ts`)

O compilador transforma o grafo ReactFlow em JSON do Node-RED. Cada `node.type` precisa ter um handler no compilador.

### Adicionando suporte a um novo nó

No `flow-compiler.service.ts`, dentro do switch/if de processamento de nós:

```typescript
case "myNode": {
  const envPrefix = `MYNODE_${node.id.toUpperCase()}`;
  nodeRedNodes.push({
    id: node.id,
    type: "function",
    name: "My Node",
    func: `
      const template = env.get("${envPrefix}_FIELD");
      const result = render(template, msg.payload);
      msg.myResult = result;
      return msg;
    `,
    wires: [outWires],
  });
  envVars[`${envPrefix}_FIELD`] = nodeData.someField ?? "";
  break;
}
```

---

## 10. Nós Implementados

### 10.1 `triggerNode` — Trigger

- **Categoria**: trigger | **Variant**: start
- **Modos**: manual, webhook (POST), cron (expressão cron)
- **Config**: TriggerNodeConfig — exibe URL do webhook, input de cron
- **Compilador**: gera nó `http in` (webhook) ou `inject` (manual/cron)

### 10.2 `gmailNode` — Gmail

- **Categoria**: communication | **Provider**: google | **Variant**: end
- **Config**: GmailNodeConfig — credencial OAuth, destinatário, assunto, corpo
- **Suporte a variáveis**: `{{variavel}}` em todos os campos de texto
- **Compilador**: gera nó `gmail` com env vars para cada campo

### 10.3 `httpRequestNode` — HTTP Request

- **Categoria**: automation | **Variant**: work
- **Config**: HttpRequestNodeConfig — método, URL, autenticação (bearer/basic/apikey), headers, body
- **Suporte a variáveis**: `{{variavel}}` na URL, headers e body
- **Compilador**: gera nó `http request`

### 10.4 `httpResponseNode` — HTTP Response

- **Categoria**: automation | **Variant**: end
- **Config**: HttpResponseNodeConfig — status code (9 opções), Content-Type, corpo da resposta
- **Suporte a variáveis**: `{{variavel}}` no corpo
- **Compilador**: gera nó `http response`

---

## 11. Checklist para Criar um Novo Nó

```
[ ] 1. Criar {Name}Node.tsx em nodes/{categoria}/{provider}/
[ ] 2. Criar {Name}NodeConfig.tsx no mesmo diretório
[ ] 3. Criar ou atualizar definitions/{categoria}.ts com a NodeDefinition
[ ] 4. Adicionar spread no NODE_REGISTRY em index.ts
[ ] 5. Importar e adicionar bloco condicional em NodeConfigPanel.tsx
[ ] 6. Adicionar handler no flow-compiler.service.ts (backend)
[ ] 7. Verificar zero erros TypeScript nos arquivos modificados
```

---

## 12. Convenções de UI

- **Tailwind v4**: modificador important usa sufixo → `class!` (não `!class`)
- **SectionLabel**: componente interno para labels de seção (uppercase, xs, gray-500)
- **TextInput**: componente reutilizável com `font-mono` opcional
- **Cores de foco**: `focus:ring-2 focus:ring-{cor-categoria}-400`
- **Espaçamento entre seções**: `space-y-5` no container, `border-t border-gray-100` como divisor
- **Hints**: `text-[11px] text-gray-400 mt-1` abaixo de campos

---

## 13. Estrutura de Arquivos Completa

```
cortex-flow-front/src/
├── lib/
│   └── node-registry/
│       ├── index.ts                    ← registro mestre + NODE_TYPES_MAP
│       ├── types.ts                    ← interface NodeDefinition
│       ├── taxonomy.ts                 ← CATEGORIES, PROVIDERS, PRODUCTS
│       └── definitions/
│           ├── triggers.ts
│           ├── communication.ts
│           └── automation.ts           ← HTTP Request, HTTP Response
└── components/
    └── flow-editor/
        ├── NodeConfigPanel.tsx         ← roteador de painéis
        ├── FlowNode.tsx                ← componente base de nó
        └── nodes/
            ├── triggers/
            │   └── native/
            │       ├── TriggerNode.tsx
            │       └── TriggerNodeConfig.tsx
            ├── communication/
            │   └── google/
            │       ├── GmailNode.tsx
            │       └── GmailNodeConfig.tsx
            └── automation/
                └── native/
                    ├── HttpRequestNode.tsx
                    ├── HttpRequestNodeConfig.tsx
                    ├── HttpResponseNode.tsx
                    └── HttpResponseNodeConfig.tsx
```
