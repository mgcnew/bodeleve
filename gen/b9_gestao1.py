from common import *
import os

NUM = 'font-variant-numeric: tabular-nums'
def H(n): return '{{ ' + n + ' }}'
VAZIO = 'renderVals() {\nreturn {};\n}'

def gphone(fname, title, h, body, logic, bg=OP):
    html = ('<!doctype html>\n<html lang="pt-BR">\n<head>\n<meta charset="utf-8">\n<title>' + title + '</title>\n<script src="./support.js"></script>\n</head>\n<body>\n<x-dc>\n<helmet>\n'
            '<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">\n'
            '<style>\nbody{margin:0}\na{color:#A9482C}a:hover{color:#8A3920}\n</style>\n</helmet>\n'
            f'<div style="width: 390px; height: {h}px; box-sizing: border-box; display: flex; flex-direction: column; background: {bg}; color: {G}; font-family: {FB}; font-size: 16px; line-height: 24px">\n'
            + body + '\n</div>\n</x-dc>\n'
            '<script type="text/x-dc" data-dc-script data-props=\'{"$preview":{"width":390,"height":' + str(h) + '}}\'>\n'
            'class Component extends DCLogic {\n' + logic + '\n}\n</script>\n</body>\n</html>\n')
    open(os.path.join(OUT, fname), 'w').write(html)
    print(fname, len(html))

GNAV = [('inicio', 'Início', 'Gestao-Inicio.dc.html'), ('pedidos', 'Pedidos', 'Gestao-Pedidos.dc.html'), ('estoque', 'Estoque', 'Gestao-Estoque.dc.html'), ('financeiro', 'Financeiro', 'Gestao-Financeiro.dc.html'), ('mais', 'Mais', 'Gestao-Mais.dc.html')]
def gnav(active):
    cells = ''
    for i, (ic, t, href) in enumerate(GNAV):
        on = i == active
        st = f'flex: 1 1 0; min-width: 0; height: 64px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; text-decoration: none; color: {T if on else G2}; font-size: 12px; line-height: 16px; font-weight: {700 if on else 500}'
        cur = 'aria-current="page" ' if on else ''
        cells += f'<a href="{href}" {cur}style="{st}">{icon(ic)}<span>{t}</span></a>' if href else f'<span style="{st}; opacity: 0.55">{icon(ic)}<span>{t}</span></span>'
    return f'<nav aria-label="Navegação principal" style="flex: none; display: flex; background: {W}; border-top: 1px solid {LN}">{cells}</nav>'

def bar(titulo, back):
    return (f'<header style="display: flex; align-items: center; gap: 4px; height: 56px; padding: 0 6px; flex: none; background: {W}; border-bottom: 1px solid {LN}">'
            f'<a href="{back}" aria-label="Voltar" style="width: 44px; height: 44px; border-radius: 12px; color: {G}; display: inline-flex; align-items: center; justify-content: center">{icon("voltar")}</a>'
            f'<div style="flex: 1 1 0; font-family: {FD}; font-weight: 700; font-size: 20px; line-height: 26px">{titulo}</div></header>')
titulo = lambda t, sub='': (f'<header style="padding: 16px 16px 8px; flex: none"><h1 style="margin: 0; font-family: {FD}; font-weight: 700; font-size: 28px; line-height: 34px; letter-spacing: -0.01em">{t}</h1>'
                            + (f'<div style="{SM}">{sub}</div>' if sub else '') + '</header>')
h2 = lambda t: f'<h2 style="margin: 0; font-family: {FD}; font-weight: 700; font-size: 20px; line-height: 26px">{t}</h2>'
box = lambda inner, extra='': f'<div style="padding: 4px 16px; border-radius: 12px; background: {W}; border: 1px solid {LN}; {extra}">{inner}</div>'
cta = lambda t, href, extra='': f'<a href="{href}" style="height: 56px; padding: 0 20px; border-radius: 12px; background: {T}; color: {W}; text-decoration: none; display: flex; align-items: center; justify-content: center; gap: 8px; font-weight: 600; font-size: 16px; {extra}">{t}</a>'
def campo(fid, label, value='', ph='', tipo='text', extra=''):
    return (f'<div style="display: flex; flex-direction: column; gap: 6px"><label for="{fid}" style="font-size: 14px; line-height: 20px; font-weight: 600">{label}</label>'
            f'<input id="{fid}" type="{tipo}" value="{value}" placeholder="{ph}"{extra} style="height: 48px; padding: 0 14px; border-radius: 8px; border: 1.5px solid {LN}; background: {W}; color: {G}; font: 400 16px {FB}; box-sizing: border-box; width: 100%"></div>')

