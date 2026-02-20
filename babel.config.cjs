module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    // https://jestjs.io/docs/tutorial-react#setup
    ['@babel/preset-react', {runtime: 'automatic'}]
  ]
};
