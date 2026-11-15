from b12_producao import *   # regenera lotes 1 a 4 da gestão (aba Financeiro ativa) e traz os auxiliares

def money_row(t, sub, v, fg=G, tag='', href=None, last=False):
    bd = '' if last else f'border-bottom: 1px solid {LN}; '
    inner = (f'<span style="flex: 1 1 0; min-width: 0"><span style="display: block; font-weight: 600">{t}</span><span style="display: block; font-size: 13px; line-height: 18px; color: {G2}">{sub}</span></span>'
             f'<span style="flex: none; display: flex; flex-direction: column; align-items: flex-end; gap: 4px"><span style="font-weight: 700; color: {fg}; {NUM}">{v}</span>{tag}</span>')
    st = f'display: flex; align-items: center; gap: 12px; padding: 12px 0; {bd}text-decoration: none; color: {G}; {NUM}'
    return f'<a href="{href}" style="{st}">{inner}{icon("avancar", 18, G2)}</a>' if href else f'<div style="{st}">{inner}</div>'
link2 = lambda t, href: f'<a href="{href}" style="flex: 1 1 0; min-width: 0; height: 48px; border-radius: 12px; border: 1.5px solid {G}; color: {G}; text-decoration: none; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 15px">{t}</a>'

# ---------- Financeiro (visão e fluxo de caixa) ----------
DIAS = [  # dia, descrição, valor, entrada?, saldo
    ('Hoje', 'Aluguel (atrasado), Laticínios e energia', '− R$ 2.440,00', False, 'R$ 4.352,40'),
    ('15/11', 'Cartão de débito · liquidação', '+ R$ 210,00', True, 'R$ 4.562,40'),
    ('17/11', 'Cartão de crédito · vendas de outubro', '+ R$ 780,00', True, 'R$ 5.342,40'),
    ('20/11', 'Fiado · Dona Zefa', '+ R$ 160,00', True, 'R$ 5.502,40'),
    ('21/11', 'Moinho Sertão · PC-0054', '− R$ 512,00', False, 'R$ 4.990,40'),
]
def dia(i):
    d, t, v, e, s = DIAS[i]
    bd = '' if i == len(DIAS) - 1 else f'border-bottom: 1px solid {LN}; '
    return (f'<div style="display: flex; gap: 12px; align-items: center; padding: 12px 0; {bd}{NUM}"><span style="flex: none; width: 48px; font-weight: 700">{d}</span>'
            f'<span style="flex: 1 1 0; min-width: 0; font-size: 14px; line-height: 20px; color: {G2}">{t}</span>'
            f'<span style="flex: none; text-align: right"><span style="display: block; font-weight: 700; color: {OK_T if e else G}">{v}</span><span style="display: block; font-size: 12px; line-height: 16px; color: {G2}">saldo {s}</span></span></div>')
fin = (titulo('Financeiro', 'Sábado, 14 de novembro')
    + f'<main style="display: flex; flex-direction: column; gap: 20px; padding: 8px 16px 24px">'
    f'<div style="padding: 20px; border-radius: 20px; background: {G}; color: {C}; display: flex; flex-direction: column; gap: 10px; {NUM}"><span style="font-size: 14px; line-height: 20px">Saldo agora</span>'
    f'<span style="font-family: {FD}; font-weight: 700; font-size: 40px; line-height: 44px">R$ 6.792,40</span>'
    f'<span style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; padding-top: 10px; border-top: 1px solid rgba(247,242,232,0.25)">'
    f'<span><span style="display: block; font-size: 12px; line-height: 16px; color: {LN}">Conta no banco</span><span style="font-weight: 600; font-size: 18px">R$ 6.380,40</span></span>'
    f'<span><span style="display: block; font-size: 12px; line-height: 16px; color: {LN}">Caixa (gaveta)</span><span style="font-weight: 600; font-size: 18px">R$ 412,00</span></span></span></div>'
    f'<section style="display: flex; flex-direction: column; gap: 8px">{h2("Pede ação hoje")}'
    + box(money_row('Aluguel', 'Venceu em 10/11 · 4 dias de atraso', 'R$ 1.800,00', ER_T, tagc('Atrasado', ER_T, ER_B), 'Gestao-Baixa.dc.html')
          + money_row('2 contas vencem hoje', 'Laticínios Serra Verde e energia', 'R$ 640,00', G, tagc('Vence hoje', AT_T, AT_B), 'Gestao-Contas.dc.html', True), 'padding-top: 0; padding-bottom: 0') + '</section>'
    f'<section style="display: flex; flex-direction: column; gap: 8px"><div style="display: flex; justify-content: space-between; align-items: baseline; gap: 8px">{h2("Próximos 7 dias")}<span style="{SM}">saldo previsto</span></div>'
    + box(''.join(dia(i) for i in range(len(DIAS))), 'padding-top: 0; padding-bottom: 0')
    + f'<div style="{SM}; {NUM}">Se tudo for pago e recebido como previsto, o saldo chega a R$ 4.990,40 em 21/11.</div></section>'
    f'<div style="display: flex; gap: 8px">' + link2('Contas', 'Gestao-Contas.dc.html') + link2('Lançamentos', 'Gestao-Lancamentos.dc.html') + '</div></main>'
    + f'<div style="margin-top: auto; flex: none">{gnav(3)}</div>')