# ---------- Entrar ----------
entrar = (f'<main style="flex: 1 1 0; display: flex; flex-direction: column; justify-content: center; gap: 24px; padding: 24px 20px">'
    f'<div><div style="font-family: {FD}; font-weight: 700; font-size: 34px; line-height: 40px; letter-spacing: -0.01em">Bodeleve</div><div style="{SM}">Gestão da casa</div></div>'
    + campo('em', 'E-mail', 'ana@exemplo.com', '', 'email', ' autocomplete="username"') + campo('pw', 'Senha', '', '', 'password', ' autocomplete="current-password"')
    + cta('Entrar', 'Gestao-Inicio.dc.html')
    + f'<div style="{SM}">Acesso só para a equipe. Quem cadastra novas pessoas é o dono ou o gestor.</div></main>')
gphone('Gestao-Entrar.dc.html', 'Bodeleve — gestão: entrar', 700, entrar, VAZIO)

# ---------- Início ----------
def acao(ic, cor, bg, t, sub, href=None):
    inner = (f'<span aria-hidden="true" style="flex: none; width: 40px; height: 40px; border-radius: 10px; background: {bg}; color: {cor}; display: flex; align-items: center; justify-content: center">{icon(ic, 20)}</span>'
             f'<span style="flex: 1 1 0; min-width: 0"><span style="display: block; font-weight: 600">{t}</span><span style="display: block; font-size: 13px; line-height: 18px; color: {G2}; {NUM}">{sub}</span></span>')
    st = f'display: flex; align-items: center; gap: 12px; min-height: 64px; padding: 8px 0; border-bottom: 1px solid {LN}; text-decoration: none; color: {G}'
    if href:
        return f'<a href="{href}" style="{st}">{inner}{icon("avancar", 18, G2)}</a>'
    return f'<div style="{st}">{inner}</div>'
def kpi(t, v, sub, fg=G, href=None):
    inner = (f'<span style="font-size: 13px; line-height: 18px; color: {G2}">{t}</span><span style="font-weight: 600; font-size: 22px; line-height: 28px; color: {fg}; {NUM}">{v}</span>'
             f'<span style="font-size: 12px; line-height: 16px; color: {G2}; {NUM}">{sub}</span>')
    st = f'padding: 14px; border-radius: 12px; background: {W}; border: 1px solid {LN}; display: flex; flex-direction: column; gap: 2px; min-width: 0; text-decoration: none; color: {G}'
    return f'<a href="{href}" style="{st}">{inner}</a>' if href else f'<div style="{st}">{inner}</div>'

