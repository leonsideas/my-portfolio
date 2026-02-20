---
layout: Uebermich
---

Here is the final version formatted cleanly in **Markdown**:

---


# Portfolio Workshop

**By:** Mahmoud Tamaa  
**Contact:** mtamaa@hfk-bremen.de  


## Workshop Overview

In this workshop, you will learn Git and modern web development using VitePress.  
Each participant will clone a prepared repository containing a basic portfolio structure.  
You will modify the layout (Vue components), customize it using AI tools, add your own projects, and deploy the portfolio using GitHub Pages.


## VitePress

VitePress is a fast static site generator built on Vite and Vue.js.

It takes content written in Markdown, applies a theme, and generates static HTML pages that can be deployed anywhere.

Ideal use cases include documentation, portfolios, and personal websites.

VitePress includes a default documentation theme, but this workshop uses a custom theme that can be extended. Creative coding libraries such as `p5.js` and `three.js` can also be used.


## Tailwind CSS

Tailwind CSS is a utility-first CSS framework that enables rapid styling directly in HTML or Vue components.

It provides utility classes such as `flex`, `bg-gray-100`, and `rounded-xl` to build modern and responsive layouts efficiently.

Tailwind helps ensure the portfolio is clean, consistent, and mobile-friendly.


## Before the Workshop

Please complete the following requirements:

1. **Create a GitHub Account** using your university email.
2. **Get GitHub Copilot Pro (Student Access).**
3. **Install Visual Studio Code.**
4. **Install Node.js (LTS version).**
5. **Review the example portfolio provided.**


---

## Workshop Date

**02.12.2025 — Git and GitHub Basics + Deployment with GitHub Pages**


## 1. Workshop Goals

During the workshop, you will:

- Sign in to GitHub using VS Code  
- Clone the prepared repository  
- Modify the project  
- Commit and push changes to GitHub  
- Deploy the result using GitHub Pages  


---

## 2. What is Git?

Git is a version control system that helps you:

- Track changes in your project  
- Restore older versions  
- Collaborate without overwriting others’ work  

Git functions like a time machine for your project.


### Key Git Concepts

| Term | Description |
|------|------------|
| Repository (repo) | A project folder tracked by Git |
| Clone | Create a local copy of a repository |
| Commit | A saved snapshot of changes |
| Push | Upload commits to GitHub |
| Pull | Download commits from GitHub |
| Branch | A parallel development line |
| Remote | The online version of your repository (e.g., GitHub) |


---

## 3. Git vs GitHub

| Git | GitHub |
|-----|--------|
| Runs locally and manages version history | Hosts repositories online |
| Tracks and manages changes | Enables collaboration and website deployment |


---

## 4. Sign In to GitHub from VS Code

1. Open VS Code.  
2. Click the profile icon and log into GitHub.  
3. Approve authentication in your browser.  

Configure Git:

```sh
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
````

---

## 5. Clone the Repository

### 5.1 Copy the Repository URL

Example:

```
https://github.com/username/repository.git
```

### 5.2 Clone Using Terminal

```sh
cd Documents
git clone https://github.com/Mahmoudtamaa993/my-awesome-portfolio.git
cd my-awesome-portfolio
```

### 5.3 Install Dependencies

```sh
npm install
```

### 5.4 Start the Development Server

```sh
npm run docs:dev
```

View the project locally at:

```
http://localhost:5173
```

---

## 6. Make a Change

1. Open the `works` directory.
2. Create a folder named after your project.
3. Add an `index.md` file (copy an example if needed).
4. Add a `cover.png` image.
5. Save all changes.

Check status:

```sh
git status
```

---

## 7. Commit Your Changes

### Stage Files

```sh
git add .
```

### Commit

```sh
git commit -m "Added new project"
```

---

## 8. Push Changes to GitHub

```sh
git push
```

If needed for first push:

```sh
git push -u origin main
```

---

## 9. Deploy with GitHub Pages

1. Open your repository on GitHub.
2. Go to: **Settings → Pages**
3. Under **Build and Deployment**, set:

   * Source: **Deploy from a branch**
   * Branch: **main**
   * Folder: **/**
4. Save.

GitHub will generate a public link, for example:

```
https://username.github.io/repository-name/
```

---

## Git Command Reference

```sh
git status
git log
git add .
git add filename.ext
git commit -m "Message"
git push
git pull

