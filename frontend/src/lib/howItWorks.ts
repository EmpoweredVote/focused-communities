// The four steps the landing page names and its illustration plays, in order.
// Interface copy only: it describes features the product has today.

export interface HowItWorksStep {
  title: string
  body: string
}

export const HOW_IT_WORKS_STEPS: HowItWorksStep[] = [
  {
    title: 'Pick an issue',
    body: 'Search or browse the communities. Each one is a single issue from the Empowered Compass.',
  },
  {
    title: 'See the views',
    body: "Read this season's question and the positions people hold on it: a spectrum of outcomes, not a scale from agree to disagree.",
  },
  {
    title: 'Map the argument',
    body: 'Add reasons for and against, and rate how much weight each one deserves. The points readers weigh most rise to the top.',
  },
  {
    title: 'Talk it through',
    body: 'Start a thread or reply. Edits stay in a visible history, so the record stays honest.',
  },
]
