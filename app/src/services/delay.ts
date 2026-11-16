/** Latência simulada dos mocks, para os estados de carregamento aparecerem */
export function delay(ms = 200) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
