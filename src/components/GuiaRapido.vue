<script setup lang="ts">
import IconeTraco from './IconeTraco.vue'
// Caixa "Teste em 1 minuto": diz pra quem chega pelo link o que o app faz e o que testar.
// Fecha e lembra no aparelho; o botão "Como testar" do topo abre de novo.
defineEmits<{ fechar: [] }>()
</script>

<template>
  <section class="guia" aria-labelledby="guia-titulo">
    <div class="topo-guia">
      <h2 id="guia-titulo">Teste em 1 minuto</h2>
      <button class="fechar" aria-label="Fechar o guia" @click="$emit('fechar')">×</button>
    </div>
    <p class="oque">
      Fluxo de assinatura de documentos, do PDF ao arquivo assinado. Roda inteiro no navegador: o arquivo não sai do seu aparelho.
    </p>
    <ol>
      <li>Clique em <b>Usar contrato de exemplo</b> (ou envie um PDF seu).</li>
      <li>Adicione duas pessoas. Escolha cada uma e clique na página onde ela deve assinar.</li>
      <li>Clique em <b>Enviar para assinatura</b> e use <b>Abrir link</b> pra assinar como cada pessoa, na ordem.</li>
      <li>Quando todos assinarem, clique em <b>Baixar PDF assinado</b>: a última página traz a trilha de auditoria.</li>
    </ol>
    <p class="reparar">
      <b>Repare:</b> a segunda pessoa só consegue assinar depois da primeira, e o PDF final registra o SHA-256 do original, quem assinou e
      quando.
    </p>
    <button class="botao" @click="$emit('fechar')"><IconeTraco nome="concluir" />Entendi</button>
  </section>
</template>

<style scoped>
.guia {
  width: min(60rem, 100% - 2rem);
  margin: 1.25rem auto 0;
  padding: 1.1rem 1.25rem 1.25rem;
  background: var(--primaria-suave);
  border: 1px solid #cfdcff;
  border-radius: 12px;
}
.topo-guia {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
h2 {
  font-size: 1rem;
}
.fechar {
  width: 2.25rem;
  height: 2.25rem;
  border: 0;
  background: none;
  font-size: 1.4rem;
  line-height: 1;
  color: var(--texto-3);
  cursor: pointer;
  border-radius: 8px;
}
.fechar:hover {
  color: var(--texto);
  background: #fff;
}
.oque {
  color: var(--texto-2);
  margin-top: 0.25rem;
  font-size: 0.92rem;
}
ol {
  margin: 0.75rem 0 0 1.25rem;
  display: grid;
  gap: 0.3rem;
  font-size: 0.92rem;
}
.reparar {
  margin-top: 0.75rem;
  font-size: 0.88rem;
  color: var(--texto-2);
}
.botao {
  margin-top: 0.9rem;
}
</style>
