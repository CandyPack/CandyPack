module.exports = {
  branches: ["main"],
  plugins: [
    ["@semantic-release/commit-analyzer", {
      preset: 'conventionalcommits',
      releaseRules: [
        { type: 'refactor', release: 'patch' },
        { type: 'style', release: 'patch' },
        { type: 'build', release: 'patch' },
        { type: 'ci', release: 'patch' },
        { type: 'chore', release: 'patch' },
        { type: 'docs', release: 'patch' },
        { type: 'test', release: 'patch' },
        { type: 'perf', release: 'patch' },
      ],
    }],
    ["@semantic-release/release-notes-generator", {
      preset: 'conventionalcommits',
      writerOpts: {
        transform: (commit, context) => {
          const map = {
            feat: '✨ Features',
            fix: '🐛 Fixes',
            perf: '⚡ Performance',
            refactor: '🧠 Refactors',
            docs: '📝 Docs',
            style: '🎨 Style',
            test: '✅ Tests',
            chore: '🔧 Chore',
            build: '🏗️ Build',
            ci: '🤖 CI'
          };

          if (!commit.type) return commit;
          commit.type = map[commit.type] || commit.type;

          const hide = ['🎨 Style', '🔧 Chore', '🏗️ Build', '🤖 CI'];
          commit.hidden = hide.includes(commit.type);

          if (commit.scope === '*' || commit.scope === 'root') commit.scope = '';

          if (commit.notes) {
            commit.notes.forEach(n => {
              n.title = '💥 BREAKING CHANGES';
            });
          }

          if (commit.subject) {
            commit.subject = commit.subject.replace(/^([A-Z])/,(m)=>m.toLowerCase());
          }

          return commit;
        },
        groupBy: 'type',
        commitGroupsSort: (a, b) => (a.title > b.title ? 1 : -1),
        commitsSort: ['scope', 'subject']
      }
    }],
    [
      "@semantic-release/changelog",
      {
        changelogFile: "CHANGELOG.md"
      }
    ],
    "@semantic-release/npm",
    [
      "@semantic-release/git",
      {
        assets: ["package.json", "CHANGELOG.md"],
        message: "chore(release): ${nextRelease.version} [skip ci]\\n\\n${nextRelease.notes}"
      }
    ],
    "@semantic-release/github"
  ]
};