gphone('Gestao-Financeiro.dc.html', 'Bodeleve — gestão: financeiro', 1300, fin, VAZIO)

# ---------- Contas a pagar e a receber ----------
PAG = [  # grupo, título, sub, valor, tag, href
    ('Atrasadas', 'Aluguel', 'Despesa fixa · venceu 10/11', 'R$ 1.800,00', tagc('Atrasado', ER_T, ER_B), 'Gestao-Baixa.dc.html'),
    ('Hoje', 'Laticínios Serra Verde', 'Boleto · compra PC-0053', 'R$ 420,00', tagc('Vence hoje', AT_T, AT_B), None),
    ('Hoje', 'Energia elétrica', 'Despesa fixa · débito automático', 'R$ 220,00', tagc('Vence hoje', AT_T, AT_B), None),
    ('Próximos dias', 'Moinho Sertão', 'Boleto · compra PC-0054 · 21/11', 'R$ 512,00', '', None),
    ('Próximos dias', 'Gás', 'Despesa fixa · 25/11', 'R$ 145,00', '', None),
    ('Próximos dias', 'Laticínios Serra Verde', 'Boleto · compra PC-0057 · 28/11', 'R$ 622,00', tagc('Criada hoje', IN_T, IN_B), None),
]
REC = [
    ('Esta semana', 'Cartão de débito', 'Liquidação das vendas de hoje · 15/11', 'R$ 210,00', '', None),
    ('Esta semana', 'Cartão de crédito', 'Vendas de 15/10 · 17/11', 'R$ 780,00', '', None),
    ('Esta semana', 'Dona Zefa', 'Fiado · combinado para 20/11', 'R$ 160,00', tagc('Fiado', G, C), None),
]
def lista(itens, aba):
    out, grupo = '', None
    for i, (g, t, s, v, tag, href) in enumerate(itens):
        if g != grupo:
            if grupo is not None: out += '</div></section>'
            out += f'<section style="display: flex; flex-direction: column; gap: 8px"><div style="{LBL}">{g}</div><div style="padding: 0 16px; border-radius: 12px; background: {W}; border: 1px solid {LN}">'
            grupo = g
        last = i == len(itens) - 1 or itens[i + 1][0] != g
        out += money_row(t, s, v, ER_T if g == 'Atrasadas' else G, tag, href, last)
    return f'<sc-if value="{H("v" + str(aba))}" hint-placeholder-val="{H("true" if aba == 0 else "false")}"><div style="display: flex; flex-direction: column; gap: 16px">' + out + '</div></section></div></sc-if>'
contas = (bar('Contas', 'Gestao-Financeiro.dc.html')
    + f'<main style="display: flex; flex-direction: column; gap: 16px; padding: 16px 16px 24px">'
    f'<div role="group" aria-label="Tipo de conta" style="display: flex; gap: 8px">' + chips(['A pagar · R$ 3.719,00', 'A receber · R$ 1.150,00']) + '</div>'
    + lista(PAG, 0) + lista(REC, 1)
    + f'<div style="{SM}">Contas de compra nascem no recebimento da mercadoria. Despesas fixas se repetem todo mês.</div></main>')
logic_contas = ("renderVals() {\nconst t = (this.state && this.state.t) || 0;\nconst out = { v0: t === 0, v1: t === 1 };\n" + chips_logic(2) + "return out;\n}")
gphone('Gestao-Contas.dc.html', 'Bodeleve — gestão: contas a pagar e a receber', 1140, contas, logic_contas)

