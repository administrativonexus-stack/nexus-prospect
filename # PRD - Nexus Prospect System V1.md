# PRD - Nexus Prospect System V1

## Visão Geral

O Nexus Prospect System é uma plataforma interna desenvolvida para automatizar a prospecção comercial da Nexus.

O sistema tem como objetivo encontrar empresas através do Google Maps, importar leads para um CRM, realizar auditorias automáticas utilizando IA, iniciar contatos via WhatsApp e utilizar um SDR IA para qualificar oportunidades e agendar reuniões automaticamente.

O sistema não será comercializado como SaaS nesta versão.

Uso exclusivo interno da operação.

---

# Objetivos

## Objetivo Principal

Automatizar o processo de aquisição de clientes para venda de sistemas personalizados.

## Metas

* Reduzir trabalho manual de prospecção
* Centralizar leads em um único sistema
* Automatizar contato inicial
* Automatizar qualificação
* Automatizar agendamento de reuniões
* Melhorar taxa de conversão comercial

---

# Usuários

## Administrador

Permissão total.

## Sócio

Permissão total.

Não existe diferenciação de permissões na V1.

---

# Fluxo Principal

Buscar Empresas
↓
Importar Leads
↓
Auditoria IA
↓
Mensagem Automática
↓
WhatsApp
↓
SDR IA
↓
Agendar Reunião
↓
CRM
↓
Proposta
↓
Fechado

---

# Menu Principal

* Dashboard
* Prospecção
* CRM
* Conversas
* SDR IA
* Configurações

---

# Dashboard

## Métricas

* Leads captados hoje
* Leads captados no mês
* Mensagens enviadas
* Respostas recebidas
* Reuniões marcadas
* Negócios fechados

## Gráficos

Funil de conversão:

Leads
↓
Mensagens
↓
Respostas
↓
Reuniões
↓
Vendas

---

# Módulo de Prospecção

## Objetivo

Buscar empresas através do Google Maps.

## Campos de Busca

* Nicho
* Cidade
* Quantidade de Resultados

## Exemplo

Nicho: Contabilidade

Cidade: Belo Horizonte

Quantidade: 100

## Resultado

Cada empresa deve retornar:

* Nome
* Telefone
* Site
* Endereço
* Avaliação
* Quantidade de avaliações

## Ações

* Importar para CRM
* Analisar Empresa

---

# Auditor IA

## Objetivo

Analisar automaticamente o site da empresa.

## Entradas

* Nome da empresa
* Website

## Análises

* Possui site?
* Site responsivo?
* Possui formulário?
* Possui CTA?
* Possui chatbot?
* Possui captura de leads?

## Resultado

### Score

0 a 100

### Problemas Encontrados

Lista de melhorias.

### Oportunidades

Sugestões de automação e desenvolvimento.

### Argumentos de Venda

Lista de argumentos para abordagem comercial.

---

# CRM

## Pipeline

1. Lead Encontrado
2. Mensagem Enviada
3. Respondeu
4. Reunião Marcada
5. Proposta
6. Fechado
7. Perdido

## Funcionalidades

* Drag and Drop
* Pesquisa
* Filtros
* Histórico

---

# Lead

## Dados

* Nome da empresa
* Telefone
* Cidade
* Website
* Status
* Score

## Informações

* Conversas
* Auditoria IA
* Histórico
* Observações

---

# Conversas

## Objetivo

Centralizar atendimento WhatsApp.

## Layout

* Lista de conversas
* Janela de chat
* Informações do lead

## Recursos

* Envio manual
* Envio IA
* Histórico completo

---

# SDR IA

## Objetivo

Agendar reuniões.

## Limites

O SDR IA NÃO deve vender.

O SDR IA NÃO deve enviar propostas.

O SDR IA NÃO deve negociar preços.

## Responsabilidades

* Responder dúvidas básicas
* Qualificar o lead
* Entender necessidade
* Agendar reunião

## Dados Utilizados

* Nome da empresa
* Cidade
* Histórico da conversa

---

# Google Calendar

## Integração

Quando o lead aceitar reunião:

1. Criar evento no Google Calendar
2. Gerar link Meet
3. Enviar confirmação
4. Atualizar CRM para "Reunião Marcada"

---

# Configurações

## OpenAI

* API Key

## WhatsApp

* Evolution API
* QR Code

## Google Calendar

* OAuth Google

---

# Banco de Dados

## users

id
name
email
created_at

## leads

id
company_name
phone
city
website
rating
review_count
score
status
created_at

## conversations

id
lead_id
message
sender
created_at

## meetings

id
lead_id
meeting_date
meeting_link
status

## audits

id
lead_id
score
problems
opportunities
sales_arguments

---

# Stack Tecnológica

Frontend:

* Next.js
* TypeScript
* Tailwind CSS
* Shadcn UI

Backend:

* Supabase

IA:

* OpenAI

WhatsApp:

* Evolution API

Calendar:

* Google Calendar API

Prospecção:

* Apify ou Outscraper

---

# Design

Visual premium.

Tema escuro.

Minimalista.

Inspirado em:

* Linear
* Stripe Dashboard
* Vercel Dashboard

Sem aparência de CRM antigo.

Priorizar velocidade, clareza e foco em conversão.
