module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // New feature
        'fix',      // Bug fix
        'docs',     // Documentation only
        'style',    // Code style (formatting, missing semi-colons, etc)
        'refactor', // Code change that neither fixes a bug nor adds a feature
        'test',     // Adding missing tests or correcting existing tests
        'perf',     // Performance improvement
        'ci',       // CI configuration changes
        'build',    // Build system or external dependency changes
        'revert',   // Reverts a previous commit
        'chore',    // Other changes that don't modify src or test files
      ],
    ],
    'subject-case': [2, 'never', ['start-case', 'pascal-case', 'upper-case']],
    'header-max-length': [2, 'always', 100],
  },
};
