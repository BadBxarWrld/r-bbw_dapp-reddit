## Registration Project

This project provides a user crypto registration and management system within your Reddit community. It includes:
- User sign-up autofilled with basic information (Reddit username)
- Crypto address verification

## Table of Contents

- [Getting Started](#getting-started)
- [Features](#features)
- [GitHub Branching Strategy](#github-branching-strategy)
- [Reference](#reference)
- [License](#license)

## Getting Started

### Prerequisites
Before you start, you'll need:
- **Node.js (v22.2.0+)**
- **A test subreddit that you moderate** (with less than 200 members)
  - After creating a test subreddit, visit your Safety Filters under mod tools and turn off the Reputation filter.
- **A code editor** (Reddit recommends VS Code)

### Installation and Setup

1. **Install the Devvit CLI:**  
   Choose your preferred package manager:
   ```bash
   npm install -g devvit
   ```
2. **Log in to Reddit:**
   ```bash
   devvit login
   ```
3. **Create a New Project:**
   ```bash
   devvit new --template blocks-post
   cd my-project
   ```
   **Pro Tip:** If you're already a savvy web developer, use `--template web-view-post` to leverage webview component features.

4. **Clone the Repository:**
   ```bash
   git clone https://github.com/BadBxarWrld/r-bbw_dapp-reddit.git
   ```
5. **Upload Your App:**
   ```bash
   devvit upload
   ```
6. **Playtest Your App:**  
   Replace `<my-subreddit>` with your test subreddit name (e.g., `r/MyTestSub`).
   ```bash
   devvit playtest <my-subreddit>
   ```

## Features

- **Registration Form** – Allows any user to participate in earning rewards with their username and crypto address.
  - **Crypto Address Verification:** If a user registers again, their previous wallet will be overwritten in the ledger post's comments while preserving history. (Addresses must be in 0x... format.)
  - **Username:Crypto Address Ledger:** Maintains a record of all participants via the ledger post and comments.
- **Mod-Only: Create Ledger Post Button:**  
  Provides a button for mods to create a ledger post for registrations.  
  - **Non-Mods:** Receive a toast notification informing them they are not allowed.
  - **Mods:** Receive a toast notification confirming the post has been created. (Refresh the screen to view the new post.)

## GitHub Branching Strategy

[TheAverageNewishCoder](https://github.com/TheAverageNewishCoder) follows a simple branching model:
1. **main:** The primary branch for the Crypto Registration feature.
2. **additional subreddit feature:** For any new subreddit features, create a branch named `feature/subreddit` and develop there.

**Note:** When a feature is complete, DO NOT open a pull request to merge changes back into `main` unless the feature directly relates to Crypto Registration. All other requests may be ignored.

## Reference

For more details on integrating with Devvit or building advanced Reddit-based features, check out [Devvit’s Quickstart documentation](https://developers.reddit.com/docs/quickstart).

## License

This project is licensed under the [GNU General Public License v3.0](https://www.gnu.org/licenses/gpl-3.0.en.html).
