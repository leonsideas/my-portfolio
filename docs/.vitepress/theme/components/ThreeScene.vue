<!-- filepath: /Users/mahmoudtamaa/projects/proposals/portfolio-custom/.vitepress/theme/components/ThreeScene.vue -->
<template>
    <div ref="threeContainer" :style="{ height }" class="three-container"></div>
  </template>
  
  <script>
  import * as THREE from 'three';
  
  export default {
    props: {
        setupScene: {
          type: Function,
          required: false,
          default: null,
        },
        height: {
          type: String,
          default: '50vh',
        },
      },
    mounted() {
      // Create the Three.js scene
      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      this.renderer = new THREE.WebGLRenderer({ antialias: true });
      // Make the renderer match the container size (we'll size to container clientWidth/Height)
      const container = this.$refs.threeContainer;
      const rect = container.getBoundingClientRect();
      this.renderer.setSize(rect.width, rect.height);
      this.$refs.threeContainer.appendChild(this.renderer.domElement);

      // Ensure methods keep the correct `this` when used as callbacks
      this.animate = this.animate.bind(this);
      this.onWindowResize = this.onWindowResize.bind(this);

      // Style the canvas so it fits the container and doesn't block interactions
      const canvas = this.renderer.domElement;
      canvas.style.position = 'absolute';
      canvas.style.top = '0';
      canvas.style.left = '0';
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.zIndex = '0';
      canvas.style.pointerEvents = 'none';
  
      // Call the setupScene function to customize the scene (if provided)
      if (typeof this.setupScene === 'function') {
        this.setupScene(this.scene, this.camera, this.renderer);
      } else {
        this.defaultSetupScene(this.scene, this.camera, this.renderer);
      }
  
      // Start the animation loop
      this.animate();
      window.addEventListener('resize', this.onWindowResize);
    },
    beforeUnmount() {
      window.removeEventListener('resize', this.onWindowResize);
      if (this.renderer) {
        // remove canvas from DOM
        try {
          const canvas = this.renderer.domElement;
          if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
        } catch (e) {}
        this.renderer.dispose();
        this.renderer = null;
      }
    },
    methods: {
      // A simple default scene when no setupScene prop is provided
      defaultSetupScene(scene, camera, renderer) {
        // position camera
        camera.position.z = 5;

        // basic cube
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshNormalMaterial();
        const cube = new THREE.Mesh(geometry, material);
        scene.add(cube);

        // small ambient light so MeshPhongMaterial would show up if used elsewhere
        const light = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(light);

        // keep a reference so animate() can update it
        this._defaultMesh = cube;

        // set renderer clear color
        try {
          renderer.setClearColor(0x000000, 0);
        } catch (e) {}
      },
      animate() {
        requestAnimationFrame(this.animate);
        if (this._defaultMesh) {
          this._defaultMesh.rotation.x += 0.01;
          this._defaultMesh.rotation.y += 0.013;
        }
        if (this.scene && this.camera && this.renderer) {
          this.renderer.render(this.scene, this.camera);
        }
      },
      onWindowResize() {
        if (!this.camera || !this.renderer) return;
        // Resize renderer to match container
        const container = this.$refs.threeContainer;
        const rect = container.getBoundingClientRect();
        this.camera.aspect = rect.width / rect.height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(rect.width, rect.height);
      },
    },
  };
  </script>
  
  <style scoped>
  .three-container {
    position: relative;
    width: 100%;
    overflow: hidden;
    z-index: 0;
  }
  </style>