from common import *
import os

NUM = 'font-variant-numeric: tabular-nums'
def H(n): return '{{ ' + n + ' }}'
def wpage(fname, title, root_style, body, logic, w, h):
    html = ('<!doctype html>\n<html lang="pt-BR">\n<head>\n<meta charset="utf-8">\n<title>' + title + '</title>\n<script src="./support.js"></script>\n</head>\n<body>\n<x-dc>\n<helmet>\n'
            '<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">\n'
            '<style>\nbody{margin:0}\na{color:#A9482C}a:hover{color:#8A3920}\n</style>\n</helmet>\n'
            f'<div style="{root_style}; box-sizing: border-box; color: {G}; font-family: {FB}; font-size: 16px; line-height: 24px">\n' + body + '\n</div>\n</x-dc>\n'
            '<script type="text/x-dc" data-dc-script data-props=\'{"$preview":{"width":' + str(w) + ',"height":' + str(h) + '}}\'>\n'
            'class Component extends DCLogic {\n' + logic + '\n}\n</script>\n</body>\n</html>\n')
    open(os.path.join(OUT, fname), 'w').write(html)
    print(fname, len(html))
VAZIO = 'renderVals() {\nreturn {};\n}'
h2 = lambda t: f'<h2 style="margin: 0; font-family: {FD}; font-weight: 700; font-size: 20px; line-height: 26px">{t}</h2>'
cardw = lambda inner, extra='': f'<section style="padding: 20px; border-radius: 16px; background: {W}; border: 1px solid {LN}; display: flex; flex-direction: column; gap: 12px; min-width: 0; {extra}">{inner}</section>'
def lrow(t, sub, v, href=None, tag=''):
    inner = (f'<span style="flex: 1 1 0; min-width: 0"><span style="display: block; font-weight: 600">{t}</span><span style="display: block; font-size: 13px; line-height: 18px; color: {G2}">{sub}</span></span>'
             f'<span style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px"><span style="font-weight: 700; {NUM}">{v}</span>{tag}</span>')
    st = f'display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid {LN}; text-decoration: none; color: {G}'
    return f'<a href="{href}" style="{st}">{inner}{icon("avancar", 18, G2)}</a>' if href else f'<div style="{st}">{inner}</div>'

# ---------- Gestão no computador (página fluida) ----------
MENU = [('inicio', 'Início', 'Gestao-Inicio.dc.html', True), ('pedidos', 'Pedidos', 'Gestao-Pedidos.dc.html', False), ('estoque', 'Estoque', 'Gestao-Estoque.dc.html', False),
        ('financeiro', 'Financeiro', 'Gestao-Financeiro.dc.html', False), ('compras', 'Compras', 'Gestao-Compras.dc.html', False), ('producao', 'Produção', 'Gestao-Producao.dc.html', False),
        ('vender', 'Produtos', 'Gestao-Produtos.dc.html', False), ('perfil', 'Clientes', 'Gestao-Clientes.dc.html', False), ('local', 'Entregas', 'Gestao-Entregas.dc.html', False),
        ('historico', 'Relatórios', 'Gestao-Relatorios.dc.html', False), ('mais', 'Configurações', 'Gestao-Configuracoes.dc.html', False)]
menu = (f'<nav aria-label="Módulos" style="flex: 1 1 220px; max-width: 260px; min-width: 200px; display: flex; flex-direction: column; gap: 2px; padding: 20px 12px; background: {W}; border-right: 1px solid {LN}">'
        f'<div style="padding: 4px 12px 16px; font-family: {FD}; font-weight: 700; font-size: 24px; line-height: 30px">Bodeleve</div>'
        + ''.join(f'<a href="{h}" {"aria-current=" + chr(34) + "page" + chr(34) + " " if on else ""}style="display: flex; align-items: center; gap: 12px; min-height: 44px; padding: 0 12px; border-radius: 10px; text-decoration: none; '
                  f'background: {TS if on else "transparent"}; color: {TP if on else G}; font-size: 15px; font-weight: {600 if on else 500}">{icon(ic, 20)}<span>{t}</span></a>' for ic, t, h, on in MENU) + '</nav>')
kpi = lambda t, v, sub, fg=G: (f'<div style="padding: 16px; border-radius: 12px; background: {W}; border: 1px solid {LN}; display: flex; flex-direction: column; gap: 2px; min-width: 0">'
                               f'<span style="font-size: 13px; line-height: 18px; color: {G2}">{t}</span><span style="font-weight: 600; font-size: 24px; line-height: 30px; color: {fg}; {NUM}">{v}</span><span style="font-size: 12px; line-height: 16px; color: {G2}">{sub}</span></div>')
