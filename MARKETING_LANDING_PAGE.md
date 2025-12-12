# 🎨 Marketing Landing Page

A beautiful marketing website similar to Typesense, showcasing Retail Brain's features and capabilities.

## 🚀 What Was Created

### 1. Marketing Landing Page (`/marketing`)
- **Hero Section**: Eye-catching gradient background with tagline
- **Features Showcase**: 9 key features with icons
- **How It Works**: 3-step process explanation
- **Call-to-Action**: Sign up/Sign in buttons
- **Footer**: Links and company information

### 2. Login/Signup Page (`/login`)
- **Sign In**: Existing users can log in
- **Sign Up**: New users can create accounts
- **Demo Mode**: Works with any email/password (for demo purposes)
- **Auto-redirect**: Redirects to dashboard after login

### 3. Authentication Flow
- **Protected Routes**: Dashboard pages require authentication
- **Auto-redirect**: Unauthenticated users redirected to marketing page
- **Token Storage**: Uses localStorage for demo (replace with proper auth in production)

## 📍 Routes

| Route | Description | Auth Required |
|-------|-------------|---------------|
| `/marketing` | Marketing landing page | No |
| `/login` | Login/Signup page | No |
| `/` | Dashboard (home) | Yes |
| `/customers` | Customer list | Yes |
| `/analytics` | Analytics dashboard | Yes |
| All other routes | Dashboard pages | Yes |

## 🎨 Design Features

### Marketing Page
- ✅ Clean, modern design inspired by Typesense
- ✅ Gradient hero section (lime green to emerald)
- ✅ Feature cards with icons
- ✅ Responsive layout
- ✅ Professional footer

### Login Page
- ✅ Clean, centered design
- ✅ Toggle between Sign In / Sign Up
- ✅ Form validation
- ✅ Error handling
- ✅ Demo mode indicator

## 🔐 Authentication (Demo Mode)

Currently uses localStorage for demo purposes:

```javascript
// Login creates a token
localStorage.setItem('rb_auth_token', token);
localStorage.setItem('rb_user_email', email);

// Check authentication
const token = localStorage.getItem('rb_auth_token');
```

**For Production**: Replace with proper authentication service (JWT, OAuth, etc.)

## 🚀 How to Use

### 1. Visit Marketing Page
```
http://localhost:3100/marketing
```

### 2. Click "Get Started" or "Sign In"
- Takes you to `/login`
- Toggle between Sign In / Sign Up

### 3. Enter Any Credentials (Demo Mode)
- Email: `demo@example.com`
- Password: `password123`
- Click "Sign in" or "Create account"

### 4. Redirected to Dashboard
- After login, automatically redirected to `/`
- Full dashboard access with sidebar and header

## 🎯 Features Showcased

1. **Identity Resolution** - Merge duplicate customer records
2. **Customer 360** - Unified customer profile
3. **AI Assistant** - Natural language queries
4. **Real-time Analytics** - Live dashboards
5. **Intent Detection** - Understand customer intent
6. **A/B Testing** - Test strategies
7. **Smart Search** - Find customers instantly
8. **Website Integration** - JavaScript SDK
9. **ML Predictions** - Predictive analytics

## 🔄 User Flow

```
1. User visits /marketing
   ↓
2. Clicks "Get Started" or "Sign In"
   ↓
3. Lands on /login
   ↓
4. Enters credentials (any email/password in demo)
   ↓
5. Token stored in localStorage
   ↓
6. Redirected to / (dashboard)
   ↓
7. Full access to all dashboard features
```

## 🛠️ Customization

### Update Marketing Content
Edit `apps/dashboard/app/marketing/page.tsx`:
- Change hero text
- Update features
- Modify colors/styling
- Add more sections

### Update Login Page
Edit `apps/dashboard/app/login/page.tsx`:
- Change form fields
- Update validation
- Modify styling
- Add OAuth providers

### Add Real Authentication
1. Create auth service
2. Update `LayoutWrapper.tsx` to use real auth
3. Replace localStorage with secure tokens
4. Add API endpoints for login/signup

## 📱 Responsive Design

- ✅ Mobile-friendly
- ✅ Tablet optimized
- ✅ Desktop layout
- ✅ Touch-friendly buttons

## 🎨 Color Scheme

- **Primary**: Gray-900 (dark)
- **Accent**: Blue-600
- **Hero**: Lime-400 to Emerald-500 gradient
- **Background**: White / Gray-50
- **Text**: Gray-900 / Gray-600

## 🚀 Next Steps

1. **Add Real Authentication**
   - JWT tokens
   - OAuth providers (Google, GitHub)
   - Password reset flow

2. **Add More Sections**
   - Testimonials
   - Pricing table
   - Case studies
   - Video demos

3. **SEO Optimization**
   - Meta tags
   - Open Graph
   - Structured data

4. **Analytics**
   - Track page views
   - Conversion tracking
   - User behavior

## 📝 Notes

- Currently uses demo authentication (localStorage)
- Replace with proper auth service for production
- All dashboard routes are protected
- Marketing and login pages are public

---

**Ready to showcase Retail Brain!** 🎉

Visit `http://localhost:3100/marketing` to see the landing page.

