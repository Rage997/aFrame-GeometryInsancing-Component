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

    // This is a little "hack". Since we can't store a whole matrix, we store each component
    const matrix_size = number_instances * 4
    const model_matrix = [
      new Float32Array(matrix_size),
      new Float32Array(matrix_size),
      new Float32Array(matrix_size),
      new Float32Array(matrix_size),
      ]
    
    for( let i = 0 ; i < model_matrix.length ; i ++ ){
      geometry.addAttribute( 
          `aInstanceMatrix${i}`, 
          new THREE.InstancedBufferAttribute( model_matrix[i], 4 ) 
      )
    }

    // assign valus
    for( let i = 0 ; i < number_instances ; i ++ ){
    for ( let r = 0 ; r < 4 ; r ++ )
    for ( let c = 0 ; c < 4 ; c ++ ){
      model_matrix[r][i*4 + c] =  Math.random()
    }
  }

    let color_array = new Float32Array(number_instances*3)
    for(let i = 0; i < number_instances; i++){
      color_array[i + 0] = Math.random()
      color_array[i + 1] = Math.random()
      color_array[i + 2] = Math.random()
    }

    geometry.addAttribute('color', new THREE.InstancedBufferAttribute(color_array, 3, 1, false))
    
    var material = new THREE.ShaderMaterial({
      uniforms: {
        time: {value: 0}
      },
      vertexShader: [
        'attribute vec4 aInstanceMatrix0;',
        'attribute vec4 aInstanceMatrix1;',
        'attribute vec4 aInstanceMatrix2;',
        'attribute vec4 aInstanceMatrix3;',
        'attribute vec3 color;',
        'varying vec3 vColor;',
        'void main() {',
        'mat4 instance_matrix = mat4(aInstanceMatrix0, aInstanceMatrix1, aInstanceMatrix2, aInstanceMatrix3);',
        '  gl_Position = projectionMatrix * modelViewMatrix * instance_matrix * vec4(position, 1.0 );',
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