conteudo = (f'<main style="flex: 999 1 560px; min-width: 0; padding: 32px; display: flex; flex-direction: column; gap: 24px">'
    f'<header style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-end; gap: 16px"><div><div style="{SM}">Sábado, 14 de novembro · 15h30</div>'
    f'<h1 style="margin: 0; font-family: {FD}; font-weight: 700; font-size: 34px; line-height: 40px">Boa tarde</h1></div>'
    f'<a href="Gestao-CompraNova.dc.html" style="height: 48px; padding: 0 20px; border-radius: 12px; background: {T}; color: {W}; text-decoration: none; display: inline-flex; align-items: center; gap: 8px; font-weight: 600">{icon("adicionar", 20)}Novo pedido de compra</a></header>'
    f'<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px">'
    f'<a href="Gestao-Pedidos.dc.html" style="grid-column: span 2; padding: 20px; border-radius: 16px; background: {G}; color: {C}; text-decoration: none; display: flex; flex-direction: column; gap: 8px; {NUM}">'
    f'<span style="font-size: 14px">Vendas de hoje</span><span style="font-family: {FD}; font-weight: 700; font-size: 40px; line-height: 44px">R$ 1.284,50</span>'
    f'<span style="font-size: 14px; color: {LN}">Balcão R$ 892,00 · Internet R$ 392,50 · ontem até esta hora R$ 1.102,00</span></a>'
    + kpi('Pedidos em aberto', '4', '2 novos · 2 em preparo') + kpi('A pagar hoje', 'R$ 640,00', '2 contas', ER_T) + '</div>'
    f'<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 16px; align-items: start">'
    + cardw(h2('Pede ação hoje') + '<div>' + lrow('2 pedidos novos', 'Aguardando aceite', '', 'Gestao-Pedidos.dc.html') + lrow('Aluguel atrasado', 'Venceu em 10/11', 'R$ 1.800,00', 'Gestao-Baixa.dc.html', tagc('Atrasado', ER_T, ER_B))
            + lrow('3 lotes vencem em até 7 dias', 'Queijo coalho, Doce de leite, Nata', '', 'Gestao-Estoque.dc.html') + lrow('7 itens com estoque baixo', 'Tapioca, Rapadura e mais 5', '', 'Gestao-Estoque.dc.html') + '</div>')
    + cardw(h2('Pedidos do dia') + '<div>' + lrow('#1043 · Maria Lima', 'Entrega · 3 itens · 15h20', 'R$ 63,70', 'Gestao-Pedido.dc.html', tagc('Novo', IN_T, IN_B))
            + lrow('#1044 · João Pedro', 'Retirada · 2 itens · 15h26', 'R$ 47,80', None, tagc('Novo', IN_T, IN_B)) + lrow('#1041 · Paula Reis', 'Entrega · 6 itens', 'R$ 132,10', None, tagc('Em preparo', AT_T, AT_B))
            + lrow('#1042 · Ana Souza', 'Entrega · com Carlos', 'R$ 81,20', None, tagc('Em rota', IN_T, IN_B)) + '</div>')
    + cardw(h2('Em produção') + '<div>' + lrow('OP-0032 · Queijo coalho', '20 un · termina 18h', '', 'Gestao-Ordem.dc.html') + lrow('OP-0033 · Doce de leite', '12 un · termina amanhã 10h', '') + '</div>')
    + '</div>'
    f'<div style="{SM}">A partir de 1024 px: menu lateral fixo com os 12 módulos, cartões lado a lado. Entre 768 e 1023 px o menu vira faixa recolhível; abaixo de 768 px vale o layout de celular.</div></main>')
desk = f'<div style="display: flex; flex-wrap: wrap; min-height: 100vh">{menu}{conteudo}</div>'
wpage('Resp-Gestao-Desktop.dc.html', 'Bodeleve — gestão no computador', f'width: 100%; min-height: 100vh; background: {OP}', desk, VAZIO, 1280, 980)

# ---------- PDV no tablet do balcão (1024 × 768, deitado) ----------
PR = [('Queijo coalho', 'R$ 32,90', '12 un', 32.9), ('Carne de sol', 'R$ 59,90/kg', '6,4 kg', 29.95), ('Farinha de mandioca', 'R$ 12,90', '26 un', 12.9), ('Tapioca granulada', 'R$ 9,90', '3 un', 9.9),
      ('Rapadura', 'R$ 14,50', '4 un', 14.5), ('Manteiga de garrafa', 'R$ 28,00', '11 un', 28.0), ('Feijão de corda', 'R$ 16,90/kg', '9 kg', 8.45), ('Doce de leite', 'R$ 18,90', '9 un', 18.9)]
