# Bob's Personal Website

A minimalist personal website with an interactive autumn sunset gradient and contact form.

## 🎨 Features

- **Interactive Landing Page**: Your name displayed with a smooth, mouse-reactive autumn gradient
- **Contact Form**: Simple form for visitors to reach out (280 character limit)
- **Minimalist Design**: Clean, elegant, and professional
- **No Build Tools**: Pure HTML/CSS/JavaScript for simplicity

---

## 📋 Complete Setup Guide

Follow these steps in order. Don't skip any!

### Step 1: Set Up Formspree (Contact Form Backend)

Formspree will handle your contact form submissions and email them to you.

1. **Go to Formspree**: Visit https://formspree.io/
2. **Sign Up**: Click "Get Started" and create a free account with your email
3. **Create a New Form**:
   - After signing up, click "+ New Form"
   - Give it a name like "Bob Portfolio Contact"
   - Enter your email address (where you want to receive messages)
   - Click "Create Form"
4. **Copy Your Form ID**:
   - You'll see a form endpoint that looks like: `https://formspree.io/f/xyzabc123`
   - Copy the part after `/f/` (example: `xyzabc123`)
5. **Update contact.html**:
   - Open `contact.html` in a text editor
   - Find the line that says: `action="https://formspree.io/f/YOUR_FORM_ID"`
   - Replace `YOUR_FORM_ID` with your actual form ID
   - Save the file

**Example:**
```html
<!-- Before -->
<form action="https://formspree.io/f/YOUR_FORM_ID" method="POST">

<!-- After (using example ID) -->
<form action="https://formspree.io/f/xyzabc123" method="POST">
```

---

### Step 2: Set Up GitHub

GitHub will store your code and connect to Cloudflare for deployment.

#### 2A: Create a GitHub Account (if you don't have one)

1. Go to https://github.com
2. Click "Sign up"
3. Follow the steps to create your account
4. Verify your email address

#### 2B: Install Git on Your Computer

**For Mac:**
1. Open Terminal (search for "Terminal" in Spotlight)
2. Type: `git --version` and press Enter
3. If Git isn't installed, it will prompt you to install it - follow the prompts

**For Windows:**
1. Download Git from: https://git-scm.com/download/win
2. Run the installer
3. Use default settings (just keep clicking "Next")
4. After installation, search for "Git Bash" and open it

**For Linux:**
```bash
sudo apt-get update
sudo apt-get install git
```

#### 2C: Configure Git

Open Terminal (Mac/Linux) or Git Bash (Windows) and run these commands (replace with your info):

```bash
git config --global user.name "Your Name"
git config --global user.email "youremail@example.com"
```

#### 2D: Create Your Repository

1. **On GitHub.com**:
   - Log in to GitHub
   - Click the "+" icon in the top right
   - Select "New repository"
   - Repository name: `bob-portfolio` (or whatever you like)
   - Description: "My personal website"
   - Keep it **Public** (required for free Cloudflare Pages)
   - **Do NOT** check "Initialize with README"
   - Click "Create repository"

2. **On Your Computer**:
   - Open Terminal/Git Bash
   - Navigate to where you want to store your website files:
     ```bash
     cd Desktop  # or wherever you want
     ```
   - Create a folder and move into it:
     ```bash
     mkdir bob-portfolio
     cd bob-portfolio
     ```
   - Copy all your website files (index.html, contact.html, styles.css, script.js) into this folder

3. **Initialize and Push to GitHub**:
   
   Run these commands one by one in Terminal/Git Bash (replace `yourusername` with your actual GitHub username):
   
   ```bash
   # Initialize Git in this folder
   git init
   
   # Add all files
   git add .
   
   # Create your first commit
   git commit -m "Initial commit - Bob's portfolio"
   
   # Connect to your GitHub repository
   git remote add origin https://github.com/yourusername/bob-portfolio.git
   
   # Push your code to GitHub
   git branch -M main
   git push -u origin main
   ```

