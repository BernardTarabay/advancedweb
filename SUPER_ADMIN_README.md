# Super Admin Setup & User Management

## What Was Fixed

Your super admin functionality was broken for several reasons:
1. **No super admin existed in the database** - The code supported it but you never created one
2. **The admin login redirected to a non-existent route** (`/admin-dashboard` didn't exist)
3. **The user form didn't allow creating admins** - It only had customer/manager/admin options, no way to actually grant admin role
4. **Role permissions were inconsistent** - Routes didn't properly differentiate between admin and super admin

## What's New

### 1. Super Admin Creation Script
**Location:** `/scripts/createSuperAdmin.js`

Run this once to create your super admin account:
```bash
node scripts/createSuperAdmin.js
```

**Default Credentials:**
- Email: `superadmin@example.com`
- Password: `SuperAdmin123!`

**⚠️ CHANGE THE PASSWORD IMMEDIATELY AFTER FIRST LOGIN**

### 2. Admin Dashboard
**Route:** `/admin-dashboard`

The dashboard now provides:
- Overview statistics (total users, admins, managers, customers, super admins)
- Complete user list with roles
- **Super Admin Only:** Ability to change user roles inline (grant/revoke admin permissions)

### 3. Role Hierarchy

```
Super Admin (you)
    ↓
  Admin (can manage users but cannot create other admins)
    ↓
 Manager (regular elevated user)
    ↓
Customer (default user)
```

### 4. New Routes

**Admin Routes** (`/routes/admin.routes.js`):
- `GET /admin-dashboard` - View all users and stats (admin + super admin)
- `POST /admin/grant-role` - Change user roles (super admin only)

## How To Use

### Login as Super Admin

1. Go to `/auth/login`
2. Use the "Login as Admin" form (bottom form)
3. Enter super admin credentials
4. You'll be redirected to `/admin-dashboard`

### Grant Admin Permissions

**As Super Admin:**
1. Navigate to `/admin-dashboard`
2. Find the user you want to promote
3. Change their role from the dropdown (Customer → Manager → Admin)
4. Click "Update"

**As Regular Admin:**
- You can view the dashboard but cannot change roles
- You can create/edit users but only assign Customer or Manager roles
- You cannot create or promote users to Admin

### Create New Users

**Option 1: Through User Management** (Admin/Super Admin only)
- Navigate to `/users`
- Click "Create New User"
- If you're super admin, you can select Admin role
- If you're regular admin, you can only select Customer or Manager

**Option 2: Through Admin Dashboard** (Super Admin only)
- This is better for just changing roles of existing users
- Find user → select new role → click Update

## Role Permissions

| Action | Customer | Manager | Admin | Super Admin |
|--------|----------|---------|-------|-------------|
| View products | ✓ | ✓ | ✓ | ✓ |
| Manage products | ✗ | ✓ | ✓ | ✓ |
| View users | ✗ | ✗ | ✓ | ✓ |
| Create users (Customer/Manager) | ✗ | ✗ | ✓ | ✓ |
| Create Admins | ✗ | ✗ | ✗ | ✓ |
| Change user roles | ✗ | ✗ | ✗ | ✓ |
| Access admin dashboard | ✗ | ✗ | ✓ | ✓ |
| Grant admin permissions | ✗ | ✗ | ✗ | ✓ |

## Security Notes

1. **Super admin cannot be created through the UI** - Only through the script or direct database access
2. **Super admin cannot demote themselves** - Protected in the UI
3. **Regular admins cannot create other admins** - They can only create Customer/Manager roles
4. **Only super admin can grant admin role** - This prevents privilege escalation

## Files Modified/Created

**Created:**
- `/controllers/adminController.js` - Admin dashboard logic
- `/routes/admin.routes.js` - Admin routes
- `/views/admin-dashboard.ejs` - Dashboard UI
- `/scripts/createSuperAdmin.js` - Super admin creation script

**Modified:**
- `/routes/index.js` - Added admin routes
- `/routes/user.routes.js` - Allow super admin access
- `/views/user-form.ejs` - Show admin role option for super admin
- `/controllers/userController.js` - Enforce role creation permissions

## Troubleshooting

**Can't login as super admin?**
- Make sure you ran the creation script: `node scripts/createSuperAdmin.js`
- Check your MongoDB connection in `.env`
- Use the "Login as Admin" form, not "Login as User"

**Getting 404 after login?**
- Make sure you restarted your server after adding the new routes
- Check that `/routes/admin.routes.js` exists and is imported in `/routes/index.js`

**Can't grant admin role?**
- Only super admin can do this
- Make sure you're logged in as super admin (check the dashboard stats)
- Regular admins can only create Customer and Manager roles

require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

const connectDB = require('./config/db');
const User = require('./models/User');

const app = express();

// Connect Database
connectDB();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
const routes = require('./routes');
app.use('/', routes);

// Ensure Super Admin exists
const ensureSuperAdmin = async () => {
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD;

  if (!superAdminEmail || !superAdminPassword) {
    console.error('Super Admin credentials are not set in environment variables.');
    return;
  }

  const existingSuperAdmin = await User.findOne({ email: superAdminEmail, role: 'super admin' });
  if (!existingSuperAdmin) {
    await User.create({
      name: 'Super Admin',
      email: superAdminEmail,
      password: superAdminPassword,
      role: 'super admin'
    });
    console.log('Super Admin created successfully.');
  }
};

ensureSuperAdmin();

app.use((err, req, res, next) => {
  console.error(err.stack);
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: err.message });
  }
  
  // Mongoose cast error (invalid ID)
  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid ID format' });
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
  
  // Default
  res.status(err.status || 500).json({
    message: process.env.NODE_ENV === 'production' ? 'Server Error' : err.message
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});