tiles = ''.join(f'<button type="button" onClick="{H("a" + str(i))}" aria-label="{n}, {p}" style="height: 112px; padding: 14px; border-radius: 12px; border: 1px solid {LN}; background: {W}; color: {G}; text-align: left; display: flex; flex-direction: column; justify-content: space-between; font: 400 14px {FB}; min-width: 0">'
                f'<span style="font-weight: 600; font-size: 16px; line-height: 20px">{n}</span><span style="display: flex; justify-content: space-between; {NUM}"><b>{p}</b><span style="font-size: 12px; color: {AT_T if e in ("3 un", "4 un") else G2}">{e}</span></span></button>'
                for i, (n, p, e, v) in enumerate(PR))
tablet = (f'<div style="flex: 1 1 0; display: flex; flex-direction: column; min-width: 0">'
    f'<header style="display: flex; align-items: center; justify-content: space-between; padding: 14px 24px; background: {W}; border-bottom: 1px solid {LN}"><div><b style="font-family: {FD}; font-size: 22px">Balcão</b>'
    f'<span style="{SM}"> · caixa aberto · Júlia</span></div><div role="tablist" style="display: flex; gap: 4px">'
    + ''.join(f'<span role="tab" aria-selected="{"true" if k == 0 else "false"}" style="height: 44px; padding: 0 16px; display: inline-flex; align-items: center; border-bottom: 3px solid {T if k == 0 else "transparent"}; font-weight: 600; color: {G if k == 0 else G2}">{t}</span>' for k, t in enumerate(['Favoritos', 'Categorias', 'Buscar']))
    + f'</div></header><main style="flex: 1 1 0; padding: 20px 24px; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; align-content: start">{tiles}</main>'
    f'<div style="{SM}; padding: 0 24px 16px">Produtos por peso abrem o peso numa janela central. Abas e busca como no celular.</div></div>'
    f'<aside aria-label="Sacola" style="flex: none; width: 340px; display: flex; flex-direction: column; background: {W}; border-left: 1px solid {LN}">'
    f'<div style="padding: 20px 20px 8px; font-family: {FD}; font-weight: 700; font-size: 22px">Sacola</div>'
    f'<div style="flex: 1 1 0; padding: 0 20px; overflow: auto"><sc-for list="{H("itens")}" as="it" hint-placeholder-count="2"><div style="display: flex; justify-content: space-between; gap: 12px; padding: 12px 0; border-bottom: 1px solid {LN}; {NUM}"><span>{{{{ it.n }}}}</span><b>{{{{ it.v }}}}</b></div></sc-for>'
    f'<sc-if value="{H("vazia")}" hint-placeholder-val="{H("false")}"><div style="{SM}; padding: 12px 0">Toque nos produtos para somar.</div></sc-if></div>'
    f'<div style="padding: 16px 20px 20px; border-top: 1px solid {LN}; display: flex; flex-direction: column; gap: 12px"><div style="display: flex; justify-content: space-between; font-weight: 700; font-size: 24px; {NUM}"><span>Total</span><span>{H("total")}</span></div>'
    f'<a href="PDV-Pagamento.dc.html" style="height: 56px; border-radius: 12px; background: {T}; color: {W}; text-decoration: none; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 18px">Cobrar</a>'
    f'<button type="button" onClick="{H("limpar")}" style="height: 44px; border: 1.5px solid {G}; border-radius: 12px; background: {W}; color: {G}; font: 600 15px {FB}">Limpar sacola</button></div></aside>')
logic_tab = ("renderVals() {\nconst fmt = (v) => 'R$ ' + v.toFixed(2).replace('.', ',');\nconst N = [" + ', '.join("'" + p[0] + "'" for p in PR) + "];\nconst V = [" + ', '.join(str(p[3]) for p in PR) + "];\n"
             "const c = (this.state && this.state.c) || [{ i: 0 }, { i: 1 }];\nconst out = { itens: c.map((x) => ({ n: N[x.i] + (x.i === 1 || x.i === 6 ? ' · 0,500 kg' : ''), v: fmt(V[x.i]) })), vazia: c.length === 0, total: fmt(c.reduce((a, x) => a + V[x.i], 0)), limpar: () => this.setState({ c: [] }) };\n"
             "N.forEach((n, i) => { out['a' + i] = () => this.setState({ c: c.concat([{ i: i }]) }); });\nreturn out;\n}")
wpage('Resp-PDV-Tablet.dc.html', 'Bodeleve — PDV no tablet', f'width: 1024px; height: 768px; display: flex; background: {OP}', tablet, logic_tab, 1024, 768)

