from b6_loja import *   # regenera o lote 1 (com o novo destino do botão Continuar da sacola) e traz os auxiliares

def bar2(titulo, back):
    return (f'<header style="display: flex; align-items: center; gap: 4px; height: 56px; padding: 0 6px; flex: none">'
            f'<a href="{back}" aria-label="Voltar" style="width: 44px; height: 44px; border-radius: 12px; color: {G}; display: inline-flex; align-items: center; justify-content: center">{icon("voltar")}</a>'
            f'<div style="flex: 1 1 0; font-family: {FD}; font-weight: 700; font-size: 20px; line-height: 26px">{titulo}</div></header>')
def etapa(n, nome):
    segs = ''.join(f'<span aria-hidden="true" style="flex: 1 1 0; height: 6px; border-radius: 999px; background: {T if i < n else LN}"></span>' for i in range(4))
    return f'<div style="display: flex; flex-direction: column; gap: 8px"><div style="display: flex; gap: 6px">{segs}</div><div style="{SM}">Etapa {n} de 4 · {nome}</div></div>'
def campo(fid, label, value='', ph='', tipo='text', modo='', ajuda=''):
    im = f' inputmode="{modo}"' if modo else ''
    a = f'<div style="font-size: 13px; line-height: 18px; color: {G2}">{ajuda}</div>' if ajuda else ''
    return (f'<div style="display: flex; flex-direction: column; gap: 6px; min-width: 0"><label for="{fid}" style="font-size: 14px; line-height: 20px; font-weight: 600">{label}</label>'
            f'<input id="{fid}" type="{tipo}"{im} value="{value}" placeholder="{ph}" style="height: 48px; padding: 0 14px; border-radius: 8px; border: 1.5px solid {LN}; background: {W}; color: {G}; font: 400 16px {FB}; box-sizing: border-box; width: 100%">{a}</div>')
def opcao(fid, grupo, t, sub, on=False, dir_=''):
    return (f'<label for="{fid}" style="display: flex; align-items: center; gap: 12px; min-height: 56px; padding: 10px 14px; border-radius: 12px; background: {W}; border: 1px solid {LN}">'
            f'<input id="{fid}" type="radio" name="{grupo}"{" checked" if on else ""} style="flex: none; width: 22px; height: 22px; accent-color: {T}; margin: 0">'
            f'<span style="flex: 1 1 0; min-width: 0"><span style="display: block; font-weight: 600">{t}</span><span style="display: block; font-size: 13px; line-height: 18px; color: {G2}">{sub}</span></span>'
            f'<span style="font-weight: 600; {NUM}">{dir_}</span></label>')
def rodape(inner):
    return f'<div style="margin-top: auto; flex: none; padding: 12px 16px 16px; background: {W}; border-top: 1px solid {LN}; display: flex; flex-direction: column; gap: 8px">{inner}</div>'
h1 = lambda t: f'<h1 style="margin: 0; font-family: {FD}; font-weight: 700; font-size: 24px; line-height: 30px">{t}</h1>'
VAZIO = 'renderVals() {\nreturn {};\n}'

# 1 Identificação
ident = (bar2('Finalizar pedido', 'Loja-Sacola.dc.html')
    + f'<main style="display: flex; flex-direction: column; gap: 20px; padding: 4px 16px 24px">{etapa(1, "Identificação")}{h1("Para quem é o pedido?")}'
    + f'<div style="{SM}">Sem cadastro e sem senha. Usamos seus dados só para avisar sobre este pedido.</div>'
    + campo('nome', 'Nome', 'Ana Souza') + campo('cel', 'Celular com WhatsApp', '(00) 90000-0000', '', 'tel', 'tel', 'Você recebe a confirmação e o código de entrega por aqui.')
    + f'<div style="padding: 14px 16px; border-radius: 12px; background: {W}; border: 1px solid {LN}; display: flex; align-items: center; justify-content: space-between; gap: 12px"><span style="{SM}">Já tem conta na Bodeleve?</span><a href="Loja-Entrar.dc.html" style="min-height: 44px; display: inline-flex; align-items: center; font-weight: 600; text-decoration: none">Entrar</a></div></main>'
    + rodape(cta('Continuar sem conta', 'Loja-Entrega.dc.html')))
phone('Loja-Identificacao.dc.html', 'Bodeleve — loja: identificação', 700, ident, VAZIO)

