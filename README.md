# ScaleUp Admin HeroUI

A modern CRM application built with Next.js and HeroUI. This admin panel allows multiple users to manage their business and daily transactions with an intuitive, responsive interface.

## Features

- 🚀 **Modern Tech Stack**: Built with Next.js and HeroUI for a fast, responsive experience
- 📱 **Responsive Design**: Fully responsive across all devices
- 🎨 **Beautiful UI**: Clean, modern design with a customizable theme
- 🔒 **Authentication**: User registration, login, password reset, and email verification
- 📊 **Dashboard**: Visualize key metrics and recent activities
- 👥 **User Management**: Easily manage users with search and filtering
- 🔄 **API Integration**: Seamless integration with ScaleUp API

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone https://github.com/dennesabing/scaleup-admin-heroui.git
cd scaleup-admin-heroui
```

2. Install dependencies:

```bash
npm install
# or
yarn
```

3. Create a `.env.local` file in the root directory with the following variables:

```
NEXT_PUBLIC_API_URL=your_api_url_here
```

### Running the Development Server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

### Building for Production

```bash
npm run build
# or
yarn build
```

Then start the production server:

```bash
npm run start
# or
yarn start
```

## Project Structure

```
scaleup-admin-heroui/
├── components/        # Reusable components
├── layouts/           # Page layouts
├── pages/             # Next.js pages
│   ├── admin/         # Admin-specific pages
│   ├── auth/          # Authentication pages
│   └── api/           # API routes
├── public/            # Static assets
├── styles/            # Global styles
├── types/             # TypeScript type definitions
└── scripts/           # Utility scripts
```

## Authentication

The app includes pages for:
- Registration
- Login
- Forgot password
- Email verification

Authentication is handled through the ScaleUp API.

## Release Process

The project uses semantic versioning and provides scripts to automate the release process.

### Using the Release Scripts

#### For Unix/Linux/Mac Users:

```bash
# Using npm
npm run release 0.2.0

# Or directly using Node.js
node scripts/release.js 0.2.0

# Or using bash script
bash scripts/release.sh 0.2.0
```

#### For Windows Users:

```powershell
# Using npm
npm run release:win 0.2.0

# Or directly using PowerShell
.\scripts\release.ps1 0.2.0
```

### What the Release Script Does

1. Creates a release branch (e.g., `release/v0.2.0`) from your current branch
2. Updates the version in `package.json`
3. Checks/updates the `CHANGELOG.md` if necessary
4. Commits these changes
5. Creates a version tag (e.g., `v0.2.0`)
6. Merges the release branch to master
7. Provides instructions for pushing to remote and creating a GitHub release

### Manual Release Process

If you prefer to release manually, follow these steps:

1. Create a release branch: `git checkout -b release/v0.2.0`
2. Update version in package.json: `npm version 0.2.0 --no-git-tag-version`
3. Ensure CHANGELOG.md is updated
4. Commit changes: `git commit -am "chore: prepare release v0.2.0"`
5. Tag the release: `git tag -a v0.2.0 -m "Release v0.2.0"`
6. Merge to master: `git checkout master && git merge --no-ff release/v0.2.0`
7. Push changes: `git push origin master && git push origin v0.2.0`

## Versioning

This project uses [Semantic Versioning](https://semver.org/). To update the version:

1. Update the CHANGELOG.md file with your changes
2. Run the version update script:

```bash
npm run update-version
```

This will automatically extract the latest version from the CHANGELOG.md file and update it in package.json.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
