import { Devvit } from '@devvit/public-api';
import type { MenuItemOnPressEvent, FormOnSubmitEvent, Context } from '@devvit/public-api';

/** Enable Reddit API access */
Devvit.configure({ redditAPI: true });

/** Menu action to create the initial ledger post (if not already created) */
Devvit.addMenuItem({
  label: 'Create Ledger Post',
  location: 'subreddit',
  onPress: async (_event: MenuItemOnPressEvent, context: Context) => {
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
      ui.showToast({ text: 'Only moderators can create a new ledger post.' });
      return;
    }
    
    // If the user is a moderator, proceed to create the post.

    const newPost = await reddit.submitPost({
      subredditName: subreddit.name,
      title: 'Ledger Post',
      text: '[]'  // initialize with an empty JSON array
    });
    await newPost.sticky(1);  // pin this post
    ui.showToast({ text: 'Ledger post created and pinned!' });
  }
});

type WalletEntry = { username: string; address: string; };
const PINNED_POST_ID = 't3_1ivxmxn';  // Use the full thing ID for the pinned ledger post

// Define an interface to let TypeScript know that our Post has a text property and an edit method.
interface EditablePost {
  text?: string | null;
  edit(options: { text: string }): Promise<void>;
}

function parseRegistrationComment(commentBody: string): WalletEntry | null {
  // Basic pattern: "Registered u/NAME with wallet 0xSOMETHING"
  const re = /^Registered u\/(\S+) with wallet (0x[a-zA-Z0-9]+)/i;
  const match = commentBody.trim().match(re);
  if (!match) return null;

  const username = match[1];
  const address = match[2];
  return { username, address };
}

// Define a type for the form configuration object.
type FormConfig = {
  title: string;
  acceptLabel: string;
  cancelLabel: string;
  fields: {
    name: string;
    type: 'string';
    label: string;
    defaultValue?: string;
    placeholder?: string;
    helpText?: string;
    readonly?: boolean;
  }[];
};

/**
 * Fetch the pinned post's JSON array + parse relevant comments to produce
 * a combined list of wallet entries.
 */
export async function fetchLedgerData(context: Context, pinnedPostId: string): Promise<WalletEntry[]> {
  // 1) Fetch pinned post text
  const pinnedPost = (await context.reddit.getPostById(pinnedPostId)) as EditablePost;
  const postContent = pinnedPost.text ?? '[]';

  let ledgerData: WalletEntry[] = [];
  try {
    ledgerData = JSON.parse(postContent);
    if (!Array.isArray(ledgerData)) {
      ledgerData = [];
    }
  } catch {
    ledgerData = [];
  }

  // 2) Fetch comments on the pinned post
  const listing = context.reddit.getComments({
    postId: pinnedPostId,
    limit: 1000,
    pageSize: 100,
    sort: 'new'
  });

  // Devvit’s Listing objects can be iterated or we can call .all()
  const comments = await listing.all();

  // 3) Parse each comment that looks like a registration
  for (const c of comments) {
    const parsed = parseRegistrationComment(c.body);
    if (parsed) {
      ledgerData.push(parsed);
    }
  }

  // 4) Remove duplicates (by address, for example). 
  //    If you also want to unify by username, do a second map or pick whichever key is important.
  const unique = new Map<string, WalletEntry>();
  for (const entry of ledgerData) {
    // This will overwrite duplicates with the latest, or you can skip duplicates if needed.
    unique.set(entry.address, entry);
  }

  return Array.from(unique.values());
}