# ---------- Baixa (pagar uma conta) ----------
def origem_btn(k, t, sub):
    return (f'<button type="button" aria-pressed="{H("a" + str(k))}" onClick="{H("o" + str(k))}" style="flex: 1 1 0; min-width: 0; min-height: 64px; padding: 10px 12px; border-radius: 12px; '
            f'border: {H("bd" + str(k))}; background: {W}; color: {G}; text-align: left; font: 400 14px {FB}; {NUM}"><span style="display: block; font-weight: 600; font-size: 16px">{t}</span>'
            f'<span style="display: block; color: {G2}">{sub}</span></button>')
baixa = (bar('Pagar conta', 'Gestao-Contas.dc.html')
    + f'<sc-if value="{H("editando")}" hint-placeholder-val="{H("true")}"><main style="display: flex; flex-direction: column; gap: 16px; padding: 16px 16px 24px">'
    f'<div style="display: flex; flex-direction: column; gap: 6px"><div>{tagc("Atrasado · 4 dias", ER_T, ER_B)}</div><div style="font-family: {FD}; font-weight: 700; font-size: 26px; line-height: 32px">Aluguel</div>'
    f'<div style="{SM}; {NUM}">Despesa fixa · venceu em 10/11/2026 · R$ 1.800,00</div></div>'
    + f'<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px">' + campo('vp', 'Valor pago', 'R$ 1.800,00', '', 'text', ' inputmode="decimal"') + campo('ac', 'Multa e juros', 'R$ 0,00', '', 'text', ' inputmode="decimal"') + '</div>'
    + campo('dt', 'Data do pagamento', '14/11/2026')
    + f'<div style="display: flex; flex-direction: column; gap: 8px"><div id="olbl" style="font-weight: 600">Saiu de onde</div><div role="group" aria-labelledby="olbl" style="display: flex; gap: 8px">'
    + origem_btn(0, 'Conta no banco', 'R$ 6.380,40') + origem_btn(1, 'Caixa (gaveta)', 'R$ 412,00') + '</div></div>'
    + sel('forma', 'Forma', ['Pix', 'Transferência', 'Boleto', 'Dinheiro'])
    + f'<div style="display: flex; flex-direction: column; gap: 6px"><label for="comp" style="font-size: 14px; line-height: 20px; font-weight: 600">Comprovante (opcional)</label>'
      f'<input id="comp" type="file" accept="image/*,application/pdf" style="font: 400 14px {FB}; color: {G2}"></div>'
    + f'<sc-if value="{H("ok")}" hint-placeholder-val="{H("true")}">' + card(li('Saldo depois do pagamento', H('depois'))) + '</sc-if>'
    + f'<sc-if value="{H("insuf")}" hint-placeholder-val="{H("false")}"><div role="alert" style="display: flex; gap: 10px; align-items: flex-start; padding: 12px 14px; border-radius: 12px; background: {ER_B}; color: {ER_T}; font-size: 14px; line-height: 20px; font-weight: 500">{icon("alerta", 20)}<span>O caixa tem R$ 412,00. Escolha o banco ou pague só uma parte.</span></div></sc-if>'
    + '</main>'
    + rodape(f'<sc-if value="{H("ok")}" hint-placeholder-val="{H("true")}"><button type="button" onClick="{H("pagar")}" style="height: 56px; border: 0; border-radius: 12px; background: {T}; color: {W}; font: 600 16px {FB}; width: 100%">Registrar pagamento</button></sc-if>'
             f'<sc-if value="{H("insuf")}" hint-placeholder-val="{H("false")}"><button type="button" disabled style="height: 56px; border: 0; border-radius: 12px; background: {LN}; color: {G2}; font: 600 16px {FB}; width: 100%">Saldo insuficiente no caixa</button></sc-if>') + '</sc-if>'
    f'<sc-if value="{H("feito")}" hint-placeholder-val="{H("false")}"><main style="display: flex; flex-direction: column; align-items: center; text-align: center; gap: 12px; padding: 48px 24px">'
    f'<div aria-hidden="true" style="width: 64px; height: 64px; border-radius: 999px; background: {V}; color: {W}; display: flex; align-items: center; justify-content: center">{icon("confirmar", 32)}</div>'
    f'<h1 style="margin: 0; font-family: {FD}; font-weight: 700; font-size: 24px; line-height: 30px">Aluguel pago</h1><div style="color: {G2}; {NUM}">R$ 1.800,00 saiu da conta no banco. Saldo agora: R$ 4.580,40.<br>O próximo aluguel já está lançado para 10/12.</div></main>'
    + rodape(cta('Voltar às contas', 'Gestao-Contas.dc.html') + f'<button type="button" onClick="{H("desfazer")}" style="height: 48px; border: 1.5px solid {G}; border-radius: 12px; background: {W}; color: {G}; font: 600 16px {FB}">Desfazer</button>') + '</sc-if>')
