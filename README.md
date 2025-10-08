# Khavho Groups - Business Conglomerate Website

A comprehensive business website with admin panel for managing products, orders, users, and content.

## 🌟 Features

### Main Website (`index.html`)
- **Multi-page Business Site**: Home, About, Services, Contact
- **Responsive Design**: Works on all devices
- **Firebase Integration**: Real-time data and authentication
- **Contact Forms**: Direct integration with admin panel
- **Product Displays**: Real-time stock and pricing

### Admin Panel (`admin-panel.html`)
- **Dashboard**: Business metrics and analytics
- **User Management**: Create, edit, delete users
- **Product Inventory**: Stock management with alerts
- **Order Tracking**: Complete order lifecycle management
- **Contact Messages**: View and manage customer inquiries
- **Analytics**: Charts and performance metrics
- **Settings**: Site configuration and preferences

## 🚀 Live Demo

- **Main Website**: [View Live Site](https://yourusername.github.io/repository-name/)
- **Admin Panel**: [Admin Dashboard](https://yourusername.github.io/repository-name/admin-panel.html)

## 🔧 Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/repository-name.git
   ```

2. **Configure Firebase**
   - Update Firebase configuration in both `index.html` and `admin-panel.html`
   - Set up Firestore collections: `users`, `products`, `orders`, `contacts`, `settings`

3. **Enable GitHub Pages**
   - Go to repository Settings → Pages
   - Select source: Deploy from a branch
   - Choose `main` branch

## 📁 File Structure

```
├── index.html                 # Main website homepage
├── admin-panel.html          # Admin management panel
├── contact-integration.js    # Contact form handler
├── khavho-capital.html       # Capital division page
├── khavho-holdings.html      # Holdings division page
├── khavho-inter-africa.html  # Inter Africa division page
├── images/                   # Image assets
│   ├── logo.png
│   └── README.txt
└── README.md                 # This file
```

## 🛡️ Admin Access

- Create an admin user in Firebase with `role: "admin"`
- Login through the main website
- Click "Admin Panel" button when logged in as admin

## 🎨 Brand Colors

- **Primary Navy**: #1a365d
- **Secondary Orange**: #F37021
- **Accent Gold**: #d4af37

## 📱 Responsive Breakpoints

- Desktop: 1200px+
- Tablet: 768px - 1199px
- Mobile: 320px - 767px

## 🔥 Firebase Collections

### Users Collection
```javascript
{
  name: "string",
  email: "string",
  role: "admin" | "user",
  createdAt: timestamp
}
```

### Products Collection
```javascript
{
  name: "string",
  category: "string",
  description: "string",
  price: number,
  stock: number,
  lowStockAlert: number,
  status: "active" | "inactive" | "discontinued",
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Orders Collection
```javascript
{
  customerEmail: "string",
  product: "string",
  amount: number,
  status: "pending" | "completed" | "cancelled",
  notes: "string",
  createdAt: timestamp
}
```

### Contacts Collection
```javascript
{
  name: "string",
  email: "string",
  subject: "string",
  message: "string",
  phone: "string",
  company: "string",
  createdAt: timestamp,
  status: "new" | "replied"
}
```

## 🛠️ Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Charts**: Chart.js
- **Icons**: Lucide Icons
- **Hosting**: GitHub Pages

## 📈 Features Overview

### Admin Panel Capabilities
- ✅ Real-time dashboard metrics
- ✅ User management with roles
- ✅ Product inventory tracking
- ✅ Order management system
- ✅ Contact message handling
- ✅ Analytics with charts
- ✅ Settings configuration
- ✅ Auto-sync to website

### Website Features
- ✅ Multi-page navigation
- ✅ Contact form integration
- ✅ Real-time product displays
- ✅ User authentication
- ✅ Responsive design
- ✅ Admin access control

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For support or questions, contact: info@khavhogroups.com