// Create the registration form. The username field is auto-filled and read-only.
const registerForm = Devvit.createForm(
  (data: { username?: string }): FormConfig => ({
    title: 'Register Wallet',
    acceptLabel: 'Submit',
    cancelLabel: 'Cancel',
    fields: [
      {
        name: 'username',
        type: 'string',
        label: 'Reddit Username',
        defaultValue: `u/${data.username ?? ''}`,  // autofill with passed username
        helpText: 'This field is auto-filled and cannot be edited',
        readonly: true
      },
      {
        name: 'address',
        type: 'string',
        label: 'Crypto Wallet Address',
        placeholder: '0x...',
        helpText: 'Enter the wallet address to link to your Reddit account'
      }
    ]
  }),
  async (event: FormOnSubmitEvent<{ username?: string; address?: string }>, context: Context) => {
    const address = (event.values.address ?? '').trim();
    const user = await context.reddit.getCurrentUser();
    if (!user) throw new Error("Could not retrieve current user");
    const username = user.username;

    // Basic checks
    if (!address) throw new Error('Wallet address is required.');
    if (!address.startsWith('0x')) {
      context.ui.showToast({ text: 'Wallet must start with 0x...' });
      throw new Error('Wallet must start with 0x...');
    }

    // 2) Combine data from pinned post + comments
    // biome-ignore lint/style/useConst: <explanation>
        let ledgerData = await fetchLedgerData(context, PINNED_POST_ID);

    // 3) Duplicate checks
    if (ledgerData.some(e => e.address === address)) {
      throw new Error(`Wallet ${address} is already registered.`);
    }
    if (ledgerData.some(e => e.username === username)) {
      throw new Error(`Username ${username} is already registered.`);
    }

    // 4) Add new entry to the combined data
    ledgerData.push({ username, address });

    // 5) Overwrite the pinned post's text with updated JSON
    const pinnedPost = (await context.reddit.getPostById(PINNED_POST_ID)) as EditablePost;
    await pinnedPost.edit({ text: JSON.stringify(ledgerData, null, 2) });

    // 6) Also add a comment (optional) so it’s appended to the thread
    await context.reddit.submitComment({
      id: PINNED_POST_ID,
      text: `Registered u/${username} with wallet ${address}`
    });

    // 7) Confirm success
    context.ui.showToast({ text: `Registered u/${username} with wallet ${address}!` });
  }
);

// 2) Menu items etc...
Devvit.addMenuItem({
  label: 'Submit a Wallet',
  location: 'post',
  onPress: async (_event: MenuItemOnPressEvent, context: Context) => {
    const user = await context.reddit.getCurrentUser();
    if (!user) {
      context.ui.showToast({ text: 'Could not retrieve user info.' });
      return;
    }
    context.ui.showForm(registerForm, { username: user.username });
  }
});
  async (
    event: FormOnSubmitEvent<{ username?: string; address?: string }>,
    context: Context
  ) => {
    const address = (event.values.address ?? '').trim();
    const user = await context.reddit.getCurrentUser();
    if (!user) {
      throw new Error("Could not retrieve current user");
    }
    // Use user.username (make sure your user object has the property 'username')
    const username = user.username;
    if (!address) throw new Error('Wallet address is required.');
    if (!address.startsWith('0x')) {
      context.ui.showToast({ text: 'Wallet must start with 0x...' });
      throw new Error('Wallet must start with 0x...');
    }

    // 1. Update the ledger post's JSON array.
    const pinnedPost = (await context.reddit.getPostById(PINNED_POST_ID)) as EditablePost;
    const postContent = pinnedPost.text ?? '[]';
    let ledgerData: WalletEntry[] = [];
    try {
      ledgerData = JSON.parse(postContent);
      if (!Array.isArray(ledgerData)) ledgerData = [];
    } catch {
      ledgerData = [];
    }
    if (ledgerData.some(entry => entry.address === address)) {
      throw new Error(`Wallet ${address} is already registered.`);
    }
    if (ledgerData.some(entry => entry.username === username)) {
      throw new Error(`Username ${username} is already registered.`);
    }
    ledgerData.push({ username, address });
    // Overwrite the post with the updated JSON array (pretty printed so each entry is on a new line)
    await pinnedPost.edit({ text: JSON.stringify(ledgerData, null, 2) });

    // 2. Also append a new comment to the pinned post.
    await context.reddit.submitComment({
      id: PINNED_POST_ID,
      text: `Registered u/${username} with wallet ${address}`
    });

    context.ui.showToast({ text: `Registered u/${username} with wallet ${address}!` });
  
  }
;

/** Menu action to open the external BBW token transfer dApp */
Devvit.addMenuItem({
  label: 'Transfer BBW Tokens',
  location: 'post',
  onPress: async (_event: MenuItemOnPressEvent, context: Context) => {
    context.ui.navigateTo('https://dapp.badbxar.com');
  }
});

export default Devvit;
