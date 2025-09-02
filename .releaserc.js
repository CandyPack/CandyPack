module.exports = {
  branches: ["main"],
  plugins: [
    ["@semantic-release/commit-analyzer", {
      preset: 'conventionalcommits',
    }],
    ["@semantic-release/release-notes-generator", {
      preset: 'conventionalcommits',
      writerOpts: {
        transform: (c, context) => {
          const commit = JSON.parse(JSON.stringify(c));

          const map = {
            feat: "✨ What's New",
            fix: '🛠️ Fixes & Improvements',
            perf: '⚡️ Performance Upgrades',
            refactor: '⚙️ Engine Tuning',
            docs: '📚 Documentation',
            style: '🎨 Style',
            test: '✅ Tests',
            chore: '🔧 Maintenance & Cleanup',
            build: '🏗️ Build',
            ci: '🤖 CI'
          };

          commit.type = map[commit.type] || commit.type;

          const hide = ['🎨 Style', '🔧 Maintenance & Cleanup', '🏗️ Build', '🤖 CI'];
          commit.hidden = hide.includes(commit.type);

          if (commit.scope === '*' || commit.scope === 'root') commit.scope = '';

          if (commit.notes) {
            commit.notes.forEach(n => {
              n.title = '💥 BREAKING CHANGES';
            });
          }

          if (commit.subject) {
            let subject = commit.subject;

            // Find and extract PR number from the subject, e.g., "feat: new thing (#123)"
            const prRegex = /\s\(#(\d+)\)$/;
            const prMatch = subject.match(prRegex);
            const prNumber = prMatch ? prMatch[1] : null;

            // If a PR number is found, remove it from the subject to avoid it appearing twice
            if (prNumber) {
              subject = subject.replace(prRegex, '');
            }

            // Clean up the subject (lowercase first letter)
            subject = subject.replace(/^([A-Z])/,(m)=>m.toLowerCase());

            let attribution = '';

            // Get author name - prefer GitHub login if available
            const author = (commit.author && commit.author.login) ? commit.author.login : commit.authorName;
            if (author) {
              if (!author.includes('[bot]')) {
                 attribution = `by @${author}`;
              }
            }

            // Get PR link if a number was found
            if (prNumber && context.host && context.owner && context.repository) {
              const prUrl = `https://${context.host}/${context.owner}/${context.repository}/pull/${prNumber}`;
              const prLink = `[#${prNumber}](${prUrl})`;
              attribution = attribution ? `${attribution} in ${prLink}` : prLink;
            }

            // Append the attribution string to the subject if we created one
            if (attribution) {
              commit.subject = `${subject} ${attribution}`;
            } else {
              commit.subject = subject;
            }
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
