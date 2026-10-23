# SmartSpend — Expense Tracker

A responsive expense-tracking website built with HTML, CSS, and vanilla JavaScript for the JBN Innotech Generative AI Website UI Challenge.

## Features
- Expense summary and monthly budget remaining
- Add expenses with name, amount, category, date, and optional note
- Remove a transaction after confirmation
- Search transactions and filter by category
- Spending breakdown by category using a CSS conic-gradient chart
- Update the monthly budget and view budget usage
- Browser localStorage persistence
- Responsive layout with mobile navigation
- Input validation and confirmation messages

## Run locally
1. Download and extract the project ZIP.
2. Open the folder in VS Code.
3. Open `index.html` in a browser, or use VS Code Live Server.
4. Internet is only used for optional Google Fonts. The website itself does not need a backend.

## Files
- `index.html` — semantic page structure
- `style.css` — visual design and responsive layout
- `script.js` — expense logic, filtering, chart, validation, and localStorage
- `PROJECT_DESCRIPTION.txt` — short project report
- `AI_PROMPTS.md` — prompts to document AI-assisted development
- `TESTING_CHECKLIST.md` — suggested manual tests

## Important limitations
This is a front-end demonstration, not a banking app. Data is stored only in the current browser/device. Clearing browser site data may erase it. No login, bank connection, or server backup is provided. Sample transactions appear on first launch; deleting them and refreshing will not restore them once browser storage has been initialized.

## Customize before submission
- Change the sample transaction names or default budget.
- Adjust the theme or add a small feature of your own.
- Test at desktop and mobile widths.
- Capture at least three screenshots after testing.
- Be ready to explain the HTML, CSS, JavaScript, and AI prompts.
