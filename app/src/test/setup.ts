import '@testing-library/jest-dom/vitest'
import * as matchers from 'vitest-axe/matchers'
import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

expect.extend(matchers)
afterEach(() => cleanup())

// jsdom ainda não implementa <dialog>.showModal()/close(); o suficiente para os testes de comportamento.
const proto = window.HTMLDialogElement?.prototype
if (proto && !proto.showModal) {
  proto.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '')
  }
  proto.close = function close(this: HTMLDialogElement) {
    if (!this.hasAttribute('open')) return
    this.removeAttribute('open')
    this.dispatchEvent(new Event('close'))
  }
}
