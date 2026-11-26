// Os campos são guardados em coordenadas relativas (0 a 1, origem no canto de cima),
// que é o que a tela usa. O PDF usa pontos com origem no canto de BAIXO.
// Essa conversão é o tipo de detalhe que vira bug de "assinatura no lugar errado".

export interface Retangulo {
  x: number
  y: number
  largura: number
  altura: number
}

export function relativoParaPdf(r: Retangulo, larguraPagina: number, alturaPagina: number): Retangulo {
  return {
    x: r.x * larguraPagina,
    y: alturaPagina - (r.y + r.altura) * alturaPagina,
    largura: r.largura * larguraPagina,
    altura: r.altura * alturaPagina,
  }
}

/** Mantém o campo inteiro dentro da página. */
export function prender(r: Retangulo): Retangulo {
  const largura = Math.min(Math.max(r.largura, 0.05), 1)
  const altura = Math.min(Math.max(r.altura, 0.025), 1)
  return {
    largura,
    altura,
    x: Math.min(Math.max(r.x, 0), 1 - largura),
    y: Math.min(Math.max(r.y, 0), 1 - altura),
  }
}

/** Encaixa a imagem da assinatura dentro do campo sem distorcer. */
export function encaixar(larguraImg: number, alturaImg: number, caixa: Retangulo): Retangulo {
  const escala = Math.min(caixa.largura / larguraImg, caixa.altura / alturaImg)
  const largura = larguraImg * escala
  const altura = alturaImg * escala
  return { largura, altura, x: caixa.x + (caixa.largura - largura) / 2, y: caixa.y + (caixa.altura - altura) / 2 }
}
