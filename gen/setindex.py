import json,sys,os
p=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','design','canvas.json')
j=json.load(open(p))
allb=[("DS-Fundamentos.dc.html",0,1440,2240,"Fundamentos"),("DS-Componentes.dc.html",1520,1440,1500,"Componentes base"),("DS-Navegacao.dc.html",3040,1760,1500,"Navegação e sobreposições"),("DS-Dominio.dc.html",4880,1760,1600,"Componentes de domínio"),("DS-Estados.dc.html",6720,1440,1000,"Estados")]
n=int(sys.argv[1])
hs={k:int(v) for k,v in (a.split('=') for a in sys.argv[2:])}
for f,x,w,h,t in allb:
    j['boards'].pop(f,None)
    if f in j['order']: j['order'].remove(f)
for f,x,w,h,t in allb[:n]:
    j['boards'][f]={"x":x,"y":0,"w":w,"h":hs.get(f.split('.')[0],h),"title":t,"page":"etapa2"}
    j['order'].append(f)
json.dump(j,open(p,'w'),ensure_ascii=False,separators=(',',':'))
print(list(j['boards']))