4. **Enter GitHub Credentials**:
   - When prompted, enter your GitHub username
   - For password, you need a **Personal Access Token** (not your regular password):
     - Go to: https://github.com/settings/tokens
     - Click "Generate new token" → "Generate new token (classic)"
     - Give it a note like "Portfolio deployment"
     - Check "repo" scope
     - Click "Generate token"
     - **Copy the token immediately** (you won't see it again!)
     - Use this token as your password

5. **Verify**:
   - Go to your repository on GitHub: `https://github.com/yourusername/bob-portfolio`
   - You should see all your files there!

---

### Step 3: Deploy to Cloudflare Pages

Cloudflare Pages will host your website for free.

1. **Create Cloudflare Account**:
   - Go to https://pages.cloudflare.com/
   - Click "Sign up"
   - Create a free account

2. **Connect GitHub**:
   - After logging in, click "Create a project"
   - Click "Connect to Git"
   - Click "GitHub"
   - Authorize Cloudflare to access your repositories
   - Select your `bob-portfolio` repository

3. **Configure Deployment**:
   - Project name: `bob-portfolio` (this will be in your URL)
   - Production branch: `main`
   - Build settings:
     - Framework preset: **None**
     - Build command: (leave empty)
     - Build output directory: `/`
   - Click "Save and Deploy"

4. **Wait for Deployment**:
   - Cloudflare will deploy your site (takes 1-2 minutes)
   - When it's done, you'll see a URL like: `bob-portfolio.pages.dev`
   - Click the URL to view your live website!

---

### Step 4: Connect Your Custom Domain (When You Buy One)

When you're ready to use your own domain:

1. **Buy a Domain**:
   - Recommended registrars:
     - **Namecheap**: https://www.namecheap.com (popular, good prices)
     - **Cloudflare Registrar**: https://www.cloudflare.com/products/registrar/ (at-cost pricing)
     - **Google Domains**: https://domains.google/ (now Squarespace)
   - Search for available domains (example: `bob.com`, `bob.dev`, `bobsmith.com`)
   - Purchase the domain you want

2. **Transfer to Cloudflare** (Recommended):
   - In Cloudflare dashboard, go to "Websites"
   - Click "Add a site"
   - Enter your domain
   - Follow the instructions to change nameservers at your registrar
   - Wait 24-48 hours for nameserver propagation

3. **Add Custom Domain to Pages**:
   - In Cloudflare Pages, go to your project
   - Click "Custom domains"
   - Click "Set up a custom domain"
   - Enter your domain (example: `bob.com`)
   - Click "Continue"
   - Cloudflare will automatically configure DNS
   - Your site will be live on your domain in 5-10 minutes!

4. **Set Up www Subdomain** (Optional):
   - In "Custom domains", click "Set up a custom domain" again
   - Enter `www.yourdomain.com`
   - This ensures both `bob.com` and `www.bob.com` work

---

## 🔄 Updating Your Website

Whenever you want to make changes:

1. **Edit Your Files**:
   - Make changes to your HTML/CSS/JS files locally

2. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Description of what you changed"
   git push
   ```

3. **Automatic Deployment**:
   - Cloudflare automatically detects the changes
   - Your site will be updated in 1-2 minutes!

---

## 🎨 Customization Ideas

Want to make it more personal? Here are some ideas:

### Change Colors
Edit the `:root` section in `styles.css`:
```css
:root {
    --deep-red: #8B2E1F;      /* Try different autumn colors */
    --burnt-orange: #D4662A;
    --warm-yellow: #E8A65D;
    --forest-green: #3A5A40;
    --dark-olive: #2D3A2E;
}
```

### Change Fonts
Replace the Google Fonts link in the `<head>` of both HTML files:
- Browse fonts at: https://fonts.google.com
- Copy the `<link>` code
- Update the `font-family` in CSS

### Add More Pages
1. Create a new HTML file (example: `about.html`)
2. Copy the structure from `contact.html`
3. Add links to it from your other pages
4. Push to GitHub - it will auto-deploy!

---

## 🆘 Troubleshooting

### Form Doesn't Send Emails
- Double-check your Formspree Form ID in `contact.html`
- Make sure you verified your email with Formspree
- Check your spam folder

### Git Push Fails
- Make sure you're in the correct folder: `cd bob-portfolio`
- Verify remote is set: `git remote -v`
- Try: `git pull origin main` then `git push origin main`

### Cloudflare Not Updating
- Check deployment status in Cloudflare Pages dashboard
- Make sure Git push was successful
- Clear your browser cache (Ctrl/Cmd + Shift + R)

### Website Looks Different Locally vs. Online
- Make sure ALL files are committed and pushed
- Check browser console for errors (F12 → Console tab)
- Verify file paths are relative (not absolute)

---

## 📞 Need Help?

If you get stuck:
1. Check the error message carefully
2. Google the error message
3. Ask in web development communities:
   - https://stackoverflow.com
   - https://www.reddit.com/r/webdev
4. Ask me for help - I'm here to coach you!

---

## ✅ Checklist

Use this to track your progress:

- [ ] Set up Formspree account
- [ ] Update contact.html with Formspree Form ID
- [ ] Create GitHub account
- [ ] Install Git
- [ ] Configure Git with your name and email
- [ ] Create GitHub repository
- [ ] Push code to GitHub
- [ ] Create Cloudflare account
- [ ] Connect GitHub to Cloudflare
- [ ] Deploy site to Cloudflare Pages
- [ ] Test the live website
- [ ] Buy domain (when ready)
- [ ] Connect custom domain to Cloudflare Pages

---

**You've got this! Take it step by step, and you'll have your site live in no time. 🚀**
