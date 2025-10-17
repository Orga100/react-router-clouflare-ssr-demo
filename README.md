# React SSR Demo - Cloudflare Workers + Hono

> Production-ready full-stack application showcasing modern web development on Cloudflare's edge network

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/cloudflare/templates/tree/main/react-router-hono-fullstack-template)

## 🎯 Overview

A professional demonstration of modern full-stack development with **server-side rendering at the edge**. Built with React Router 7, Hono, and Cloudflare Workers, this application showcases real-world patterns for building fast, scalable web applications.

### ✨ Features

- 📝 **Todo List** - Full CRUD with KV persistence, optimistic updates, undo functionality, and real-time feedback
- 🌤️ **Weather Dashboard** - 7-day forecast with sunrise/sunset, UV index, and temperature trends
- 🎨 **Modern UI** - Radix UI components with dark mode and responsive design
- 📱 **Mobile Optimized** - Touch-friendly interface with responsive breakpoints
- 🚀 **Edge Computing** - Sub-50ms response times globally via Cloudflare Workers
- 📊 **API Documentation** - OpenAPI/Swagger spec with interactive documentation

## ✨ Key Technologies

### Infrastructure
- **Cloudflare Workers** - Edge computing platform
- **Cloudflare KV** - Distributed key-value database
- **Server-Side Rendering (SSR)** - Fast initial page loads

### Frontend
- **React 19** - Latest React with concurrent features
- **React Router v7** (Remix) - File-based routing with SSR support
- **Radix UI** - Accessible, unstyled component primitives
- **Radix Themes** - Beautiful, themeable design system
- **CSS Modules** - Scoped styling without CSS-in-JS overhead

### Backend & API
- **Hono** - Lightweight web framework for Cloudflare Workers
- **REST API** - RESTful endpoints with proper HTTP methods
- **React Router Actions** - Type-safe form handling and mutations
- **Async Toast Notifications** - Non-blocking user feedback
- **KV Import/Export Scripts** - Database management utilities

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Cloudflare account (for deployment)
- Wrangler CLI (installed automatically with dependencies)

### Installation

```bash
# Install dependencies
npm install

# Configure the project
# Copy wrangler.jsonc.example to wrangler.jsonc and update:
# - account_id: Your Cloudflare account ID
# - kv_namespaces.id: Your KV namespace ID
# - kv_namespaces.preview_id: Your preview KV namespace ID
cp wrangler.jsonc.example wrangler.jsonc

# Generate TypeScript types for Cloudflare Workers
npm run cf-typegen

# Start development server
npm run dev
```

The application will be available at `http://localhost:3000`