# ---------- Loja no computador (página fluida) ----------
LP = [('Queijo coalho', '500 g', 'R$ 32,90', 'casa'), ('Queijo manteiga', '500 g', 'R$ 36,90', 'casa'), ('Rapadura', '400 g', 'R$ 14,50', 'marca'), ('Manteiga de garrafa', '200 ml', 'R$ 28,00', 'marca'),
      ('Carne de sol', '500 g', 'R$ 34,90', ''), ('Farinha de mandioca', '1 kg', 'R$ 12,90', ''), ('Doce de leite', '400 g', 'R$ 18,90', 'casa'), ('Tapioca granulada', '500 g', 'R$ 9,90', '')]
def lcard(n, u, p, o):
    s = seal('Feito na casa', V) if o == 'casa' else seal('Marca Bodeleve', T) if o == 'marca' else ''
    return (f'<a href="Loja-Produto.dc.html" style="padding: 12px; border-radius: 12px; background: {W}; border: 1px solid {LN}; text-decoration: none; color: {G}; display: flex; flex-direction: column; gap: 8px; min-width: 0">'
            f'<span role="img" aria-label="Espaço para foto do produto" style="height: 160px; border-radius: 10px; background: {C}; border: 1px dashed {G2}; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; color: {G2}">[FOTO DO PRODUTO]</span>'
            f'<span style="min-height: 24px">{s}</span><span style="font-weight: 600">{n}</span><span style="font-size: 13px; color: {G2}">{u}</span><span style="font-weight: 700; font-size: 18px; {NUM}">{p}</span></a>')
loja = (f'<header style="display: flex; flex-wrap: wrap; align-items: center; gap: 16px 32px; padding: 16px 32px; background: {W}; border-bottom: 1px solid {LN}">'
    f'<a href="Loja-Inicio.dc.html" style="font-family: {FD}; font-weight: 700; font-size: 28px; text-decoration: none; color: {G}">Bodeleve</a>'
    f'<nav aria-label="Seções" style="display: flex; flex-wrap: wrap; gap: 4px">' + ''.join(f'<a href="{h}" style="min-height: 44px; padding: 0 12px; display: inline-flex; align-items: center; text-decoration: none; color: {G}; font-weight: 500">{t}</a>'
        for t, h in (('Produtos', 'Loja-Categoria.dc.html'), ('Linha Bodeleve', 'Loja-Linha.dc.html'), ('Sobre a casa', 'Loja-Sobre.dc.html'), ('Meus pedidos', 'Loja-Pedidos.dc.html'))) + '</nav>'
    f'<div style="flex: 1 1 240px; display: flex; align-items: center; gap: 10px; height: 44px; padding: 0 16px; border-radius: 999px; background: {C}; border: 1.5px solid {LN}; color: {G2}">{icon("buscar", 20)}'
    f'<input type="search" aria-label="Buscar produto" placeholder="Buscar na Bodeleve" style="flex: 1 1 0; min-width: 0; border: 0; background: transparent; font: 400 16px {FB}; color: {G}; outline: none"></div>'
    f'<a href="Loja-Sacola.dc.html" style="height: 44px; padding: 0 16px; border-radius: 12px; background: {T}; color: {W}; text-decoration: none; display: inline-flex; align-items: center; gap: 8px; font-weight: 600">{icon("sacola", 20)}Sacola · 3</a></header>'
    f'<main style="max-width: 1200px; margin: 0 auto; padding: 32px; display: flex; flex-direction: column; gap: 32px">'
    f'<section style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 24px; align-items: center; padding: 40px; border-radius: 24px; background: {T}; color: {W}">'
    f'<div style="display: flex; flex-direction: column; gap: 16px"><div style="font-size: 13px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase">Casa do Norte</div>'
    f'<div style="font-family: {FD}; font-weight: 700; font-size: 48px; line-height: 52px; letter-spacing: -0.02em">Sabores do Norte, feitos e escolhidos pela casa.</div>'
    f'<a href="Loja-Categoria.dc.html" style="align-self: flex-start; height: 48px; padding: 0 20px; border-radius: 12px; background: {W}; color: {TP}; text-decoration: none; display: inline-flex; align-items: center; font-weight: 600">Ver produtos</a></div>'
    f'<div role="img" aria-label="Espaço para foto da casa" style="height: 260px; border-radius: 16px; border: 1px dashed rgba(255,255,255,0.7); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600">[FOTO DA CASA]</div></section>'
    f'<section style="display: flex; flex-direction: column; gap: 16px">{h2("Mais pedidos")}<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px">'
    + ''.join(lcard(*p) for p in LP) + '</div></section>'
    f'<div style="{SM}">No computador: grade de 4 colunas, busca e sacola no topo; checkout em coluna única centralizada de até 560 px.</div></main>')
wpage('Resp-Loja-Desktop.dc.html', 'Bodeleve — loja no computador', f'width: 100%; min-height: 100vh; background: {C}', loja, VAZIO, 1280, 1500)
