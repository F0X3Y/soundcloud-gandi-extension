class TestExt {
  getInfo() {
    return {
      id: 'testext',
      name: 'Test Extension',
      color1: '#0b6',
      blocks: [
        {
          opcode: 'hello',
          blockType: Scratch.BlockType.COMMAND,
          text: 'say hello'
        },
        {
          opcode: 'echo',
          blockType: Scratch.BlockType.REPORTER,
          text: 'echo [TEXT]',
          arguments: {
            TEXT: { type: Scratch.ArgumentType.STRING, defaultValue: 'yo' }
          }
        }
      ],
      targetTypes: ['sprite']
    };
  }

  // implementations
  hello() {
    console.log('Hello from test extension');
    alert('Hello from test extension');
  }

  echo(args) {
    return String(args.TEXT);
  }
}

Scratch.extensions.register(new TestExt());