> **Note**: You need to configure `wrangler.jsonc` with your Cloudflare account details before deployment. See [Configuration](#️-configuration) section below.

### Development Commands

```bash
# Development with hot reload
npm run dev

# View API documentation (Swagger UI)
npm run api

# Preview with Wrangler (local KV)
npm run preview_wrangler_local_preview_kv

# Preview with Wrangler (remote KV)
npm run preview_wrangler_remote_preview_kv

# Type checking
npm run typecheck

# Build for production
npm run build

# Deploy to Cloudflare
npm run deploy

# View production logs
npm run logs
```

### Database Management

```bash
# Import todos to KV database
npm run import_kv

# Export todos from KV database
npm run export_kv
```

### API Documentation

```bash
# Start Swagger UI server
npm run api

# Then open http://localhost:8080
# Documentation available at: docs/swagger.yaml
```

## 📁 Project Structure

```
├── app/                 # React application
│   ├── routes/          # Page routes
│   ├── components/      # Reusable UI components
│   └── context/         # State management
├── workers/             # Cloudflare Worker + API
├── scripts/             # Utility scripts
├── docs/                # Documentation
└── public/              # Static assets
```

## 🏗️ Architecture Highlights

### Edge-First Design
- **Server-Side Rendering** at Cloudflare's 300+ edge locations
- **Sub-50ms response times** globally
- **No cold starts** - instant scaling
- **Distributed database** with Cloudflare KV

### Modern React Patterns
- Optimistic UI updates for instant feedback
- Toast notifications for user actions
- Type-safe form handling
- Graceful error boundaries

### API & Performance
- REST API with OpenAPI documentation
- Minimal bundle size with CSS optimization
- Route-based code splitting
- Efficient database operations
- Mobile-responsive design

## 🛠️ Configuration

### Initial Setup

1. **Copy configuration file**:
   ```bash
   cp wrangler.jsonc.example wrangler.jsonc
   ```

2. **Update `wrangler.jsonc`** with your Cloudflare details:
   - `account_id`: Your Cloudflare account ID
   - `kv_namespaces.id`: Your production KV namespace ID
   - `kv_namespaces.preview_id`: Your preview KV namespace ID

3. **Create KV namespaces** (if not already created):
   ```bash
   # Create production KV namespace
   wrangler kv:namespace create "TODOS_KV"
   
   # Create preview KV namespace
   wrangler kv:namespace create "TODOS_KV" --preview
   ```

### Environment Variables (Optional)

Create a `.dev.vars` file for local development secrets:

```env
VALUE_FROM_CLOUDFLARE=your_value_here
```

## 🎨 Design Philosophy

- **CSS Modules** - Scoped styling for maintainability
- **Radix UI** - Accessible component primitives
- **Dark mode** - Built-in theme support
- **Mobile-first** - Touch-optimized responsive design
- **TypeScript** - End-to-end type safety
- **Semantic HTML** - Accessible markup

## 📊 API Documentation

The application includes a REST API for todo management. Complete API documentation is available:

- **OpenAPI Spec**: `docs/swagger.yaml`
- **Interactive UI**: Run `npm run api` and visit http://localhost:8080

## 🧪 Testing

### Mobile Testing
Access the app from your mobile device:
1. Find your local IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
2. Visit `http://192.168.x.x:3000` from your mobile browser

## 📈 What's Included

✅ **Server-Side Rendering** - Fast initial page loads  
✅ **Edge Computing** - Global distribution via Cloudflare  
✅ **Database Persistence** - Cloudflare KV integration  
✅ **API Documentation** - OpenAPI/Swagger specification  
✅ **Mobile Responsive** - Touch-friendly UI  
✅ **Dark Mode** - Theme support  
✅ **Toast Notifications** - User feedback system  
✅ **Optimistic Updates** - Instant UI feedback  
✅ **Error Handling** - Graceful error boundaries  
✅ **Type Safety** - Full TypeScript coverage  
✅ **CSS Optimization** - Purged production builds  
✅ **Accessibility** - ARIA labels and semantic HTML

## 📚 Documentation

- **[API Documentation](docs/swagger.yaml)** - OpenAPI 3.0 specification
- **[Project Specification](docs/specification.md)** - Detailed project overview
- **[Documentation Index](docs/README.md)** - All documentation

## 🔗 Resources

### Official Documentation
- [Cloudflare Workers](https://developers.cloudflare.com/workers/) - Edge computing platform
- [React Router v7](https://reactrouter.com/) - Full-stack React framework
- [Hono](https://hono.dev/) - Lightweight web framework
- [Radix UI](https://www.radix-ui.com/) - Accessible component primitives
- [Radix Themes](https://www.radix-ui.com/themes) - Design system
- [Cloudflare KV](https://developers.cloudflare.com/kv/) - Key-value storage

### External APIs
- [Open-Meteo](https://open-meteo.com/) - Weather forecast API

## 🤝 Contributing

This is a demo application showcasing best practices. Feel free to:
- Use it as a reference for your projects
- Fork and modify for your needs
- Report issues or suggest improvements
- Share feedback on architecture decisions

## 📄 License

MIT License - feel free to use this project as a starting point for your own applications.

---

**Built with** ❤️ **using React Router 7, Hono, and Cloudflare Workers**

*This demo showcases modern web development patterns including SSR, edge computing, and distributed databases. Perfect for learning or as a production-ready template.*
