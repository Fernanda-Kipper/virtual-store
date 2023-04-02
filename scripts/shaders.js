var vertexShaderText = `#version 300 es
  in vec4 a_position;
  in vec3 a_normal;
  in vec2 a_texcoord;

  uniform mat4 u_projection;
  uniform mat4 u_view;
  uniform mat4 u_world;

  out vec2 v_texcoord;

  void main() {
    gl_Position = u_projection * u_view * u_world * a_position;
    v_texcoord = a_texcoord;
  }
`

var fragmentShaderText = `#version 300 es
  precision mediump float;

  in vec2 v_texcoord;

  uniform sampler2D u_texture;

  out vec4 outColor;

  void main () {
    outColor = texture(u_texture, v_texcoord);
  }
`