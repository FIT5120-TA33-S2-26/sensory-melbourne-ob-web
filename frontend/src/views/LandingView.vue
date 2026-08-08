<template>
  <main class="landing">
    <div class="landing-inner">
      <div class="logo" aria-label="Sensory Melbourne">
        <span>Sensory</span>
        <span>Melbourne</span>
      </div>
      <div class="welcome-copy">
        <h1>Navigate Melbourne with confidence</h1>
        <p>Find calmer routes and understand crowd levels across Melbourne CBD.</p>
      </div>
      <RouterLink class="primary-button" to="/home">Get started</RouterLink>
      <p class="attribution">Using City of Melbourne Open Data</p>
    </div>
  </main>
</template>

<style scoped>
.landing { display: grid; min-height: 100vh; place-items: center; padding: 36px 20px; background: radial-gradient(circle at 50% 35%, #fff 0, #fff 48%, #edf8f6 100%); text-align: center; }
.landing-inner { display: flex; width: min(540px, 100%); min-height: min(760px, calc(100vh - 72px)); flex-direction: column; align-items: center; justify-content: center; }
.logo { display: flex; flex-direction: column; margin-bottom: clamp(70px, 13vh, 125px); font-size: clamp(2.1rem, 7vw, 3.25rem); font-weight: 950; font-style: italic; line-height: 1.02; letter-spacing: -.04em; }
.welcome-copy h1 { margin: 0 0 22px; font-size: clamp(1.45rem, 4vw, 2rem); }
.welcome-copy p { max-width: 450px; margin: 0; color: var(--muted); font-size: 1.08rem; line-height: 1.5; }
.primary-button { min-width: 210px; margin-top: 58px; }
.attribution { margin: 34px 0 0; color: var(--muted); font-size: .82rem; }
</style>