inicio = (f'<header style="padding: 16px 16px 8px; flex: none; display: flex; justify-content: space-between; align-items: flex-start; gap: 12px"><div>'
    f'<div style="{SM}">Sábado, 14 de novembro · 15h30</div><h1 style="margin: 0; font-family: {FD}; font-weight: 700; font-size: 28px; line-height: 34px; letter-spacing: -0.01em">Boa tarde</h1></div>'
    f'<span style="padding: 6px 10px; border-radius: 999px; background: {W}; border: 1px solid {LN}; font-size: 13px; line-height: 18px; font-weight: 600">Bodeleve</span></header>'
    f'<main style="display: flex; flex-direction: column; gap: 20px; padding: 8px 16px 24px">'
    f'<a href="Gestao-Pedidos.dc.html" style="padding: 20px; border-radius: 20px; background: {G}; color: {C}; text-decoration: none; display: flex; flex-direction: column; gap: 10px">'
    f'<span style="display: flex; justify-content: space-between; align-items: center; font-size: 14px; line-height: 20px"><span>Vendas de hoje</span>{icon("avancar", 18, C)}</span>'
    f'<span style="font-family: {FD}; font-weight: 700; font-size: 40px; line-height: 44px; {NUM}">R$ 1.284,50</span>'
    f'<span style="font-size: 14px; line-height: 20px; color: {LN}; {NUM}">32 vendas · ontem até esta hora: R$ 1.102,00</span>'
    f'<span style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; padding-top: 10px; border-top: 1px solid rgba(247,242,232,0.25); {NUM}">'
    f'<span><span style="display: block; font-size: 12px; line-height: 16px; color: {LN}">Balcão · 26</span><span style="font-weight: 600; font-size: 18px">R$ 892,00</span></span>'
    f'<span><span style="display: block; font-size: 12px; line-height: 16px; color: {LN}">Internet · 6</span><span style="font-weight: 600; font-size: 18px">R$ 392,50</span></span></span></a>'
    f'<section style="display: flex; flex-direction: column; gap: 8px">{h2("Pede ação hoje")}'
    + box(acao('pedidos', IN_T, IN_B, '2 pedidos novos', 'Aguardando aceite · o mais antigo há 10 min', 'Gestao-Pedidos.dc.html')
          + acao('alerta', ER_T, ER_B, 'Aluguel atrasado', 'Venceu em 10/11 · R$ 1.800,00', 'Gestao-Baixa.dc.html')
          + acao('financeiro', AT_T, AT_B, '2 contas vencem hoje', 'R$ 640,00 · Laticínios Serra Verde e energia', 'Gestao-Contas.dc.html')
          + acao('validade', AT_T, AT_B, '3 lotes vencem em até 7 dias', 'Queijo coalho, Doce de leite, Nata', 'Gestao-Estoque.dc.html')
          + acao('estoque', AT_T, AT_B, '7 itens com estoque baixo', 'Tapioca granulada, Rapadura e mais 5', 'Gestao-Estoque.dc.html').replace(f'border-bottom: 1px solid {LN}; ', '', 1).replace('min-height: 64px; padding: 8px 0; text', 'min-height: 64px; padding: 8px 0; text'), 'padding-bottom: 0')
    + '</section>'
    f'<section style="display: flex; flex-direction: column; gap: 8px">{h2("Hoje na casa")}<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px">'
    + kpi('Pedidos em aberto', '4', '2 novos · 2 em preparo', G, 'Gestao-Pedidos.dc.html') + kpi('Em produção', '2 ordens', 'Queijo coalho · Doce de leite', G, 'Gestao-Producao.dc.html')
    + kpi('A pagar hoje', 'R$ 640,00', '2 contas', ER_T, 'Gestao-Contas.dc.html') + kpi('A receber na semana', 'R$ 1.150,00', 'cartões e fiado', OK_T, 'Gestao-Contas.dc.html') + '</div></section>'
    f'<div style="{SM}">Faturamento do mês, comparativos e gráficos ficam em Relatórios, para o início mostrar só o que pede ação.</div></main>'
    f'<div style="margin-top: auto; flex: none">{gnav(0)}</div>')
gphone('Gestao-Inicio.dc.html', 'Bodeleve — gestão: início', 1180, inicio, VAZIO)

# ---------- Pedidos (lista) ----------
PED = [  # num, cliente, modo, itens, total, hora, aba
    ('1043', 'Maria Lima', 'Entrega', '3 itens', 'R$ 63,70', '15h20', 0, 'Pix · pago'),
    ('1044', 'João Pedro', 'Retirada', '2 itens', 'R$ 47,80', '15h26', 0, 'Pagar na retirada'),
    ('1041', 'Paula Reis', 'Entrega', '6 itens', 'R$ 132,10', '14h40', 1, 'Pix · pago'),
    ('1040', 'Carla Nunes', 'Retirada', '4 itens', 'R$ 88,30', '14h31', 1, 'Pix · pago'),
    ('1039', 'Rafael Dias', 'Retirada', '2 itens', 'R$ 41,40', '13h58', 2, 'Pix · pago'),
    ('1042', 'Ana Souza', 'Entrega', '4 itens', 'R$ 81,20', '14h52', 3, 'Pix · pago'),
]
TABS = ['Novos', 'Em preparo', 'Prontos', 'Em rota']
TAGS = [tagc('Novo', IN_T, IN_B), tagc('Em preparo', AT_T, AT_B), tagc('Pronto', OK_T, OK_B), tagc('Em rota', IN_T, IN_B)]
def pcard(i):
    n, cli, modo, it, tot, hr, aba, pg = PED[i]
    href = 'Gestao-Pedido.dc.html' if n == '1043' else None
    inner = (f'<span style="display: flex; justify-content: space-between; align-items: center; gap: 8px"><span style="font-weight: 600; font-size: 17px; {NUM}">#{n} · {cli}</span>{TAGS[aba]}</span>'
             f'<span style="display: flex; gap: 8px; align-items: center; color: {G2}; font-size: 14px; line-height: 20px; {NUM}">{icon("entregas" if modo == "Entrega" else "local", 18, G2)}<span>{modo} · {it} · {hr}</span></span>'
             f'<span style="display: flex; justify-content: space-between; gap: 8px; font-size: 14px; line-height: 20px; {NUM}"><span style="color: {G2}">{pg}</span><b>{tot}</b></span>')
    st = f'padding: 14px 16px; border-radius: 12px; background: {W}; border: 1px solid {LN}; text-decoration: none; color: {G}; display: flex; flex-direction: column; gap: 6px'
    card = f'<a href="{href}" style="{st}">{inner}</a>' if href else f'<div style="{st}">{inner}</div>'
    return f'<sc-if value="{H("v" + str(i))}" hint-placeholder-val="{H("true" if aba == 0 else "false")}">{card}</sc-if>'
