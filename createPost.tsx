import { Devvit } from '@devvit/public-api';

// Configure Devvit's plugins
Devvit.configure({
  redditAPI: true,
});

// Adds a new menu item to the subreddit allowing only moderators to create a new post.
Devvit.addMenuItem({
  label: 'Create New Registration',
  location: 'subreddit',
  onPress: async (_event, context) => {
    const { reddit, ui } = context;
    const subreddit = await reddit.getCurrentSubreddit();

    // Retrieve the current user.
    const currentUser = await reddit.getCurrentUser();
    if (!currentUser) {
      ui.showToast({ text: 'Unable to determine current user.' });
      return;
    }

    // Fetch the list of moderators for the subreddit.
    const modListing = await reddit.getModerators({ subredditName: subreddit.name });
    // Use .all() to get all moderators from the Listing.
    const mods = await modListing.all();
    if (!mods.some(mod => mod.username === currentUser.username)) {
      ui.showToast({ text: 'Only moderators can create a new registration post.' });
      return;
    }

    // If the user is a moderator, proceed to create the post.
    const post = await reddit.submitPost({
      title: 'Register',
      subredditName: subreddit.name,
      // The preview appears while the post loads.
      preview: (
        <vstack height="100%" width="100%" alignment="middle center">
          <text size="large">Loading ...</text>
        </vstack>
      ),
    });
    ui.showToast({ text: 'Created post!' });
    ui.navigateTo(post);
  },
});

export default Devvit;
