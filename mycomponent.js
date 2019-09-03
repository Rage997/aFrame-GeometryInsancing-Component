// TODOS:
// 1) Include materials
// 2) Working light 


if (typeof AFRAME === 'undefined') {
  throw new Error('Component attempted to register before' +
                  'AFRAME was available.');
}

AFRAME.registerComponent('instancing', {
  schema: {
    number_instances: {type: 'int', default: 10000}
  },

  init: function () {
    this.number_instances = this.data.number_instances;
    this.model = null;
    const loader = new THREE.GLTFLoader();
    const url = 'test_draco.glb';
    this.geometry = null
    this.material = null

    // Here, 'gltf' is the object that the loader returns to us
    const onLoad = ( gltf ) => {
      console.log( gltf );
      const model = gltf.scene.children[ 2 ];
      this.material = model.material
      this.geometry = model.geometry
      console.log(this.material)
      this.init_scene();
    };

    // Set the draco decoder
    THREE.DRACOLoader.setDecoderPath('./decoder/');
    loader.setDRACOLoader(new THREE.DRACOLoader())
    loader.load(url, onLoad)

  },
  
  init_scene: function () {
    if (this.model !== null) { return; }
    var el = this.el;
    // console.log(el)
    var number_instances = this.number_instances;

    var geometry = new THREE.InstancedBufferGeometry();
    geometry.copy(this.geometry);

    var translateArray = new Float32Array(number_instances*3);
    var colorArray = new Float32Array(number_instances*3);
    
    for (var i = 0; i < number_instances; i++) {
      translateArray[i*3+0] = (Math.random() - 0.5) * 100;
      translateArray[i*3+1] = (Math.random() - 0.5) * 100;
      translateArray[i*3+2] = (Math.random() - 0.5) * 100;
    }

    for (var i = 0; i < number_instances; i++) {
      colorArray[i*3+0] = Math.random();
      colorArray[i*3+1] = Math.random();
      colorArray[i*3+2] = Math.random();
    }

    geometry.addAttribute('translate', new THREE.InstancedBufferAttribute(translateArray, 3, 1, false));
    geometry.addAttribute('color', new THREE.InstancedBufferAttribute(colorArray, 3, 1, false));

    var material = new THREE.ShaderMaterial({
      uniforms: {
        time: {value: 0}
      },
      vertexShader: [
        'attribute vec3 translate;',
        'attribute vec3 color;',
        'varying vec3 vColor;',
        'void main() {',
        '  gl_Position = projectionMatrix * modelViewMatrix * vec4( position + translate, 1.0 );',
        '  vColor = color;',
  '}'
      ].join('\n'),
      fragmentShader: [
        'varying vec3 vColor;',
        'void main() {',
        '  gl_FragColor = vec4(vColor, 1.0 );',
        '}'
      ].join('\n')
    });

    var mesh = new THREE.Mesh(geometry, material);
    mesh.position = (0,0,0)

    
    this.model = mesh;
    el.setObject3D('mesh', mesh);
    el.emit('model-loaded', {format:'mesh', model: mesh});
  },

  tick: function(time, delta) {
    if (this.model === null || this.model.geometry === null) { return; }

    // console.log(this.geometry)
    var mesh = this.model;
    // 
    mesh.material.uniforms.time.value = (mesh.material.uniforms.time.value + delta / 1000) % 30.0;
  }
});