logic_baixa = ("renderVals() {\nconst st = this.state || {};\nconst o = st.o || 0;\nconst feito = !!st.feito;\nconst ok = o === 0;\n"
               f"const on = '2px solid {G}', off = '1.5px solid {LN}';\n"
               "return { editando: !feito, feito: feito, ok: ok, insuf: !ok, depois: 'R$ 4.580,40 no banco', a0: o === 0, a1: o === 1, bd0: o === 0 ? on : off, bd1: o === 1 ? on : off,\n"
               "  o0: () => this.setState({ o: 0 }), o1: () => this.setState({ o: 1 }), pagar: () => this.setState({ feito: true }), desfazer: () => this.setState({ feito: false }) };\n}")
gphone('Gestao-Baixa.dc.html', 'Bodeleve — gestão: pagar conta', 1100, baixa, logic_baixa)

# ---------- Lançamentos (o que já aconteceu) ----------
LAN = [  # data, título, sub, valor, entrada?
    ('Hoje', 'Vendas no balcão · dinheiro', 'Caixa · 14 vendas', '+ R$ 312,00', True),
    ('Hoje', 'Vendas no Pix', 'Banco · balcão e loja online', '+ R$ 392,50', True),
    ('13/11', 'Embalagens a vácuo', 'Banco · Pix · categoria Insumos', '− R$ 96,00', False),
    ('13/11', 'Sangria do caixa', 'Caixa → banco · transferência entre contas', 'R$ 600,00', None),
    ('12/11', 'Cartão de débito · liquidação', 'Banco · vendas de 11/11', '+ R$ 540,00', True),
    ('11/11', 'Charqueada Norte · PC-0050', 'Banco · boleto · categoria Compras', '− R$ 684,00', False),
]
def lrow(i):
    d, t, s, v, e = LAN[i]
    cor = OK_T if e else G
    ic = 'adicionar' if e else 'remover' if e is False else 'avancar'
    bg = OK_B if e else C
    kind = 'e' if e else 's' if e is False else 't'
    return (f'<sc-if value="{H("v" + str(i))}" hint-placeholder-val="{H("true")}"><div style="display: flex; gap: 12px; align-items: center; padding: 12px 0; border-bottom: 1px solid {LN}; {NUM}">'
            f'<span aria-hidden="true" style="flex: none; width: 36px; height: 36px; border-radius: 10px; background: {bg}; color: {cor if e else G2}; display: flex; align-items: center; justify-content: center">{icon(ic, 18)}</span>'
            f'<span style="flex: 1 1 0; min-width: 0"><span style="display: block; font-weight: 600">{t}</span><span style="display: block; font-size: 13px; line-height: 18px; color: {G2}">{d} · {s}</span></span>'
            f'<span style="flex: none; font-weight: 700; color: {cor}">{v}</span></div></sc-if>')
lans = (bar('Lançamentos', 'Gestao-Financeiro.dc.html')
    + f'<main style="display: flex; flex-direction: column; gap: 16px; padding: 16px 16px 24px">'
    f'<div role="group" aria-label="Filtrar lançamentos" style="display: flex; gap: 8px; flex-wrap: wrap">' + chips(['Todos', 'Entradas', 'Saídas']) + '</div>'
    + box(''.join(lrow(i) for i in range(len(LAN))), 'padding-top: 0; padding-bottom: 0')
    + card(li('Entradas no período', '+ R$ 1.244,50') + li('Saídas no período', '− R$ 780,00'))
    + f'<div style="{SM}">Vendas, compras e baixas de contas entram sozinhas. Transferência entre caixa e banco não conta como entrada nem saída.</div></main>')
logic_lans = ("renderVals() {\nconst K = [" + ', '.join("'" + ('e' if l[4] else 's' if l[4] is False else 't') + "'" for l in LAN) + "];\nconst t = (this.state && this.state.t) || 0;\nconst out = {};\n"
              "K.forEach((k, i) => { out['v' + i] = t === 0 || (t === 1 && k === 'e') || (t === 2 && k === 's'); });\n" + chips_logic(3) + "return out;\n}")
gphone('Gestao-Lancamentos.dc.html', 'Bodeleve — gestão: lançamentos', 960, lans, logic_lans)