# 2 Entrega ou retirada
def bloco_ent():
    return (f'<div style="display: flex; flex-direction: column; gap: 16px">'
            f'<div style="padding: 14px 16px; border-radius: 12px; background: {W}; border: 1px solid {LN}; display: flex; gap: 12px; align-items: flex-start">{icon("local", 22, T)}'
            f'<div style="flex: 1 1 0; min-width: 0"><div style="font-weight: 600">Rua das Camélias, 120 · apto 34</div><div style="{SM}">Jardim das Flores</div></div>'
            f'<a href="Loja-Endereco.dc.html" style="min-height: 44px; display: inline-flex; align-items: center; font-weight: 600; text-decoration: none">Trocar</a></div>'
            f'<fieldset style="margin: 0; padding: 0; border: 0; display: flex; flex-direction: column; gap: 8px"><legend style="padding: 0; margin-bottom: 8px; font-weight: 600">Quando entregar?</legend>'
            + opcao('e1', 'quando', 'O quanto antes', 'Hoje, em 40 a 60 minutos', True) + opcao('e2', 'quando', 'Hoje à tarde', 'Entre 17h e 18h') + opcao('e3', 'quando', 'Amanhã cedo', 'Entre 9h e 10h') + '</fieldset>'
            f'<div style="display: flex; justify-content: space-between; padding: 14px 16px; border-radius: 12px; background: {TS}; color: {G}; {NUM}"><span>Taxa de entrega</span><b>R$ 8,00</b></div></div>')
def bloco_ret():
    return (f'<div style="display: flex; flex-direction: column; gap: 16px">'
            f'<div style="padding: 14px 16px; border-radius: 12px; background: {W}; border: 1px solid {LN}; display: flex; gap: 12px; align-items: flex-start">{icon("local", 22, T)}'
            f'<div style="flex: 1 1 0; min-width: 0"><div style="font-weight: 600">Bodeleve</div><div style="{SM}">[ENDEREÇO DA LOJA]<br>[HORÁRIO DE FUNCIONAMENTO]</div></div></div>'
            f'<fieldset style="margin: 0; padding: 0; border: 0; display: flex; flex-direction: column; gap: 8px"><legend style="padding: 0; margin-bottom: 8px; font-weight: 600">Quando retirar?</legend>'
            + opcao('r1', 'quandor', 'Assim que estiver pronto', 'Avisamos pelo WhatsApp', True) + opcao('r2', 'quandor', 'Hoje à tarde', 'Entre 17h e 18h') + '</fieldset>'
            f'<div style="display: flex; justify-content: space-between; padding: 14px 16px; border-radius: 12px; background: {OK_B}; color: {OK_T}; {NUM}"><span>Retirada na loja</span><b>Grátis</b></div></div>')
entrega = (bar2('Finalizar pedido', 'Loja-Identificacao.dc.html')
    + f'<main style="display: flex; flex-direction: column; gap: 20px; padding: 4px 16px 24px">{etapa(2, "Entrega")}{h1("Como você quer receber?")}'
    + f'<sc-if value="{H("ent")}" hint-placeholder-val="{H("true")}">{segm(True)}{bloco_ent()}</sc-if><sc-if value="{H("ret")}" hint-placeholder-val="{H("false")}">{segm(False)}{bloco_ret()}</sc-if></main>'
    + rodape(cta('Continuar', 'Loja-Pagamento.dc.html')))
logic_ent = ("renderVals() {\nconst ent = !(this.state && this.state.modo === 'retirada');\n"
             "return { ent: ent, ret: !ent, setEntrega: () => this.setState({ modo: 'entrega' }), setRetirada: () => this.setState({ modo: 'retirada' }) };\n}")
phone('Loja-Entrega.dc.html', 'Bodeleve — loja: entrega ou retirada', 900, entrega, logic_ent)

# 3 Endereço
ender = (bar2('Endereço de entrega', 'Loja-Entrega.dc.html')
    + f'<main style="display: flex; flex-direction: column; gap: 16px; padding: 4px 16px 24px">'
    + campo('cep', 'CEP', '00000-000', '', 'text', 'numeric', 'Com o CEP preenchemos rua e bairro.')
    + campo('rua', 'Rua', 'Rua das Camélias')
    + f'<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px">' + campo('num', 'Número', '120', '', 'text', 'numeric') + campo('comp', 'Complemento', 'apto 34') + '</div>'
    + campo('bairro', 'Bairro', 'Jardim das Flores') + campo('ref', 'Ponto de referência (opcional)', '', 'Ex.: portão azul')
    + f'<div role="status" style="display: flex; gap: 10px; align-items: flex-start; padding: 12px 14px; border-radius: 12px; background: {OK_B}; color: {OK_T}; font-size: 14px; line-height: 20px; font-weight: 500">{icon("confirmar", 20)}<span>Entregamos neste endereço. Taxa de R$ 8,00.</span></div></main>'
    + rodape(cta('Usar este endereço', 'Loja-Entrega.dc.html')))