def tab(i, t):
    cnt = sum(1 for p in PED if p[6] == i)
    return (f'<button type="button" aria-pressed="{H("a" + str(i))}" onClick="{H("t" + str(i))}" style="flex: none; height: 40px; padding: 0 14px; border-radius: 999px; border: 1.5px solid {G}; '
            f'background: {H("b" + str(i))}; color: {H("c" + str(i))}; font: 600 14px {FB}; {NUM}">{t} · {cnt}</button>')
pedidos = (titulo('Pedidos', 'Loja e balcão, do dia')
    + f'<main style="display: flex; flex-direction: column; gap: 16px; padding: 8px 16px 24px"><div role="group" aria-label="Filtrar por situação" style="display: flex; gap: 8px; flex-wrap: wrap">'
    + ''.join(tab(i, t) for i, t in enumerate(TABS)) + '</div>'
    + '<div style="display: flex; flex-direction: column; gap: 10px">' + ''.join(pcard(i) for i in range(len(PED))) + '</div>'
    + f'<div style="{SM}">Vendas de balcão já entram concluídas e aparecem no histórico do PDV.</div></main>'
    + f'<div style="margin-top: auto; flex: none">{gnav(1)}</div>')
logic_ped = ("renderVals() {\nconst A = [" + ', '.join(str(p[6]) for p in PED) + "];\nconst t = (this.state && this.state.t) || 0;\nconst out = {};\n"
             "A.forEach((a, i) => { out['v' + i] = a === t; });\n"
             "[0, 1, 2, 3].forEach((k) => { out['a' + k] = t === k; out['b' + k] = t === k ? '" + G + "' : '" + W + "'; out['c' + k] = t === k ? '" + W + "' : '" + G + "'; out['t' + k] = () => this.setState({ t: k }); });\n"
             "return out;\n}")
gphone('Gestao-Pedidos.dc.html', 'Bodeleve — gestão: pedidos', 860, pedidos, logic_ped)

# ---------- Pedido (detalhe com ação por etapa) ----------
ITENS = [('Queijo coalho', '1 un · 500 g', 'R$ 32,90', 'Lote QC-1107 · vence 19/11'), ('Farinha de mandioca', '1 un · 1 kg', 'R$ 12,90', 'Lote FM-0921'), ('Tapioca granulada', '1 un · 500 g', 'R$ 9,90', 'Lote TG-1030')]
def chk(i):
    n, q, p, lote = ITENS[i]
    return (f'<label for="k{i}" style="display: flex; align-items: center; gap: 12px; min-height: 64px; padding: 8px 0; border-bottom: 1px solid {LN}">'
            f'<input id="k{i}" type="checkbox" checked="{H("k" + str(i))}" onChange="{H("tk" + str(i))}" style="flex: none; width: 24px; height: 24px; accent-color: {V}; margin: 0">'
            f'<span style="flex: 1 1 0; min-width: 0"><span style="display: block; font-weight: 600">{n}</span><span style="display: block; font-size: 13px; line-height: 18px; color: {G2}; {NUM}">{q} · {lote}</span></span>'
            f'<span style="font-weight: 600; {NUM}">{p}</span></label>')
def item(i):
    n, q, p, lote = ITENS[i]
    return (f'<div style="display: flex; align-items: center; gap: 12px; min-height: 56px; padding: 8px 0; border-bottom: 1px solid {LN}"><span style="flex: 1 1 0; min-width: 0"><span style="display: block; font-weight: 600">{n}</span>'
            f'<span style="display: block; font-size: 13px; line-height: 18px; color: {G2}; {NUM}">{q}</span></span><span style="font-weight: 600; {NUM}">{p}</span></div>')
