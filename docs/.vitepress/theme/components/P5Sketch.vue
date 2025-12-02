<!-- filepath: /Users/mahmoudtamaa/projects/proposals/portfolio-custom/.vitepress/theme/components/P5Sketch.vue -->
<template>
  <div class="p5-wrapper" :style="containerStyle">
    <div ref="p5Container" class="p5-background" aria-hidden="true"></div>
    <div class="p5-content"><slot /></div>
  </div>
</template>

<script>
export default {
  props: {
    sketch: {
      type: Function,
      required: false,
      default: null,
    },
    height: {
      type: String,
      default: '50vh',
    },
    fullPage: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    containerStyle() {
      if (this.fullPage) {
        return {
          position: 'fixed',
          top: '0',
          left: '0',
          width: '100%',
          height: '100vh',
          zIndex: 0,
        }
      }
      return { height: this.height }
    }
  },
  async mounted() {
    const p5 = (await import('p5')).default; // Dynamically import p5
    const sketchToUse = typeof this.sketch === 'function'
      ? this.sketch
      : this.defaultSketch(this.$refs.p5Container);

    this.p5Instance = new p5(sketchToUse, this.$refs.p5Container);
  },
  beforeUnmount() {
    if (this.p5Instance) {
      this.p5Instance.remove();
    }
  },
  methods: {
    // Returns a p5 sketch function bound to the provided container
    defaultSketch(container) {
      return function (p) {
        let x = 0;
        let speed = 2;

        p.setup = function () {
          const w = container.clientWidth || 400;
          const h = container.clientHeight || 300;
          p.createCanvas(w, h).style('pointer-events', 'none');
          p.noStroke();
        };

        p.draw = function () {
          p.clear();
          p.background(0, 0);
          p.fill(200, 100, 240, 200);
          const radius = Math.min(p.width, p.height) * 0.08;
          x += speed;
          if (x - radius > p.width) x = -radius;
          p.ellipse(x, p.height / 2, radius * 2, radius * 2);
        };

        p.windowResized = function () {
          const w = container.clientWidth || 400;
          const h = container.clientHeight || 300;
          p.resizeCanvas(w, h);
        };
      };
    },
  },
};
</script>

<style scoped>
.p5-wrapper {
  position: relative;
  width: 100%;
  overflow: hidden;
}
.p5-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0; /* behind content that has higher stacking context */
  pointer-events: none; /* allow interactions with page content */
}
.p5-content {
  position: relative;
  z-index: 1; /* ensure slot content renders above the canvas */
  padding: 1rem;
}
</style>