that's server.js

/routes has contr
admin.routes.js
auth.routes.js
order.routes.js
controller.routes.js
product.routes.js
supplier.routes.js
user.routes.js
index.js (entry point to the routes)

/controller has:
adminController.js
authController.js
orderController.js
productController.js
userController.js
supplierController.js

/models has:
Order.js
OrderItem.js
Product.js
Supplier.js
User.js

/config has:
db.js

/middleware has:
asyncHandler.js
authMiddleware.js
requireRole.js

/scripts has:
createSuperAdmin.js

/views has alot here we go:
admin-dashboard.ejs
login.ejs
order-detail.ejs
order-form.ejs
order-update.ejs
orders.ejs
product-detail.ejs
product-form.ejs
products.ejs
register.ejs
supplier-detail.ejs
supplier-form.ejs
suppliers.ejs
user-detail.ejs
user-form.ejs
users.ejs

alongside server.js we have
.env
package.json

🟦 ENTRY LAYER
server.js

This is your boot sequence:

loads environment (.env)
connects MongoDB (config/db.js)
registers middleware:
body parsing
cookies
static files
sets EJS view engine
mounts routes:
app.use('/', routes)
runs superadmin bootstrap check
global error handler
starts server

👉 Translation:

“Start app → connect everything → hand off to routes”

Nothing else should happen here (you’re fine).

🟨 ROUTING LAYER (TRAFFIC CONTROLLER)
routes/index.js (main hub)

This is your single entry router.

It delegates to:

auth.routes
user.routes
admin.routes
product.routes
supplier.routes
order.routes

Each route file:

maps URL → controller function

Example mental mapping:

/login → authController.login
/admin → adminController.dashboard
/products → productController.list

👉 Routes are dumb. They just point.

🟥 CONTROLLERS (CORE LOGIC ZONE)

This is your real application brain.

authController
login
register
JWT creation
password verification (bcrypt + salt)

👉 “Who are you?”

userController
user CRUD
profile logic
maybe role updates (depends)

👉 “Who is this person in the system?”

adminController
admin dashboard logic
system-level views
aggregation of stats

👉 “control panel brain”

productController
product CRUD
inventory logic
supplierController
supplier CRUD
supplier-product relationships (if any)
orderController
order creation
order items logic
order status updates

👉 “the most state-heavy controller”

🟩 MIDDLEWARE (GATEKEEPERS)
authMiddleware
verifies JWT
attaches user to request

👉 “Are you real?”

requireRole
checks RBAC
allows/blocks access

👉 “Are you allowed here?”

asyncHandler
wraps controllers to catch errors

👉 “Don’t crash, just report properly”

🟪 MODELS (DATA TRUTH)
User
name
email
password
role (includes super admin)
Product
product data
pricing / stock
Supplier
supplier info
Order
order header
OrderItem
line items inside orders

👉 Important pattern:
Order → has many OrderItems

🟫 CONFIG LAYER
db.js
MongoDB connection setup

👉 “connect to brain of the system”

⬛ SCRIPTS (OUT-OF-BAND TOOLS)
createSuperAdmin.js
manually creates privileged user

BUT ALSO:

👉 server.js also auto-creates superadmin

So you have:

two ways to initialize same concept

(not broken, just duplicated intent)

🟧 VIEWS (EJS FRONTEND)

This is your UI layer, split by entity:

Auth
login
register
Admin
dashboard
Users
list / form / detail
Products
list / form / detail
Suppliers
list / form / detail
Orders
list / form / detail / update

👉 Pattern everywhere:

list → form → detail → edit