li = lambda a, b: f'<div style="display: flex; justify-content: space-between; gap: 12px; color: {G2}; {NUM}"><span>{a}</span><span>{b}</span></div>'
bt = lambda t, on, kind='p': (f'<button type="button" onClick="{on}" style="height: 56px; border: {"0" if kind == "p" else "1.5px solid " + G}; border-radius: 12px; background: {T if kind == "p" else W}; '
                              f'color: {W if kind == "p" else G}; font: 600 16px {FB}; width: 100%">{t}</button>')
etapas = ''.join(f'<span aria-hidden="true" style="flex: 1 1 0; height: 6px; border-radius: 999px; background: {H("e" + str(i))}"></span>' for i in range(3))
pedido = (bar('Pedido #1043', 'Gestao-Pedidos.dc.html')
    + f'<main style="display: flex; flex-direction: column; gap: 16px; padding: 16px 16px 24px">'
    f'<div style="display: flex; flex-direction: column; gap: 8px"><div style="display: flex; gap: 6px">{etapas}</div>'
    f'<div style="display: flex; justify-content: space-between; align-items: center; gap: 8px"><span style="font-family: {FD}; font-weight: 700; font-size: 22px; line-height: 28px">{H("status")}</span>'
    f'<span style="{SM}; {NUM}">Recebido às 15h20</span></div><div aria-live="polite" style="{SM}">{H("dica")}</div></div>'
    f'<section style="display: flex; flex-direction: column; gap: 8px">{h2("Itens")}'
    f'<sc-if value="{H("sep")}" hint-placeholder-val="{H("false")}">' + box(''.join(chk(i) for i in range(3)), 'padding-bottom: 0') + f'<div style="{SM}; {NUM}">{H("conf")}</div></sc-if>'
    f'<sc-if value="{H("naoSep")}" hint-placeholder-val="{H("true")}">' + box(''.join(item(i) for i in range(3)), 'padding-bottom: 0') + '</sc-if>'
    f'<div style="padding: 14px 16px; border-radius: 12px; background: {W}; border: 1px solid {LN}; display: flex; flex-direction: column; gap: 6px">' + li('Subtotal', 'R$ 55,70') + li('Entrega', 'R$ 8,00')
    + f'<div style="display: flex; justify-content: space-between; padding-top: 6px; border-top: 1px solid {LN}; font-weight: 600; {NUM}"><span>Total</span><span>R$ 63,70</span></div>'
    + f'<div style="display: flex; gap: 8px; align-items: center; padding-top: 4px">{tagc("Pago · Pix", OK_T, OK_B)}</div></div></section>'
    f'<section style="display: flex; flex-direction: column; gap: 8px">{h2("Cliente e entrega")}'
    f'<div style="padding: 14px 16px; border-radius: 12px; background: {W}; border: 1px solid {LN}; display: flex; flex-direction: column; gap: 10px">'
    f'<div><div style="font-weight: 600">Maria Lima</div><div style="{SM}; {NUM}">(00) 90000-0001 · cliente desde 03/2026 · 5 pedidos</div></div>'
    f'<div style="display: flex; gap: 10px; align-items: flex-start">{icon("local", 20, G2)}<div><div>Av. das Palmeiras, 455 · casa 2</div><div style="{SM}">Centro · O quanto antes</div></div></div></div></section></main>'
    f'<div style="margin-top: auto; flex: none; padding: 12px 16px 16px; background: {W}; border-top: 1px solid {LN}; display: flex; flex-direction: column; gap: 8px">'
    f'<sc-if value="{H("p0")}" hint-placeholder-val="{H("true")}">' + bt('Aceitar e começar a separar', H('aceitar')) + '</sc-if>'
    f'<sc-if value="{H("p1ok")}" hint-placeholder-val="{H("false")}">' + bt('Marcar como pronto', H('pronto')) + '</sc-if>'
    f'<sc-if value="{H("p1no")}" hint-placeholder-val="{H("false")}"><button type="button" disabled style="height: 56px; border: 0; border-radius: 12px; background: {LN}; color: {G2}; font: 600 16px {FB}; width: 100%; {NUM}">Confira os itens · {H("conf")}</button></sc-if>'
    f'<sc-if value="{H("p2")}" hint-placeholder-val="{H("false")}"><div role="status" style="display: flex; gap: 10px; align-items: center; padding: 12px 14px; border-radius: 12px; background: {OK_B}; color: {OK_T}; font-weight: 600">{icon("confirmar", 20)}<span>Pronto. Aguardando entregador.</span></div>'
    + cta('Voltar aos pedidos', 'Gestao-Pedidos.dc.html', 'height: 48px') + bt('Desfazer', H('desfazer'), 's').replace('height: 56px', 'height: 48px') + '</sc-if></div>')
