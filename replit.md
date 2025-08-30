# Cohesion Lab Website

## Overview

This is a static website for Cohesion Lab (Laboratorul de Tehnologie Civică și Coeziune Socială), a private institution in Moldova focused on civic technology and social cohesion. The site serves as the organization's primary web presence, showcasing their mission, impact metrics, and transparency documents. Built as a performance-optimized static site without frameworks or build tools, it emphasizes accessibility, security, and transparency principles that align with the organization's civic technology mission.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Pure Static Approach**: Uses vanilla HTML, CSS, and JavaScript without any frameworks or build tools to ensure maximum performance and simplicity
- **Mobile-First Responsive Design**: CSS Grid and Flexbox for layout with mobile-first responsive breakpoints
- **Component-Based Structure**: Consistent navigation, header, and footer components across pages despite being static HTML
- **Progressive Enhancement**: Core functionality works without JavaScript, with enhancement layers for dynamic features

### Page Structure
- **Multi-page Architecture**: Separate HTML files for main sections (index, impact, transparency) rather than single-page application
- **Semantic HTML**: Uses proper semantic elements (header, nav, main, section, article) for accessibility and SEO
- **ARIA Implementation**: Comprehensive accessibility attributes including aria-labels, role attributes, and navigation landmarks

### Data Management
- **JSON-based Metrics**: Impact data stored in `/data/metrics.json` for easy updates without code changes
- **Client-side Data Loading**: JavaScript fetches and displays metrics data dynamically on the impact page
- **File-based Transparency**: Public documents stored in `/public/` directory with automatic listing

### Performance Optimization
- **Critical Resource Preloading**: CSS preloaded for faster first paint
- **Optimized Asset Structure**: SVG logos and icons for scalability and small file sizes
- **Minimal External Dependencies**: No external libraries or CDN dependencies to ensure fast loading and CSP compliance

### Security Implementation
- **Content Security Policy**: Strict CSP headers to prevent XSS attacks
- **Security Headers**: HSTS, X-Frame-Options, and other security headers via `_headers` file
- **Security Contact**: RFC 9116 compliant `security.txt` file for vulnerability reporting
- **Input Sanitization**: Client-side data handling includes basic sanitization for dynamic content

### SEO and Discoverability
- **Comprehensive Meta Tags**: Open Graph, Twitter Cards, and structured data markup
- **XML Sitemap**: Automated sitemap generation for search engines
- **Robots.txt**: Properly configured crawling permissions and restrictions
- **Canonical URLs**: Prevents duplicate content issues

## External Dependencies

### Hosting and Infrastructure
- **Cloudflare Pages**: Static site hosting with edge caching and SSL termination
- **Custom Domain Setup**: Primary domain (cohesionlab.org) with redirect from technical domain (cohesionlab.tech)
- **DNS Management**: Cloudflare DNS for domain routing and subdomain management

### Development Tools
- **Python HTTP Server**: Local development server for testing (python -m http.server)
- **W3C Validators**: HTML and CSS validation for standards compliance
- **Lighthouse Auditing**: Performance and accessibility testing with target scores (≥90 Performance, ≥95 Accessibility)

### Security Services
- **PGP Key Management**: External PGP key hosting for secure communications
- **Email Security**: Dedicated security contact email (security@cohesionlab.org)
- **Vulnerability Reporting**: Coordinated disclosure process for security issues

### Analytics and Monitoring
- **Performance Monitoring**: Lighthouse CI for continuous performance tracking
- **Accessibility Testing**: Automated accessibility compliance checking
- **Browser Compatibility**: Cross-browser testing without external testing services

### Content Delivery
- **Asset Optimization**: SVG graphics for logos and icons to ensure scalability
- **Font Stack**: System fonts only to avoid external font loading
- **Image Handling**: Optimized image delivery through Cloudflare's image optimization

The architecture prioritizes transparency, performance, and accessibility while maintaining the organization's commitment to open-source principles and civic technology best practices.