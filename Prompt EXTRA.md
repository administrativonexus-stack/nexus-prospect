Você é um desenvolvedor Full Stack especialista em sistemas SaaS, CRM, ERP, dashboards administrativos e UX/UI.

Quero expandir meu sistema atual da Nexus Digital adicionando dois novos módulos completos no menu lateral (Sidebar), mantendo exatamente o mesmo padrão visual do restante da aplicação.

O sistema deve ter aparência premium, inspirado em plataformas como Stripe, Linear, Vercel Dashboard, Notion, Framer, HubSpot, Monday e ClickUp.

Todo o layout deve ser moderno, clean, minimalista, responsivo, rápido e extremamente organizado.

======================================================================
1) NOVA ABA NA SIDEBAR
💰 FINANCEIRO
======================================================================

Criar uma nova opção na Sidebar chamada:

Financeiro

Ao clicar, abrir um Dashboard Financeiro completo da agência Nexus Digital.

Este módulo será responsável por controlar toda a saúde financeira da empresa.

######################################################################
DASHBOARD
######################################################################

No topo criar cards informativos mostrando:

• Receita do mês
• Despesas do mês
• Lucro líquido
• Receita recorrente (MRR)
• Receita anual (ARR)
• Receita prevista do próximo mês
• Fluxo de Caixa
• Contas a pagar
• Contas a receber
• Ticket médio
• Quantidade de clientes ativos
• Clientes inadimplentes
• Valor recebido hoje
• Valor recebido na semana
• Valor recebido no mês

Cada card deve possuir:

• Ícone moderno
• Cor suave
• Hover elegante
• Pequena animação
• Comparativo com o mês anterior
• Percentual de crescimento ou queda

######################################################################
GRÁFICO PRINCIPAL
######################################################################

Criar um gráfico profissional ocupando boa parte da tela.

Este gráfico será o principal elemento visual do Dashboard.

Características:

• Gráfico de linhas moderno
• Linha suavizada (Smooth Curve)
• Área abaixo da linha preenchida com Gradient
• Animação ao carregar
• Tooltip bonito ao passar o mouse
• Responsivo
• Zoom automático
• Excelente visual tanto no Dark quanto no Light Mode

Cada ponto do gráfico representa um mês.

O gráfico deve mostrar:

Receita
Despesas
Lucro

O usuário poderá ativar ou desativar cada linha.

Exemplo:

☑ Receita

☑ Despesas

☑ Lucro

######################################################################
ESCALA AUTOMÁTICA
######################################################################

O gráfico deve ajustar automaticamente sua escala.

Exemplo:

Se o maior faturamento for:

R$12.000

o eixo deve terminar em aproximadamente:

R$15.000

Se o maior faturamento for:

R$250.000

o gráfico deverá aumentar automaticamente sua escala.

Nunca utilizar escala fixa.

Sempre utilizar escala dinâmica baseada no maior valor encontrado.

######################################################################
FILTROS DO GRÁFICO
######################################################################

Adicionar filtros rápidos:

Hoje

Últimos 7 dias

Últimos 30 dias

Últimos 90 dias

Este mês

Últimos 6 meses

Últimos 12 meses

Este ano

Período personalizado

######################################################################
ESTATÍSTICAS ACIMA DO GRÁFICO
######################################################################

Mostrar:

📈 Crescimento em relação ao mês anterior

🔥 Melhor mês da empresa

💰 Total faturado

💸 Total gasto

🏆 Lucro líquido

📊 Média mensal

📅 Receita prevista do próximo mês

######################################################################
META MENSAL
######################################################################

Criar uma meta mensal configurável.

Exemplo:

Meta

R$30.000

Mostrar uma barra elegante indicando:

██████████░░░░░░

78%

R$23.500 de R$30.000

Quando atingir 100%

mostrar uma pequena animação de sucesso.

######################################################################
PREVISÃO DE FATURAMENTO
######################################################################

Criar uma previsão automática utilizando a média dos meses anteriores.

Exemplo

Previsão para o próximo mês

R$28.450

######################################################################
FLUXO DE CAIXA
######################################################################

Criar uma tabela moderna contendo:

Data

Descrição

Categoria

Cliente

Tipo

Entrada

Saída

Valor

Forma de pagamento

Status

Pago

Pendente

Vencido

Editar

Excluir

Filtros:

Categoria

Cliente

Período

Forma de pagamento

Status

Pesquisa

######################################################################
NOVA RECEITA
######################################################################

Botão:

+ Nova Receita

Campos:

Data

Cliente

Valor

Descrição

Categoria

Forma de pagamento

PIX

Cartão

Dinheiro

Transferência

Boleto

Receita recorrente

Sim

Não

Se recorrente:

Mensal

Trimestral

Semestral

Anual

Quantidade de parcelas

Próximo vencimento

Observações

######################################################################
NOVA DESPESA
######################################################################

Botão:

+ Nova Despesa

Categorias:

Google Ads

Meta Ads

TikTok Ads

OpenAI

Claude