logic_pedido = ("renderVals() {\nconst st = this.state || {};\nconst p = st.p || 0;\nconst k = st.k || [false, false, false];\nconst nk = k.filter(Boolean).length;\n"
                f"const on = '{T}', off = '{LN}', ok = '{V}';\n"
                "const S = ['Novo', 'Separando', 'Pronto'];\nconst D = ['Pago no Pix. Aceite para começar a separar.', 'Marque cada item ao colocar na sacola.', 'O cliente foi avisado pelo WhatsApp.'];\n"
                "const tog = (i) => () => { const c = k.slice(); c[i] = !c[i]; this.setState({ k: c }); };\n"
                "const out = { status: S[p], dica: D[p], sep: p === 1, naoSep: p !== 1, p0: p === 0, p1ok: p === 1 && nk === 3, p1no: p === 1 && nk < 3, p2: p === 2, conf: nk + ' de 3 conferidos',\n"
                "  aceitar: () => this.setState({ p: 1 }), pronto: () => this.setState({ p: 2 }), desfazer: () => this.setState({ p: 1 }) };\n"
                "[0, 1, 2].forEach((i) => { out['k' + i] = k[i]; out['tk' + i] = tog(i); out['e' + i] = i < p ? ok : i === p ? on : off; });\nreturn out;\n}")
gphone('Gestao-Pedido.dc.html', 'Bodeleve — gestão: pedido', 1020, pedido, logic_pedido)

# ---------- Mais ----------
def mrow(ic, t, sub, last=False, href=None):
    bd = '' if last else f'border-bottom: 1px solid {LN}; '
    inner = (f'{icon(ic, 22, G2)}<span style="flex: 1 1 0; min-width: 0"><span style="display: block; font-weight: 600">{t}</span>'
             f'<span style="display: block; font-size: 13px; line-height: 18px; color: {G2}">{sub}</span></span>')
    st = f'display: flex; align-items: center; gap: 12px; min-height: 56px; padding: 8px 0; {bd}color: {G}; text-decoration: none'
    if href:
        return f'<a href="{href}" style="{st}">{inner}{icon("avancar", 18, G2)}</a>'
    return f'<div style="{st}">{inner}</div>'
grupo = lambda t, inner: f'<section style="display: flex; flex-direction: column; gap: 8px"><div style="{LBL}">{t}</div>{box(inner)}</section>'
mais = (titulo('Mais', 'Todos os módulos da gestão')
    + f'<main style="display: flex; flex-direction: column; gap: 20px; padding: 8px 16px 24px">'
    + grupo('Abastecer', mrow('compras', 'Compras', 'Pedidos de compra e recebimento', False, 'Gestao-Compras.dc.html') + mrow('entregas', 'Fornecedores', 'Contatos e histórico de compras', False, 'Gestao-Fornecedores.dc.html') + mrow('producao', 'Produção', 'Fichas técnicas e ordens de produção', True, 'Gestao-Producao.dc.html'))
    + grupo('Catálogo', mrow('vender', 'Produtos e categorias', 'Preço, origem, publicação na loja', True))
    + grupo('Relacionamento', mrow('perfil', 'Clientes', 'Histórico e contato') + mrow('local', 'Entregas', 'Atribuir e acompanhar entregadores', True))
    + grupo('Análise', mrow('historico', 'Relatórios', 'Vendas, estoque, financeiro', True))
    + grupo('Sistema', mrow('mais', 'Configurações', 'Casa, equipe e permissões', True))
    + f'<a href="Gestao-Entrar.dc.html" style="align-self: flex-start; min-height: 44px; display: inline-flex; align-items: center; font-weight: 600; text-decoration: none">Sair</a></main>'
    + f'<div style="margin-top: auto; flex: none">{gnav(4)}</div>')
gphone('Gestao-Mais.dc.html', 'Bodeleve — gestão: mais', 1060, mais, VAZIO)