phone('Loja-Endereco.dc.html', 'Bodeleve — loja: endereço', 880, ender, VAZIO)

# 4 Pagamento
pag = (bar2('Finalizar pedido', 'Loja-Entrega.dc.html')
    + f'<main style="display: flex; flex-direction: column; gap: 20px; padding: 4px 16px 24px">{etapa(3, "Pagamento")}{h1("Como você quer pagar?")}'
    + f'<fieldset style="margin: 0; padding: 0; border: 0; display: flex; flex-direction: column; gap: 8px"><legend style="padding: 0; margin-bottom: 8px; font-weight: 600">Pagar agora</legend>'
    + opcao('p1', 'pag', 'Pix', 'O código aparece ao confirmar o pedido', True) + '</fieldset>'
    + f'<fieldset style="margin: 0; padding: 0; border: 0; display: flex; flex-direction: column; gap: 8px"><legend style="padding: 0; margin-bottom: 8px; font-weight: 600">Pagar ao receber</legend>'
    + opcao('p2', 'pag', 'Cartão na entrega', 'Débito ou crédito, na maquininha') + opcao('p3', 'pag', 'Dinheiro', 'Informe abaixo se precisa de troco') + '</fieldset>'
    + campo('troco', 'Troco para quanto? (só para dinheiro)', '', 'Ex.: R$ 100,00', 'text', 'decimal')
    + f'<div style="display: flex; justify-content: space-between; padding: 14px 16px; border-radius: 12px; background: {W}; border: 1px solid {LN}; font-weight: 600; font-size: 18px; {NUM}"><span>Total</span><span>R$ 81,20</span></div></main>'
    + rodape(cta('Revisar pedido', 'Loja-Revisao.dc.html')))
phone('Loja-Pagamento.dc.html', 'Bodeleve — loja: pagamento', 860, pag, VAZIO)

# 5 Revisão
def bloco(titulo, href, inner):
    return (f'<section style="padding: 14px 16px; border-radius: 12px; background: {W}; border: 1px solid {LN}; display: flex; flex-direction: column; gap: 6px">'
            f'<div style="display: flex; justify-content: space-between; align-items: center; gap: 12px"><h2 style="margin: 0; font-size: 16px; line-height: 24px; font-weight: 600">{titulo}</h2>'
            f'<a href="{href}" aria-label="Alterar {titulo.lower()}" style="min-height: 44px; display: inline-flex; align-items: center; font-weight: 600; text-decoration: none">Alterar</a></div>{inner}</section>')
li = lambda a, b: f'<div style="display: flex; justify-content: space-between; gap: 12px; color: {G2}; {NUM}"><span>{a}</span><span>{b}</span></div>'
rev = (bar2('Finalizar pedido', 'Loja-Pagamento.dc.html')
    + f'<main style="display: flex; flex-direction: column; gap: 12px; padding: 4px 16px 24px">{etapa(4, "Revisão")}{h1("Confira antes de confirmar")}'
    + bloco('Itens', 'Loja-Sacola.dc.html', li('1 × Queijo coalho', 'R$ 32,90') + li('2 × Farinha de mandioca', 'R$ 25,80') + li('1 × Rapadura', 'R$ 14,50'))
    + bloco('Entrega', 'Loja-Entrega.dc.html', f'<div style="color: {G2}">Rua das Camélias, 120 · apto 34 — Jardim das Flores<br>O quanto antes · hoje, em 40 a 60 minutos</div>')
    + bloco('Pagamento', 'Loja-Pagamento.dc.html', f'<div style="color: {G2}">Pix · o código aparece ao confirmar</div>')
    + bloco('Contato', 'Loja-Identificacao.dc.html', f'<div style="color: {G2}; {NUM}">Ana Souza · (00) 90000-0000</div>')
    + f'<div style="padding: 16px; border-radius: 12px; background: {W}; border: 1px solid {LN}; display: flex; flex-direction: column; gap: 8px; {NUM}">' + li('Subtotal', 'R$ 73,20') + li('Entrega', 'R$ 8,00')
    + f'<div style="display: flex; justify-content: space-between; padding-top: 8px; border-top: 1px solid {LN}; font-weight: 600; font-size: 18px"><span>Total</span><span>R$ 81,20</span></div></div></main>'
    + rodape(cta(f'<span style="flex: 1 1 0">Confirmar pedido</span><span style="{NUM}">R$ 81,20</span>', 'Loja-Confirmado.dc.html', 'justify-content: space-between')))
phone('Loja-Revisao.dc.html', 'Bodeleve — loja: revisão', 1060, rev, VAZIO)
