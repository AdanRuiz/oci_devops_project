module.exports = {
  extends: [
    'react-app',
    'react-app/jest',
    'plugin:react/recommended',
    'plugin:prettier/recommended',
  ],
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
  },
};
