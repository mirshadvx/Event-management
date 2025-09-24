# 🎉 Event Management System

A full-featured, scalable **Event Management Web Application** built using **Django REST Framework** and **React**. This platform is designed to simplify event creation, management, and participation—featuring role-based access, ticketing, real-time chat, payment integration, and more.

---

## 🔍 Overview

This project supports **three user roles**:

- **🔐 Admin**  
  - Approves users who want to become organizers  
  - Manages platform data and earns commission from each event

- **🧑‍💼 Organizer**  
  - Creates and manages events  
  - Adds event details like location, features, ticket types, and restrictions  
  - Sets participation limits

- **🙋 Normal User**  
  - Explores public events  
  - Buys tickets and joins events  
  - Participates in group chats with other ticket holders  
  - Likes, comments, and connects with other users  
  - Can purchase a premium plan to unlock more chat features

---

## 🚀 Features

- 🎟️ Event creation & ticketing system  
- 🔐 Role-based user permissions  
- 💬 Group & private chat system (with premium logic)  
- 🌍 Explore page with event discovery  
- ❤️ Like, comment, and follow functionality  
- 📩 Admin panel for approvals, commissions, and analytics  
- 💰 Wallet & Stripe payment integration  
- 📦 Modular backend and scalable architecture  
- 🧵 Background task handling with Celery and Redis  

---

## 🛠 Tech Stack

**Frontend:**
- React
- Tailwind CSS
- ShadCN (UI components)

**Backend:**
- Django REST Framework
- PostgreSQL
- Celery + Redis
- Stripe (Payments)

**Tools:**
- Postman (API Testing & Docs)
- Figma (UI/UX Design)

---

## ⚙️ Setup Instructions

### Backend

```bash
# Clone the repo
git clone https://github.com/mirshadvx/Event-management.git
cd event-management-system/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Apply migrations
python manage.py migrate

# Start development server
python manage.py runserver