Gemini

Cursor

Lovable

Cloudflare

Hospedagem

Domínio

Servidor

Internet

Energia

Telefone

Notebook

Computador

Funcionários

Freelancers

Comissões

Salários

Cursos

Mentorias

Assinaturas

Aluguel

Impostos

Contador

Marketing

Viagens

Combustível

Alimentação

Outros

Campos:

Descrição

Categoria

Fornecedor

Valor

Data

Forma de pagamento

Recorrente

Sim

Não

Anexar comprovante

Observações

######################################################################
CLIENTES RECORRENTES
######################################################################

Criar uma tela mostrando:

Nome

Empresa

Valor Mensal

Próximo vencimento

Dias restantes

Status

Recebido

Pendente

Botão:

Recebido

Editar

######################################################################
CONTROLE DE CLIENTES
######################################################################

Cada cliente deve possuir:

Nome

Empresa

Plano

Valor mensal

Data de vencimento

Receita total

Tempo como cliente

Status

Ativo

Pausado

Cancelado

Serviços contratados

######################################################################
RELATÓRIOS
######################################################################

Criar uma tela de relatórios contendo:

Receita por mês

Lucro por mês

Despesas por categoria

Clientes mais lucrativos

Evolução financeira

Comparativo mensal

Comparativo anual

Fluxo de caixa

Exportar PDF

Exportar Excel

######################################################################
INDICADORES
######################################################################

Mostrar automaticamente:

Maior cliente

Maior despesa

Maior receita

Categoria que mais gera gastos

Categoria que mais gera lucro

Margem líquida

MRR

ARR

CAC

LTV

Lucro Bruto

Lucro Líquido

######################################################################
ALERTAS
######################################################################

Criar notificações automáticas para:

Contas vencendo

Clientes atrasados

Assinaturas próximas

Fluxo de caixa negativo

Meta atingida

Receitas pendentes

======================================================================
2) NOVA ABA
🌐 PORTFÓLIO
======================================================================

Criar uma nova opção na Sidebar chamada:

Portfólio

Ela será uma biblioteca de todos os sites desenvolvidos pela Nexus Digital.

######################################################################
LAYOUT
######################################################################

Criar um layout em Cards.

Cada card deve possuir:

Imagem do site

Nome

Cliente

Categoria

Descrição

Data

Status

Tecnologias

######################################################################
BOTÕES
######################################################################

Cada card deve possuir:

🌐 Abrir Site

👁 Visualizar

📋 Copiar Link

✏ Editar

🗑 Excluir

######################################################################
CADASTRO
######################################################################

Botão

Novo Projeto

Campos:

Nome

Cliente

Categoria

Descrição

URL do Site

URL do Repositório

Tecnologias

Thumbnail

Data

Observações

######################################################################
FILTROS
######################################################################

Todos

Landing Pages

Sites

Sistemas

Aplicativos

E-commerce

######################################################################
PESQUISA
######################################################################

Pesquisar por:

Nome

Cliente

Categoria

######################################################################
ORDENAÇÃO
######################################################################

Mais recentes

Mais antigos

A-Z

Última edição

######################################################################
BADGES
######################################################################

Mostrar badges como:

React

Next.js

Laravel

Vue

Node

WordPress

Firebase

Supabase

HTML

CSS

JavaScript

PHP

Outro

######################################################################
ESTATÍSTICAS
######################################################################

No topo mostrar:

Total de projetos

Landing Pages

Sites

Sistemas

Aplicativos

E-commerce

Projetos ativos

Último projeto criado

######################################################################
FAVORITOS
######################################################################

Permitir favoritar projetos.

Criar uma seção:

⭐ Favoritos

======================================================================
BANCO DE DADOS
======================================================================

Estruturar corretamente todas as tabelas.

Utilizar relacionamentos.

Preparar para futuras expansões.

Evitar código duplicado.

Criar APIs organizadas.

Seguir boas práticas de arquitetura.

======================================================================
DESIGN
======================================================================

Todo o sistema deve possuir:

✔ Layout moderno

✔ Bordas arredondadas

✔ Ícones elegantes

✔ Sombras suaves

✔ Hover moderno

✔ Transições suaves

✔ Responsividade completa

✔ Dark Mode

✔ Light Mode

✔ Excelente experiência do usuário

✔ Interface extremamente profissional

======================================================================
OBJETIVO
======================================================================

Quero transformar meu CRM em uma plataforma completa de gestão para minha agência Nexus Digital.

O módulo Financeiro deve permitir controlar absolutamente todas as receitas, despesas, assinaturas, clientes recorrentes, fluxo de caixa, lucro, metas e crescimento financeiro.

O módulo Portfólio deve funcionar como uma biblioteca organizada de todos os projetos desenvolvidos pela agência, permitindo acesso rápido aos sites publicados.

Todas as funcionalidades devem ser totalmente integradas ao sistema existente, mantendo exatamente o mesmo padrão visual, identidade, componentes, animações e experiência do usuário já utilizados no restante da aplicação.