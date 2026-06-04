const module_def = {
  name: 'github-profiler',
  description: 'Queries the GitHub API for profile metrics, contributions, languages, and extracts public commit emails.',
  accepts: ['username', 'email'],
  requiresKey: false,
  keyName: 'GITHUB_TOKEN',

  async run(input) {
    const query = input.query;
    const type = input.type; // 'username' or 'email'

    let username = query;

    // If query is an email, we try to extract the username part as a guess,
    // or we can search for the user by email using GitHub API.
    const token = process.env.GITHUB_TOKEN;
    const headers = {
      'User-Agent': 'Specter-OSINT-App',
      'Accept': 'application/vnd.github.v3+json',
    };
    if (token) {
      headers['Authorization'] = `token ${token}`;
    }

    const result = {
      username: null,
      profile: null,
      repos: [],
      emailsFound: [],
    };

    // 1. Resolve username from email if input is email
    if (type === 'email') {
      try {
        const searchUrl = `https://api.github.com/search/users?q=${encodeURIComponent(query)}+in:email`;
        const response = await fetch(searchUrl, { headers, signal: AbortSignal.timeout(5000) });
        if (response.ok) {
          const searchData = await response.json();
          if (searchData.items && searchData.items.length > 0) {
            username = searchData.items[0].login;
          } else {
            // Check fallback to local part
            username = query.split('@')[0];
          }
        } else {
          username = query.split('@')[0];
        }
      } catch (err) {
        username = query.split('@')[0];
      }
    }

    result.username = username;

    // 2. Fetch User Profile
    try {
      const profileUrl = `https://api.github.com/users/${encodeURIComponent(username)}`;
      const response = await fetch(profileUrl, { headers, signal: AbortSignal.timeout(5000) });
      if (response.ok) {
        const profile = await response.json();
        result.profile = {
          login: profile.login,
          name: profile.name,
          company: profile.company,
          blog: profile.blog,
          location: profile.location,
          email: profile.email,
          bio: profile.bio,
          avatar_url: profile.avatar_url,
          public_repos: profile.public_repos,
          followers: profile.followers,
          following: profile.following,
          created_at: profile.created_at,
          updated_at: profile.updated_at,
        };

        if (profile.email) {
          result.emailsFound.push(profile.email);
        }
      } else {
        throw new Error(`GitHub API returned status ${response.status}`);
      }
    } catch (err) {
      result.error = err.message;
      return result; // Profile fetch is required
    }

    // 3. Fetch public repos to analyze languages
    try {
      const reposUrl = `https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=30&sort=updated`;
      const response = await fetch(reposUrl, { headers, signal: AbortSignal.timeout(5000) });
      if (response.ok) {
        const repos = await response.json();
        result.repos = repos.map(r => ({
          name: r.name,
          description: r.description,
          language: r.language,
          created_at: r.created_at,
          updated_at: r.updated_at,
          fork: r.fork,
        }));
      }
    } catch (err) {
      // Non-blocking
    }

    // 4. Trace commit emails using Public Events API
    try {
      const eventsUrl = `https://api.github.com/users/${encodeURIComponent(username)}/events/public?per_page=30`;
      const response = await fetch(eventsUrl, { headers, signal: AbortSignal.timeout(5000) });
      if (response.ok) {
        const events = await response.json();
        const emails = new Set();
        
        for (const event of events) {
          if (event.type === 'PushEvent' && event.payload && event.payload.commits) {
            for (const commit of event.payload.commits) {
              if (commit.author && commit.author.email) {
                // Ignore github private placeholder emails
                if (!commit.author.email.includes('noreply.github.com')) {
                  emails.add(commit.author.email);
                }
              }
            }
          }
        }
        
        result.emailsFound = Array.from(new Set([...result.emailsFound, ...emails]));
      }
    } catch (err) {
      // Non-blocking
    }

    return result;
  }
};

export default module_def;
